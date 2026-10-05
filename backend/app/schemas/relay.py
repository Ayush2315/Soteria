"""
Pydantic Schemas for Relay Mesh, SMS Webhook, and Citizen Tracking.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SMSWebhookPayload(BaseModel):
    """
    Twilio / Carrier SMS Webhook Payload schema.
    Compatible with form-data Body or JSON {"Body": "...", "From": "..."}.
    """
    From: Optional[str] = Field(None, description="Sender phone number (Twilio format e.g. +919876543210)")
    Body: str = Field(..., description="Raw SMS body text containing SOT1 packet string")
    MessageSid: Optional[str] = Field(None, description="Twilio message SID if available")
    AccountSid: Optional[str] = None


class BulkRelayPayload(BaseModel):
    """
    Schema for batch of SOT1 packets uploaded by a carried device or relief camp kiosk.
    """
    packets: List[str] = Field(..., max_length=500, description="List of raw SOT1 packet strings")
    carrier_node_id: str = Field("P-ANON", max_length=64, description="ID of carrier node e.g. P-8B1A or KIOSK-CAMP3")
    channel: str = Field("QR_RELAY", description="Delivery channel: QR_RELAY, CAMP_KIOSK, or SIMULATION")


class RelayIngestResult(BaseModel):
    packet_id: str
    tracking_code: str
    status: str  # CREATED | DUPLICATE_MERGED | REJECTED
    incident_id: Optional[int] = None
    reporter_count: int = 1
    detail: Optional[str] = None


class BulkRelayResponse(BaseModel):
    received: int
    created: int
    duplicates: int
    rejected: int
    results: List[RelayIngestResult]


class IncidentTrackingResponse(BaseModel):
    """
    Response schema for public citizen status tracking (/track/{tracking_code}).
    """
    tracking_code: str
    incident_id: int
    status: str
    triage_category: str
    triage_score: float
    hazard_type: str
    location_name: Optional[str] = None
    latitude: float
    longitude: float
    reporter_count: int = 1
    created_at: datetime
    updated_at: datetime
    assigned_volunteer: Optional[Dict[str, Any]] = None
    verification_data: Optional[Dict[str, Any]] = None
    safety_sop: Optional[Dict[str, Any]] = None

