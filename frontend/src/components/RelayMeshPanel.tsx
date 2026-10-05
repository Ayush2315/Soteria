"use client";

/**
 * Offline Relay Mesh panel — "People carry the SOS to the relief camp."
 *
 * 1. CREATE  : compress an SOS into a 160-char SOT1 packet -> QR + SMS + local carry.
 * 2. RECEIVE : scan a neighbour's QR (BarcodeDetector) or paste the code -> carry it.
 * 3. DELIVER : whenever this phone touches ANY network (internet or a camp kiosk LAN),
 *              every carried packet is bulk-uploaded and de-duplicated by the server.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  HAZARDS,
  FLAG,
  encodePacket,
  decodePacket,
  carryPacket,
  getCarried,
  clearDelivered,
  getNodeTag,
  smsLink,
  hazardMeta,
  DecodedPacket,
} from "@/lib/relay";
import {
  QrCode,
  MessageSquare,
  ScanLine,
  Upload,
  Copy,
  CheckCircle2,
  Users,
  Radio,
  Tent,
  Smartphone,
  Wifi,
  WifiOff,
  Crosshair,
  X,
  AlertTriangle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const SMS_GATEWAY = process.env.NEXT_PUBLIC_SMS_GATEWAY || "+911234567890";

interface Props {
  defaultLat: number;
  defaultLng: number;
  initialMessage?: string;
}

export function RelayMeshPanel({ defaultLat, defaultLng, initialMessage = "" }: Props) {
  // ---- Create ----
  const [hazard, setHazard] = useState("F");
  const [people, setPeople] = useState(4);
  const [trapped, setTrapped] = useState(4);
  const [flags, setFlags] = useState<number>(FLAG.CHILDREN | FLAG.ELDERLY);
  const [message, setMessage] = useState(initialMessage || "Water at roof level, need boat");
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [packet, setPacket] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ---- Receive ----
  const [scanOpen, setScanOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [receiveMsg, setReceiveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimer = useRef<number | null>(null);

  // ---- Carry / Deliver ----
  const [carried, setCarried] = useState<DecodedPacket[]>([]);
  const [online, setOnline] = useState(true);
  const [channel, setChannel] = useState<"QR_RELAY" | "CAMP_KIOSK">("QR_RELAY");
  const [delivering, setDelivering] = useState(false);
  const [deliverMsg, setDeliverMsg] = useState<string | null>(null);
  const [nodeTag, setNodeTag] = useState("P-0000");
  const deliveringRef = useRef(false);

  const refreshCarried = useCallback(() => {
    const list: DecodedPacket[] = [];
    for (const raw of getCarried()) {
      try {
        list.push(decodePacket(raw));
      } catch {
        /* skip corrupted */
      }
    }
    setCarried(list.reverse());
  }, []);

  const deliver = useCallback(async () => {
    if (deliveringRef.current) return;
    const raws = getCarried();
    if (raws.length === 0) {
      setDeliverMsg("Nothing to deliver — you are not carrying any SOS packets.");
      return;
    }
    deliveringRef.current = true;
    setDelivering(true);
    setDeliverMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/relay/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packets: raws,
          channel,
          delivered_by: channel === "CAMP_KIOSK" ? "KIOSK-" + getNodeTag().slice(2) : getNodeTag(),
        }),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      const doneIds: string[] = data.results
        .filter((r: any) => r.status !== "REJECTED")
        .map((r: any) => r.packet_id);
      clearDelivered(doneIds);
      setDeliverMsg(
        `✅ Delivered ${data.created} new SOS, merged ${data.duplicates} duplicate(s)` +
          (data.rejected ? `, rejected ${data.rejected} corrupted.` : ".")
      );
    } catch (e: any) {
      setDeliverMsg(`📦 No route to HQ yet (${e.message}). Packets stay safely on this phone — keep moving toward a camp or signal.`);
    } finally {
      deliveringRef.current = false;
      setDelivering(false);
      refreshCarried();
    }
  }, [channel, refreshCarried]);

  useEffect(() => {
    setNodeTag(getNodeTag());
    refreshCarried();
    setOnline(navigator.onLine);
    const onChange = () => refreshCarried();
    const goOnline = () => {
      setOnline(true);
      // Auto store-and-forward the moment ANY network appears.
      if (getCarried().length > 0) deliver();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("soteria-relay-change", onChange);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("soteria-relay-change", onChange);
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [refreshCarried, deliver]);

  useEffect(() => () => stopScan(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFlag = (f: number) => setFlags((prev) => prev ^ f);

  const useGps = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude);
        setLng(p.coords.longitude);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const generate = async () => {
    const pkt = encodePacket({ latitude: lat, longitude: lng, people, trapped, flags, hazard, message });
    setPacket(pkt);
    carryPacket(pkt, true);
    setQrUrl(await QRCode.toDataURL(pkt, { errorCorrectionLevel: "M", margin: 1, width: 320 }));
  };

  const copy = async () => {
    if (!packet) return;
    await navigator.clipboard?.writeText(packet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const accept = (raw: string) => {
    try {
      const pkt = decodePacket(raw);
      const added = carryPacket(raw);
      setReceiveMsg({
        ok: true,
        text: added
          ? `Now carrying SOS ${pkt.id} (${pkt.people} people, ${hazardMeta(pkt.hazard).label}). It will auto-deliver at the next signal or camp.`
          : `Already carrying SOS ${pkt.id}.`,
      });
      setPasteText("");
      stopScan();
    } catch (e: any) {
      setReceiveMsg({ ok: false, text: e.message });
    }
  };

  const startScan = async () => {
    setReceiveMsg(null);
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setReceiveMsg({ ok: false, text: "Camera QR scanning is not supported in this browser — paste the SOS code below instead." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
      const detector = new Detector({ formats: ["qr_code"] });
      scanTimer.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const hit = codes.find((c: any) => String(c.rawValue).startsWith("SOT1|"));
          if (hit) accept(hit.rawValue);
        } catch {
          /* ignore frame errors */
        }
      }, 400);
    } catch {
      setReceiveMsg({ ok: false, text: "Camera permission denied — paste the SOS code below instead." });
    }
  };

  function stopScan() {
    if (scanTimer.current) window.clearInterval(scanTimer.current);
    scanTimer.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanOpen(false);
  }

  const ageLabel = (unix: number) => {
    const h = (Date.now() / 1000 - unix) / 3600;
    if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
    if (h < 48) return `${h.toFixed(1)} h ago`;
    return `${(h / 24).toFixed(1)} days ago`;
  };

  const chip = (active: boolean) =>
    `px-3 py-2 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer ${
      active
        ? "bg-violet-500/20 border-violet-400/60 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.35)]"
        : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-violet-400/40"
    }`;

  return (
    <div className="space-y-6">
      {/* Hero / how it works */}
      <section className="relative overflow-hidden p-5 md:p-6 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 via-surface-container to-cyan-950/40">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
            <Radio className="w-5 h-5 text-violet-300" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl font-black text-on-surface">No network for days? Your SOS still travels.</h2>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
              SOTERIA turns your SOS into a tiny code that can hop <b>phone-to-phone</b> until someone reaches a signal or a
              relief camp. Every neighbour, boat crew, or volunteer becomes a carrier.
            </p>
          </div>
        </div>
        <ol className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {[
            { icon: Wifi, t: "1. Internet", d: "Sent instantly when data works" },
            { icon: MessageSquare, t: "2. SMS (2G)", d: "160-char code works without data" },
            { icon: Smartphone, t: "3. QR hand-off", d: "Neighbour scans & carries it" },
            { icon: Tent, t: "4. Camp kiosk", d: "Offline LAN at relief camp syncs all" },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-1">
              <Icon className="w-4 h-4 text-violet-300" />
              <div className="font-bold text-on-surface">{t}</div>
              <div className="text-on-surface-variant leading-snug">{d}</div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CREATE */}
        <section className="p-5 rounded-3xl bg-surface-container border border-outline-variant/40 space-y-4" aria-labelledby="relay-create-h">
          <h3 id="relay-create-h" className="font-black text-on-surface flex items-center gap-2">
            <QrCode className="w-4 h-4 text-violet-300" /> Create offline SOS code
          </h3>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Emergency type</div>
            <div className="grid grid-cols-3 gap-2">
              {HAZARDS.map((h) => (
                <button key={h.code} type="button" id={`relay-hazard-${h.code}`} onClick={() => setHazard(h.code)} className={chip(hazard === h.code)} aria-pressed={hazard === h.code}>
                  <span className="mr-1" aria-hidden>{h.emoji}</span>
                  {h.label}
                  <span className="block text-[10px] font-normal opacity-70">{h.labelHi}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "People / लोग", val: people, set: setPeople, min: 1, id: "relay-people" },
              { label: "Trapped / फंसे", val: trapped, set: setTrapped, min: 0, id: "relay-trapped" },
            ].map(({ label, val, set, min, id }) => (
              <div key={id}>
                <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
                <div className="mt-1 flex items-center rounded-xl border border-outline-variant/40 overflow-hidden">
                  <button type="button" aria-label={`decrease ${label}`} onClick={() => set(Math.max(min, val - 1))} className="w-11 h-11 text-lg font-black hover:bg-surface-variant/40">−</button>
                  <input id={id} type="number" min={min} value={val} onChange={(e) => set(Math.max(min, parseInt(e.target.value) || min))} className="flex-1 w-full min-w-0 bg-transparent text-center font-black text-on-surface outline-none" />
                  <button type="button" aria-label={`increase ${label}`} onClick={() => set(val + 1)} className="w-11 h-11 text-lg font-black hover:bg-surface-variant/40">+</button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Who is with you?</div>
            <div className="flex flex-wrap gap-2">
              {[
                { f: FLAG.CHILDREN, l: "👶 Children" },
                { f: FLAG.ELDERLY, l: "👵 Elderly" },
                { f: FLAG.PREGNANT, l: "🤰 Pregnant" },
                { f: FLAG.DISABLED, l: "♿ Disabled" },
                { f: FLAG.INJURED, l: "🩸 Injured" },
              ].map(({ f, l }) => (
                <button key={f} type="button" onClick={() => toggleFlag(f)} className={chip(!!(flags & f))} aria-pressed={!!(flags & f)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="relay-msg" className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Short message (English letters, optional)</label>
            <input id="relay-msg" maxLength={80} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full px-3 py-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface outline-none focus:border-violet-400" />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-on-surface-variant font-mono">
            <span>📍 {lat.toFixed(5)}, {lng.toFixed(5)}</span>
            <button type="button" onClick={useGps} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-cyan-400 text-cyan-300">
              <Crosshair className="w-3.5 h-3.5" /> Use my GPS
            </button>
          </div>

          <button id="relay-generate" type="button" onClick={generate} className="w-full min-h-[52px] rounded-2xl font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:brightness-110 shadow-lg shadow-violet-900/40 transition-all">
            Generate offline SOS code
          </button>

          {packet && (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-violet-400/30 space-y-3 animate-in fade-in">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {qrUrl && <img src={qrUrl} alt="SOS relay QR code — let a neighbour or rescuer scan this" className="w-44 h-44 rounded-xl bg-white p-1" />}
                <div className="flex-1 space-y-2 w-full">
                  <p className="text-xs text-on-surface-variant">Show this QR to anyone nearby. They scan it and carry your SOS to the next signal or relief camp.</p>
                  <code className="block text-[10px] break-all p-2 rounded-lg bg-black/30 text-violet-200">{packet}</code>
                  <div className="text-[10px] text-on-surface-variant">{packet.length}/160 chars · fits one SMS · checksum protected</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a id="relay-sms" href={smsLink(SMS_GATEWAY, packet)} className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold">
                  <MessageSquare className="w-4 h-4" /> Send by SMS
                </a>
                <button type="button" onClick={copy} className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-outline-variant/50 hover:border-violet-400 text-xs font-bold text-on-surface">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy code"}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* RECEIVE */}
          <section className="p-5 rounded-3xl bg-surface-container border border-outline-variant/40 space-y-4" aria-labelledby="relay-recv-h">
            <h3 id="relay-recv-h" className="font-black text-on-surface flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-cyan-300" /> Carry someone else&apos;s SOS
            </h3>
            {!scanOpen ? (
              <button id="relay-scan" type="button" onClick={startScan} className="w-full min-h-[52px] rounded-2xl font-black text-cyan-100 bg-cyan-600/20 border border-cyan-400/40 hover:bg-cyan-600/30 flex items-center justify-center gap-2">
                <ScanLine className="w-5 h-5" /> Scan SOS QR with camera
              </button>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-cyan-400/50">
                <video ref={videoRef} className="w-full aspect-video object-cover bg-black" muted playsInline />
                <div className="absolute inset-8 border-2 border-cyan-300/70 rounded-xl pointer-events-none animate-pulse" />
                <button type="button" onClick={stopScan} aria-label="Stop scanning" className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                id="relay-paste"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="…or paste a SOT1| code (from SMS/WhatsApp)"
                className="flex-1 min-w-0 px-3 py-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-cyan-400"
              />
              <button type="button" onClick={() => accept(pasteText)} disabled={!pasteText.trim()} className="px-4 rounded-xl bg-cyan-600 text-white text-xs font-bold disabled:opacity-40">
                Carry
              </button>
            </div>
            {receiveMsg && (
              <p role="status" className={`text-xs p-3 rounded-xl ${receiveMsg.ok ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30" : "bg-red-950/40 text-red-300 border border-red-500/30"}`}>
                {receiveMsg.text}
              </p>
            )}
          </section>

          {/* CARRY & DELIVER */}
          <section className="p-5 rounded-3xl bg-surface-container border border-outline-variant/40 space-y-4" aria-labelledby="relay-carry-h">
            <div className="flex items-center justify-between gap-2">
              <h3 id="relay-carry-h" className="font-black text-on-surface flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-300" /> Carrying {carried.length} SOS
              </h3>
              <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full border ${online ? "text-emerald-300 border-emerald-500/40" : "text-amber-300 border-amber-500/40"}`}>
                {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />} {online ? "LINK UP" : "NO SIGNAL"} · {nodeTag}
              </span>
            </div>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {carried.length === 0 && <li className="text-xs text-on-surface-variant">No packets yet. Generate your own or scan a neighbour&apos;s.</li>}
              {carried.map((p) => {
                const hz = hazardMeta(p.hazard);
                return (
                  <li key={p.id} className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs flex items-center gap-3">
                    <span className="text-xl" aria-hidden>{hz.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-on-surface truncate">
                        {p.id} · {p.people} people{p.trapped ? ` · ${p.trapped} trapped` : ""}
                      </div>
                      <div className="text-on-surface-variant truncate">
                        {ageLabel(p.createdUnix)} · {p.hops} hop{p.hops === 1 ? "" : "s"}{p.path.length ? ` via ${p.path.join(" → ")}` : " · created here"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Delivery route">
              {(["QR_RELAY", "CAMP_KIOSK"] as const).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={channel === c} onClick={() => setChannel(c)} className={chip(channel === c)}>
                  {c === "QR_RELAY" ? "📶 Found signal" : "⛺ At relief camp"}
                </button>
              ))}
            </div>
            <button id="relay-deliver" type="button" onClick={deliver} disabled={delivering} className="w-full min-h-[52px] rounded-2xl font-black text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" /> {delivering ? "Delivering…" : "Deliver all carried SOS"}
            </button>
            {deliverMsg && <p role="status" className="text-xs text-on-surface-variant p-3 rounded-xl bg-black/20 border border-white/5">{deliverMsg}</p>}
            <p className="text-[10px] text-on-surface-variant flex gap-1.5">
              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
              Packets contain only location, headcount and needs — no names or phone numbers. Duplicates from many carriers are merged automatically.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
