from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.zone import Zone
from app.schemas.zone import ZoneCreate, ZoneOut

router = APIRouter()


@router.post("/", response_model=ZoneOut, status_code=201)
async def create_zone(
    payload: ZoneCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "coordinator")),
):
    z = Zone(**payload.model_dump())
    db.add(z)
    await db.commit()
    await db.refresh(z)
    return z


@router.get("/", response_model=list[ZoneOut])
async def list_zones(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (await db.execute(select(Zone))).scalars().all()


@router.get("/{zone_id}", response_model=ZoneOut)
async def get_zone(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    z = (await db.execute(select(Zone).where(Zone.id == zone_id))).scalar_one_or_none()
    if not z:
        raise HTTPException(status_code=404, detail="Zone not found")
    return z