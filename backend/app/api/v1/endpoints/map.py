from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.incident import Incident
from app.models.depot import Depot
from app.models.zone import Zone
from app.schemas.map import MapMarker, HeatPoint

router = APIRouter()


@router.get("/markers", response_model=list[MapMarker])
async def get_markers(
    type: str | None = Query(None, description="incident | depot | all"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    markers: list[MapMarker] = []

    if type in (None, "all", "incident"):
        rows = (await db.execute(select(Incident))).scalars().all()
        for r in rows:
            markers.append(MapMarker(
                id=r.id, type="incident",
                latitude=r.latitude, longitude=r.longitude,
                label=f"{r.type.value.title()} — {r.location}",
                priority=r.priority.value,
                status=r.status.value,
                meta={
                    "code": r.code,
                    "affected_population": r.affected_population,
                    "demand": {
                        "food":    r.demand_food,
                        "water":   r.demand_water,
                        "medical": r.demand_medical,
                        "shelter": r.demand_shelter,
                    },
                },
            ))

    if type in (None, "all", "depot"):
        rows = (await db.execute(select(Depot))).scalars().all()
        for r in rows:
            markers.append(MapMarker(
                id=r.id, type="depot",
                latitude=r.latitude, longitude=r.longitude,
                label=r.name,
                meta={"max_transport_per_trip": r.max_transport_per_trip},
            ))

    return markers


@router.get("/heatmap", response_model=list[HeatPoint])
async def get_heatmap(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (await db.execute(select(Zone))).scalars().all()
    out: list[HeatPoint] = []
    for z in rows:
        intensity = min(
            1.0,
            0.5 * (z.population_density / 10_000.0) + 0.5 * z.vulnerability_score,
        )
        out.append(HeatPoint(
            latitude=z.latitude, longitude=z.longitude,
            intensity=round(intensity, 4),
            label=z.name,
        ))
    return out


@router.get("/layers")
async def get_layers(user: User = Depends(get_current_user)):
    return {
        "layers": [
            {"id": "incidents", "label": "Active Incidents", "color": "#dc2626"},
            {"id": "depots",    "label": "Resource Depots",  "color": "#2563eb"},
            {"id": "missions",  "label": "Active Missions",  "color": "#16a34a"},
            {"id": "heatmap",   "label": "Demand Heatmap",   "color": "#f59e0b"},
        ],
        "default_center": {"lat": 20.5937, "lon": 78.9629},
        "default_zoom": 5,
    }
