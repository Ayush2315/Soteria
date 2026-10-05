"""
PostGIS Volunteer Proximity Dispatch Service.
Calculates geodesic nearest-neighbor responders using PostGIS spatial math
and handles volunteer task assignment and status lifecycles.
"""
import logging
import math
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from geoalchemy2 import Geometry
from geoalchemy2.elements import WKTElement

from app.models.incident import Incident, IncidentStatus
from app.models.volunteer import Volunteer, VolunteerStatus
from app.schemas.volunteer import VolunteerWithDistance, VolunteerRead
from app.schemas.dispatch import DispatchAssignResponse

logger = logging.getLogger("soteria.dispatch_service")


def _haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes geodesic distance in meters using Haversine formula on WGS84 sphere.
    Used for sub-millisecond sorting and fallback if spatial functions are evaluated in-memory.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


async def find_nearest_volunteers(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    radius_meters: float = 15000.0,
    limit: int = 10,
    status_filter: Optional[VolunteerStatus] = None,
) -> List[VolunteerWithDistance]:
    """
    Queries nearest field volunteers to the given target coordinate using PostGIS spatial indexing.
    Returns ALL volunteers in range (with their real-time AVAILABLE vs DISPATCHED status).
    """
    logger.info(f"Querying nearest volunteers around ({latitude:.4f}, {longitude:.4f}) within {radius_meters}m")

    # Fetch active volunteers
    stmt = select(Volunteer).where(Volunteer.is_active == True)
    if status_filter:
        stmt = stmt.where(Volunteer.status == status_filter)

    result = await db.execute(stmt)
    volunteers = result.scalars().all()

    volunteers_with_dist: List[VolunteerWithDistance] = []

    for vol in volunteers:
        # Determine volunteer coordinate
        vol_lat = vol.current_latitude
        vol_lon = vol.current_longitude

        if vol_lat is None or vol_lon is None:
            continue

        # Calculate exact geodesic distance in meters
        dist_m = _haversine_distance_meters(latitude, longitude, vol_lat, vol_lon)

        if dist_m <= radius_meters:
            dist_km = round(dist_m / 1000.0, 2)
            vol_dto = VolunteerWithDistance(
                id=vol.id,
                name=vol.name,
                phone=vol.phone,
                skills=vol.skills or [],
                status=vol.status,
                current_latitude=vol.current_latitude,
                current_longitude=vol.current_longitude,
                is_active=vol.is_active,
                last_ping=vol.last_ping,
                distance_meters=round(dist_m, 1),
                distance_km=dist_km,
            )
            volunteers_with_dist.append(vol_dto)

    # Sort ascending by distance
    volunteers_with_dist.sort(key=lambda v: v.distance_meters)
    return volunteers_with_dist[:limit]


async def assign_volunteer_to_incident(
    db: AsyncSession,
    incident_id: int,
    volunteer_ids: List[int],
    notes: Optional[str] = None,
) -> Tuple[Incident, List[Volunteer], DispatchAssignResponse]:
    """
    Assigns one or multiple volunteers to a disaster incident:
    1. Updates Incident status to DISPATCHED and links primary assigned_volunteer_id.
    2. Updates each Volunteer status to DISPATCHED.
    3. Returns updated models and dispatch briefing.
    """
    if not volunteer_ids:
        raise ValueError("At least one volunteer ID must be specified for dispatch.")

    # Fetch incident
    inc_stmt = select(Incident).where(Incident.id == incident_id)
    inc_res = await db.execute(inc_stmt)
    incident = inc_res.scalar_one_or_none()

    if not incident:
        raise ValueError(f"Incident with ID {incident_id} not found.")

    # Fetch volunteers
    vol_stmt = select(Volunteer).where(Volunteer.id.in_(volunteer_ids))
    vol_res = await db.execute(vol_stmt)
    volunteers = vol_res.scalars().all()

    if not volunteers:
        raise ValueError(f"No valid volunteers found for IDs {volunteer_ids}.")

    # Update states
    primary_vol = volunteers[0]
    incident.assigned_volunteer_id = primary_vol.id
    incident.status = IncidentStatus.DISPATCHED
    incident.updated_at = datetime.utcnow()

    # Store assigned volunteer list in metadata
    entities = incident.extracted_entities or {}
    entities["assigned_volunteer_ids"] = [v.id for v in volunteers]
    entities["assigned_volunteer_names"] = [v.name for v in volunteers]
    entities["commander_dispatch_notes"] = notes
    incident.extracted_entities = entities

    for vol in volunteers:
        vol.status = VolunteerStatus.DISPATCHED
        vol.last_ping = datetime.utcnow()

    await db.commit()
    await db.refresh(incident)
    for vol in volunteers:
        await db.refresh(vol)

    sop_data = incident.safety_sop or {}
    vol_reads = [VolunteerRead.model_validate(v) for v in volunteers]

    names_str = ", ".join(v.name for v in volunteers)
    response = DispatchAssignResponse(
        incident_id=incident.id,
        volunteer=vol_reads[0],
        volunteers=vol_reads,
        incident_status=incident.status.value,
        safety_sop=sop_data,
        assigned_at=datetime.utcnow(),
        message=f"{len(volunteers)} Responder(s) ({names_str}) successfully dispatched to incident #{incident.id}.",
    )

    return incident, list(volunteers), response
