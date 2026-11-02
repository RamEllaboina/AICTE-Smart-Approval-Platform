import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin


class NotificationChannelEnum(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"


class NotificationPriorityEnum(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Notification(Base, UUIDMixin):
    __tablename__ = "notifications"

    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # e.g., SUBMISSION_RECEIVED, DEFICIENCY_ISSUED, DEADLINE_WARNING
    channel = Column(String(20), default=NotificationChannelEnum.IN_APP.value, nullable=False)
    priority = Column(String(20), default=NotificationPriorityEnum.NORMAL.value, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    link_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    recipient = relationship("User", back_populates="notifications")


class Deadline(Base, UUIDMixin):
    __tablename__ = "deadlines"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    task_type = Column(String(50), nullable=False)  # e.g., INSTITUTION_DEFICIENCY_RESPONSE, REVIEWER_SCRUTINY, FINAL_DECISION
    target_entity_id = Column(String(36), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    warning_72h_sent = Column(Boolean, default=False, nullable=False)
    warning_24h_sent = Column(Boolean, default=False, nullable=False)
    overdue_sent = Column(Boolean, default=False, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", back_populates="deadlines")
