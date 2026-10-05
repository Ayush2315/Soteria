"""
Incident SQLAlchemy Model with PostGIS Point Geometry and Multimodal Triage Metadata.
"""
from datetime import datetime
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Text,
    DateTime,
    Boolean,
    Enum as SQLEnum,
    JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


class SourceType(str, enum.Enum):
    VOICE = "VOICE"
    IMAGE = "IMAGE"
    TEXT = "TEXT"
    SOCIAL = "SOCIAL"
    SENSOR = "SENSOR"


class TriageCategory(str, enum.Enum):
    CRITICAL_P1 = "CRITICAL_P1"  # 80 - 100
    URGENT_P2 = "URGENT_P2"      # 60 - 79
    MODERATE_P3 = "MODERATE_P3"  # 40 - 59
    LOW_P4 = "LOW_P4"            # 0 - 39


class IncidentStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    TRIAGED = "TRIAGED"
    DISPATCHED = "DISPATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Input Modality
    source_type = Column(
        SQLEnum(SourceType), default=SourceType.TEXT, nullable=False, index=True
    )
    raw_payload = Column(Text, nullable=True)
    audio_url = Column(String(512), nullable=True)
    image_urls = Column(JSON, default=list)

    # Spatial Location (WGS84 EPSG:4326)
    location_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    
    # PostGIS Spatial Point Column (SRID 4326: WGS 84 GPS coordinates)
    location_geom = Column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True,
    )

    # Multimodal AI Triage Outputs
    triage_score = Column(Float, default=0.0, index=True)
    triage_category = Column(
        SQLEnum(TriageCategory), default=TriageCategory.LOW_P4, index=True
    )
    status = Column(
        SQLEnum(IncidentStatus), default=IncidentStatus.REPORTED, index=True
    )

    # Structured AI Extractions
    # schema: { "trapped_count": int, "medical_needs": list[str], "hazard_types": list[str], "vulnerable_people": dict }
    extracted_entities = Column(JSON, default=dict)

    # Dynamic Volunteer Safety Standard Operating Procedure (SOP)
    # schema: { "hazards": list[str], "required_gear": list[str], "protocol_steps": list[str], "urgency_summary": str }
    safety_sop = Column(JSON, default=dict)

    # Volunteer Dispatch
    assigned_volunteer_id = Column(
        Integer, ForeignKey("volunteers.id", ondelete="SET NULL"), nullable=True
    )
    assigned_volunteer = relationship("Volunteer", back_populates="assigned_incidents")

    # AI Verification and Closure Proof
    # schema: { "proof_photo_url": str, "closure_notes": str, "verified_by_ai": bool, "closed_at": str }
    verification_data = Column(JSON, default=dict)

    # Offline-First Sync Metadata
    is_offline_cached = Column(Boolean, default=False)
    client_timestamp = Column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return (
            f"<Incident(id={self.id}, score={self.triage_score}, "
            f"category={self.triage_category}, status={self.status})>"
        )
