/**
 * SOTERIA Relay Mesh — client-side SOT1 packet codec + carried-packet store.
 *
 * Mirrors backend/app/api/v1/endpoints/relay.py. A packet is a tiny ASCII string
 * (<= 160 chars) so it fits in ONE SMS and in a low-density QR code that any
 * phone camera can read.
 *
 *   SOT1|id|lat|lng|people|trapped|flags|hazard|unix_ts|msg|crc|hops|path
 */

export const FLAG = { ELDERLY: 1, CHILDREN: 2, PREGNANT: 4, DISABLED: 8, INJURED: 16 } as const;

export const HAZARDS: { code: string; label: string; labelHi: string; emoji: string }[] = [
  { code: "F", label: "Flood", labelHi: "बाढ़", emoji: "🌊" },
  { code: "C", label: "Collapse", labelHi: "इमारत गिरी", emoji: "🏚️" },
  { code: "R", label: "Fire", labelHi: "आग", emoji: "🔥" },
  { code: "M", label: "Medical", labelHi: "चिकित्सा", emoji: "🩺" },
  { code: "L", label: "Landslide", labelHi: "भूस्खलन", emoji: "⛰️" },
  { code: "O", label: "Other", labelHi: "अन्य", emoji: "🆘" },
];

export interface RelayDraft {
  latitude: number;
  longitude: number;
  people: number;
  trapped: number;
  flags: number;
  hazard: string;
  message: string;
}

export interface DecodedPacket extends RelayDraft {
  id: string;
  createdUnix: number;
  crc: string;
  hops: number;
  path: string[];
  raw: string;
}

// ---------------------------------------------------------------------------
// Minimal pure-JS SHA-256 (crypto.subtle is unavailable on plain-HTTP LAN
// kiosks, which is exactly where offline relay must still work).
// ---------------------------------------------------------------------------
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export function sha256Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen >>> 0);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const W = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H).map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

// ---------------------------------------------------------------------------
// Codec
// ---------------------------------------------------------------------------
const sanitize = (s: string) =>
  s.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").replace(/\|/g, "/").trim();

function randomId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function encodePacket(d: RelayDraft, opts?: { id?: string; createdUnix?: number }): string {
  const id = opts?.id || randomId();
  const ts = opts?.createdUnix ?? Math.floor(Date.now() / 1000);
  // Keep message short so the whole packet fits one 160-char SMS.
  const fixedLen = 60;
  const msg = sanitize(d.message).slice(0, Math.max(0, 160 - fixedLen - 20));
  const core = [
    "SOT1",
    id,
    d.latitude.toFixed(5),
    d.longitude.toFixed(5),
    String(Math.max(1, Math.round(d.people))),
    String(Math.max(0, Math.round(d.trapped))),
    String(d.flags & 31),
    (d.hazard || "O").slice(0, 1).toUpperCase(),
    String(ts),
    msg,
  ];
  const crc = sha256Hex(core.join("|")).slice(0, 6);
  return [...core, crc, "0", ""].join("|");
}

export function decodePacket(raw: string): DecodedPacket {
  const parts = raw.trim().split("|");
  if (parts.length < 11 || parts[0] !== "SOT1") throw new Error("Not a SOTERIA SOS packet");
  const core = parts.slice(0, 10);
  const crc = sha256Hex(core.join("|")).slice(0, 6);
  if (crc !== parts[10].toLowerCase()) throw new Error("Checksum failed — packet corrupted or tampered");
  return {
    id: core[1],
    latitude: parseFloat(core[2]),
    longitude: parseFloat(core[3]),
    people: parseInt(core[4]) || 1,
    trapped: parseInt(core[5]) || 0,
    flags: parseInt(core[6]) || 0,
    hazard: core[7] || "O",
    createdUnix: parseInt(core[8]),
    message: core[9],
    crc,
    hops: parseInt(parts[11] || "0") || 0,
    path: (parts[12] || "").split(",").filter(Boolean),
    raw: raw.trim(),
  };
}

/** Add this device to the carry path and bump the hop count (core + crc untouched). */
export function addHop(raw: string, nodeTag: string): string {
  const parts = raw.trim().split("|");
  while (parts.length < 13) parts.push("");
  const path = parts[12].split(",").filter(Boolean);
  if (path[path.length - 1] !== nodeTag) path.push(nodeTag);
  parts[11] = String((parseInt(parts[11]) || 0) + 1);
  parts[12] = path.slice(-6).join(",");
  return parts.join("|");
}

// ---------------------------------------------------------------------------
// Device identity + carried-packet store (localStorage: survives reloads/offline)
// ---------------------------------------------------------------------------
const CARRY_KEY = "soteria_relay_carry_v1";
const MINE_KEY = "soteria_relay_mine_v1";
const NODE_KEY = "soteria_relay_node_v1";

export function getNodeTag(): string {
  if (typeof window === "undefined") return "P-0000";
  let tag = localStorage.getItem(NODE_KEY);
  if (!tag) {
    tag = "P-" + Math.random().toString(16).slice(2, 6).toUpperCase();
    localStorage.setItem(NODE_KEY, tag);
  }
  return tag;
}

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  localStorage.setItem(key, JSON.stringify(list.slice(-200)));
  window.dispatchEvent(new Event("soteria-relay-change"));
}

export function getCarried(): string[] {
  return readList(CARRY_KEY);
}

export function getMine(): string[] {
  return readList(MINE_KEY);
}

/** Store a packet this device is carrying. Returns false if already carried. */
export function carryPacket(raw: string, isMine = false): boolean {
  const pkt = decodePacket(raw); // validates
  const list = getCarried();
  if (list.some((r) => r.split("|")[1] === pkt.id)) return false;
  const withHop = isMine ? raw : addHop(raw, getNodeTag());
  writeList(CARRY_KEY, [...list, withHop]);
  if (isMine) writeList(MINE_KEY, [...getMine(), pkt.id]);
  return true;
}

export function clearDelivered(ids: string[]) {
  writeList(CARRY_KEY, getCarried().filter((r) => !ids.includes(r.split("|")[1])));
}

export function smsLink(gateway: string, packet: string): string {
  const sep = typeof navigator !== "undefined" && /iPhone|iPad|Mac/i.test(navigator.userAgent) ? "&" : "?";
  return `sms:${gateway}${sep}body=${encodeURIComponent(packet)}`;
}

export function hazardMeta(code: string) {
  return HAZARDS.find((h) => h.code === code) || HAZARDS[HAZARDS.length - 1];
}
