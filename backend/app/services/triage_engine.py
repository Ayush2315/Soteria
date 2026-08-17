"""
Urgency Triage Engine — Deterministic 0-100 Scoring & Severity Tier Mapping.
Pure mathematical, explainable, and fully auditable algorithm for disaster prioritization.
"""
from datetime import datetime
from typing import Optional
import logging

from app.core.config import settings
from app.models.incident import TriageCategory
from app.schemas.incident import (
    MultimodalGeminiExtraction,
    TriageBreakdown,
)

logger = logging.getLogger("soteria.triage_engine")


def calculate_triage_score(
    extraction: MultimodalGeminiExtraction,
    client_timestamp: Optional[datetime] = None,
) -> TriageBreakdown:
    """
    Computes a deterministic 0-100 composite urgency score based on:
    1. Hazard Severity (0 - 35.0 pts): Scaled from 1-10 severity rating.
    2. Trapped Victims (0 - 25.0 pts): Base trapped penalty (15.0) + count multiplier.
    3. Vulnerability Demographics (0 - 25.0 pts): Weighted sum of elderly, children, pregnant, disabled.
    4. Medical Trauma / Injuries (0 - 10.0 pts): Severity of immediate physical wounds.
    5. Recency / Temporal Decay (0 - 5.0 pts): Fresh distress signals boosted vs older cached signals.

    Returns:
        TriageBreakdown: Detailed breakdown of each scoring factor and the mapped TriageCategory.
    """
    # 1. Hazard Severity Factor (Max 35.0 points)
    # Scaled from 1-10 rating extracted by Gemini
    clamped_hazard_severity = max(1, min(10, extraction.hazard_severity))
    hazard_severity_score = round(clamped_hazard_severity * 3.5, 2)

    # 2. Trapped Victims Factor (Max 25.0 points)
    # If trapped is true, base 15 points + 2.5 points per trapped individual up to 25
    if extraction.is_trapped:
        count = extraction.trapped_count if extraction.trapped_count > 0 else 1
        trapped_factor_score = round(15.0 + min(10.0, count * 2.5), 2)
    else:
        trapped_factor_score = 0.0

    # 3. Vulnerability Demographic Factor (Max 25.0 points)
    # Weighted by physiological vulnerability:
    # Elderly: 3.0 pts each
    # Children: 3.5 pts each
    # Pregnant: 4.0 pts each
    # Disabled: 4.0 pts each
    vgroups = extraction.vulnerable_groups
    raw_vulnerability = (
        (max(0, vgroups.elderly) * 3.0)
        + (max(0, vgroups.children) * 3.5)
        + (max(0, vgroups.pregnant) * 4.0)
        + (max(0, vgroups.disabled) * 4.0)
    )
    vulnerability_score = round(min(25.0, max(0.0, float(raw_vulnerability))), 2)

    # 4. Medical Injury Factor (Max 10.0 points)
    # 3.5 pts per reported distinct trauma/injury
    injuries = extraction.injuries_reported or []
    medical_injury_score = round(min(10.0, max(0.0, len(injuries) * 3.5)), 2)

    # 5. Recency Factor (Max 5.0 points)
    # Signals within 15 minutes receive maximum 5.0 bonus.
    # Older signals decay smoothly at 1 point per 30 minutes beyond the first 15 mins.
    if client_timestamp:
        try:
            delta_seconds = (datetime.utcnow() - client_timestamp).total_seconds()
            delta_minutes = max(0.0, delta_seconds / 60.0)
            if delta_minutes <= 15.0:
                recency_factor_score = 5.0
            else:
                recency_factor_score = round(max(0.0, 5.0 - ((delta_minutes - 15.0) / 30.0)), 2)
        except Exception:
            recency_factor_score = 5.0
    else:
        recency_factor_score = 5.0

    # Composite Raw Score
    raw_composite = (
        hazard_severity_score
        + trapped_factor_score
        + vulnerability_score
        + medical_injury_score
        + recency_factor_score
    )

    # Clamp composite score strictly to 0.0 - 100.0
    final_score = round(min(100.0, max(0.0, raw_composite)), 1)

    # Map to Severity Tiers based on configured thresholds
    if final_score >= settings.TRIAGE_SCORE_THRESHOLD_CRITICAL:
        triage_category = TriageCategory.CRITICAL_P1
    elif final_score >= settings.TRIAGE_SCORE_THRESHOLD_URGENT:
        triage_category = TriageCategory.URGENT_P2
    elif final_score >= settings.TRIAGE_SCORE_THRESHOLD_MODERATE:
        triage_category = TriageCategory.MODERATE_P3
    else:
        triage_category = TriageCategory.LOW_P4

    logger.info(
        f"Triage score calculated: {final_score}/100 [{triage_category.value}] "
        f"(Hazard: {hazard_severity_score}, Trapped: {trapped_factor_score}, "
        f"Vuln: {vulnerability_score}, Med: {medical_injury_score}, Recency: {recency_factor_score})"
    )

    return TriageBreakdown(
        hazard_severity_score=hazard_severity_score,
        trapped_factor_score=trapped_factor_score,
        vulnerability_score=vulnerability_score,
        medical_injury_score=medical_injury_score,
        recency_factor_score=recency_factor_score,
        final_score=final_score,
        triage_category=triage_category,
    )
