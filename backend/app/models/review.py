import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class DeficiencyStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    SUBMITTED = "SUBMITTED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class AssignmentStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    REASSIGNED = "REASSIGNED"


class RecommendationEnum(str, enum.Enum):
    RECOMMENDED = "RECOMMENDED"
    NOT_RECOMMENDED = "NOT_RECOMMENDED"
    DEFICIENCY_FOUND = "DEFICIENCY_FOUND"


class ReviewerAssignment(Base, UUIDMixin):
    __tablename__ = "reviewer_assignments"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default=AssignmentStatusEnum.ACTIVE.value, nullable=False)
    priority = Column(String(20), default="NORMAL", nullable=False)

    application = relationship("Application", back_populates="assignments")
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])


class ReviewComment(Base, UUIDMixin):
    __tablename__ = "review_comments"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    stage = Column(String(50), nullable=False)
    comment_type = Column(String(50), default="INTERNAL_OBSERVATION", nullable=False)  # INTERNAL_OBSERVATION, FORMAL_RECOMMENDATION, FINAL_DECISION_NOTE
    content = Column(Text, nullable=False)
    recommendation = Column(String(50), nullable=True)  # RECOMMENDED, NOT_RECOMMENDED, DEFICIENCY_FOUND
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", back_populates="comments")
    reviewer = relationship("User")


class Deficiency(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "deficiencies"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(36), ForeignKey("compliance_rules.id", ondelete="SET NULL"), nullable=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requested_correction = Column(Text, nullable=False)
    severity = Column(String(20), default="HIGH", nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default=DeficiencyStatusEnum.OPEN.value, nullable=False, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    application = relationship("Application", back_populates="deficiencies")
    reviewer = relationship("User")
    responses = relationship("DeficiencyResponse", back_populates="deficiency", cascade="all, delete-orphan", order_by="DeficiencyResponse.submitted_at.desc()")


class DeficiencyResponse(Base, UUIDMixin):
    __tablename__ = "deficiency_responses"

    deficiency_id = Column(String(36), ForeignKey("deficiencies.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    response_notes = Column(Text, nullable=False)
    supporting_document_id = Column(String(36), ForeignKey("application_documents.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    deficiency = relationship("Deficiency", back_populates="responses")
    supporting_document = relationship("ApplicationDocument")
