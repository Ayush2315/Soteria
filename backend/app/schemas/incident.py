"""
Pydantic Schemas for Incident Ingestion, Multimodal AI Triage Extraction, Safety SOPs, and Verification.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.incident import SourceType, TriageCategory, IncidentStatus


# --- Multimodal Structured Extraction Schemas (Gemini Response Schema) ---
class VulnerableGroupBreakdown(BaseModel):
    elderly: int = Field(0, description="Count of elderly individuals (>= 60 years old)")
    children: int = Field(0, description="Count of infants or children (< 18 years old)")
    pregnant: int = Field(0, description="Count of pregnant individuals")
    disabled: int = Field(0, description="Count of physically disabled or non-ambulatory individuals")


class SafetySOP(BaseModel):
    summary: str = Field(..., description="1-sentence operational hazard summary for ground rescue teams")
    bullet_1: str = Field(..., description="Step 1: Immediate life safety / hazard containment action")
    bullet_2: str = Field(..., description="Step 2: Evacuation and rescue protocol with required PPE")
    bullet_3: str = Field(..., description="Step 3: Medical triage, stabilization, and secondary danger check")


class MultimodalGeminiExtraction(BaseModel):
    detected_language: str = Field(
        "en",
        description="Detected language/dialect e.g. 'Hindi', 'Bhojpuri', 'Bengali', 'Tamil', 'Telugu', 'English'",
    )
    transcript: str = Field(
        ...,
        description="Verbatim transcript of spoken audio or clean text description",
    )
    translation_en: str = Field(
        ...,
        description="English translation of the transcript if original is in a regional dialect or non-English",
    )
    hazard_type: str = Field(
        ...,
        description="Primary hazard classification: 'FLOOD', 'STRUCTURAL_COLLAPSE', 'FIRE', 'ELECTRICAL', 'LANDSLIDE', 'CYCLONE', 'HAZMAT', 'MEDICAL_EMERGENCY', or 'OTHER'",
    )
    hazard_severity: int = Field(
        ...,
        ge=1,
        le=10,
        description="Inherent severity of the hazard on a 1 to 10 scale (10 = catastrophic / life-threatening)",
    )
    people_affected: int = Field(
        1,
        ge=1,
        description="Estimated total number of people impacted or in distress",
    )
    vulnerable_groups: VulnerableGroupBreakdown = Field(
        default_factory=VulnerableGroupBreakdown,
        description="Breakdown of vulnerable demographics present at the scene",
    )
    is_trapped: bool = Field(
        False,
        description="True if any victims are physically trapped, stranded on roofs, or unable to evacuate",
    )
    trapped_count: int = Field(
        0,
        ge=0,
        description="Number of individuals physically trapped or immobilized",
    )
    injuries_reported: List[str] = Field(
        default_factory=list,
        description="Specific injuries or medical conditions (e.g. 'crush trauma', 'severe bleeding', 'hypothermia')",
    )
    extracted_location: Optional[str] = Field(
        None,
        description="Landmark, building name, road, or neighborhood mentioned in audio/text",
    )
    safety_sop: SafetySOP = Field(
        ...,
        description="3-bullet actionable standard operating procedure for first responders",
    )
    confidence_score: float = Field(
        0.95,
        ge=0.0,
        le=1.0,
        description="AI confidence score for extraction accuracy (0.0 to 1.0)",
    )


# --- Legacy / Generic Extracted Entities Schema for Backward Compatibility ---
class ExtractedEntities(BaseModel):
    trapped_count: int = Field(0, description="Estimated number of trapped individuals")
    medical_needs: List[str] = Field(default_factory=list, description="Immediate medical assistance needed")
    hazard_types: List[str] = Field(default_factory=list, description="Hazards detected e.g., FLOOD, COLLAPSE, FIRE, ELECTRICAL")
    vulnerable_people: Dict[str, Any] = Field(
        default_factory=lambda: {"elderly": 0, "children": 0, "pregnant": 0, "disabled": 0},
        description="Identified vulnerable demographics",
    )
    detected_language: Optional[str] = Field("en", description="Detected dialect or language code")
    translation_en: Optional[str] = Field(None, description="English translation if dialect detected")
    confidence_score: Optional[float] = Field(0.95, description="Extraction confidence score (0.0 - 1.0)")


class SafetySOPResponse(BaseModel):
    urgency_summary: str = Field(..., description="High-level hazard brief for ground teams")
    hazards_detected: List[str] = Field(default_factory=list, description="Active perils at location")
    recommended_gear: List[str] = Field(default_factory=list, description="Required PPE and rescue equipment")
    protocol_steps: List[str] = Field(default_factory=list, description="Step-by-step ground action protocol")


class TriageBreakdown(BaseModel):
    hazard_severity_score: float = Field(..., description="Subscore from hazard severity rating (0 - 35.0)")
    trapped_factor_score: float = Field(..., description="Subscore from trapped victims status and count (0 - 25.0)")
    vulnerability_score: float = Field(..., description="Subscore from children, elderly, pregnant, disabled (0 - 25.0)")
    medical_injury_score: float = Field(..., description="Subscore from medical trauma and injuries reported (0 - 10.0)")
    recency_factor_score: float = Field(..., description="Subscore bonus/decay from distress signal freshness (0 - 5.0)")
    final_score: float = Field(..., description="Composite 0 - 100 Urgency Triage Score")
    triage_category: TriageCategory = Field(..., description="Mapped Triage Tier (CRITICAL_P1, URGENT_P2, MODERATE_P3, LOW_P4)")


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


# --- Complete Multimodal Triage API Response ---
class MultimodalTriageResponse(BaseModel):
    incident: IncidentRead = Field(..., description="Persisted incident database record")
    extraction: MultimodalGeminiExtraction = Field(..., description="Structured AI extraction from Gemini")
    triage_breakdown: TriageBreakdown = Field(..., description="Mathematical urgency score calculation breakdown")
    audio_playback_url: Optional[str] = Field(None, description="Static playback URL for uploaded audio")
    image_preview_url: Optional[str] = Field(None, description="Static preview URL for uploaded disaster photo")


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
