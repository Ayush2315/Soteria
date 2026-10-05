"""
SOTERIA Relay Mesh — Delay-Tolerant (Store-Carry-Forward) SOS Ingestion Endpoints.

Provides:
  1. POST /api/v1/relay/sms-webhook : Carrier SMS webhook (Twilio / MSG91 compatible)
  2. POST /api/v1/relay/sms         : Alias for sms-webhook
  3. POST /api/v1/relay/bulk        : Bulk upload of SOT1 packets from carried devices / camp kiosks
  4. POST /api/v1/relay/decode      : Non-persisting packet verification & decoding
  5. GET  /api/v1/relay/stats       : Relay mesh telemetry & delivery metrics

Integrates PostGIS ST_DWithin 50m spatial deduplication to cluster duplicate signals.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
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
from app.schemas.relay import (
    SMSWebhookPayload,
    BulkRelayPayload,
    BulkRelayResponse,
    RelayIngestResult,
)
from app.services.sms_codec import decode_sot1, SOT1Packet
from app.services.deduplication_service import (
    find_and_merge_duplicate_incident,
    generate_tracking_code,
)
from app.services.triage_engine import calculate_triage_score

logger = logging.getLogger("soteria.api.relay")
router = APIRouter()

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

HAZARD_SEVERITIES = {
    "FLOOD": 7,
    "STRUCTURAL_COLLAPSE": 9,
    "FIRE": 9,
    "MEDICAL_EMERGENCY": 8,
    "LANDSLIDE": 8,
    "OTHER": 6,
}


def _packet_to_extraction(pkt: SOT1Packet, stranded_hours: float) -> MultimodalGeminiExtraction:
    """Computes deterministic multimodal extraction from SOT1 packet fields without external LLM."""
    hz_type = pkt.hazard_type
    base_severity = HAZARD_SEVERITIES.get(hz_type, 6)

    severity = base_severity + (1 if pkt.has_injuries else 0)

    # Time-stranded escalation: longer wait without network = higher urgency
    if stranded_hours >= 72:
        severity += 3
    elif stranded_hours >= 24:
        severity += 2
    elif stranded_hours >= 6:
        severity += 1
    severity = max(1, min(10, severity))

    summary, b1, b2, b3 = SOP_LIBRARY.get(hz_type, SOP_LIBRARY["OTHER"])
    msg_text = pkt.message or f"{hz_type} distress signal relayed via offline mesh"

    return MultimodalGeminiExtraction(
        detected_language="relay-mesh-packet",
        transcript=msg_text,
        translation_en=msg_text,
        hazard_type=hz_type,
        hazard_severity=severity,
        people_affected=pkt.people,
        vulnerable_groups=VulnerableGroupBreakdown(
            elderly=1 if pkt.has_elderly else 0,
            children=1 if pkt.has_children else 0,
            pregnant=1 if pkt.has_pregnant else 0,
            disabled=1 if pkt.has_disabled else 0,
        ),
        is_trapped=pkt.trapped > 0,
        trapped_count=pkt.trapped,
        injuries_reported=["Trauma/wound reported via relay packet"] if pkt.has_injuries else [],
        extracted_location=None,
        safety_sop=SafetySOP(summary=summary, bullet_1=b1, bullet_2=b2, bullet_3=b3),
        confidence_score=0.90,
    )


async def _find_by_packet_id(db: AsyncSession, packet_id: str) -> Optional[Incident]:
    """Finds an incident previously created with this specific packet ID."""
    rows = await db.execute(
        select(Incident).where(Incident.is_offline_cached.is_(True)).order_by(Incident.id.desc()).limit(500)
    )
    for inc in rows.scalars():
        relay_meta = (inc.extracted_entities or {}).get("relay", {})
        if relay_meta.get("packet_id") == packet_id:
            return inc
    return None


async def ingest_relay_packet(
    db: AsyncSession,
    pkt: SOT1Packet,
    channel: str,
    carrier_tag: str,
) -> RelayIngestResult:
    """
    Ingests a SOT1 packet into PostGIS.
    1. Checks for exact packet ID deduplication.
    2. Runs PostGIS ST_DWithin 50m spatial cluster deduplication.
    3. Creates new incident if novel.
    """
    now = datetime.now(timezone.utc)
    created = datetime.fromtimestamp(pkt.created_unix, tz=timezone.utc)
    stranded_hours = max(0.0, (now - created).total_seconds() / 3600.0)

    # 1. Exact Packet ID Deduplication
    exact_match = await _find_by_packet_id(db, pkt.id)
    if exact_match:
        entities = dict(exact_match.extracted_entities or {})
        relay = dict(entities.get("relay", {}))
        relay["copies_received"] = int(relay.get("copies_received", 1)) + 1
        channels = set(relay.get("channels", []))
        channels.add(channel)
        relay["channels"] = sorted(channels)
        entities["relay"] = relay
        exact_match.extracted_entities = entities
        await db.commit()
        return RelayIngestResult(
            packet_id=pkt.id,
            tracking_code=exact_match.tracking_code,
            status="DUPLICATE_MERGED",
            incident_id=exact_match.id,
            reporter_count=exact_match.reporter_count,
            detail="Exact packet ID duplicate merged",
        )

    # 2. Spatial Deduplication (50m radius, 12h window)
    spatial_merged_incident, is_spatial_merged = await find_and_merge_duplicate_incident(
        db=db,
        latitude=pkt.latitude,
        longitude=pkt.longitude,
        hazard_type=pkt.hazard_type,
        raw_payload=pkt.message or f"SOT1 packet {pkt.id}",
        source_channel=channel,
        incoming_trapped=pkt.trapped,
        client_timestamp=created,
    )

    if is_spatial_merged and spatial_merged_incident:
        # Broadcast cluster update via WebSocket
        try:
            await ws_manager.broadcast_incident(
                event_type="INCIDENT_MERGED",
                incident_data=IncidentRead.model_validate(spatial_merged_incident).model_dump(mode="json"),
                triage_breakdown={"reporter_count": spatial_merged_incident.reporter_count},
            )
        except Exception:
            pass

        return RelayIngestResult(
            packet_id=pkt.id,
            tracking_code=spatial_merged_incident.tracking_code,
            status="DUPLICATE_MERGED",
            incident_id=spatial_merged_incident.id,
            reporter_count=spatial_merged_incident.reporter_count,
            detail=f"Spatially clustered into existing Incident #{spatial_merged_incident.id} (reporter count: {spatial_merged_incident.reporter_count})",
        )

    # 3. Novel Incident: Perform Deterministic Triage & Persist
    extraction = _packet_to_extraction(pkt, stranded_hours)
    breakdown = calculate_triage_score(extraction=extraction, client_timestamp=None)

    path = list(pkt.path)
    if carrier_tag and (not path or path[-1] != carrier_tag):
        path.append(carrier_tag)

    tracking_code = generate_tracking_code()

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
            "packet_id": pkt.id,
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

    new_incident = Incident(
        tracking_code=tracking_code,
        reporter_count=1,
        duplicate_metadata=[],
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
            "recommended_gear": ["PFD Life Jacket", "Emergency Trauma Kit", "Headlamp", "Radio"],
            "protocol_steps": [
                extraction.safety_sop.bullet_1,
                extraction.safety_sop.bullet_2,
                extraction.safety_sop.bullet_3,
            ],
        },
        is_offline_cached=True,
        client_timestamp=created.replace(tzinfo=None),
    )

    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)

    # Real-time broadcast to connected commander dashboards
    try:
        await ws_manager.broadcast_incident(
            event_type="INCIDENT_CREATED",
            incident_data=IncidentRead.model_validate(new_incident).model_dump(mode="json"),
            triage_breakdown=breakdown.model_dump(mode="json"),
        )
    except Exception as ws_err:
        logger.warning(f"Relay WebSocket broadcast non-fatal exception: {ws_err}")

    logger.info(
        f"Created Incident #{new_incident.id} (tracking: {tracking_code}) from SOT1 packet {pkt.id} via {channel}"
    )

    return RelayIngestResult(
        packet_id=pkt.id,
        tracking_code=tracking_code,
        status="CREATED",
        incident_id=new_incident.id,
        reporter_count=1,
    )


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@router.post("/sms-webhook", response_model=RelayIngestResult, summary="Carrier 2G/GSM SMS Webhook (Twilio / MSG91)")
@router.post("/sms", response_model=RelayIngestResult, include_in_schema=False)
async def relay_sms_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> RelayIngestResult:
    """
    Accepts Twilio-compatible form post (`Body`, `From`) or JSON `{"Body": "...", "From": "..."}`.
    Decodes SOT1 ASCII packet, verifies SHA-256 checksum, performs 50m spatial deduplication,
    and returns tracking code.
    """
    body_text = ""
    sender = ""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        data = await request.json()
        body_text = str(data.get("Body") or data.get("body") or "")
        sender = str(data.get("From") or data.get("from") or "")
    else:
        form = await request.form()
        body_text = str(form.get("Body") or form.get("body") or form.get("message") or "")
        sender = str(form.get("From") or form.get("from") or "")

    if not body_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="SMS body is empty",
        )

    try:
        packet = decode_sot1(body_text)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid SOT1 SMS packet: {exc}",
        )

    carrier_tag = f"SMS-{sender[-4:]}" if len(sender) >= 4 else "SMS-GATEWAY"
    return await ingest_relay_packet(db, packet, "SMS", carrier_tag)


@router.post("/bulk", response_model=BulkRelayResponse, summary="Batch upload of SOT1 packets from carrier or camp kiosk")
async def relay_bulk_upload(payload: BulkRelayPayload, db: AsyncSession = Depends(get_db)) -> BulkRelayResponse:
    """
    Ingests an array of SOT1 packets collected by a mobile carrier device or relief camp edge node.
    Performs individual packet validation, CRC verification, and PostGIS spatial clustering.
    """
    results: List[RelayIngestResult] = []
    channel = payload.channel.upper()[:20]

    for raw in payload.packets:
        try:
            packet = decode_sot1(raw)
            res = await ingest_relay_packet(db, packet, channel, payload.carrier_node_id)
            results.append(res)
        except ValueError as exc:
            results.append(
                RelayIngestResult(
                    packet_id=raw[:12],
                    tracking_code="",
                    status="REJECTED",
                    detail=str(exc),
                )
            )

    return BulkRelayResponse(
        received=len(results),
        created=sum(r.status == "CREATED" for r in results),
        duplicates=sum(r.status == "DUPLICATE_MERGED" for r in results),
        rejected=sum(r.status == "REJECTED" for r in results),
        results=results,
    )


@router.post("/decode", summary="Decode and verify SOT1 packet without storing")
async def relay_decode_packet(payload: dict) -> dict:
    raw = str(payload.get("packet", ""))
    try:
        pkt = decode_sot1(raw)
        return pkt.model_dump()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))


@router.get("/stats", summary="Relay mesh delivery and telemetry statistics")
async def relay_stats(db: AsyncSession = Depends(get_db)) -> dict:
    rows = await db.execute(select(Incident).where(Incident.is_offline_cached.is_(True)))
    by_channel: dict = {}
    total = 0
    max_hours = 0.0
    hops_total = 0

    for inc in rows.scalars():
        relay_meta = (inc.extracted_entities or {}).get("relay")
        if not relay_meta:
            continue
        total += 1
        ch = relay_meta.get("channel", "UNKNOWN")
        by_channel[ch] = by_channel.get(ch, 0) + 1
        max_hours = max(max_hours, float(relay_meta.get("stranded_hours", 0.0)))
        hops_total += int(relay_meta.get("hops", 0))

    return {
        "relayed_incidents": total,
        "by_channel": by_channel,
        "longest_stranded_hours": round(max_hours, 1),
        "avg_hops": round(hops_total / total, 2) if total else 0,
    }
