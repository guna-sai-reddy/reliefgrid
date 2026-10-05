from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.volunteer import Volunteer, VolunteerStatus, InductionStatus
from app.models.incident import Incident
from app.schemas.volunteer import (
    VolunteerCreate,
    VolunteerUpdate,
    VolunteerStatusUpdate,
    VolunteerInductUpdate,
    VolunteerDeploy,
    VolunteerOut,
    VolunteerStatsOut,
)

router = APIRouter()


@router.get("/stats", response_model=VolunteerStatsOut)
async def get_volunteer_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    total = (await db.execute(select(func.count(Volunteer.id)))).scalar_one() or 0
    available = (
        await db.execute(
            select(func.count(Volunteer.id)).where(Volunteer.status == VolunteerStatus.available)
        )
    ).scalar_one() or 0
    deployed = (
        await db.execute(
            select(func.count(Volunteer.id)).where(Volunteer.status == VolunteerStatus.deployed)
        )
    ).scalar_one() or 0
    standby = (
        await db.execute(
            select(func.count(Volunteer.id)).where(Volunteer.status == VolunteerStatus.on_standby)
        )
    ).scalar_one() or 0
    inducted = (
        await db.execute(
            select(func.count(Volunteer.id)).where(
                Volunteer.induction_status.in_([InductionStatus.inducted, InductionStatus.certified])
            )
        )
    ).scalar_one() or 0

    return VolunteerStatsOut(
        total=total,
        available=available,
        deployed=deployed,
        on_standby=standby,
        inducted_or_certified=inducted,
    )


@router.get("/", response_model=list[VolunteerOut])
async def list_volunteers(
    status_filter: str | None = Query(None, alias="status"),
    region: str | None = Query(None),
    skill: str | None = Query(None),
    induction: str | None = Query(None),
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Volunteer).order_by(desc(Volunteer.created_at))

    if status_filter and status_filter != "all":
        try:
            stmt = stmt.where(Volunteer.status == VolunteerStatus(status_filter))
        except ValueError:
            pass

    if region and region != "all":
        stmt = stmt.where(Volunteer.region.ilike(f"%{region}%"))

    if skill and skill != "all":
        stmt = stmt.where(Volunteer.skills.ilike(f"%{skill}%"))

    if induction and induction != "all":
        try:
            stmt = stmt.where(Volunteer.induction_status == InductionStatus(induction))
        except ValueError:
            pass

    stmt = stmt.limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/", response_model=VolunteerOut, status_code=status.HTTP_201_CREATED)
async def create_volunteer(
    payload: VolunteerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = Volunteer(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        region=payload.region,
        skills=payload.skills,
        badge_level=payload.badge_level or "Field Responder",
        status=VolunteerStatus.available,
        induction_status=InductionStatus.in_induction,
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return v


@router.get("/{volunteer_id}", response_model=VolunteerOut)
async def get_volunteer(
    volunteer_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = (
        await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    ).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return v


@router.patch("/{volunteer_id}/status", response_model=VolunteerOut)
async def update_volunteer_status(
    volunteer_id: str,
    payload: VolunteerStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = (
        await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    ).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    try:
        new_status = VolunteerStatus(payload.status)
        v.status = new_status
        if new_status == VolunteerStatus.available:
            v.assigned_incident_id = None
        await db.commit()
        await db.refresh(v)
        return v
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")


@router.post("/{volunteer_id}/deploy", response_model=VolunteerOut)
async def deploy_volunteer(
    volunteer_id: str,
    payload: VolunteerDeploy,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = (
        await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    ).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    inc = (
        await db.execute(select(Incident).where(Incident.id == payload.incident_id))
    ).scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Disaster incident not found")

    v.status = VolunteerStatus.deployed
    v.assigned_incident_id = inc.id
    v.missions_count += 1
    await db.commit()
    await db.refresh(v)
    return v


@router.post("/{volunteer_id}/induct", response_model=VolunteerOut)
async def induct_volunteer(
    volunteer_id: str,
    payload: VolunteerInductUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = (
        await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    ).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    try:
        v.induction_status = InductionStatus(payload.induction_status)
        if payload.badge_level:
            v.badge_level = payload.badge_level
        await db.commit()
        await db.refresh(v)
        return v
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid induction status: {payload.induction_status}")


@router.delete("/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer(
    volunteer_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = (
        await db.execute(select(Volunteer).where(Volunteer.id == volunteer_id))
    ).scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    await db.delete(v)
    await db.commit()
