from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.incident import Incident
from app.models.depot import Depot
from app.models.resource import Resource
from app.models.prediction import Prediction

router = APIRouter()


@router.get("/sitrep")
async def situation_report(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Post-event analytics: aggregate situation report."""
    n_incidents = (await db.execute(select(func.count()).select_from(Incident))).scalar_one()
    n_depots = (await db.execute(select(func.count()).select_from(Depot))).scalar_one()
    n_predictions = (await db.execute(select(func.count()).select_from(Prediction))).scalar_one()

    incidents = (await db.execute(select(Incident))).scalars().all()
    total_affected = sum(i.affected_population for i in incidents)
    by_priority = {}
    by_status = {}
    by_type = {}
    for i in incidents:
        by_priority[i.priority.value] = by_priority.get(i.priority.value, 0) + 1
        by_status[i.status.value] = by_status.get(i.status.value, 0) + 1
        by_type[i.type.value] = by_type.get(i.type.value, 0) + 1

    total_demand = {
        "food":    sum(i.demand_food for i in incidents),
        "water":   sum(i.demand_water for i in incidents),
        "medical": sum(i.demand_medical for i in incidents),
        "shelter": sum(i.demand_shelter for i in incidents),
    }

    resources = (await db.execute(select(Resource))).scalars().all()
    total_supply = {}
    for r in resources:
        total_supply[r.type.value] = total_supply.get(r.type.value, 0) + r.quantity

    return {
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
        "incidents": {
            "total": n_incidents,
            "by_priority": by_priority,
            "by_status": by_status,
            "by_type": by_type,
            "total_affected_population": total_affected,
        },
        "depots": {"total": n_depots},
        "predictions": {"total": n_predictions},
        "demand": total_demand,
        "supply": total_supply,
        "gap": {
            r: round(total_demand.get(r, 0) - total_supply.get(r, 0), 2)
            for r in set(list(total_demand) + list(total_supply))
        },
    }