import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class FollowUpHistory(Base):
    __tablename__ = "follow_up_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str] = mapped_column(String, ForeignKey("cases.id"), index=True)
    symptoms_added: Mapped[str] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String)
    reasoning: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
