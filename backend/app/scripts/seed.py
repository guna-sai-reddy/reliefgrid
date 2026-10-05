"""
Seed script — populates DB with demo data for testing.
Run once after starting the backend:
    python -m app.scripts.seed
"""
import asyncio
import uuid

from sqlalchemy import select

from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models import (
    User, UserRole,
    Incident, IncidentType, IncidentStatus, Priority,
    Depot, Resource, ResourceType,
    Zone, Alert, AlertSeverity,
    Mission, MissionStatus,
)
from app.models.prediction import Prediction
from app.services.ml_service import get_ml_service
from app.api.v1.endpoints.predictions import build_ai_alert, priority_to_alert_severity


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # -------- Admin user --------
        existing = (await db.execute(select(User).where(User.email == "admin@reliefgrid.io"))).scalar_one_or_none()
        if not existing:
            db.add(User(
                email="admin@reliefgrid.io",
                full_name="Admin User",
                hashed_password=hash_password("admin123"),
                role=UserRole.admin,
                organization="NDRF HQ",
            ))
            print("  [OK] admin@reliefgrid.io / admin123")

        # -------- Commander --------
        existing = (await db.execute(select(User).where(User.email == "commander@reliefgrid.io"))).scalar_one_or_none()
        if not existing:
            db.add(User(
                email="commander@reliefgrid.io",
                full_name="Cmdr. A. Rao",
                hashed_password=hash_password("commander123"),
                role=UserRole.commander,
                organization="NDRF Sector 4",
            ))
            print("  [OK] commander@reliefgrid.io / commander123")

        await db.commit()

        # -------- Depots --------
        depots_data = [
            ("Delhi Central Depot", 28.6139, 77.2090, 8000),
            ("Mumbai West Depot", 19.0760, 72.8777, 7000),
            ("Chennai South Depot", 13.0827, 80.2707, 6000),
        ]
        depots = []
        for name, lat, lon, cap in depots_data:
            existing = (await db.execute(select(Depot).where(Depot.name == name))).scalar_one_or_none()
            if not existing:
                d = Depot(name=name, latitude=lat, longitude=lon, max_transport_per_trip=cap)
                db.add(d)
                depots.append(d)
        await db.commit()

        # Re-fetch all depots
        depots = (await db.execute(select(Depot))).scalars().all()
        print(f"  [OK] {len(depots)} depots")

        # -------- Resources per depot --------
        for d in depots:
            for rtype, qty in [("food", 50000), ("water", 80000),
                               ("medical", 500), ("shelter", 5000)]:
                existing = (await db.execute(
                    select(Resource).where(Resource.depot_id == d.id, Resource.type == ResourceType(rtype))
                )).scalar_one_or_none()
                if not existing:
                    db.add(Resource(depot_id=d.id, type=ResourceType(rtype), quantity=qty))
        await db.commit()
        print("  [OK] resources added")

        # -------- Incidents --------
        incidents_data = [
            ("INC-2026-01", IncidentType.flood, "Wayanad, Kerala", 11.6854, 76.1320, 12400, Priority.critical),
            ("INC-2026-02", IncidentType.cyclone, "Puri, Odisha", 19.8135, 85.8312, 18200, Priority.critical),
            ("INC-2026-03", IncidentType.earthquake, "Manipur", 24.6637, 93.9063, 8400, Priority.high),
            ("INC-2026-04", IncidentType.drought, "Vidarbha, MH", 20.9374, 77.7796, 9200, Priority.medium),
            ("INC-2026-05", IncidentType.flood, "Assam", 26.2006, 92.9376, 15000, Priority.high),
        ]
        for code, itype, loc, lat, lon, pop, prio in incidents_data:
            existing = (await db.execute(select(Incident).where(Incident.code == code))).scalar_one_or_none()
            if not existing:
                db.add(Incident(
                    code=code, type=itype, location=loc,
                    latitude=lat, longitude=lon,
                    affected_population=pop,
                    priority=prio,
                    status=IncidentStatus.active,
                    demand_food=pop * 7.2,
                    demand_water=pop * 14,
                    demand_medical=pop * 0.01,
                    demand_shelter=pop * 1.0,
                ))
        await db.commit()

        incidents = (await db.execute(select(Incident))).scalars().all()
        print(f"  [OK] {len(incidents)} incidents")

        # -------- Missions --------
        if depots and incidents:
            d_delhi = next((d for d in depots if "Delhi" in d.name), depots[0])
            d_mumbai = next((d for d in depots if "Mumbai" in d.name), depots[0])
            d_chennai = next((d for d in depots if "Chennai" in d.name), depots[0])

            inc_wayanad = next((i for i in incidents if "Wayanad" in i.location), incidents[0])
            inc_puri = next((i for i in incidents if "Puri" in i.location), incidents[0])
            inc_manipur = next((i for i in incidents if "Manipur" in i.location), incidents[0])

            missions_data = [
                ("MSN-DEL-WAY01", d_chennai.id, inc_wayanad.id, "Food: 15,000 Pks, Water: 30,000 L, Medical: 500 Kits", 210.0, 2.8, MissionStatus.in_transit),
                ("MSN-MUM-PURI02", d_mumbai.id, inc_puri.id, "Food: 20,000 Pks, Water: 40,000 L, Shelter: 1,200 Units", 310.5, 4.2, MissionStatus.dispatched),
                ("MSN-CHE-MAN03", d_delhi.id, inc_manipur.id, "Medical: 350 Kits, Shelter: 2,000 Units, Water: 15,000 L", 420.0, 5.6, MissionStatus.delivered),
            ]

            for code, dep_id, inc_id, summary, dist, eta, status in missions_data:
                existing = (await db.execute(select(Mission).where(Mission.code == code))).scalar_one_or_none()
                if not existing:
                    db.add(Mission(
                        code=code,
                        depot_id=dep_id,
                        incident_id=inc_id,
                        resources_summary=summary,
                        distance_km=dist,
                        eta_hours=eta,
                        status=status,
                    ))
            await db.commit()
            print("  [OK] 3 demo missions seeded")

        # -------- Zones --------
        zones_data = [
            ("Wayanad", 11.6854, 76.1320, 450, 0.55, 0.72, 24.5, 11.2, 2.1),
            ("Puri", 19.8135, 85.8312, 620, 0.62, 0.68, 26.1, 10.5, 2.3),
            ("Manipur", 24.6637, 93.9063, 380, 0.48, 0.78, 23.8, 9.9, 1.9),
        ]
        for name, lat, lon, dens, acc, vuln, child, elder, disab in zones_data:
            existing = (await db.execute(select(Zone).where(Zone.name == name))).scalar_one_or_none()
            if not existing:
                db.add(Zone(
                    name=name, latitude=lat, longitude=lon,
                    population_density=dens,
                    accessibility_score=acc,
                    vulnerability_score=vuln,
                    children_pct=child, elder_pct=elder, disability_pct=disab,
                ))
        await db.commit()
        print(f"  [OK] zones added")

        # -------- Prediction-Based Alerts --------
        ml = get_ml_service()
        admin_user = (await db.execute(select(User).where(User.email == "admin@reliefgrid.io"))).scalar_one_or_none()
        admin_id = admin_user.id if admin_user else str(uuid.uuid4())

        alert_presets = [
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

        seeded_alerts_count = 0
        for p in alert_presets:
            feats = p["features"]
            pred = ml.predict(feats)
            priority = ml.priority_from_demand(pred)
            alert_severity = priority_to_alert_severity(priority)
            title, msg = build_ai_alert(p["zone_name"], priority, pred)

            existing_alert = (await db.execute(
                select(Alert).where(Alert.title == title)
            )).scalar_one_or_none()

            if not existing_alert:
                db.add(Alert(title=title, message=msg, severity=alert_severity, region=p["region"], is_active=True))
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
                db.add(Prediction(
                    user_id=admin_id,
                    zone_name=p["zone_name"],
                    inputs=feats,
                    outputs=outputs_with_meta,
                    priority=priority,
                ))
                seeded_alerts_count += 1

        await db.commit()
        print(f"  [OK] {seeded_alerts_count} prediction-based alerts seeded")

        # -------- Rescue Volunteers --------
        from app.models.volunteer import Volunteer, VolunteerStatus, InductionStatus

        volunteers_data = [
            ("Dr. Ananya Nair", "+91 98470 11223", "ananya.nair@rescue.in", "Wayanad, Kerala", "Medical / First Aid, Emergency Triage", VolunteerStatus.deployed, InductionStatus.certified, "Lead Rescuer", 12),
            ("Rahul Varma", "+91 94471 33445", "rahul.varma@rescue.in", "Wayanad, Kerala", "Boat & Flood Rescue, Swiftwater Tech", VolunteerStatus.deployed, InductionStatus.inducted, "Certified Specialist", 8),
            ("Debabrata Das", "+91 98610 55667", "debabrata.das@rescue.in", "Puri, Odisha", "Cyclone Evacuation, Coastal Search & Rescue", VolunteerStatus.available, InductionStatus.certified, "Lead Rescuer", 15),
            ("Priya Mohanty", "+91 94370 77889", "priya.mohanty@rescue.in", "Puri, Odisha", "Logistics & Food Distribution, First Aid", VolunteerStatus.available, InductionStatus.in_induction, "Field Responder", 3),
            ("Nongthombam Singh", "+91 98560 99001", "nsingh@rescue.in", "Imphal, Manipur", "Urban Search & Rescue (USAR), Debris Clearance", VolunteerStatus.on_standby, InductionStatus.certified, "Certified Specialist", 9),
            ("Grace Lhingboi", "+91 94360 22334", "grace.l@rescue.in", "Churachandpur, Manipur", "Emergency Evacuation, Drone Reconnaissance", VolunteerStatus.available, InductionStatus.inducted, "Field Responder", 5),
        ]

        # Associate deployed volunteers with active incidents if available
        inc_wayanad = next((i for i in incidents if "Wayanad" in i.location), None)
        inc_puri = next((i for i in incidents if "Puri" in i.location), None)

        seeded_volunteers = 0
        for name, phone, email, region, skills, v_stat, ind_stat, badge, count in volunteers_data:
            existing_v = (await db.execute(select(Volunteer).where(Volunteer.email == email))).scalar_one_or_none()
            if not existing_v:
                assigned_inc = None
                if v_stat == VolunteerStatus.deployed and "Wayanad" in region and inc_wayanad:
                    assigned_inc = inc_wayanad.id
                elif v_stat == VolunteerStatus.deployed and "Puri" in region and inc_puri:
                    assigned_inc = inc_puri.id

                db.add(Volunteer(
                    name=name,
                    phone=phone,
                    email=email,
                    region=region,
                    skills=skills,
                    status=v_stat,
                    induction_status=ind_stat,
                    badge_level=badge,
                    missions_count=count,
                    assigned_incident_id=assigned_inc,
                ))
                seeded_volunteers += 1

        await db.commit()
        print(f"  [OK] {seeded_volunteers} rescue volunteers seeded")

    print("\n[OK] Seed complete")
    print("\nTest credentials:")
    print("  admin@reliefgrid.io     / admin123")
    print("  commander@reliefgrid.io / commander123")


if __name__ == "__main__":
    asyncio.run(seed())