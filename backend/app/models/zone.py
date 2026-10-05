import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                    default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), unique=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    population_density: Mapped[float] = mapped_column(Float, default=0.0)
    accessibility_score: Mapped[float] = mapped_column(Float, default=0.5)
    vulnerability_score: Mapped[float] = mapped_column(Float, default=0.5)
    children_pct: Mapped[float] = mapped_column(Float, default=25.0)
    elder_pct: Mapped[float] = mapped_column(Float, default=10.0)
    disability_pct: Mapped[float] = mapped_column(Float, default=2.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                                 server_default=func.now())