from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserUpdate(BaseModel):
    full_name: str | None = None
    organization: str | None = None
    phone: str | None = None


class AdminUserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    organization: str | None = None
    phone: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class UserRoleUpdate(BaseModel):
    role: str  # admin, commander, coordinator, viewer


class UserStatusUpdate(BaseModel):
    is_active: bool


class SystemHealthOut(BaseModel):
    status: str
    database_connected: bool
    ml_ensemble_ready: bool
    total_users: int
    total_incidents: int
    total_depots: int
    total_missions: int
    total_alerts: int
    total_volunteers: int
    server_time: datetime