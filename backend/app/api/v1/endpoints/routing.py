from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User
from app.services.routing_service import estimate_route

router = APIRouter()


class RouteRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float


@router.post("/route")
async def compute_route(
    payload: RouteRequest,
    user: User = Depends(get_current_user),
):
    return estimate_route(
        payload.origin_lat, payload.origin_lon,
        payload.dest_lat, payload.dest_lon,
    )