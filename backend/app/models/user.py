import enum
from sqlalchemy import Column, String, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.base import UUIDMixin, TimestampMixin


class UserRoleEnum(str, enum.Enum):
    INSTITUTION_ADMIN = "INSTITUTION_ADMIN"
    REVIEWER = "REVIEWER"
    APPROVING_AUTHORITY = "APPROVING_AUTHORITY"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"


user_roles_table = Table(
    "user_role_assignments",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
)


class Role(Base, UUIDMixin):
    __tablename__ = "roles"

    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    users = relationship("User", secondary=user_roles_table, back_populates="roles")


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    roles = relationship("Role", secondary=user_roles_table, back_populates="users", lazy="joined")
    institution_memberships = relationship("InstitutionMember", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")

    @property
    def primary_role(self) -> str:
        if self.roles:
            return self.roles[0].name
        return UserRoleEnum.INSTITUTION_ADMIN.value

    @property
    def institution_id(self):
        if self.institution_memberships:
            return self.institution_memberships[0].institution_id
        return None
