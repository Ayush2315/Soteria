"""
Incident Ingestion, Retrieval, and Triage Management Endpoints with WebSocket Broadcasts.
"""
from typing import List, Optional
from datetime import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.config import settings
from app.core.websockets import ws_manager
from app.models.incident import Incident, SourceType, TriageCategory, IncidentStatus
from app.schemas.incident import (
    IncidentCreate,
    IncidentRead,
    IncidentUpdate,
)

logger = logging.getLogger("soteria.api.incidents")
router = APIRouter()


def _compute_preliminary_triage(payload: IncidentCreate) -> tuple[float, TriageCategory, dict, dict]:
    """
    Computes a baseline heuristic triage score (0-100) and structured safety brief.
    """
    text_content = (payload.raw_payload or "").lower()
    score = 30.0  # Base priority score
    medical_needs = []
    hazard_types = []
    trapped_count = 0
    vulnerable = {"elderly": 0, "children": 0, "pregnant": 0, "disabled": 0}

    # Keyword heuristics for high-urgency disaster distress
    if any(k in text_content for k in ["trapped", "stuck", "buried", "collapse", "drowning", "roof", "fase"]):
        score += 35.0
        trapped_count = 2
        hazard_types.append("STRUCTURAL_COLLAPSE")

    if any(k in text_content for k in ["flood", "water rising", "water level", "current", "overflow", "baadh", "pani"]):
        score += 20.0
        hazard_types.append("RAPID_FLOOD")

    if any(k in text_content for k in ["bleeding", "unconscious", "heart", "oxygen", "injury", "injured", "fracture"]):
        score += 25.0
        medical_needs.append("CRITICAL_TRAUMA_CARE")

    if any(k in text_content for k in ["elderly", "old age", "grandma", "grandpa", "baby", "infant", "child", "children", "pregnant"]):
        score += 20.0
        vulnerable["children"] = 1
        vulnerable["elderly"] = 1

    # Clamp score to 0 - 100
    final_score = min(100.0, max(0.0, score))

    # Determine category
    if final_score >= settings.TRIAGE_SCORE_THRESHOLD_CRITICAL:
        category = TriageCategory.CRITICAL_P1
    elif final_score >= settings.TRIAGE_SCORE_THRESHOLD_URGENT:
        category = TriageCategory.URGENT_P2
    elif final_score >= settings.TRIAGE_SCORE_THRESHOLD_MODERATE:
        category = TriageCategory.MODERATE_P3
    else:
        category = TriageCategory.LOW_P4

    extracted_entities = {
        "trapped_count": trapped_count,
        "is_trapped": trapped_count > 0,
        "medical_needs": medical_needs or ["GENERAL_EVALUATION"],
        "hazard_types": hazard_types or ["GENERAL_DISASTER_ZONE"],
        "hazard_severity": int(final_score / 10),
        "people_affected": max(1, trapped_count + vulnerable["children"] + vulnerable["elderly"]),
        "vulnerable_people": vulnerable,
        "detected_language": "en",
        "confidence_score": 0.92,
    }

    safety_sop = {
        "urgency_summary": f"Incident triaged as {category.value} with priority score {final_score:.1f}/100.",
        "hazards_detected": hazard_types or ["UNSPECIFIED_ENVIRONMENTAL_HAZARD"],
        "recommended_gear": [
            "Heavy-Duty Waterproof Boots",
            "Personal Flotation Device (PFD)",
            "Class 3 High-Visibility Vest",
            "First Responder Medical Kit",
        ],
        "protocol_steps": [
            "1. Establish visual contact and evaluate structural stability prior to entry.",
            "2. Secure safe egress route for casualties and response team.",
            "3. Administer immediate triage and stabilize vulnerable individuals.",
            "4. Transmit status update and request evacuation vehicle if needed.",
        ],
    }

    return final_score, category, extracted_entities, safety_sop


