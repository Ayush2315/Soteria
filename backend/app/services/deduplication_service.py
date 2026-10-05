"""
PostGIS Spatial Clustering & Deduplication Service.
Identifies incoming SOS reports within 50 meters of an active incident
reporting the same hazard within a 12-hour window, merging duplicates
into a single clustered incident rather than cluttering tactical GIS radars.
"""
import random
import string
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func

from app.models.incident import Incident, IncidentStatus

logger = logging.getLogger("soteria.deduplication")

DEDUPLICATION_RADIUS_METERS = 50.0
DEDUPLICATION_WINDOW_HOURS = 12


def generate_tracking_code() -> str:
    """Generates a human-friendly tracking code (e.g. SOT-8821)."""
    digits_and_letters = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    suffix = "".join(random.choices(digits_and_letters, k=4))
    return f"SOT-{suffix}"


async def find_and_merge_duplicate_incident(
    db: AsyncSession,
    latitude: float,
    longitude: float,
    hazard_type: str,
    raw_payload: str,
    source_channel: str,
    incoming_trapped: int = 0,
    client_timestamp: Optional[datetime] = None,
) -> Tuple[Optional[Incident], bool]:
    """
    Executes PostGIS ST_DWithin query to find existing active incidents
    within 50 meters and 12 hours with identical hazard type.

    Returns:
        (Incident, True) if merged into an existing incident.
        (None, False) if this is a distinct, novel incident.
    """
    cutoff_time = datetime.utcnow() - timedelta(hours=DEDUPLICATION_WINDOW_HOURS)

    # PostGIS ST_DWithin query using spatial geography casting (accurate WGS84 meter distance)
    # Excludes already closed/resolved incidents
    spatial_query = text(
        """
        SELECT id, ST_Distance(
            location_geom::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        ) AS distance_meters
        FROM incidents
        WHERE
            status NOT IN ('RESOLVED', 'CLOSED')
            AND created_at >= :cutoff_time
            AND location_geom IS NOT NULL
            AND ST_DWithin(
                location_geom::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                :radius_meters
            )
        ORDER BY distance_meters ASC
        LIMIT 1;
        """
    )

    result = await db.execute(
        spatial_query,
        {
            "lon": longitude,
            "lat": latitude,
            "cutoff_time": cutoff_time,
            "radius_meters": DEDUPLICATION_RADIUS_METERS,
        },
    )
    row = result.first()

    if not row:
        return None, False

    matched_incident_id = row[0]
    distance_meters = round(float(row[1]), 1)

    # Fetch ORM object
    stmt = select(Incident).where(Incident.id == matched_incident_id)
    inc_res = await db.execute(stmt)
    existing_incident = inc_res.scalar_one_or_none()

    if not existing_incident:
        return None, False

    # Check hazard type match (allow match if either hazard matches or existing has similar)
    existing_entities = dict(existing_incident.extracted_entities or {})
    existing_hazards = existing_entities.get("hazard_types", [])
    primary_existing_hazard = existing_hazards[0] if existing_hazards else "OTHER"

    # Normalize hazards
    hz_in = hazard_type.upper()
    hz_ex = primary_existing_hazard.upper()

    # If both hazards are specified and completely different (e.g. FIRE vs FLOOD), do not merge
    if hz_in != "OTHER" and hz_ex != "OTHER" and hz_in != hz_ex:
        return None, False

    # --- PERFORM CLUSTER MERGE ---
    existing_incident.reporter_count = (existing_incident.reporter_count or 1) + 1

    dup_entry = {
        "timestamp": (client_timestamp or datetime.utcnow()).isoformat(),
        "source": source_channel,
        "raw_text": raw_payload[:200],
        "distance_meters": distance_meters,
        "reported_trapped": incoming_trapped,
    }

    current_meta = list(existing_incident.duplicate_metadata or [])
    current_meta.append(dup_entry)
    existing_incident.duplicate_metadata = current_meta

    # If incoming report reports more trapped individuals, escalate the victim count
    if incoming_trapped > existing_entities.get("trapped_count", 0):
        existing_entities["trapped_count"] = incoming_trapped
        existing_entities["is_trapped"] = True
        existing_incident.extracted_entities = existing_entities
        logger.info(
            f"Escalated trapped count for Incident #{existing_incident.id} to {incoming_trapped} from duplicate report."
        )

    await db.commit()
    await db.refresh(existing_incident)

    logger.info(
        f"Spatial Deduplication Match: Merged SOS from channel {source_channel} into Incident #{existing_incident.id} "
        f"({distance_meters}m away, reporter_count={existing_incident.reporter_count})"
    )

    return existing_incident, True
