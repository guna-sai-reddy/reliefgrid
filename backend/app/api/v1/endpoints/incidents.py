from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.incident import Incident, IncidentType, IncidentStatus, Priority
from app.schemas.incident import IncidentCreate, IncidentOut, PriorityOverride
from app.services.ml_service import get_ml_service
from app.websockets.manager import map_manager

from app.core.geocoder import geocode_location

router = APIRouter()


@router.post("/", response_model=IncidentOut, status_code=201)
async def create_incident(
    payload: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lat = payload.latitude
    lng = payload.longitude

    # Auto-geocode if default center (20.5937, 78.9629) or (0,0) was left in form
    if (abs(lat - 20.5937) < 0.01 and abs(lng - 78.9629) < 0.01) or (lat == 0 and lng == 0):
        geo = geocode_location(payload.location)
        if geo:
            lat, lng = geo

    demand_food = payload.demand_food
    demand_water = payload.demand_water
    demand_medical = payload.demand_medical
    demand_shelter = payload.demand_shelter

    # If demands are not manually set and affected_population is provided, estimate with ML
    if demand_food == 0.0 and demand_water == 0.0 and payload.affected_population > 0:
        try:
            ml = get_ml_service()
            features = {
                "population_density": 500.0,
                "accessibility_score": 0.6,
                "vulnerability_score": 0.5,
                "affected_population": payload.affected_population,
                "children_pct": 25.0,
                "elder_pct": 10.0,
                "disability_pct": 2.0,
            }
            preds = ml.predict(features)
            demand_food = preds["food"]["point"]
            demand_water = preds["water"]["point"]
            demand_medical = preds["medical"]["point"]
            demand_shelter = preds["shelter"]["point"]
        except Exception:
            pop = payload.affected_population
            demand_food = round(pop * 2.5, 1)
            demand_water = round(pop * 5.0, 1)
            demand_medical = round(pop * 0.05, 1)
            demand_shelter = round(pop * 0.2, 1)

    inc = Incident(
        code=payload.code,
        type=IncidentType(payload.type),
        location=payload.location,
        latitude=lat,
        longitude=lng,
        affected_population=payload.affected_population,
        description=payload.description,
        priority=Priority(payload.priority),
        demand_food=demand_food,
        demand_water=demand_water,
        demand_medical=demand_medical,
        demand_shelter=demand_shelter,
        reported_by=user.id,
    )
    db.add(inc)
    await db.commit()
    await db.refresh(inc)

    # Broadcast live to map websocket subscribers
    try:
        await map_manager.broadcast({
            "type": "incident_created",
            "marker": {
                "id": inc.id,
                "type": "incident",
                "latitude": inc.latitude,
                "longitude": inc.longitude,
                "label": f"{inc.type.value.title()} — {inc.location}",
                "priority": inc.priority.value,
                "status": inc.status.value,
                "meta": {
                    "code": inc.code,
                    "affected_population": inc.affected_population,
                    "demand": {
                        "food": inc.demand_food,
                        "water": inc.demand_water,
                        "medical": inc.demand_medical,
                        "shelter": inc.demand_shelter,
                    },
                },
            }
        })
    except Exception:
        pass

    return inc


@router.get("/", response_model=list[IncidentOut])
async def list_incidents(
    status: str | None = None,
    priority: str | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Incident).order_by(desc(Incident.created_at)).limit(limit)
    if status:
        q = q.where(Incident.status == IncidentStatus(status))
    if priority:
        q = q.where(Incident.priority == Priority(priority))
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.get("/{incident_id}", response_model=IncidentOut)
async def get_incident(
    incident_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    inc = (await db.execute(select(Incident).where(Incident.id == incident_id))).scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc


@router.patch("/{incident_id}/priority", response_model=IncidentOut)
async def override_priority(
    incident_id: str,
    payload: PriorityOverride,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "commander")),
):
    """Commander priority override — elevates an incident's priority."""
    inc = (await db.execute(select(Incident).where(Incident.id == incident_id))).scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.priority = Priority(payload.priority)
    inc.priority_override = True
    await db.commit()
    await db.refresh(inc)
    return inc