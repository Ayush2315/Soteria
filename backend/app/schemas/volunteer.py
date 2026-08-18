"""
Volunteer Schemas for Skill-Based Dispatch and Spatial Tracking.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.volunteer import VolunteerStatus


class VolunteerBase(BaseModel):
    name: str = Field(..., description="Full name of registered field volunteer / responder")
    phone: str = Field(..., description="Direct contact phone number")
    skills: List[str] = Field(
        default_factory=list,
        description="Certified disaster response capabilities e.g. ['SWIMMER', 'BOAT_OPERATOR', 'PARAMEDIC']",
    )
    status: VolunteerStatus = Field(
        VolunteerStatus.AVAILABLE,
        description="Current operational status: AVAILABLE, DISPATCHED, BUSY, OFFLINE",
    )
    current_latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Current latitude coordinate")
    current_longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Current longitude coordinate")


class VolunteerCreate(VolunteerBase):
    pass


class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[VolunteerStatus] = None
    current_latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    current_longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    is_active: Optional[bool] = None


class VolunteerRead(VolunteerBase):
    id: int
    is_active: bool
    last_ping: datetime

    class Config:
        from_attributes = True


class VolunteerWithDistance(VolunteerRead):
    distance_meters: float = Field(..., description="PostGIS geodesic distance in meters from incident coordinate")
    distance_km: float = Field(..., description="Formatted distance in kilometers")
