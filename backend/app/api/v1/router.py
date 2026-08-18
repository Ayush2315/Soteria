"""
Aggregation of all v1 API endpoints.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import health, incidents, triage, dispatch, command

api_router = APIRouter()

api_router.include_router(
    health.router,
    tags=["System & PostGIS Health"],
)

api_router.include_router(
    incidents.router,
    prefix="/incidents",
    tags=["Disaster Incidents & Triage"],
)

api_router.include_router(
    triage.router,
    prefix="/triage",
    tags=["Multimodal GenAI Triage Engine"],
)

api_router.include_router(
    dispatch.router,
    prefix="/dispatch",
    tags=["Volunteer Spatial Dispatch & AI Verification"],
)

api_router.include_router(
    command.router,
    prefix="/command",
    tags=["Commander SitRep & Operational Metrics"],
)
