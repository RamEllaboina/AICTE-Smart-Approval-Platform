from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class WorkflowDefinition(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "workflow_definitions"

    category = Column(String(50), nullable=False, unique=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1, nullable=False)

    states = relationship("WorkflowState", back_populates="workflow_definition", cascade="all, delete-orphan")


class WorkflowState(Base, UUIDMixin):
    __tablename__ = "workflow_states"

    workflow_id = Column(String(36), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    state_key = Column(String(50), nullable=False)
    label = Column(String(100), nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    is_terminal = Column(Boolean, default=False, nullable=False)
    target_sla_hours = Column(Integer, default=72, nullable=False)

    workflow_definition = relationship("WorkflowDefinition", back_populates="states")


class WorkflowTransition(Base, UUIDMixin):
    __tablename__ = "workflow_transitions"

    workflow_id = Column(String(36), ForeignKey("workflow_definitions.id", ondelete="CASCADE"), nullable=False, index=True)
    from_state = Column(String(50), nullable=False)
    to_state = Column(String(50), nullable=False)
    allowed_roles = Column(JSON, default=list, nullable=False)  # e.g. ["REVIEWER", "SYSTEM_ADMIN"]
    requires_comment = Column(Boolean, default=False, nullable=False)


class ApplicationTransitionHistory(Base, UUIDMixin):
    __tablename__ = "application_transition_history"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    from_state = Column(String(50), nullable=False)
    to_state = Column(String(50), nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_role = Column(String(50), nullable=False)
    reason = Column(String(500), nullable=True)
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", back_populates="transition_history")
    actor = relationship("User")
