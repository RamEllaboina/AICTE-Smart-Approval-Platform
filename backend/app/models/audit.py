import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, Text
from app.db.session import Base
from app.models.base import UUIDMixin


class AuditEvent(Base, UUIDMixin):
    __tablename__ = "audit_events"

    correlation_id = Column(String(36), default=lambda: str(uuid.uuid4()), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True, index=True)
    actor_role = Column(String(50), nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # e.g., APPLICATION_SUBMITTED, TRANSITION_EXECUTED, DOCUMENT_UPLOADED, DEFICIENCY_ISSUED
    entity_type = Column(String(50), nullable=False, index=True)  # e.g., Application, Document, Deficiency
    entity_id = Column(String(36), nullable=False, index=True)
    ip_address = Column(String(50), nullable=True)
    before_state_json = Column(JSON, nullable=True)
    after_state_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
