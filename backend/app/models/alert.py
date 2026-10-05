import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AlertSeverity(str, enum.Enum):
    info = "info"
    warning = "warning"
    severe = "severe"
    critical = "critical"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True,
                                    default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200))
    message: Mapped[str] = mapped_column(Text)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity))
    region: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),
                                                 server_default=func.now(), index=True)