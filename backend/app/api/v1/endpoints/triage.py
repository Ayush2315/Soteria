"""
Multimodal GenAI Triage Ingestion and Urgency Analysis Endpoints.
Processes audio recordings, disaster photos, and text distress signals in a single unified flow,
persists in PostGIS, and broadcasts in real time via WebSockets.
"""
from typing import Optional
from datetime import datetime
import os
import uuid
import logging
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.websockets import ws_manager
from app.models.incident import Incident, SourceType, IncidentStatus
from app.schemas.incident import (
    IncidentRead,
    MultimodalTriageResponse,
)
from app.services.gemini_service import extract_multimodal_distress
from app.services.triage_engine import calculate_triage_score

logger = logging.getLogger("soteria.api.triage")
router = APIRouter()


@router.post(
    "/multimodal",
    response_model=MultimodalTriageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Multimodal SOS (Voice, Photo, Text) with GenAI Triage, PostGIS Persistence & WebSocket Broadcast",
    description=(
        "Accepts multipart/form-data containing emergency audio notes, scene photos, and text signals. "
        "Streams to Google Gemini for dialect translation, entity extraction, and 3-bullet SOP generation. "
        "Applies a deterministic 0-100 triage urgency algorithm, persists in PostGIS, and instantly "
        "broadcasts the structured incident to connected Next.js Deck.gl GIS dashboards."
    ),
)
async def triage_multimodal_distress(
    text: Optional[str] = Form(None, description="Distress text or description"),
    audio: Optional[UploadFile] = File(None, description="Spoken voice note (WAV, WebM, MP3, OGG, M4A)"),
    image: Optional[UploadFile] = File(None, description="Disaster scene photo (JPEG, PNG, WebP)"),
    latitude: float = Form(..., description="GPS Latitude in decimal degrees (-90.0 to 90.0)"),
    longitude: float = Form(..., description="GPS Longitude in decimal degrees (-180.0 to 180.0)"),
    location_name: Optional[str] = Form(None, description="Optional human-readable landmark or address"),
    is_offline_cached: bool = Form(False, description="True if captured in cellular dead-zone and synced"),
    db: AsyncSession = Depends(get_db),
) -> MultimodalTriageResponse:
    # Coordinate validation
    if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid GPS coordinates: latitude ({latitude}) must be between -90 and 90, longitude ({longitude}) between -180 and 180.",
        )

    # Ensure uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    audio_bytes: Optional[bytes] = None
    audio_mime: Optional[str] = None
    audio_url: Optional[str] = None

    image_bytes: Optional[bytes] = None
    image_mime: Optional[str] = None
    image_url: Optional[str] = None
    image_urls_list = []

    # 1. Process Audio Upload if provided
    if audio and audio.filename:
        audio_bytes = await audio.read()
        if len(audio_bytes) > 0:
            audio_mime = audio.content_type or "audio/wav"
            file_ext = os.path.splitext(audio.filename)[1] or ".webm"
            unique_filename = f"sos_audio_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            with open(file_path, "wb") as f:
                f.write(audio_bytes)
            audio_url = f"/uploads/{unique_filename}"
            logger.info(f"Saved uploaded audio: {file_path} ({len(audio_bytes)} bytes)")

    # 2. Process Image Upload if provided
    if image and image.filename:
        image_bytes = await image.read()
        if len(image_bytes) > 0:
            image_mime = image.content_type or "image/jpeg"
            file_ext = os.path.splitext(image.filename)[1] or ".jpg"
            unique_filename = f"sos_photo_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{file_ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            image_url = f"/uploads/{unique_filename}"
            image_urls_list.append(image_url)
            logger.info(f"Saved uploaded photo: {file_path} ({len(image_bytes)} bytes)")

    # 3. Determine Source Modality
    if audio_bytes and len(audio_bytes) > 0:
        source_type = SourceType.VOICE
    elif image_bytes and len(image_bytes) > 0:
        source_type = SourceType.IMAGE
    else:
        source_type = SourceType.TEXT

    # 4. Stream to Gemini Multimodal Extraction Service
    location_context = location_name or f"Coordinates ({latitude:.4f}, {longitude:.4f})"
    extraction = await extract_multimodal_distress(
        audio_bytes=audio_bytes,
        audio_mime_type=audio_mime,
        image_bytes=image_bytes,
        image_mime_type=image_mime,
        text_payload=text,
        location_hint=location_context,
    )

    # 5. Deterministic Mathematical Triage Urgency Calculation
    client_time = datetime.utcnow()
    triage_breakdown = calculate_triage_score(
        extraction=extraction,
        client_timestamp=client_time,
    )

    # 6. Format Structured Entities and Dynamic SOP for Database Model
    resolved_location_name = (
        extraction.extracted_location
        or location_name
        or f"Disaster Zone ({latitude:.4f}, {longitude:.4f})"
    )

    entities_payload = {
        "trapped_count": extraction.trapped_count,
        "is_trapped": extraction.is_trapped,
        "medical_needs": extraction.injuries_reported,
        "hazard_types": [extraction.hazard_type],
        "hazard_severity": extraction.hazard_severity,
        "people_affected": extraction.people_affected,
        "vulnerable_people": {
            "elderly": extraction.vulnerable_groups.elderly,
            "children": extraction.vulnerable_groups.children,
            "pregnant": extraction.vulnerable_groups.pregnant,
            "disabled": extraction.vulnerable_groups.disabled,
        },
        "detected_language": extraction.detected_language,
        "translation_en": extraction.translation_en,
        "confidence_score": extraction.confidence_score,
    }

    safety_sop_payload = {
        "urgency_summary": extraction.safety_sop.summary,
        "hazards_detected": [extraction.hazard_type],
        "recommended_gear": [
            "Level 3 PPE Suit",
            "Insulated Safety Boots",
            "Emergency Medical Trauma Kit",
            "High-Output SAR Illumination",
        ],
        "protocol_steps": [
            extraction.safety_sop.bullet_1,
            extraction.safety_sop.bullet_2,
            extraction.safety_sop.bullet_3,
        ],
    }

    # 7. PostGIS Spatial Point (SRID 4326: WGS 84 GPS)
    point_wkt = f"SRID=4326;POINT({longitude} {latitude})"

    db_incident = Incident(
        source_type=source_type,
        raw_payload=extraction.transcript or text or "Multimodal distress signal",
        audio_url=audio_url,
        image_urls=image_urls_list,
        location_name=resolved_location_name,
        latitude=latitude,
        longitude=longitude,
        location_geom=point_wkt,
        triage_score=triage_breakdown.final_score,
        triage_category=triage_breakdown.triage_category,
        status=IncidentStatus.TRIAGED,
        extracted_entities=entities_payload,
        safety_sop=safety_sop_payload,
        is_offline_cached=is_offline_cached,
        client_timestamp=client_time,
    )

    db.add(db_incident)
    await db.commit()
    await db.refresh(db_incident)

    logger.info(
        f"Successfully created Incident #{db_incident.id} with Triage Score {triage_breakdown.final_score} "
        f"[{triage_breakdown.triage_category.value}] at ({latitude}, {longitude})"
    )

    incident_read = IncidentRead.model_validate(db_incident)

    # 8. Real-Time WebSocket Broadcast to Commander GIS Dashboards
    try:
        await ws_manager.broadcast_incident(
            event_type="INCIDENT_CREATED",
            incident_data=incident_read.model_dump(mode="json"),
            triage_breakdown=triage_breakdown.model_dump(mode="json"),
        )
    except Exception as ws_err:
        logger.warning(f"WebSocket broadcast non-fatal exception: {ws_err}")

    return MultimodalTriageResponse(
        incident=incident_read,
        extraction=extraction,
        triage_breakdown=triage_breakdown,
        audio_playback_url=audio_url,
        image_preview_url=image_url,
    )
