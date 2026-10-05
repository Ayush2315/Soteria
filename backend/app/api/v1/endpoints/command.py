"""
Command & Control Operations: SitRep Generation and Operational Metrics Endpoints.
"""
from typing import Optional
import logging
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.sitrep import SitRepResponse, CommandStats
from app.services.sitrep_service import synthesize_sitrep, get_command_stats

logger = logging.getLogger("soteria.api.command")
router = APIRouter()


@router.get(
    "/sitrep",
    response_model=SitRepResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 30-Minute Executive Operational SitRep",
    description="Synthesizes active vs. resolved incidents from PostGIS into a structured 3-bullet military-grade briefing using Gemini.",
)
async def get_situation_report(
    time_window_minutes: int = Query(30, ge=5, le=1440, description="Analysis window in minutes"),
    db: AsyncSession = Depends(get_db),
) -> SitRepResponse:
    sitrep_res = await synthesize_sitrep(db=db, time_window_minutes=time_window_minutes)
    return sitrep_res


@router.post(
    "/sitrep",
    response_model=SitRepResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger On-Demand SitRep Synthesis",
    description="Forces immediate on-demand regeneration of the situational briefing for commanders.",
)
async def trigger_situation_report(
    time_window_minutes: int = Query(30, ge=5, le=1440),
    db: AsyncSession = Depends(get_db),
) -> SitRepResponse:
    sitrep_res = await synthesize_sitrep(db=db, time_window_minutes=time_window_minutes)
    return sitrep_res


@router.get(
    "/stats",
    response_model=CommandStats,
    status_code=status.HTTP_200_OK,
    summary="Command Dashboard Operational Metrics",
    description="Returns aggregate counts across incidents, triage priority tiers, and responder deployments.",
)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
) -> CommandStats:
    stats = await get_command_stats(db=db)
    return stats
