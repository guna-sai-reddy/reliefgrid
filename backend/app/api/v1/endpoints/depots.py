from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.depot import Depot
from app.models.resource import Resource
from app.schemas.depot import DepotCreate, DepotUpdate, DepotOut
from app.core.geocoder import geocode_location

router = APIRouter()


@router.post("/", response_model=DepotOut, status_code=201)
async def create_depot(
    payload: DepotCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "coordinator")),
):
    lat = payload.latitude
    lng = payload.longitude

    # Auto-resolve if name contains recognizable city/state or default coords
    geo = geocode_location(payload.name)
    if geo:
        if (abs(lat - 20.5937) < 0.01 and abs(lng - 78.9629) < 0.01) or (lat == 0 and lng == 0) or (abs(lat - 13.0827) < 0.01 and abs(lng - 80.2707) < 0.01 and "chennai" not in payload.name.lower()):
            lat, lng = geo

    d = Depot(
        name=payload.name,
        latitude=lat,
        longitude=lng,
        max_transport_per_trip=payload.max_transport_per_trip,
    )
    db.add(d)
    await db.commit()
    await db.refresh(d)
    return d


@router.get("/", response_model=list[DepotOut])
async def list_depots(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (await db.execute(select(Depot).order_by(Depot.name))).scalars().all()


@router.get("/{depot_id}", response_model=DepotOut)
async def get_depot(
    depot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    d = (await db.execute(select(Depot).where(Depot.id == depot_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Depot not found")
    return d


@router.patch("/{depot_id}", response_model=DepotOut)
async def update_depot(
    depot_id: str,
    payload: DepotUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "coordinator")),
):
    d = (await db.execute(select(Depot).where(Depot.id == depot_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Depot not found")

    if payload.name is not None:
        d.name = payload.name
    if payload.latitude is not None:
        d.latitude = payload.latitude
    if payload.longitude is not None:
        d.longitude = payload.longitude
    if payload.max_transport_per_trip is not None:
        d.max_transport_per_trip = payload.max_transport_per_trip

    await db.commit()
    await db.refresh(d)
    return d


@router.delete("/{depot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_depot(
    depot_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    d = (await db.execute(select(Depot).where(Depot.id == depot_id))).scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Depot not found")

    # Cascade delete associated resources
    await db.execute(delete(Resource).where(Resource.depot_id == depot_id))
    await db.delete(d)
    await db.commit()
    return None