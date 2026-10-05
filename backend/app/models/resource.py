import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Float, DateTime, func, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class ResourceType(str, enum.Enum):
    food = "food"
    water = "water"
    medical = "medical"
    shelter = "shelter"


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                    default=lambda: str(uuid.uuid4()))
    depot_id: Mapped[str] = mapped_column(String(36), ForeignKey("depots.id"), index=True)
    type: Mapped[ResourceType] = mapped_column(Enum(ResourceType))
    quantity: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String(20), default="units")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                                 server_default=func.now())