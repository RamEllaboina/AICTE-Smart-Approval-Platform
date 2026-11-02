import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class RuleTypeEnum(str, enum.Enum):
    REQUIRED_FIELD = "REQUIRED_FIELD"
    REQUIRED_DOCUMENT = "REQUIRED_DOCUMENT"
    NUMERIC_RANGE = "NUMERIC_RANGE"
    CONDITIONAL_REQUIREMENT = "CONDITIONAL_REQUIREMENT"
    CROSS_FIELD_CONSISTENCY = "CROSS_FIELD_CONSISTENCY"


class RuleSeverityEnum(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class FindingStatusEnum(str, enum.Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    WARNING = "WARNING"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class ComplianceRule(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "compliance_rules"

    rule_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Applicable application category or 'ALL'
    description = Column(String(500), nullable=False)
    rule_type = Column(String(50), nullable=False)
    condition_json = Column(JSON, nullable=False)
    severity = Column(String(20), default=RuleSeverityEnum.HIGH.value, nullable=False)
    handbook_reference = Column(String(255), nullable=True)  # e.g., "AICTE APH 2026-27 Section 4.2"
    is_active = Column(Boolean, default=True, nullable=False)
    version = Column(Integer, default=1, nullable=False)

    findings = relationship("ComplianceFinding", back_populates="rule")


class ComplianceRuleVersion(Base, UUIDMixin):
    __tablename__ = "compliance_rule_versions"

    rule_id = Column(String(36), ForeignKey("compliance_rules.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, default=1, nullable=False)
    condition_json = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)



class ComplianceEvaluation(Base, UUIDMixin):
    __tablename__ = "compliance_evaluations"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    evaluated_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    overall_status = Column(String(20), nullable=False)  # PASSED, FAILED, WARNING
    readiness_score = Column(Float, default=0.0, nullable=False)  # Percentage 0 - 100
    total_rules = Column(Integer, default=0, nullable=False)
    passed_rules = Column(Integer, default=0, nullable=False)
    failed_rules = Column(Integer, default=0, nullable=False)
    evaluation_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    application = relationship("Application", back_populates="evaluations")
    findings = relationship("ComplianceFinding", back_populates="evaluation", cascade="all, delete-orphan")


class ComplianceFinding(Base, UUIDMixin):
    __tablename__ = "compliance_findings"

    evaluation_id = Column(String(36), ForeignKey("compliance_evaluations.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(36), ForeignKey("compliance_rules.id", ondelete="SET NULL"), nullable=True)
    rule_code = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)  # PASSED, FAILED, WARNING, NOT_APPLICABLE
    message = Column(String(500), nullable=False)
    affected_field = Column(String(100), nullable=True)
    remediation_action = Column(String(500), nullable=True)
    calculated_value = Column(String(255), nullable=True)
    expected_value = Column(String(255), nullable=True)

    evaluation = relationship("ComplianceEvaluation", back_populates="findings")
    rule = relationship("ComplianceRule", back_populates="findings")
