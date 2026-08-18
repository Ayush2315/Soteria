"""
Dispatch and Closed-Loop Verification Pydantic Schemas.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.volunteer import VolunteerRead, VolunteerWithDistance


class DispatchNearbyQuery(BaseModel):
    incident_id: int = Field(..., description="Target incident ID to query nearby volunteers for")
    radius_meters: float = Field(15000.0, ge=100.0, le=100000.0, description="Spatial search radius in meters (default 15km)")
    limit: int = Field(5, ge=1, le=20, description="Maximum number of nearby volunteers to return")


class DispatchAssignRequest(BaseModel):
    incident_id: int = Field(..., description="Target disaster incident ID")
    volunteer_id: Optional[int] = Field(None, description="Selected volunteer ID to dispatch")
    volunteer_ids: Optional[List[int]] = Field(None, description="List of volunteer IDs to dispatch simultaneously")
    notes: Optional[str] = Field(None, description="Commander special deployment notes or instructions")


class DispatchAssignResponse(BaseModel):
    incident_id: int
    volunteer: Optional[VolunteerRead] = None
    volunteers: Optional[List[VolunteerRead]] = None
    incident_status: str
    safety_sop: Dict[str, Any]
    assigned_at: datetime
    message: str


class RescueVerificationAuditResult(BaseModel):
    is_verified: bool = Field(..., description="True if resolution photo proves rescue completion or hazard mitigation")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Gemini Vision model confidence rating")
    visual_observations: str = Field(..., description="Detailed AI visual findings from the resolution photo")
    hazard_clearance_status: str = Field(..., description="'HAZARD_RESOLVED', 'PARTIALLY_MITIGATED', or 'UNRESOLVED'")
    closure_summary: str = Field(..., description="Executive closure receipt text for incident audit log")


class RescueVerificationResponse(BaseModel):
    incident_id: int
    previous_status: str
    current_status: str
    audit_result: RescueVerificationAuditResult
    proof_photo_url: Optional[str] = None
    resolved_at: datetime
    volunteer_id: Optional[int] = None
    closure_notes: Optional[str] = None