@router.post(
    "/",
    response_model=IncidentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Disaster Distress Signal (JSON)",
    description="Ingests JSON distress signal, computes triage score, persists in PostGIS, and broadcasts via WebSockets.",
)
async def create_incident(
    incident_in: IncidentCreate,
    db: AsyncSession = Depends(get_db),
) -> IncidentRead:
    triage_score, triage_category, entities, sop = _compute_preliminary_triage(incident_in)

    # PostGIS Point format: SRID=4326;POINT(longitude latitude)
    point_wkt = f"SRID=4326;POINT({incident_in.longitude} {incident_in.latitude})"

    db_incident = Incident(
        source_type=incident_in.source_type,
        raw_payload=incident_in.raw_payload,
        audio_url=incident_in.audio_url,
        image_urls=incident_in.image_urls,
        location_name=incident_in.location_name or f"Coordinates ({incident_in.latitude:.4f}, {incident_in.longitude:.4f})",
        latitude=incident_in.latitude,
        longitude=incident_in.longitude,
        location_geom=point_wkt,
        triage_score=triage_score,
        triage_category=triage_category,
        status=IncidentStatus.TRIAGED,
        extracted_entities=entities,
        safety_sop=sop,
        is_offline_cached=incident_in.is_offline_cached,
        client_timestamp=incident_in.client_timestamp or datetime.utcnow(),
    )

    db.add(db_incident)
    await db.commit()
    await db.refresh(db_incident)

    incident_read = IncidentRead.model_validate(db_incident)

    # Broadcast to WebSocket subscribers
    try:
        await ws_manager.broadcast_incident(
            event_type="INCIDENT_CREATED",
            incident_data=incident_read.model_dump(mode="json"),
        )
    except Exception as e:
        logger.warning(f"Failed to broadcast WebSocket event: {e}")

    return incident_read


@router.get(
    "/",
    response_model=List[IncidentRead],
    status_code=status.HTTP_200_OK,
    summary="List Triage Incidents",
    description="Retrieves a list of disaster incidents sorted by urgency priority score and creation time.",
)
async def list_incidents(
    status_filter: Optional[IncidentStatus] = Query(None, alias="status"),
    category_filter: Optional[TriageCategory] = Query(None, alias="category"),
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[IncidentRead]:
    stmt = select(Incident)

    if status_filter:
        stmt = stmt.where(Incident.status == status_filter)
    if category_filter:
        stmt = stmt.where(Incident.triage_category == category_filter)
    if min_score is not None:
        stmt = stmt.where(Incident.triage_score >= min_score)

    stmt = stmt.order_by(desc(Incident.triage_score), desc(Incident.created_at)).limit(limit).offset(offset)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{incident_id}",
    response_model=IncidentRead,
    status_code=status.HTTP_200_OK,
    summary="Get Detailed Incident Dossier",
    description="Fetches full incident details including dynamic safety SOP briefing and verification logs.",
)
async def get_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
) -> IncidentRead:
    stmt = select(Incident).where(Incident.id == incident_id)
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found.",
        )
    return incident


@router.patch(
    "/{incident_id}",
    response_model=IncidentRead,
    status_code=status.HTTP_200_OK,
    summary="Update Incident Status or Dispatch State",
    description="Allows commanders or field volunteers to update status, assign responders, or attach photo closure proof.",
)
async def update_incident(
    incident_id: int,
    incident_update: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
) -> IncidentRead:
    stmt = select(Incident).where(Incident.id == incident_id)
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident with ID {incident_id} not found.",
        )

    update_data = incident_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(incident, field, value)

    incident.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(incident)

    incident_read = IncidentRead.model_validate(incident)

    # Broadcast update event to all connected dashboards
    try:
        await ws_manager.broadcast_incident(
            event_type="INCIDENT_UPDATED",
            incident_data=incident_read.model_dump(mode="json"),
        )
    except Exception as e:
        logger.warning(f"Failed to broadcast WebSocket update event: {e}")

    return incident_read
