from pydantic import BaseModel
from typing import Literal


class MapMarker(BaseModel):
    id: str
    type: Literal["incident", "depot", "mission"]
    latitude: float
    longitude: float
    label: str
    priority: str | None = None
    status: str | None = None
    meta: dict = {}


class HeatPoint(BaseModel):
    latitude: float
    longitude: float
    intensity: float
    label: str | None = None