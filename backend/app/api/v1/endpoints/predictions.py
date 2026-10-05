import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.prediction import Prediction
from app.models.depot import Depot
from app.models.alert import Alert, AlertSeverity

from app.services.ml_service import get_ml_service
from app.schemas.prediction import PredictionRequest, PredictionResponse

from app.websockets.manager import alert_manager


router = APIRouter()


# ============================================================
# AI PRIORITY -> ALERT SEVERITY
# ============================================================

def priority_to_alert_severity(priority: str) -> AlertSeverity:
    mapping = {
        "CRITICAL": AlertSeverity.critical,
        "HIGH": AlertSeverity.severe,
        "MEDIUM": AlertSeverity.warning,
        "LOW": AlertSeverity.info,
    }

    return mapping.get(
        priority.upper(),
        AlertSeverity.info,
    )


# ============================================================
# AI ALERT MESSAGE
# ============================================================

def build_ai_alert(
    zone_name: str,
    priority: str,
    prediction: dict,
) -> tuple[str, str]:

    severity_text = {
        "CRITICAL": "critical",
        "HIGH": "high",
        "MEDIUM": "moderate",
        "LOW": "low",
    }.get(priority.upper(), "unknown")

    food = prediction["food"]["point"]
    water = prediction["water"]["point"]
    medical = prediction["medical"]["point"]
    shelter = prediction["shelter"]["point"]

    title = f"AI {priority.upper()} ALERT: {zone_name}"

    message = (
        f"AI prediction indicates {severity_text} relief demand in "
        f"{zone_name}. "
        f"Predicted requirements: "
        f"Food {food:,.0f}, "
        f"Water {water:,.0f} L, "
        f"Medical {medical:,.0f} kits, "
        f"Shelter {shelter:,.0f} capacity. "
        f"Priority level: {priority.upper()}."
    )

    return title, message


# ============================================================
# AI PREDICTION
# ============================================================

@router.post("/predict", response_model=PredictionResponse)
async def predict(
    payload: PredictionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # --------------------------------------------------------
    # 1. Run AI/ML prediction
    # --------------------------------------------------------

    ml = get_ml_service()

    feats = payload.features.model_dump()

    pred = ml.predict(feats)

    # --------------------------------------------------------
    # 2. Calculate AI priority
    # --------------------------------------------------------

    priority = ml.priority_from_demand(pred)

    # --------------------------------------------------------
    # 3. Convert AI priority into alert severity
    # --------------------------------------------------------

    alert_severity = priority_to_alert_severity(priority)

    # --------------------------------------------------------
    # 4. Zone name
    # --------------------------------------------------------

    zone_name = payload.zone_name or "Unknown Disaster Zone"

    # --------------------------------------------------------
    # 5. Warehouse recommendation
    # --------------------------------------------------------

    warehouse_name = "Chennai South Depot (Hub Alpha)"
    route_dist = 210.0
    eta_hours = 2.8

    depots = (
        await db.execute(
            select(Depot)
        )
    ).scalars().all()

    if depots:
        d0 = depots[0]
        warehouse_name = f"{d0.name} (Hub Alpha)"

    # --------------------------------------------------------
    # 6. Report metadata
    # --------------------------------------------------------

    report_id = (
        f"Report #{uuid.uuid4().hex[:8]}-"
        f"{uuid.uuid4().hex[:4]}-410a-b775-"
        f"{uuid.uuid4().hex[:12]}"
    )

    now = datetime.now(timezone.utc)

    outputs_with_meta = {
        **pred,
        "recommended_warehouse": warehouse_name,
        "route_distance_km": route_dist,
        "dispatch_eta_hours": eta_hours,
        "report_id": report_id,
        "ai_priority": priority,
        "alert_severity": alert_severity.value,
    }

    # --------------------------------------------------------
    # 7. Save prediction
    # --------------------------------------------------------

    db_pred = Prediction(
        user_id=user.id,
        zone_name=zone_name,
        inputs=feats,
        outputs=outputs_with_meta,
        priority=priority,
    )

    db.add(db_pred)

    # --------------------------------------------------------
    # 8. Generate AI alert
    # --------------------------------------------------------

    alert_title, alert_message = build_ai_alert(
        zone_name,
        priority,
        pred,
    )

    ai_alert = Alert(
        title=alert_title,
        message=alert_message,
        severity=alert_severity,
        region=zone_name,
        is_active=True,
    )

    db.add(ai_alert)

    # --------------------------------------------------------
    # 9. Commit prediction + alert together
    # --------------------------------------------------------

    await db.commit()

    await db.refresh(db_pred)
    await db.refresh(ai_alert)

    # --------------------------------------------------------
    # 10. Broadcast alert through WebSocket
    # --------------------------------------------------------

    await alert_manager.broadcast({
        "type": "new_alert",
        "source": "ai_prediction",
        "id": ai_alert.id,
        "title": ai_alert.title,
        "message": ai_alert.message,
        "severity": ai_alert.severity.value,
        "region": ai_alert.region,
        "prediction_id": db_pred.id,
    })

    # --------------------------------------------------------
    # 11. Return prediction response
    # --------------------------------------------------------

    return PredictionResponse(
        id=db_pred.id,
        zone_name=db_pred.zone_name,
        priority=priority,
        recommended_warehouse=warehouse_name,
        route_distance_km=route_dist,
        dispatch_eta_hours=eta_hours,
        report_id=report_id,
        created_at=now.strftime("%m/%d/%Y, %I:%M:%S %p"),
        **pred,
    )


# ============================================================
# PREDICTION HISTORY
# ============================================================

@router.get("/history")
async def history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (
        await db.execute(
            select(Prediction)
            .where(Prediction.user_id == user.id)
            .order_by(desc(Prediction.created_at))
            .limit(limit)
        )
    ).scalars().all()

    result = []

    for r in rows:
        outputs = r.outputs or {}

        created_str = (
            r.created_at.strftime("%m/%d/%Y, %I:%M:%S %p")
            if r.created_at
            else None
        )

        report_id = (
            outputs.get("report_id")
            or f"Report #{r.id[:8]}-128a-410a-b775-{r.id[-12:]}"
        )

        result.append({
            "id": r.id,
            "zone_name": r.zone_name or "Unknown Zone",
            "priority": r.priority or "CRITICAL",
            "created_at": created_str,
            "report_id": report_id,
            "inputs": r.inputs or {},
            "outputs": outputs,
            "recommended_warehouse": outputs.get(
                "recommended_warehouse",
                "Chennai South Depot (Hub Alpha)",
            ),
            "route_distance_km": outputs.get(
                "route_distance_km",
                210.0,
            ),
            "dispatch_eta_hours": outputs.get(
                "dispatch_eta_hours",
                2.8,
            ),
        })

    return result