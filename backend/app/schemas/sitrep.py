"""
Situation Report (SitRep) Synthesis Pydantic Schemas.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SitRepSummary(BaseModel):
    time_window: str = Field(..., description="Operational time window evaluated e.g. 'Last 30 Minutes'")
    total_active_incidents: int = Field(..., description="Total active unclosed incidents")
    critical_p1_count: int = Field(..., description="Count of CRITICAL_P1 incidents")
    urgent_p2_count: int = Field(..., description="Count of URGENT_P2 incidents")
    moderate_p3_count: int = Field(..., description="Count of MODERATE_P3 incidents")
    low_p4_count: int = Field(..., description="Count of LOW_P4 incidents")
    resolved_count: int = Field(..., description="Total resolved/closed incidents in time window")
    volunteers_deployed: int = Field(..., description="Currently dispatched field volunteers")
    top_hazard_zones: List[str] = Field(
        default_factory=list,
        description="High-density casualty hotspots and affected sectors",
    )
    
    # 3-Bullet Executive Operational Directive
    bullet_1_hotspot_status: str = Field(
        ...,
        description="Bullet 1: Current casualty hotspots and active rescue progress",
    )
    bullet_2_operational_bottlenecks: str = Field(
        ...,
        description="Bullet 2: Resource bottlenecks, road blockages, or live hazards",
    )
    bullet_3_priority_action_plan: str = Field(
        ...,
        description="Bullet 3: Immediate 30-minute command directives and resource redeployments",
    )


class SitRepResponse(BaseModel):
    sitrep: SitRepSummary
    generated_at: datetime
    is_fallback: bool = False


class CommandStats(BaseModel):
    total_incidents: int
    critical_p1: int
    urgent_p2: int
    moderate_p3: int
    low_p4: int
    dispatched_count: int
    resolved_count: int
    total_volunteers: int
    available_volunteers: int
    dispatched_volunteers: int
    offline_cached_count: int
    system_status: str
