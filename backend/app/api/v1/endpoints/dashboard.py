from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.incident import Incident
from app.models.depot import Depot
from app.models.resource import Resource
from app.models.mission import Mission
from app.models.alert import Alert

router = APIRouter()


@router.get("/summary")
async def summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Dashboard summary cards (matches the design in your screenshot)."""
    n_incidents = (await db.execute(select(func.count()).select_from(Incident))).scalar_one()
    n_depots = (await db.execute(select(func.count()).select_from(Depot))).scalar_one()
    n_missions = (await db.execute(select(func.count()).select_from(Mission))).scalar_one()
    n_active_alerts = (await db.execute(
        select(func.count()).select_from(Alert).where(Alert.is_active == True)
    )).scalar_one()

    incidents = (await db.execute(select(Incident))).scalars().all()
    total_affected = sum(i.affected_population for i in incidents)

    resources = (await db.execute(select(Resource))).scalars().all()
    total_resources = sum(r.quantity for r in resources)

    critical = sum(1 for i in incidents if i.priority.value == "critical")
    high = sum(1 for i in incidents if i.priority.value == "high")
    medium = sum(1 for i in incidents if i.priority.value == "medium")
    low = sum(1 for i in incidents if i.priority.value == "low")

    return {
        "cards": {
            "active_incidents": n_incidents,
            "critical_incidents": critical,
            "resources_deployed": total_resources,
            "active_depots": n_depots,
            "active_missions": n_missions,
            "people_assisted": total_affected,
            "active_alerts": n_active_alerts,
        },
        "priority_breakdown": {
            "critical": critical,
            "high": high,
            "medium": medium,
            "low": low,
        },
    }