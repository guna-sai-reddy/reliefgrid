import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, Integer, Text, DateTime, func, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class IncidentType(str, enum.Enum):
    flood = "flood"
    cyclone = "cyclone"
    earthquake = "earthquake"
    drought = "drought"
    fire = "fire"
    landslide = "landslide"
    blocked_road = "blocked_road"


class IncidentStatus(str, enum.Enum):
    active = "active"
    stabilising = "stabilising"
    ongoing = "ongoing"
    resolved = "resolved"


class Priority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                    default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    type: Mapped[IncidentType] = mapped_column(Enum(IncidentType))
    location: Mapped[str] = mapped_column(String(200))
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    affected_population: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.medium)
    priority_override: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[IncidentStatus] = mapped_column(Enum(IncidentStatus),
                                                   default=IncidentStatus.active)

    demand_food: Mapped[float] = mapped_column(Float, default=0.0)
    demand_water: Mapped[float] = mapped_column(Float, default=0.0)
    demand_medical: Mapped[float] = mapped_column(Float, default=0.0)
    demand_shelter: Mapped[float] = mapped_column(Float, default=0.0)

    reported_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                                 server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                                 server_default=func.now(),
                                                 onupdate=func.now())