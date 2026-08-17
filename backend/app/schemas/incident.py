"""
Pydantic Schemas for Incident Ingestion, AI Triage Extraction, Safety SOPs, and Verification.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.incident import SourceType, TriageCategory, IncidentStatus


class ExtractedEntities(BaseModel):
    trapped_count: int = Field(0, description="Estimated number of trapped individuals")
    medical_needs: List[str] = Field(default_factory=list, description="Immediate medical assistance needed")
    hazard_types: List[str] = Field(default_factory=list, description="Hazards detected e.g., FLOOD, COLLAPSE, FIRE, ELECTRICAL")
    vulnerable_people: Dict[str, Any] = Field(
        default_factory=lambda: {"elderly": 0, "children": 0, "disabled": 0},
        description="Identified vulnerable demographics",
    )
    detected_language: Optional[str] = Field("en", description="Detected dialect or language code")
    confidence_score: Optional[float] = Field(0.95, description="Extraction confidence score (0.0 - 1.0)")


class SafetySOPResponse(BaseModel):
    urgency_summary: str = Field(..., description="High-level hazard brief for ground teams")
    hazards_detected: List[str] = Field(default_factory=list, description="Active perils at location")
    recommended_gear: List[str] = Field(default_factory=list, description="Required PPE and rescue equipment")
    protocol_steps: List[str] = Field(default_factory=list, description="Step-by-step ground action protocol")


class TriageBreakdown(BaseModel):
    base_urgency: float = Field(..., description="Baseline urgency score (0-40)")
    vulnerability_weight: float = Field(..., description="Equitable weighting for children/elderly/disabled (0-30)")
    hazard_severity: float = Field(..., description="Immediate environmental hazard severity (0-30)")
    final_score: float = Field(..., description="Composite 0-100 Triage Score")


# --- Base Incident Schema ---
class IncidentBase(BaseModel):
    source_type: SourceType = Field(SourceType.TEXT, description="Modality of distress signal")
    raw_payload: Optional[str] = Field(None, description="Distress text or transcription from voice note")
    audio_url: Optional[str] = Field(None, description="URL of uploaded offline voice note")
    image_urls: List[str] = Field(default_factory=list, description="List of disaster scene photo URLs")
    location_name: Optional[str] = Field(None, description="Human-readable landmark or address")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")


# --- Ingestion Request Schema ---
class IncidentCreate(IncidentBase):
    is_offline_cached: bool = Field(False, description="True if captured in dead-zone and synced later")
    client_timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Time recorded on device")


# --- Update Schema ---
class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_volunteer_id: Optional[int] = None
    verification_data: Optional[Dict[str, Any]] = None
    safety_sop: Optional[Dict[str, Any]] = None
    triage_score: Optional[float] = None
    triage_category: Optional[TriageCategory] = None


# --- Response Serialization Schema ---
class IncidentRead(IncidentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    triage_score: float
    triage_category: TriageCategory
    status: IncidentStatus
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    safety_sop: Dict[str, Any] = Field(default_factory=dict)
    assigned_volunteer_id: Optional[int] = None
    verification_data: Dict[str, Any] = Field(default_factory=dict)
    is_offline_cached: bool
    client_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Query Filter Parameters ---
class IncidentFilterParams(BaseModel):
    status: Optional[IncidentStatus] = None
    triage_category: Optional[TriageCategory] = None
    min_triage_score: Optional[float] = None
    max_triage_score: Optional[float] = None
    radius_meters: Optional[float] = None
    center_latitude: Optional[float] = None
    center_longitude: Optional[float] = None
    limit: int = Field(50, ge=1, le=500)
    offset: int = Field(0, ge=0)
