from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_role, get_current_user
from app.models.user import User, UserRole
from app.models.incident import Incident
from app.models.depot import Depot
from app.models.mission import Mission
from app.models.alert import Alert
from app.models.volunteer import Volunteer
from app.services.ml_service import get_ml_service
from app.schemas.user import (
    AdminUserOut, UserRoleUpdate, UserStatusUpdate, SystemHealthOut
)

# Protect all routes in this router with require_role("admin")
router = APIRouter(dependencies=[Depends(require_role("admin"))])


@router.get("/users", response_model=list[AdminUserOut])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Retrieve all registered accounts with role and status."""
    stmt = select(User).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role.value if hasattr(u.role, "value") else str(u.role),
            is_active=u.is_active,
            organization=u.organization,
            phone=u.phone,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    current_admin: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Change a user's role (admin, commander, coordinator, viewer)."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent demoting the currently active admin's own account
    if user.id == current_admin.id and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot demote your own active admin account."
        )

    try:
        user.role = UserRole(payload.role.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{payload.role}'. Must be one of: {[r.value for r in UserRole]}"
        )

    await db.commit()
    await db.refresh(user)

    return AdminUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_active=user.is_active,
        organization=user.organization,
        phone=user.phone,
        created_at=user.created_at,
    )


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
async def toggle_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    current_admin: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Suspend or activate a user account."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent self-deactivation
    if user.id == current_admin.id and not payload.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate your own active admin account."
        )

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)

    return AdminUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        is_active=user.is_active,
        organization=user.organization,
        phone=user.phone,
        created_at=user.created_at,
    )


@router.delete("/users/{user_id}")
async def delete_user_account(
    user_id: str,
    current_admin: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Permanently delete a user account."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own active admin account."
        )

    await db.delete(user)
    await db.commit()
    return {"message": f"User {user.email} successfully deleted"}


@router.get("/system/health", response_model=SystemHealthOut)
async def get_system_health(
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: Aggregate telemetry on database status, ML ensemble, and total entity counts."""
    # Check DB
    db_ok = True
    try:
        users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        incidents_count = (await db.execute(select(func.count(Incident.id)))).scalar() or 0
        depots_count = (await db.execute(select(func.count(Depot.id)))).scalar() or 0
        missions_count = (await db.execute(select(func.count(Mission.id)))).scalar() or 0
        alerts_count = (await db.execute(select(func.count(Alert.id)))).scalar() or 0
        volunteers_count = (await db.execute(select(func.count(Volunteer.id)))).scalar() or 0
    except Exception:
        db_ok = False
        users_count = incidents_count = depots_count = missions_count = alerts_count = volunteers_count = 0

    # Check ML Service
    ml_ok = False
    try:
        ml_service = get_ml_service()
        ml_ok = ml_service is not None
    except Exception:
        ml_ok = False

    return SystemHealthOut(
        status="OPERATIONAL" if (db_ok and ml_ok) else "DEGRADED",
        database_connected=db_ok,
        ml_ensemble_ready=ml_ok,
        total_users=users_count,
        total_incidents=incidents_count,
        total_depots=depots_count,
        total_missions=missions_count,
        total_alerts=alerts_count,
        total_volunteers=volunteers_count,
        server_time=datetime.now(timezone.utc),
    )
