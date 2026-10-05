from pydantic import BaseModel


class MissionCreate(BaseModel):
    depot_id: str
    incident_id: str
    resources_summary: str = ""
    distance_km: float = 0.0
    eta_hours: float = 0.0


class MissionOut(MissionCreate):
    id: str
    code: str
    status: str
    assigned_to: str | None = None

    class Config:
        from_attributes = True


class MissionStatusUpdate(BaseModel):
    status: str