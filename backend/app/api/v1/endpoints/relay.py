"""
SOTERIA Relay Mesh — Delay-Tolerant (Store-Carry-Forward) SOS Ingestion.

When the internet is down for days, an SOS does not wait on the victim's phone.
It is compressed into a tiny, checksummed text packet that can travel over:

  1. SMS        — a 2G/GSM SMS (<= 160 chars) to a gateway number -> /relay/sms
  2. QR relay   — phone-to-phone QR hand-off; any carrier that reaches network
                  (or a relief-camp kiosk) bulk-uploads everything it carries -> /relay/bulk
  3. Camp kiosk — a relief camp runs SOTERIA on a LAN with no internet; phones on
                  the camp hotspot auto-sync, kiosk later syncs upward to HQ.

Packet format (pipe-separated, ASCII only):

    SOT1|<id>|<lat>|<lng>|<people>|<trapped>|<flags>|<hazard>|<unix_ts>|<msg>|<crc>|<hops>|<path>

    flags  : bitmask  1=elderly 2=children 4=pregnant 8=disabled 16=injured
    hazard : F=flood C=collapse R=fire M=medical L=landslide O=other
    crc    : first 6 hex chars of SHA-256 over fields 0..9 (tamper/corruption check)
    hops   : number of devices that carried the packet (not covered by crc)
    path   : comma-separated relay node tags, e.g. "P-3fa1,KIOSK-B"

Triage of relayed packets is fully deterministic (no AI call) so it also works on an
offline kiosk. SOS that have been stranded for long periods are ESCALATED, never
decayed — the longer someone waits, the more urgent they become.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.websockets import ws_manager
from app.models.incident import Incident, IncidentStatus, SourceType
from app.schemas.incident import (
    IncidentRead,
    MultimodalGeminiExtraction,
    SafetySOP,
    VulnerableGroupBreakdown,
)
from app.services.triage_engine import calculate_triage_score

logger = logging.getLogger("soteria.api.relay")
router = APIRouter()

PACKET_VERSION = "SOT1"

HAZARD_CODES = {
    "F": ("FLOOD", 7),
    "C": ("STRUCTURAL_COLLAPSE", 9),
    "R": ("FIRE", 9),
    "M": ("MEDICAL_EMERGENCY", 8),
    "L": ("LANDSLIDE", 8),
    "O": ("OTHER", 6),
}

SOP_LIBRARY = {
    "FLOOD": (
        "Rising floodwater with stranded civilians — boat-based extraction required.",
        "Approach by rescue boat; avoid fast current channels and submerged power lines.",
        "All rescuers and victims in PFD life jackets; evacuate vulnerable people first.",
        "Check for hypothermia and waterborne injuries; move to nearest safe haven.",
    ),
    "STRUCTURAL_COLLAPSE": (
        "Collapsed structure with possible entrapment — USAR protocol.",
        "Cordon the area; assess secondary collapse risk before entry.",
        "Use helmets, gloves and shoring; locate victims by voice/tap before cutting.",
        "Treat crush injuries carefully; stabilise spine before moving.",
    ),
    "FIRE": (
        "Active fire with civilians at risk.",
        "Approach upwind; isolate gas and electrical supply.",
        "Breathing protection required; evacuate along smoke-free corridor.",
        "Treat burns and smoke inhalation; monitor airway.",
    ),
    "MEDICAL_EMERGENCY": (
        "Medical emergency in isolated location.",
        "Dispatch nearest medically certified responder with trauma kit.",
        "Stabilise ABCs (airway, breathing, circulation) on scene.",
        "Arrange casualty evacuation to nearest functioning medical camp.",
    ),
    "LANDSLIDE": (
        "Landslide with possible burial or blocked access.",
        "Watch for secondary slides; approach from stable ground.",
        "Helmets and probes; search from the toe of the slide upward.",
        "Treat trauma and hypothermia; evacuate to stable ground.",
    ),
    "OTHER": (
        "Distress signal received via offline relay mesh.",
        "Confirm the situation on approach; keep radio contact with HQ.",
        "Standard PPE; prioritise vulnerable people.",
        "Assess injuries and guide to nearest safe haven.",
    ),
}


# ---------------------------------------------------------------------------
# Packet codec
# ---------------------------------------------------------------------------
def _crc(core_fields: List[str]) -> str:
    return hashlib.sha256("|".join(core_fields).encode("utf-8")).hexdigest()[:6]


class RelayPacket(BaseModel):
    packet_id: str
    latitude: float
    longitude: float
    people: int = 1
    trapped: int = 0
    flags: int = 0
    hazard_code: str = "O"
    created_unix: int
    message: str = ""
    hops: int = 0
    path: List[str] = Field(default_factory=list)


def parse_packet(raw: str) -> RelayPacket:
    """Decode and integrity-check a SOT1 packet. Raises ValueError on failure."""
    raw = raw.strip()
    parts = raw.split("|")
    if len(parts) < 11 or parts[0] != PACKET_VERSION:
        raise ValueError("Not a SOT1 relay packet")

    core = parts[:10]
    if _crc(core) != parts[10].lower():
        raise ValueError("Checksum mismatch — packet corrupted or tampered")

    try:
        lat = float(core[2])
        lng = float(core[3])
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise ValueError("Invalid coordinates")
        return RelayPacket(
            packet_id=core[1],
            latitude=lat,
            longitude=lng,
            people=max(1, int(core[4] or 1)),
            trapped=max(0, int(core[5] or 0)),
            flags=int(core[6] or 0),
            hazard_code=(core[7] or "O").upper()[:1],
            created_unix=int(core[8]),
            message=core[9][:120],
            hops=int(parts[11]) if len(parts) > 11 and parts[11].isdigit() else 0,
            path=[p for p in (parts[12].split(",") if len(parts) > 12 else []) if p],
        )
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Malformed packet field: {exc}") from exc


# ---------------------------------------------------------------------------
# Deterministic offline triage of a relay packet
# ---------------------------------------------------------------------------
def _packet_to_extraction(pkt: RelayPacket, stranded_hours: float) -> MultimodalGeminiExtraction:
    hazard_type, base_severity = HAZARD_CODES.get(pkt.hazard_code, HAZARD_CODES["O"])
    injured = bool(pkt.flags & 16)

    severity = base_severity + (1 if injured else 0)
    # Time-stranded escalation: waiting longer makes it MORE urgent, not less.
    if stranded_hours >= 72:
        severity += 3
    elif stranded_hours >= 24:
        severity += 2
    elif stranded_hours >= 6:
        severity += 1
    severity = max(1, min(10, severity))

    summary, b1, b2, b3 = SOP_LIBRARY[hazard_type]
    text = pkt.message or f"{hazard_type} SOS relayed through offline mesh"

    return MultimodalGeminiExtraction(
        detected_language="relay-packet",
        transcript=text,
        translation_en=text,
        hazard_type=hazard_type,
        hazard_severity=severity,
        people_affected=pkt.people,
        vulnerable_groups=VulnerableGroupBreakdown(
            elderly=1 if pkt.flags & 1 else 0,
            children=1 if pkt.flags & 2 else 0,
            pregnant=1 if pkt.flags & 4 else 0,
            disabled=1 if pkt.flags & 8 else 0,
        ),
        is_trapped=pkt.trapped > 0,
        trapped_count=pkt.trapped,
        injuries_reported=["injury reported via relay"] if injured else [],
        extracted_location=None,
        safety_sop=SafetySOP(summary=summary, bullet_1=b1, bullet_2=b2, bullet_3=b3),
        confidence_score=0.7,  # structured but not AI-verified -> flagged for human review
    )


class RelayIngestResult(BaseModel):
    packet_id: str
    status: str  # CREATED | DUPLICATE_MERGED | REJECTED
    incident_id: Optional[int] = None
    detail: Optional[str] = None


async def _find_existing(db: AsyncSession, packet_id: str) -> Optional[Incident]:
    rows = await db.execute(
        select(Incident).where(Incident.is_offline_cached.is_(True)).order_by(Incident.id.desc()).limit(500)
    )
    for inc in rows.scalars():
        if (inc.extracted_entities or {}).get("relay", {}).get("packet_id") == packet_id:
            return inc
    return None


async def ingest_packet(db: AsyncSession, pkt: RelayPacket, channel: str, delivered_by: str) -> RelayIngestResult:
    now = datetime.now(timezone.utc)
    created = datetime.fromtimestamp(pkt.created_unix, tz=timezone.utc)
    stranded_hours = max(0.0, (now - created).total_seconds() / 3600.0)

    # De-duplicate: the same SOS may arrive via many carriers / channels.
    existing = await _find_existing(db, pkt.packet_id)
    if existing:
        entities = dict(existing.extracted_entities or {})
        relay = dict(entities.get("relay", {}))
        relay["copies_received"] = int(relay.get("copies_received", 1)) + 1
        channels = set(relay.get("channels", []))
        channels.add(channel)
        relay["channels"] = sorted(channels)
        entities["relay"] = relay
        existing.extracted_entities = entities
        await db.commit()
        return RelayIngestResult(packet_id=pkt.packet_id, status="DUPLICATE_MERGED", incident_id=existing.id)

    extraction = _packet_to_extraction(pkt, stranded_hours)
    breakdown = calculate_triage_score(extraction=extraction, client_timestamp=None)

    path = list(pkt.path)
    if delivered_by and (not path or path[-1] != delivered_by):
        path.append(delivered_by)

    entities = {
        "trapped_count": extraction.trapped_count,
        "is_trapped": extraction.is_trapped,
        "medical_needs": extraction.injuries_reported,
        "hazard_types": [extraction.hazard_type],
        "hazard_severity": extraction.hazard_severity,
        "people_affected": extraction.people_affected,
        "vulnerable_people": extraction.vulnerable_groups.model_dump(),
        "detected_language": extraction.detected_language,
        "translation_en": extraction.translation_en,
        "confidence_score": extraction.confidence_score,
        "needs_human_review": True,
        "relay": {
            "packet_id": pkt.packet_id,
            "channel": channel,
            "channels": [channel],
            "hops": max(pkt.hops, len(path)),
            "path": path,
            "stranded_hours": round(stranded_hours, 1),
            "created_at": created.isoformat(),
            "delivered_at": now.isoformat(),
            "copies_received": 1,
            "integrity": "CRC_VERIFIED",
        },
    }

    inc = Incident(
        source_type=SourceType.TEXT,
        raw_payload=f"[RELAY:{channel}] {extraction.transcript}",
        image_urls=[],
        location_name=f"Relayed SOS ({pkt.latitude:.4f}, {pkt.longitude:.4f})",
        latitude=pkt.latitude,
        longitude=pkt.longitude,
        location_geom=f"SRID=4326;POINT({pkt.longitude} {pkt.latitude})",
        triage_score=breakdown.final_score,
        triage_category=breakdown.triage_category,
        status=IncidentStatus.TRIAGED,
        extracted_entities=entities,
        safety_sop={
            "urgency_summary": extraction.safety_sop.summary,
            "hazards_detected": [extraction.hazard_type],
            "recommended_gear": ["PFD Life Jacket", "Trauma Kit", "Headlamp", "Radio"],
            "protocol_steps": [
                extraction.safety_sop.bullet_1,
                extraction.safety_sop.bullet_2,
                extraction.safety_sop.bullet_3,
            ],
        },
        is_offline_cached=True,
        client_timestamp=created.replace(tzinfo=None),
    )
    db.add(inc)
    await db.commit()
    await db.refresh(inc)

    try:
        await ws_manager.broadcast_incident(
            event_type="INCIDENT_CREATED",
            incident_data=IncidentRead.model_validate(inc).model_dump(mode="json"),
            triage_breakdown=breakdown.model_dump(mode="json"),
        )
    except Exception as ws_err:  # pragma: no cover
        logger.warning(f"Relay broadcast failed (non-fatal): {ws_err}")

    logger.info(f"Relay packet {pkt.packet_id} via {channel} -> Incident #{inc.id} ({breakdown.final_score})")
    return RelayIngestResult(packet_id=pkt.packet_id, status="CREATED", incident_id=inc.id)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
class BulkRelayRequest(BaseModel):
    packets: List[str] = Field(..., max_length=500, description="Raw SOT1 packets carried by this device")
    channel: str = Field("QR_RELAY", description="QR_RELAY | CAMP_KIOSK | INTERNET")
    delivered_by: str = Field("", max_length=40, description="Tag of the delivering device / kiosk")


class BulkRelayResponse(BaseModel):
    received: int
    created: int
    duplicates: int
    rejected: int
    results: List[RelayIngestResult]


@router.post("/bulk", response_model=BulkRelayResponse, summary="Upload SOS packets carried by a relay device or camp kiosk")
async def relay_bulk(req: BulkRelayRequest, db: AsyncSession = Depends(get_db)) -> BulkRelayResponse:
    results: List[RelayIngestResult] = []
    channel = req.channel.upper()[:20]
    for raw in req.packets:
        try:
            pkt = parse_packet(raw)
            results.append(await ingest_packet(db, pkt, channel, req.delivered_by))
        except ValueError as exc:
            results.append(RelayIngestResult(packet_id=raw[:24], status="REJECTED", detail=str(exc)))
    return BulkRelayResponse(
        received=len(results),
        created=sum(r.status == "CREATED" for r in results),
        duplicates=sum(r.status == "DUPLICATE_MERGED" for r in results),
        rejected=sum(r.status == "REJECTED" for r in results),
        results=results,
    )


@router.post("/sms", response_model=RelayIngestResult, summary="SMS gateway webhook (Twilio/MSG91 compatible)")
async def relay_sms(request: Request, db: AsyncSession = Depends(get_db)) -> RelayIngestResult:
    """
    Accepts either a Twilio-style form post (`Body`, `From`) or JSON `{"body": "...", "from": "..."}`.
    """
    body_text = ""
    sender = ""
    ctype = request.headers.get("content-type", "")
    if "application/json" in ctype:
        data = await request.json()
        body_text = str(data.get("body") or data.get("Body") or "")
        sender = str(data.get("from") or data.get("From") or "")
    else:
        form = await request.form()
        body_text = str(form.get("Body") or form.get("body") or form.get("message") or "")
        sender = str(form.get("From") or form.get("from") or "")

    try:
        pkt = parse_packet(body_text)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))

    masked = f"SMS-{sender[-4:]}" if sender else "SMS-GW"
    return await ingest_packet(db, pkt, "SMS", masked)


@router.post("/decode", summary="Validate and decode a packet without storing it")
async def relay_decode(payload: dict) -> dict:
    try:
        pkt = parse_packet(str(payload.get("packet", "")))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    return pkt.model_dump()


@router.get("/stats", summary="Relay mesh delivery statistics")
async def relay_stats(db: AsyncSession = Depends(get_db)) -> dict:
    rows = await db.execute(select(Incident).where(Incident.is_offline_cached.is_(True)))
    by_channel: dict = {}
    total = 0
    max_hours = 0.0
    hops_total = 0
    for inc in rows.scalars():
        relay = (inc.extracted_entities or {}).get("relay")
        if not relay:
            continue
        total += 1
        ch = relay.get("channel", "UNKNOWN")
        by_channel[ch] = by_channel.get(ch, 0) + 1
        max_hours = max(max_hours, float(relay.get("stranded_hours", 0)))
        hops_total += int(relay.get("hops", 0))
    return {
        "relayed_incidents": total,
        "by_channel": by_channel,
        "longest_stranded_hours": round(max_hours, 1),
        "avg_hops": round(hops_total / total, 2) if total else 0,
    }
