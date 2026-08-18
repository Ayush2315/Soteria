"""
User and Role-Based Access Control (RBAC) ORM Models for SOTERIA platform.
"""
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    VOLUNTEER = "VOLUNTEER"
    HQ_COMMANDER = "HQ_COMMANDER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(
        SQLEnum(UserRole, name="user_role_enum", create_type=False),
        nullable=False,
        default=UserRole.CITIZEN,
        index=True,
    )
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    certifications = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
