from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class Institution(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "institutions"

    name = Column(String(255), nullable=False, index=True)
    aicte_id = Column(String(50), unique=True, nullable=False, index=True)
    address = Column(String(500), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    pin_code = Column(String(10), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=False)
    category = Column(String(100), default="ENGINEERING_AND_TECHNOLOGY", nullable=False)
    status = Column(String(50), default="ACTIVE", nullable=False)

    members = relationship("InstitutionMember", back_populates="institution", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="institution", cascade="all, delete-orphan")


class InstitutionMember(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "institution_members"

    institution_id = Column(String(36), ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    designation = Column(String(100), default="Principal / Director", nullable=False)
    is_primary_admin = Column(Boolean, default=True, nullable=False)

    institution = relationship("Institution", back_populates="members")
    user = relationship("User", back_populates="institution_memberships")
