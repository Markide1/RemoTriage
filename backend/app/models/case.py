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

    # Custom ID and security
    custom_id: Mapped[str] = mapped_column(String, unique=True, nullable=True)  # e.g. jane-john-29031-a1b2c3d4
    pin_hash: Mapped[str] = mapped_column(String, nullable=True)  # bcrypt hashed PIN

    # Patient demographics and history
    patient_full_name: Mapped[str] = mapped_column(String, nullable=True)
    patient_initials: Mapped[str] = mapped_column(String, nullable=True)  # e.g. "JJ"
    date_of_birth: Mapped[str] = mapped_column(String, nullable=True)
    gender: Mapped[str] = mapped_column(String, nullable=True)
    email: Mapped[str] = mapped_column(String, nullable=True)

    # Patient medical history (JSON for flexibility)
    current_medications: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array as string
    previous_illness: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array as string
    family_illnesses: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array as string
    doctor_type: Mapped[str] = mapped_column(String, nullable=True)  # e.g. "dentist", "radiologist"
    disease_description: Mapped[str] = mapped_column(Text, nullable=True)

    # Assessment metadata
    care_plan: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array as string
    likely_diseases: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array as string
    reasoning: Mapped[str] = mapped_column(Text, nullable=True)
    follow_up_history: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array of updates
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)