"""
SOT1 SMS & QR Relay Mesh Codec.
Encodes and decodes ultra-compact, checksummed ASCII packets (<= 160 chars)
optimized for 2G GSM SMS transmission and low-density offline QR codes.

Packet Specification (Pipe-separated ASCII):
  SOT1|<id>|<lat>|<lng>|<people>|<trapped>|<flags>|<hazard>|<unix_ts>|<msg>|<crc>|<hops>|<path>

  flags: Bitmask (1=elderly, 2=children, 4=pregnant, 8=disabled, 16=injured)
  hazard: F (Flood), C (Collapse), R (Fire), M (Medical), L (Landslide), O (Other)
  crc: First 6 hex characters of SHA-256 over fields 0 through 9
  hops: Count of devices that physically relayed the packet
  path: Comma-separated node tags e.g. "P-8F12,KIOSK-B"
"""
import hashlib
import re
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

PACKET_HEADER = "SOT1"

HAZARD_MAP = {
    "F": "FLOOD",
    "C": "STRUCTURAL_COLLAPSE",
    "R": "FIRE",
    "M": "MEDICAL_EMERGENCY",
    "L": "LANDSLIDE",
    "O": "OTHER",
}

REVERSE_HAZARD_MAP = {v: k for k, v in HAZARD_MAP.items()}


class SOT1Packet(BaseModel):
    id: str = Field(..., max_length=16)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    people: int = Field(1, ge=1)
    trapped: int = Field(0, ge=0)
    flags: int = Field(0, ge=0)
    hazard_code: str = Field("O", max_length=1)
    created_unix: int
    message: str = Field("", max_length=120)
    crc: str = Field(..., max_length=6)
    hops: int = 0
    path: List[str] = Field(default_factory=list)

    @property
    def packet_id(self) -> str:
        return self.id

    @property
    def hazard_type(self) -> str:
        return HAZARD_MAP.get(self.hazard_code.upper(), "OTHER")

    @property
    def has_children(self) -> bool:
        return bool(self.flags & 2)

    @property
    def has_elderly(self) -> bool:
        return bool(self.flags & 1)

    @property
    def has_pregnant(self) -> bool:
        return bool(self.flags & 4)

    @property
    def has_disabled(self) -> bool:
        return bool(self.flags & 8)

    @property
    def has_injuries(self) -> bool:
        return bool(self.flags & 16)


def compute_crc(core_fields: List[str]) -> str:
    """Calculates first 6 hex characters of SHA-256 over core fields."""
    raw = "|".join(core_fields).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:6]


def sanitize_text(text: str) -> str:
    """Sanitizes text by stripping pipes, newlines, and non-ASCII characters."""
    if not text:
        return ""
    clean = re.sub(r"[|\r\n]", " ", text)
    return clean.encode("ascii", "ignore").decode("ascii").strip()[:80]


def encode_sot1(
    packet_id: str,
    lat: float,
    lng: float,
    people: int = 1,
    trapped: int = 0,
    flags: int = 0,
    hazard_code: str = "O",
    created_unix: Optional[int] = None,
    message: str = "",
    hops: int = 0,
    path: Optional[List[str]] = None,
) -> str:
    """
    Packs parameters into a valid SOT1 string with checksum.
    Guarantees output fits within standard 160-character single-segment SMS if message <= 80 chars.
    """
    import time
    ts = created_unix if created_unix is not None else int(time.time())
    safe_msg = sanitize_text(message)
    hz = hazard_code.upper()[:1] if hazard_code else "O"
    if hz not in HAZARD_MAP:
        hz = "O"

    core = [
        PACKET_HEADER,
        packet_id[:8].upper(),
        f"{lat:.5f}",
        f"{lng:.5f}",
        str(max(1, int(people))),
        str(max(0, int(trapped))),
        str(int(flags) & 31),
        hz,
        str(ts),
        safe_msg,
    ]

    crc = compute_crc(core)
    path_list = [p.strip() for p in (path or []) if p.strip()]
    path_str = ",".join(path_list[:5])

    return "|".join(core + [crc, str(max(0, int(hops))), path_str])


def decode_sot1(raw_packet: str) -> SOT1Packet:
    """
    Unpacks and verifies the checksum of an incoming SOT1 packet string.
    Raises ValueError on syntax error or checksum mismatch.
    """
    clean = raw_packet.strip()
    parts = clean.split("|")

    if len(parts) < 11:
        raise ValueError(f"Packet too short (expected >= 11 fields, got {len(parts)})")

    if parts[0] != PACKET_HEADER:
        raise ValueError(f"Invalid packet header: expected '{PACKET_HEADER}', got '{parts[0]}'")

    core = parts[:10]
    provided_crc = parts[10].strip().lower()
    expected_crc = compute_crc(core)

    if provided_crc != expected_crc:
        raise ValueError(
            f"Checksum mismatch (expected {expected_crc}, got {provided_crc}) — packet corrupted or tampered"
        )

    try:
        lat = float(core[2])
        lng = float(core[3])
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            raise ValueError("Coordinates out of valid range")

        hops = int(parts[11]) if len(parts) > 11 and parts[11].isdigit() else 0
        path = [p.strip() for p in (parts[12].split(",") if len(parts) > 12 else []) if p.strip()]

        return SOT1Packet(
            id=core[1],
            latitude=lat,
            longitude=lng,
            people=max(1, int(core[4])),
            trapped=max(0, int(core[5])),
            flags=int(core[6]),
            hazard_code=core[7].upper()[:1],
            created_unix=int(core[8]),
            message=core[9],
            crc=provided_crc,
            hops=hops,
            path=path,
        )
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Malformed packet field: {exc}") from exc


# Convenient alias
parse_packet = decode_sot1

