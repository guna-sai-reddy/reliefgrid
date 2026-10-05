from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import UserPublic
from app.schemas.user import UserUpdate

router = APIRouter()


def _to_public(u: User) -> UserPublic:
    return UserPublic(
        id=u.id, email=u.email, full_name=u.full_name,
        role=u.role.value, organization=u.organization, is_active=u.is_active,
    )


@router.get("/me", response_model=UserPublic)
async def me(user: User = Depends(get_current_user)):
    return _to_public(user)


@router.patch("/me", response_model=UserPublic)
async def update_me(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
):
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.organization is not None:
        user.organization = payload.organization
    if payload.phone is not None:
        user.phone = payload.phone
    return _to_public(user)