"""
Volunteer Spatial Proximity Dispatch and AI Closed-Loop Verification Endpoints.
"""
from typing import List, Optional
from datetime import datetime
import os
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.websockets import ws_manager
from app.models.incident import Incident, IncidentStatus
from app.models.volunteer import Volunteer, VolunteerStatus
from app.schemas.volunteer import (
    VolunteerRead,
    VolunteerCreate,
    VolunteerWithDistance,
)
from app.schemas.dispatch import (
    DispatchNearbyQuery,
    DispatchAssignRequest,
    DispatchAssignResponse,
    RescueVerificationResponse,
    RescueVerificationAuditResult,
)
from app.schemas.incident import IncidentRead
from app.services.dispatch_service import (
    find_nearest_volunteers,
    assign_volunteer_to_incident,
)
from app.services.gemini_service import verify_rescue_resolution

logger = logging.getLogger("soteria.api.dispatch")
router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get(
    "/volunteers",
    response_model=List[VolunteerRead],
    status_code=status.HTTP_200_OK,
    summary="List Field Volunteers",
    description="Retrieves all registered disaster volunteers with current status, skills, and GPS locations.",
)
async def list_volunteers(
    status_filter: Optional[VolunteerStatus] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> List[VolunteerRead]:
    stmt = select(Volunteer).where(Volunteer.is_active == True)
    if status_filter:
        stmt = stmt.where(Volunteer.status == status_filter)
    result = await db.execute(stmt)
    volunteers = result.scalars().all()
    return list(volunteers)


@router.post(
    "/volunteers",
    response_model=VolunteerRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register Field Volunteer",
    description="Registers a new certified responder into the spatial tracking registry.",
)
async def create_volunteer(
    payload: VolunteerCreate,
    db: AsyncSession = Depends(get_db),
) -> VolunteerRead:
    vol = Volunteer(
        name=payload.name,
        phone=payload.phone,
        skills=payload.skills,
        status=payload.status,
        current_latitude=payload.current_latitude,
        current_longitude=payload.current_longitude,
        is_active=True,
        last_ping=datetime.utcnow(),
    )
    db.add(vol)
    await db.commit()
    await db.refresh(vol)
    return vol


@router.post(
    "/nearby",
    response_model=List[VolunteerWithDistance],
    status_code=status.HTTP_200_OK,
    summary="Find Closest Available Responders",
    description="Calculates geodesic proximity distances using PostGIS to find nearest certified volunteers to an incident.",
)
async def get_nearby_volunteers(
    query: DispatchNearbyQuery,
    db: AsyncSession = Depends(get_db),
) -> List[VolunteerWithDistance]:
    # Look up incident coordinates
    stmt = select(Incident).where(Incident.id == query.incident_id)
    result = await db.execute(stmt)
    incident = result.scalar_one_or_none()

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{query.incident_id} not found.",
        )

    nearby_volunteers = await find_nearest_volunteers(
        db=db,
        latitude=incident.latitude,
        longitude=incident.longitude,
        radius_meters=query.radius_meters,
        limit=query.limit,
    )
    return nearby_volunteers


@router.post(
    "/assign",
    response_model=DispatchAssignResponse,
    status_code=status.HTTP_200_OK,
    summary="Dispatch Volunteer to Incident",
    description="Assigns a volunteer to an incident, transitions statuses, and broadcasts the event via WebSocket.",
)
async def assign_volunteer(
    payload: DispatchAssignRequest,
    db: AsyncSession = Depends(get_db),
) -> DispatchAssignResponse:
    try:
        incident, volunteer, response = await assign_volunteer_to_incident(
            db=db,
            incident_id=payload.incident_id,
            volunteer_id=payload.volunteer_id,
            notes=payload.notes,
        )

        # Broadcast update over WebSocket
        try:
            inc_read = IncidentRead.model_validate(incident)
            await ws_manager.broadcast_incident(
                event_type="DISPATCH_ASSIGNED",
                incident_data=inc_read.model_dump(mode="json"),
            )
        except Exception as ws_err:
            logger.warning(f"WebSocket broadcast error on dispatch assign: {ws_err}")

        return response

    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )


