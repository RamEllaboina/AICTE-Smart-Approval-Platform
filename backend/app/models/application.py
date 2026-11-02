import enum
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class ApplicationCategoryEnum(str, enum.Enum):
    NEW_PROGRAM = "NEW_PROGRAM"
    INTAKE_MODIFICATION = "INTAKE_MODIFICATION"
    INSTITUTION_UPDATE = "INSTITUTION_UPDATE"


class ApplicationStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    COMPLETENESS_CHECK = "COMPLETENESS_CHECK"
    RETURNED_FOR_CORRECTION = "RETURNED_FOR_CORRECTION"
    RESUBMITTED = "RESUBMITTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    REVIEW_COMPLETED = "REVIEW_COMPLETED"
    PENDING_FINAL_DECISION = "PENDING_FINAL_DECISION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Application(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "applications"

    application_number = Column(String(50), unique=True, nullable=False, index=True)
    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), default=ApplicationCategoryEnum.NEW_PROGRAM.value, nullable=False)
    academic_year = Column(String(20), default="2026-2027", nullable=False)
    status = Column(String(50), default=ApplicationStatusEnum.DRAFT.value, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    
    # Structured application payload (program details, built-up area, student intake, faculty count, etc.)
    details_json = Column(JSON, default=dict, nullable=False)

    current_revision = Column(Integer, default=1, nullable=False)
    submission_date = Column(DateTime(timezone=True), nullable=True)
    deadline_date = Column(DateTime(timezone=True), nullable=True)
    compliance_score = Column(Float, default=0.0, nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    institution = relationship("Institution", back_populates="applications")
    documents = relationship("ApplicationDocument", back_populates="application", cascade="all, delete-orphan")
    revisions = relationship("ApplicationRevision", back_populates="application", cascade="all, delete-orphan")
    transition_history = relationship("ApplicationTransitionHistory", back_populates="application", cascade="all, delete-orphan", order_by="ApplicationTransitionHistory.created_at.desc()")
    evaluations = relationship("ComplianceEvaluation", back_populates="application", cascade="all, delete-orphan", order_by="ComplianceEvaluation.evaluation_date.desc()")
    deficiencies = relationship("Deficiency", back_populates="application", cascade="all, delete-orphan")
    assignments = relationship("ReviewerAssignment", back_populates="application", cascade="all, delete-orphan")
    comments = relationship("ReviewComment", back_populates="application", cascade="all, delete-orphan")
    deadlines = relationship("Deadline", back_populates="application", cascade="all, delete-orphan")


class ApplicationRevision(Base, UUIDMixin):
    __tablename__ = "application_revisions"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    revision_number = Column(Integer, nullable=False)
    snapshot_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    application = relationship("Application", back_populates="revisions")
