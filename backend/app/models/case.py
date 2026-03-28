import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, Text, Enum as SAEnum, Column
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import enum

class Severity(str, enum.Enum):
    normal = "normal"
    moderate = "moderate"
    critical = "critical"

class InputMode(str, enum.Enum):
    text = "text"
    voice = "voice"

class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String, nullable=True)
    location = Column(String, nullable=True)
    raw_input: Mapped[str] = mapped_column(Text)
    symptoms_detected: Mapped[str] = mapped_column(Text)       # JSON array as string
    severity: Mapped[Severity] = mapped_column(SAEnum(Severity))
    recommendation: Mapped[str] = mapped_column(Text)
    input_mode: Mapped[InputMode] = mapped_column(SAEnum(InputMode))
    referred_to_hospital: Mapped[bool] = mapped_column(Boolean, default=False)
    hospital_name = Column(String, nullable=True)
    alert_triggered: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)