import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Enum as SAEnum, Column, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import enum

class DispatchStatus(str, enum.Enum):
    created = "created"
    dispatched = "dispatched"
    enroute = "enroute"
    arrived = "arrived"
    completed = "completed"
    cancelled = "cancelled"

class Dispatch(Base):
    __tablename__ = "dispatches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id: Mapped[str] = mapped_column(String, ForeignKey("critical_alerts.id"))
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id"))
    hospital_id: Mapped[str] = mapped_column(String, nullable=True)
    hospital_name: Mapped[str] = mapped_column(String)
    hospital_phone: Mapped[str] = mapped_column(String)
    
    status: Mapped[DispatchStatus] = mapped_column(SAEnum(DispatchStatus), default=DispatchStatus.created)
    
    patient_phone: Mapped[str] = mapped_column(String, nullable=True)
    patient_location: Mapped[str] = mapped_column(String, nullable=True)
    
    # Dispatch details
    estimated_arrival_time: Mapped[int] = mapped_column(Integer, nullable=True)  # in minutes
    ambulance_unit: Mapped[str] = mapped_column(String, nullable=True)
    driver_name: Mapped[str] = mapped_column(String, nullable=True)
    driver_phone: Mapped[str] = mapped_column(String, nullable=True)
    
    # Timeline
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    dispatched_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    arrived_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    # Notes and metadata
    notes: Mapped[str] = mapped_column(Text, nullable=True)
