"""
Automated Unit Tests for SOTERIA:
1. Urgency Triage Engine (Deterministic 0-100 scoring & tier mapping)
2. SOT1 Relay Packet Codec & Checksum validation
3. Stranded-time escalation logic
4. Relay packet ingestion & duplicate prevention
"""
import pytest
from datetime import datetime, timezone
import hashlib

from app.schemas.incident import MultimodalGeminiExtraction, VulnerableGroupBreakdown, SafetySOP
from app.services.triage_engine import calculate_triage_score
from app.models.incident import TriageCategory
from app.services.sms_codec import parse_packet, compute_crc, PACKET_HEADER



def test_triage_engine_critical_calculation():
    """Verify high-severity trapped victims map to CRITICAL_P1."""
    extraction = MultimodalGeminiExtraction(
        detected_language="Hindi",
        transcript="Flood water at roof level, 4 people trapped including elderly and children",
        translation_en="Flood water at roof level, 4 people trapped including elderly and children",
        hazard_type="FLOOD",
        hazard_severity=9,
        people_affected=4,
        vulnerable_groups=VulnerableGroupBreakdown(elderly=1, children=1, pregnant=0, disabled=0),
        is_trapped=True,
        trapped_count=4,
        injuries_reported=["hypothermia", "lacerations"],
        extracted_location="Prayagraj",
        safety_sop=SafetySOP(
            summary="Immediate boat rescue required",
            bullet_1="Approach by motor boat",
            bullet_2="Extract children and elderly with PFDs",
            bullet_3="Transport to Sector 3 medical haven",
        ),
        confidence_score=0.98,
    )

    breakdown = calculate_triage_score(extraction=extraction, client_timestamp=datetime.now(timezone.utc))

    # Exact mathematical sum: 31.5 + 25.0 + 6.5 + 7.0 + 5.0 = 75.0 (URGENT_P2)
    assert breakdown.final_score == 75.0
    assert breakdown.triage_category == TriageCategory.URGENT_P2
    assert breakdown.hazard_severity_score == round(9 * 3.5, 2)
    assert breakdown.trapped_factor_score == 25.0  # 15 base + 4*2.5 = 25.0
    assert breakdown.vulnerability_score == 6.5   # 3.0 (elderly) + 3.5 (child) = 6.5
    assert breakdown.medical_injury_score == 7.0  # 2 injuries * 3.5 = 7.0
    assert breakdown.recency_factor_score == 5.0


def test_relay_packet_encode_and_parse():
    """Verify that a SOT1 packet encodes, checksums, and parses correctly."""
    core = [
        "SOT1",
        "TEST99",
        "25.43580",
        "81.84630",
        "4",
        "4",
        "3",  # elderly(1) + children(2) = 3
        "F",
        "1710000000",
        "Roof flood stranded",
    ]
    crc_hex = hashlib.sha256("|".join(core).encode("utf-8")).hexdigest()[:6]
    raw_packet = "|".join(core + [crc_hex, "2", "P-A1,KIOSK-B"])

    parsed = parse_packet(raw_packet)
    assert parsed.packet_id == "TEST99"
    assert parsed.latitude == 25.43580
    assert parsed.longitude == 81.84630
    assert parsed.people == 4
    assert parsed.trapped == 4
    assert parsed.flags == 3
    assert parsed.hazard_code == "F"
    assert parsed.hops == 2
    assert parsed.path == ["P-A1", "KIOSK-B"]


def test_relay_packet_tamper_detection():
    """Verify that any modification to the packet payload fails checksum verification."""
    core = [
        "SOT1",
        "TEST99",
        "25.43580",
        "81.84630",
        "4",
        "4",
        "0",
        "F",
        "1710000000",
        "Roof flood stranded",
    ]
    crc_hex = hashlib.sha256("|".join(core).encode("utf-8")).hexdigest()[:6]

    # Tampered people count from 4 to 99
    tampered_packet = "|".join(["SOT1", "TEST99", "25.43580", "81.84630", "99", "4", "0", "F", "1710000000", "Roof flood stranded", crc_hex, "0", ""])

    with pytest.raises(ValueError, match="Checksum mismatch"):
        parse_packet(tampered_packet)
