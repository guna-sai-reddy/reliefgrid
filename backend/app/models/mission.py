import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, func, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class MissionStatus(str, enum.Enum):
    planned = "planned"
    dispatched = "dispatched"
    in_transit = "in_transit"
    delivered = "delivered"
    completed = "completed"
    cancelled = "cancelled"


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                    default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    depot_id: Mapped[str] = mapped_column(String(36), index=True)
    incident_id: Mapped[str] = mapped_column(String(36), index=True)
    resources_summary: Mapped[str] = mapped_column(Text, default="")
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    eta_hours: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[MissionStatus] = mapped_column(Enum(MissionStatus),
                                                   default=MissionStatus.planned)
    assigned_to: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                                 server_default=func.now())