@router.post(
    "/verify",
    response_model=RescueVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Closed-Loop Verification & Photo Closure",
    description="Accepts volunteer post-rescue photo proof, audits completion with Gemini Vision, and safely transitions incident to RESOLVED.",
)
async def verify_incident_resolution(
    incident_id: int = Form(..., description="ID of incident being closed"),
    volunteer_id: Optional[int] = Form(None, description="ID of volunteer submitting resolution proof"),
    closure_notes: Optional[str] = Form(None, description="Field notes on actions performed"),
    photo: Optional[UploadFile] = File(None, description="Post-rescue photographic proof file"),
    db: AsyncSession = Depends(get_db),
) -> RescueVerificationResponse:
    # 1. Fetch Incident
    inc_stmt = select(Incident).where(Incident.id == incident_id)
    inc_res = await db.execute(inc_stmt)
    incident = inc_res.scalar_one_or_none()

    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident #{incident_id} not found.",
        )

    # 2. Process uploaded photo proof if provided
    photo_url = None
    photo_bytes = None
    photo_mime = None

    if photo and photo.filename:
        photo_bytes = await photo.read()
        photo_mime = photo.content_type or "image/jpeg"
        unique_name = f"proof_{incident_id}_{uuid.uuid4().hex[:8]}_{photo.filename}"
        photo_path = os.path.join(UPLOAD_DIR, unique_name)
        with open(photo_path, "wb") as f:
            f.write(photo_bytes)
        photo_url = f"/uploads/{unique_name}"

    # 3. Trigger Gemini Vision Closed-Loop Audit
    hazard_type = "GENERAL_HAZARD"
    if incident.extracted_entities and "hazard_types" in incident.extracted_entities:
        types = incident.extracted_entities.get("hazard_types", [])
        if types:
            hazard_type = types[0]

    initial_context = incident.raw_payload or incident.location_name or "Emergency incident"

    audit_result: RescueVerificationAuditResult = await verify_rescue_resolution(
        initial_hazard=hazard_type,
        initial_description=initial_context,
        resolution_image_bytes=photo_bytes,
        resolution_image_mime=photo_mime,
        volunteer_notes=closure_notes,
    )

    # 4. Update Incident state in PostGIS
    previous_status = incident.status.value
    resolved_time = datetime.utcnow()

    incident.status = IncidentStatus.RESOLVED
    incident.updated_at = resolved_time
    incident.verification_data = {
        "is_verified": audit_result.is_verified,
        "confidence_score": audit_result.confidence_score,
        "visual_observations": audit_result.visual_observations,
        "hazard_clearance_status": audit_result.hazard_clearance_status,
        "closure_summary": audit_result.closure_summary,
        "proof_photo_url": photo_url,
        "closure_notes": closure_notes,
        "closed_by_volunteer_id": volunteer_id,
        "resolved_at": resolved_time.isoformat(),
    }

    # 5. Free assigned volunteer back to AVAILABLE
    if volunteer_id:
        vol_stmt = select(Volunteer).where(Volunteer.id == volunteer_id)
        vol_res = await db.execute(vol_stmt)
        vol = vol_res.scalar_one_or_none()
        if vol:
            vol.status = VolunteerStatus.AVAILABLE
            vol.last_ping = resolved_time

    await db.commit()
    await db.refresh(incident)

    # 6. Broadcast WebSocket Resolution event
    try:
        inc_read = IncidentRead.model_validate(incident)
        await ws_manager.broadcast_incident(
            event_type="INCIDENT_RESOLVED",
            incident_data=inc_read.model_dump(mode="json"),
        )
    except Exception as ws_err:
        logger.warning(f"WebSocket broadcast error on incident resolution: {ws_err}")

    return RescueVerificationResponse(
        incident_id=incident.id,
        previous_status=previous_status,
        current_status=incident.status.value,
        audit_result=audit_result,
        proof_photo_url=photo_url,
        resolved_at=resolved_time,
        volunteer_id=volunteer_id,
        closure_notes=closure_notes,
    )
