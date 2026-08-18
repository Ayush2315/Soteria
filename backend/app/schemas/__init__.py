"""
Pydantic Schemas for SOTERIA API request validation and response serialization.
"""
from app.schemas.health import HealthCheckResponse
from app.schemas.incident import (
    IncidentBase,
    IncidentCreate,
    IncidentUpdate,
    IncidentRead,
    IncidentFilterParams,
    SafetySOPResponse,
    TriageBreakdown,
    MultimodalGeminiExtraction,
    MultimodalTriageResponse,
)
from app.schemas.volunteer import (
    VolunteerBase,
    VolunteerCreate,
    VolunteerUpdate,
    VolunteerRead,
    VolunteerWithDistance,
)
from app.schemas.dispatch import (
    DispatchNearbyQuery,
    DispatchAssignRequest,
    DispatchAssignResponse,
    RescueVerificationAuditResult,
    RescueVerificationResponse,
)
from app.schemas.sitrep import (
    SitRepSummary,
    SitRepResponse,
    CommandStats,
)

__all__ = [
    "HealthCheckResponse",
    "IncidentBase",
    "IncidentCreate",
    "IncidentUpdate",
    "IncidentRead",
    "IncidentFilterParams",
    "SafetySOPResponse",
    "TriageBreakdown",
    "MultimodalGeminiExtraction",
    "MultimodalTriageResponse",
    "VolunteerBase",
    "VolunteerCreate",
    "VolunteerUpdate",
    "VolunteerRead",
    "VolunteerWithDistance",
    "DispatchNearbyQuery",
    "DispatchAssignRequest",
    "DispatchAssignResponse",
    "RescueVerificationAuditResult",
    "RescueVerificationResponse",
    "SitRepSummary",
    "SitRepResponse",
    "CommandStats",
]

