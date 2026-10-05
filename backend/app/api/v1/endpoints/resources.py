from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.resource import Resource, ResourceType
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceOut

router = APIRouter()


@router.post("/", response_model=ResourceOut, status_code=201)
async def add_resource(
    payload: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "coordinator")),
):
    r = Resource(
        depot_id=payload.depot_id,
        type=ResourceType(payload.type),
        quantity=payload.quantity,
        unit=payload.unit,
    )
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return r


@router.get("/", response_model=list[ResourceOut])
async def list_resources(
    depot_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = select(Resource)
    if depot_id:
        q = q.where(Resource.depot_id == depot_id)
    return (await db.execute(q)).scalars().all()


@router.patch("/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: str,
    payload: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "coordinator")),
):
    r = (await db.execute(select(Resource).where(Resource.id == resource_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")

    if payload.quantity is not None:
        r.quantity = payload.quantity
    if payload.unit is not None:
        r.unit = payload.unit
    if payload.type is not None:
        r.type = ResourceType(payload.type)
    if payload.depot_id is not None:
        r.depot_id = payload.depot_id

    await db.commit()
    await db.refresh(r)
    return r


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    r = (await db.execute(select(Resource).where(Resource.id == resource_id))).scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(r)
    await db.commit()
    return None