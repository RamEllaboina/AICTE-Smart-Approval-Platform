import enum
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class DocumentCategoryEnum(str, enum.Enum):
    LAND_DOCUMENTS = "LAND_DOCUMENTS"
    BUILDING_PLAN = "BUILDING_PLAN"
    AICTE_AFFILIATION = "AICTE_AFFILIATION"
    FACULTY_LIST = "FACULTY_LIST"
    AUDITED_ACCOUNTS = "AUDITED_ACCOUNTS"
    FIRE_SAFETY_NOC = "FIRE_SAFETY_NOC"
    POLLUTION_CONTROL_NOC = "POLLUTION_CONTROL_NOC"
    BARRIER_FREE_ENVIRONMENT = "BARRIER_FREE_ENVIRONMENT"
    OTHER = "OTHER"


class ApplicationDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "application_documents"

    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_key = Column(String(500), nullable=False, unique=True)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    sha256_checksum = Column(String(64), nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_notes = Column(String(500), nullable=True)
    uploader_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    application = relationship("Application", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan", order_by="DocumentVersion.version_number.desc()")


class DocumentVersion(Base, UUIDMixin):
    __tablename__ = "document_versions"

    document_id = Column(String(36), ForeignKey("application_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, default=1, nullable=False)
    file_key = Column(String(500), nullable=False)
    sha256_checksum = Column(String(64), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    uploaded_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)

    document = relationship("ApplicationDocument", back_populates="versions")
