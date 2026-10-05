"""
Volunteer SQLAlchemy Model for Skill Matching and Field Response Tracking.
"""
from datetime import datetime
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Boolean,
    Enum as SQLEnum,
    JSON,
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


class VolunteerStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    DISPATCHED = "DISPATCHED"
    BUSY = "BUSY"
    OFFLINE = "OFFLINE"


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False, unique=True, index=True)
    skills = Column(JSON, default=list)  # e.g., ["FIRST_AID", "SWIMMER", "BOAT_OPERATOR", "MEDIC"]
    status = Column(
        SQLEnum(VolunteerStatus), default=VolunteerStatus.AVAILABLE, index=True
    )
    
    # Location
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    current_geom = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )
    
    is_active = Column(Boolean, default=True)
    last_ping = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assigned_incidents = relationship("Incident", back_populates="assigned_volunteer")

    def __repr__(self) -> str:
        return f"<Volunteer(id={self.id}, name={self.name}, status={self.status})>"
