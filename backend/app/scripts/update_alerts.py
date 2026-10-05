import asyncio
import sys
import uuid
from datetime import datetime, timezone
sys.path.insert(0, r"D:\reliefgrid\reliefgrid\backend")

from sqlalchemy import select, delete
from app.core.database import SessionLocal
from app.models.alert import Alert, AlertSeverity
from app.models.prediction import Prediction
from app.models.user import User
from app.services.ml_service import get_ml_service
from app.api.v1.endpoints.predictions import build_ai_alert, priority_to_alert_severity

async def update_predefined_alerts():
    ml = get_ml_service()

    presets = [
        {
            "zone_name": "Wayanad Flooding (Sector 4)",
            "region": "Kerala",
            "features": {
                "magnitude": 0.0,
                "depth": 0.0,
                "weather_score": 0.95,
                "population_density": 8500.0,
                "accessibility_score": 0.55,
                "vulnerability_score": 0.72,
                "seismic_risk_score": 0.10,
                "exposure_score": 0.88,
                "resilience_score": 0.35,
                "children_pct": 24.5,
                "elder_pct": 11.2,
                "disability_pct": 2.1,
            },
            "warehouse": "Chennai South Depot (Hub Alpha)",
            "route_dist": 210.0,
            "eta_hours": 2.8,
        },
        {
            "zone_name": "Puri Cyclone Warning (Sector 2)",
            "region": "Odisha",
            "features": {
                "magnitude": 0.0,
                "depth": 0.0,
                "weather_score": 0.98,
                "population_density": 6200.0,
                "accessibility_score": 0.62,
                "vulnerability_score": 0.68,
                "seismic_risk_score": 0.05,
                "exposure_score": 0.92,
                "resilience_score": 0.38,
                "children_pct": 26.1,
                "elder_pct": 10.5,
                "disability_pct": 2.3,
            },
            "warehouse": "Mumbai West Depot",
            "route_dist": 310.5,
            "eta_hours": 4.2,
        },
        {
            "zone_name": "Manipur Seismic Aftershocks",
            "region": "Manipur",
            "features": {
                "magnitude": 6.4,
                "depth": 25.0,
                "weather_score": 0.35,
                "population_density": 3800.0,
                "accessibility_score": 0.48,
                "vulnerability_score": 0.78,
                "seismic_risk_score": 0.88,
                "exposure_score": 0.72,
                "resilience_score": 0.32,
                "children_pct": 23.8,
                "elder_pct": 9.9,
                "disability_pct": 1.9,
            },
            "warehouse": "Delhi Central Depot",
            "route_dist": 420.0,
            "eta_hours": 5.6,
        }
    ]

    async with SessionLocal() as db:
        # Get admin user for prediction ownership
        admin_user = (await db.execute(select(User).where(User.email == "admin@reliefgrid.io"))).scalar_one_or_none()
        admin_id = admin_user.id if admin_user else str(uuid.uuid4())

        # Delete old static predefined alerts
        old_titles = [
            "CRITICAL: Wayanad flooding",
            "Cyclone warning",
            "Earthquake aftershocks",
        ]
        for ot in old_titles:
            await db.execute(delete(Alert).where(Alert.title == ot))
        await db.commit()
        print("[OK] Removed old static alerts")

        # Also clear any previously created AI demo alerts to avoid duplicates
        for p in presets:
            await db.execute(delete(Alert).where(Alert.region == p["region"]))
        await db.commit()

        # Generate and insert prediction-based alerts
        for p in presets:
            feats = p["features"]
            pred = ml.predict(feats)
            priority = ml.priority_from_demand(pred)
            alert_severity = priority_to_alert_severity(priority)
            title, message = build_ai_alert(p["zone_name"], priority, pred)

            # Insert alert
            alert = Alert(
                title=title,
                message=message,
                severity=alert_severity,
                region=p["region"],
                is_active=True,
            )
            db.add(alert)

            # Insert matching prediction record
            report_id = f"Report #{uuid.uuid4().hex[:8]}-{uuid.uuid4().hex[:4]}-410a-b775-{uuid.uuid4().hex[:12]}"
            outputs_with_meta = {
                **pred,
                "recommended_warehouse": p["warehouse"],
                "route_distance_km": p["route_dist"],
                "dispatch_eta_hours": p["eta_hours"],
                "report_id": report_id,
                "ai_priority": priority,
                "alert_severity": alert_severity.value,
            }
            db_pred = Prediction(
                user_id=admin_id,
                zone_name=p["zone_name"],
                inputs=feats,
                outputs=outputs_with_meta,
                priority=priority,
            )
            db.add(db_pred)

            print(f"[+] Added prediction alert: [{alert_severity.value}] {title}")

        await db.commit()
        print("[OK] All prediction-based alerts and prediction records saved successfully!")

        # Verify active alerts in DB
        alerts = (await db.execute(select(Alert))).scalars().all()
        print(f"\nCurrent active alerts in DB: {len(alerts)}")
        for a in alerts:
            print(f"  - [{a.severity.value}] {a.title} ({a.region})")

if __name__ == "__main__":
    asyncio.run(update_predefined_alerts())
