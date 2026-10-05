import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role
from app.models.user import User
from app.models.incident import Incident
from app.models.depot import Depot
from app.models.resource import Resource
from app.models.mission import Mission, MissionStatus
from app.schemas.allocation import AllocationRequest, AllocationResponse
from app.services.optimizer_service import optimize_allocation

router = APIRouter()

PRIORITY_WEIGHTS = {
    "critical": 10,
    "high": 7,
    "medium": 5,
    "low": 2,
}


@router.post("/allocate", response_model=AllocationResponse)
async def allocate(
    payload: AllocationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "commander", "coordinator")),
):
    depots = (await db.execute(select(Depot))).scalars().all()
    resources = (await db.execute(select(Resource))).scalars().all()

    depots_data = []
    for d in depots:
        supply = {}
        for r in resources:
            if r.depot_id == d.id:
                supply[r.type.value] = supply.get(r.type.value, 0) + r.quantity
        depots_data.append({
            "id": d.id,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "max_transport_per_trip": d.max_transport_per_trip,
            "supply": supply,
        })

    incidents = (await db.execute(select(Incident))).scalars().all()
    incidents_data = []
    for i in incidents:
        incidents_data.append({
            "id": i.id,
            "latitude": i.latitude,
            "longitude": i.longitude,
            "priority_weight": PRIORITY_WEIGHTS.get(i.priority.value, 5),
            "demand": {
                "food":    i.demand_food,
                "water":   i.demand_water,
                "medical": i.demand_medical,
                "shelter": i.demand_shelter,
            },
        })

    result = optimize_allocation(
        depots=depots_data,
        incidents=incidents_data,
        resources=["food", "water", "medical", "shelter"],
        max_trip_km=payload.max_trip_km,
        priority_override=payload.priority_override,
    )

    # Convert allocations into Missions in DB
    allocations = result.get("allocation", [])
    if allocations:
        grouped = {}
        for a in allocations:
            key = (a["depot_id"], a["incident_id"])
            if key not in grouped:
                grouped[key] = {
                    "resources": [],
                    "distance_km": a["distance_km"],
                }
            qty_formatted = f"{int(a['quantity']):,}"
            unit = "L" if a["resource_type"] == "water" else "Kits" if a["resource_type"] == "medical" else "Units" if a["resource_type"] == "shelter" else "Pks"
            grouped[key]["resources"].append(f"{a['resource_type'].title()}: {qty_formatted} {unit}")

        for (d_id, i_id), data in grouped.items():
            code = f"MSN-OPT-{uuid.uuid4().hex[:6].upper()}"
            summary = ", ".join(data["resources"])
            dist = data["distance_km"]
            eta = max(round(dist / 60.0, 1), 0.5)

            m = Mission(
                code=code,
                depot_id=d_id,
                incident_id=i_id,
                resources_summary=summary,
                distance_km=dist,
                eta_hours=eta,
                status=MissionStatus.dispatched,
                assigned_to=user.id,
            )
            db.add(m)
        await db.commit()

    return AllocationResponse(**result)