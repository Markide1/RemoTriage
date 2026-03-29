import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import enum

class AlertType(str, enum.Enum):
    critical = "critical"
    moderate = "moderate"

class AlertStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"
    acknowledged = "acknowledged"

class CriticalAlert(Base):
    __tablename__ = "critical_alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id"))
    alert_type: Mapped[AlertType] = mapped_column(SAEnum(AlertType))
    status: Mapped[AlertStatus] = mapped_column(SAEnum(AlertStatus), default=AlertStatus.pending)
    symptoms: Mapped[str] = mapped_column(Text)  # JSON array as string
    recommendation: Mapped[str] = mapped_column(Text)
    patient_phone: Mapped[str] = mapped_column(String, nullable=True)
    patient_location: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)


class AlertRecipient(Base):
    """Tracks which recipients (hospitals, MoH, etc.) received the alert"""
    __tablename__ = "alert_recipients"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id: Mapped[str] = mapped_column(String, ForeignKey("critical_alerts.id"))
    recipient_type: Mapped[str] = mapped_column(String)  # "hospital", "moh", "emergency_services"
    recipient_name: Mapped[str] = mapped_column(String)
    recipient_email: Mapped[str] = mapped_column(String)
    email_status: Mapped[str] = mapped_column(String, default="pending")  # pending, sent, failed
    email_id = Column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
