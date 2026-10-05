from datetime import datetime
from pydantic import BaseModel, EmailStr


class VolunteerBase(BaseModel):
    name: str
    phone: str
    email: EmailStr
    region: str
    skills: str  # e.g., "Medical / First Aid, Boat & Flood Rescue"
    badge_level: str = "Field Responder"


class VolunteerCreate(VolunteerBase):
    pass


class VolunteerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    region: str | None = None
    skills: str | None = None
    badge_level: str | None = None
    status: str | None = None
    induction_status: str | None = None


class VolunteerStatusUpdate(BaseModel):
    status: str  # available, deployed, on_standby, off_duty


class VolunteerInductUpdate(BaseModel):
    induction_status: str = "certified"  # inducted, in_induction, certified, pending
    badge_level: str | None = "Certified Specialist"


class VolunteerDeploy(BaseModel):
    incident_id: str


class VolunteerOut(VolunteerBase):
    id: str
    status: str
    induction_status: str
    missions_count: int
    assigned_incident_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class VolunteerStatsOut(BaseModel):
    total: int
    available: int
    deployed: int
    on_standby: int
    inducted_or_certified: int
