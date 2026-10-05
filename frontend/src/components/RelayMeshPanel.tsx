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
      setDeliverMsg(`📦 Saved on device (${e.message}). Packets stay safely stored — keep moving toward a relief camp or signal.`);
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
          ? `Now carrying SOS ${pkt.id} (${pkt.people} people, ${hazardMeta(pkt.hazard).label}). It will auto-deliver when connection is restored.`
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
    `px-3 py-2 min-h-[44px] rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
      active
        ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm"
        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
    }`;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Hero explanation */}
      <section className="relative overflow-hidden p-5 md:p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Radio className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base md:text-lg font-bold text-slate-900">Offline Store-Carry-Forward Mesh</h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              When cell towers are down, SOTERIA compresses your distress report into an ultra-compact 160-character code.
              Volunteers and neighbours carry it phone-to-phone until reaching a relief station or signal.
            </p>
          </div>
        </div>
        <ol className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            { icon: Wifi, t: "1. Cellular Data", d: "Transmits instantly when online" },
            { icon: MessageSquare, t: "2. 2G SMS", d: "160-character single message" },
            { icon: Smartphone, t: "3. QR Relay", d: "Scanned and carried by neighbors" },
            { icon: Tent, t: "4. Relief Kiosk", d: "Automatic sync at camp Wi-Fi" },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <Icon className="w-4 h-4 text-indigo-600" />
              <div className="font-semibold text-slate-900">{t}</div>
              <div className="text-slate-500 text-[11px] leading-snug">{d}</div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* CREATE */}
        <section className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm" aria-labelledby="relay-create-h">
          <h3 id="relay-create-h" className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-600" /> Create Offline SOS Code
          </h3>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Emergency Type</div>
            <div className="grid grid-cols-3 gap-2">
              {HAZARDS.map((h) => (
                <button key={h.code} type="button" id={`relay-hazard-${h.code}`} onClick={() => setHazard(h.code)} className={chip(hazard === h.code)} aria-pressed={hazard === h.code}>
                  <span className="mr-1" aria-hidden>{h.emoji}</span>
                  {h.label}
                  <span className="block text-[10px] text-slate-400 font-normal">{h.labelHi}</span>
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
                <label htmlFor={id} className="text-xs font-semibold text-slate-700">{label}</label>
                <div className="mt-1 flex items-center rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <button type="button" aria-label={`decrease ${label}`} onClick={() => set(Math.max(min, val - 1))} className="w-11 h-11 text-lg font-bold hover:bg-slate-200 cursor-pointer">−</button>
                  <input id={id} type="number" min={min} value={val} onChange={(e) => set(Math.max(min, parseInt(e.target.value) || min))} className="flex-1 w-full min-w-0 bg-transparent text-center font-bold text-slate-900 outline-none" />
                  <button type="button" aria-label={`increase ${label}`} onClick={() => set(val + 1)} className="w-11 h-11 text-lg font-bold hover:bg-slate-200 cursor-pointer">+</button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Who is with you?</div>
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
            <label htmlFor="relay-msg" className="text-xs font-semibold text-slate-700">Short Message</label>
            <input id="relay-msg" maxLength={80} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-500" />
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
            <span>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</span>
            <button type="button" onClick={useGps} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-blue-600 font-medium cursor-pointer">
              <Crosshair className="w-3.5 h-3.5" /> Use GPS
            </button>
          </div>

          <button id="relay-generate" type="button" onClick={generate} className="w-full min-h-[48px] rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer text-xs uppercase tracking-wider">
            Generate Offline SOS Code
          </button>

          {packet && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {qrUrl && <img src={qrUrl} alt="SOS relay QR code" className="w-36 h-36 rounded-lg bg-white p-1 border border-slate-200" />}
                <div className="flex-1 space-y-2 w-full">
                  <p className="text-xs text-slate-600">Show this QR to passersby or responders to carry your SOS.</p>
                  <code className="block text-[11px] font-mono break-all p-2 rounded-lg bg-white border border-slate-200 text-slate-800">{packet}</code>
                  <div className="text-[11px] text-slate-500">{packet.length}/160 chars · Single SMS compliant</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a id="relay-sms" href={smsLink(SMS_GATEWAY, packet)} className="min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  <MessageSquare className="w-4 h-4" /> Send by SMS
                </a>
                <button type="button" onClick={copy} className="min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />} {copied ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* RECEIVE */}
          <section className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm" aria-labelledby="relay-recv-h">
            <h3 id="relay-recv-h" className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-blue-600" /> Carry Another Person&apos;s SOS
            </h3>
            {!scanOpen ? (
              <button id="relay-scan" type="button" onClick={startScan} className="w-full min-h-[48px] rounded-xl font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 flex items-center justify-center gap-2 cursor-pointer text-xs">
                <ScanLine className="w-5 h-5" /> Scan SOS QR with Camera
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-blue-400">
                <video ref={videoRef} className="w-full aspect-video object-cover bg-black" muted playsInline />
                <div className="absolute inset-8 border-2 border-blue-400 rounded-xl pointer-events-none animate-pulse" />
                <button type="button" onClick={stopScan} aria-label="Stop scanning" className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                id="relay-paste"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="…or paste SOT1| code"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />
              <button type="button" onClick={() => accept(pasteText)} disabled={!pasteText.trim()} className="px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer">
                Carry
              </button>
            </div>
            {receiveMsg && (
              <p role="status" className={`text-xs p-3 rounded-xl ${receiveMsg.ok ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                {receiveMsg.text}
              </p>
            )}
          </section>

          {/* CARRY & DELIVER */}
          <section className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm" aria-labelledby="relay-carry-h">
            <div className="flex items-center justify-between gap-2">
              <h3 id="relay-carry-h" className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> Carrying {carried.length} SOS Packets
              </h3>
              <span className={`flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full border ${online ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-amber-800 bg-amber-50 border-amber-200"}`}>
                {online ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />} {online ? "Online" : "No Signal"} · {nodeTag}
              </span>
            </div>

            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {carried.length === 0 && <li className="text-xs text-slate-500 p-2">No packets currently stored on this device.</li>}
              {carried.map((p) => {
                const hz = hazardMeta(p.hazard);
                return (
                  <li key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-3">
                    <span className="text-xl" aria-hidden>{hz.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">
                        {p.id} · {p.people} people{p.trapped ? ` · ${p.trapped} trapped` : ""}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        {ageLabel(p.createdUnix)} · {p.hops} hop{p.hops === 1 ? "" : "s"}{p.path.length ? ` via ${p.path.join(" → ")}` : " · local"}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Delivery route">
              {(["QR_RELAY", "CAMP_KIOSK"] as const).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={channel === c} onClick={() => setChannel(c)} className={chip(channel === c)}>
                  {c === "QR_RELAY" ? "📶 Mobile Signal" : "⛺ Relief Camp Kiosk"}
                </button>
              ))}
            </div>
            <button id="relay-deliver" type="button" onClick={deliver} disabled={delivering} className="w-full min-h-[48px] rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs">
              <Upload className="w-4 h-4" /> {delivering ? "Transmitting…" : "Upload All Carried SOS Packets"}
            </button>
            {deliverMsg && <p role="status" className="text-xs text-slate-700 p-3 rounded-xl bg-slate-50 border border-slate-200">{deliverMsg}</p>}
            <p className="text-[11px] text-slate-500 flex gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              Packets contain only location and triage needs. Redundant reports are merged automatically by the server.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
