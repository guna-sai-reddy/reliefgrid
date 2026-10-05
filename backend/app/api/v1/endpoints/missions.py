import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.models.mission import Mission, MissionStatus
from app.schemas.mission import MissionCreate, MissionOut, MissionStatusUpdate

router = APIRouter()


@router.post("/", response_model=MissionOut, status_code=201)
async def create_mission(
    payload: MissionCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    code = f"MSN-{uuid.uuid4().hex[:6].upper()}"
    m = Mission(
        code=code,
        depot_id=payload.depot_id,
        incident_id=payload.incident_id,
        resources_summary=payload.resources_summary or "General Relief Supplies",
        distance_km=payload.distance_km or 120.0,
        eta_hours=payload.eta_hours or 2.0,
        assigned_to=user.id,
        status=MissionStatus.dispatched,
    )
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m


@router.get("/", response_model=list[MissionOut])
async def list_missions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = (await db.execute(select(Mission).order_by(desc(Mission.created_at)))).scalars().all()
    return rows


@router.patch("/{mission_id}/status", response_model=MissionOut)
async def update_status(
    mission_id: str,
    payload: MissionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    m = (await db.execute(select(Mission).where(Mission.id == mission_id))).scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Mission not found")

    target_status = payload.status.lower()

    # Enforce: Only System Administrators can mark a mission as completed
    if target_status in ("completed", MissionStatus.completed.value):
        user_role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
        if user_role_str != "admin":
            raise HTTPException(
                status_code=403,
                detail="Access denied: Only System Administrators are authorized to mark missions as completed.",
            )

    try:
        m.status = MissionStatus(target_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid mission status: {payload.status}")

    await db.commit()
    await db.refresh(m)
    return m