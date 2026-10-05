import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, func, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class VolunteerStatus(str, enum.Enum):
    available = "available"
    deployed = "deployed"
    on_standby = "on_standby"
    off_duty = "off_duty"


class InductionStatus(str, enum.Enum):
    inducted = "inducted"
    in_induction = "in_induction"
    certified = "certified"
    pending = "pending"


class Volunteer(Base):
    __tablename__ = "volunteers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), index=True)
    phone: Mapped[str] = mapped_column(String(40))
    email: Mapped[str] = mapped_column(String(120), index=True)
    region: Mapped[str] = mapped_column(String(120), index=True)
    skills: Mapped[str] = mapped_column(String(255))  # Comma-separated: Medical, Boat Rescue, SAR, etc.
    status: Mapped[VolunteerStatus] = mapped_column(
        Enum(VolunteerStatus), default=VolunteerStatus.available, index=True
    )
    induction_status: Mapped[InductionStatus] = mapped_column(
        Enum(InductionStatus), default=InductionStatus.in_induction, index=True
    )
    badge_level: Mapped[str] = mapped_column(String(80), default="Field Responder")
    missions_count: Mapped[int] = mapped_column(Integer, default=0)
    assigned_incident_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
