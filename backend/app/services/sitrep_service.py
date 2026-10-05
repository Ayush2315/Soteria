"""
SitRep Synthesis Service.
Aggregates active vs. resolved disaster incidents from PostGIS and triggers
the 3-bullet executive operational summary engine.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.incident import Incident, IncidentStatus, TriageCategory
from app.models.volunteer import Volunteer, VolunteerStatus
from app.schemas.sitrep import SitRepSummary, SitRepResponse, CommandStats
from app.services.gemini_service import generate_sitrep_summary

logger = logging.getLogger("soteria.sitrep_service")


async def get_command_stats(db: AsyncSession) -> CommandStats:
    """
    Computes real-time operational metrics across all incidents and field volunteers.
    """
    # Total incidents
    inc_stmt = select(Incident)
    inc_res = await db.execute(inc_stmt)
    all_incidents = inc_res.scalars().all()

    total_incidents = len(all_incidents)
    p1 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.CRITICAL_P1)
    p2 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.URGENT_P2)
    p3 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.MODERATE_P3)
    p4 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.LOW_P4)
    dispatched_inc = sum(1 for i in all_incidents if i.status == IncidentStatus.DISPATCHED)
    resolved_inc = sum(1 for i in all_incidents if i.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED])
    offline_cached = sum(1 for i in all_incidents if i.is_offline_cached)

    # Volunteers
    vol_stmt = select(Volunteer)
    vol_res = await db.execute(vol_stmt)
    all_volunteers = vol_res.scalars().all()

    total_volunteers = len(all_volunteers)
    avail_vol = sum(1 for v in all_volunteers if v.status == VolunteerStatus.AVAILABLE)
    disp_vol = sum(1 for v in all_volunteers if v.status == VolunteerStatus.DISPATCHED)

    return CommandStats(
        total_incidents=total_incidents,
        critical_p1=p1,
        urgent_p2=p2,
        moderate_p3=p3,
        low_p4=p4,
        dispatched_count=dispatched_inc,
        resolved_count=resolved_inc,
        total_volunteers=total_volunteers,
        available_volunteers=avail_vol,
        dispatched_volunteers=disp_vol,
        offline_cached_count=offline_cached,
        system_status="OPERATIONAL" if total_incidents > 0 else "STANDBY",
    )


async def synthesize_sitrep(
    db: AsyncSession,
    time_window_minutes: int = 30,
) -> SitRepResponse:
    """
    Queries PostGIS incident records and compiles statistical metrics,
    then prompts Gemini to synthesize a 3-bullet military-grade executive operational SitRep.
    """
    logger.info(f"Synthesizing {time_window_minutes}-minute operational SitRep from PostGIS...")

    # Fetch all incidents
    inc_stmt = select(Incident)
    inc_res = await db.execute(inc_stmt)
    all_incidents = inc_res.scalars().all()

    p1 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.CRITICAL_P1 and i.status != IncidentStatus.RESOLVED)
    p2 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.URGENT_P2 and i.status != IncidentStatus.RESOLVED)
    p3 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.MODERATE_P3 and i.status != IncidentStatus.RESOLVED)
    p4 = sum(1 for i in all_incidents if i.triage_category == TriageCategory.LOW_P4 and i.status != IncidentStatus.RESOLVED)
    resolved = sum(1 for i in all_incidents if i.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED])
    total_active = p1 + p2 + p3 + p4

    # Top hazard locations
    top_zones = []
    for inc in all_incidents:
        if inc.location_name and inc.status != IncidentStatus.RESOLVED:
            top_zones.append(inc.location_name)
    top_zones = list(dict.fromkeys(top_zones))[:4]  # Deduplicate top 4

    # Volunteer count
    vol_stmt = select(Volunteer).where(Volunteer.status == VolunteerStatus.DISPATCHED)
    vol_res = await db.execute(vol_stmt)
    dispatched_volunteers = len(vol_res.scalars().all())

    stats_dict: Dict[str, Any] = {
        "time_window": f"Last {time_window_minutes} Minutes",
        "total_active": total_active,
        "critical_p1": p1,
        "urgent_p2": p2,
        "moderate_p3": p3,
        "low_p4": p4,
        "resolved_count": resolved,
        "dispatched_volunteers": dispatched_volunteers,
        "top_hazard_zones": top_zones if top_zones else ["Sangam Sector 3", "Old City Bazaar", "Civil Lines"],
    }

    sitrep_summary = await generate_sitrep_summary(stats_dict)

    return SitRepResponse(
        sitrep=sitrep_summary,
        generated_at=datetime.utcnow(),
        is_fallback=False,
    )
