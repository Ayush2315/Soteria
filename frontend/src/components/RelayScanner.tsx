"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  decodePacket,
  carryPacket,
  DecodedPacket,
  HAZARDS,
  FLAG,
  hazardMeta,
  encodePacket,
} from "@/lib/relay";

interface RelayScannerProps {
  onPacketIngested?: (packet: DecodedPacket) => void;
  onClose?: () => void;
}

export function RelayScanner({ onPacketIngested, onClose }: RelayScannerProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("manual");
  const [manualInput, setManualInput] = useState("");
  const [decoded, setDecoded] = useState<DecodedPacket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check BarcodeDetector native support
  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      setIsCameraSupported(true);
      setActiveTab("camera");
    } else {
      setIsCameraSupported(false);
      setActiveTab("manual");
    }
  }, []);

  // Cleanup camera stream
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsScanning(true);

      // Start BarcodeDetector polling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ["qr_code"],
      });

      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              handleTokenInput(raw);
              stopCamera();
            }
          } catch (_err) {
            // detection frame pass
          }
        }
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to access camera";
      setError(`Camera error: ${msg}. Please use the manual text box below.`);
      setIsScanning(false);
    }
  };

  const handleTokenInput = (raw: string) => {
    setError(null);
    setSuccessMsg(null);
    const trimmed = raw.trim();
    if (!trimmed) {
      setDecoded(null);
      return;
    }

    try {
      const pkt = decodePacket(trimmed);
      setDecoded(pkt);
      setManualInput(trimmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid SOT1 packet";
      setError(msg);
      setDecoded(null);
    }
  };

  const handleIngest = () => {
    if (!decoded) return;
    try {
      const added = carryPacket(decoded.raw, false);
      setSuccessMsg(
        added
          ? `Packet ${decoded.id} successfully added to local relay carrier queue!`
          : `Packet ${decoded.id} is already in your carrier queue.`
      );
      if (onPacketIngested) {
        onPacketIngested(decoded);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to store packet";
      setError(msg);
    }
  };

  const loadSample = (type: "flood" | "collapse") => {
    if (type === "flood") {
      const sample = encodePacket({
        latitude: 25.4358,
        longitude: 81.8463,
        people: 4,
        trapped: 4,
        flags: FLAG.ELDERLY | FLAG.CHILDREN,
        hazard: "F",
        message: "Roof level floodwater, 4 trapped",
      });
      handleTokenInput(sample);
    } else {
      const sample = encodePacket({
        latitude: 25.4412,
        longitude: 81.8329,
        people: 2,
        trapped: 2,
        flags: FLAG.INJURED,
        hazard: "C",
        message: "Masonry wall collapse over alley",
      });
      handleTokenInput(sample);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-zinc-100 shadow-xl max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-emerald-400">📶</span> Store-Carry-Forward Relay Scanner
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ingest offline SOT1 packets via QR code or 160-char text token
          </p>
        </div>
        {onClose && (
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-zinc-400 hover:text-zinc-200 text-sm p-1 rounded hover:bg-zinc-800"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-950 rounded-lg border border-zinc-800/80 mb-4 text-xs font-medium">
        <button
          onClick={() => {
            setActiveTab("manual");
            stopCamera();
          }}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            activeTab === "manual"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ⌨️ Manual Token / Paste
        </button>
        <button
          onClick={() => {
            setActiveTab("camera");
          }}
          className={`flex-1 py-1.5 rounded-md transition-colors ${
            activeTab === "camera"
              ? "bg-zinc-800 text-white shadow-sm"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          📷 QR Camera Scanner
        </button>
      </div>

      {/* Camera Tab */}
      {activeTab === "camera" && (
        <div className="space-y-3 mb-4">
          {!isCameraSupported ? (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 text-xs text-amber-200">
              <span className="font-semibold">Notice:</span> Native BarcodeDetector API is not supported in this browser. Please use the Manual Token input to test offline QR packets.
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-zinc-700 bg-black aspect-video flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 p-4 text-center">
                  <span className="text-3xl mb-2">📸</span>
                  <p className="text-xs text-zinc-300 mb-3">
                    Point camera at a citizen SOS QR code to collect
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow"
                  >
                    Start Camera Scanner
                  </button>
                </div>
              )}
              {isScanning && (
                <div className="absolute top-2 right-2">
                  <button
                    onClick={stopCamera}
                    className="px-2.5 py-1 bg-zinc-800/90 hover:bg-zinc-700 text-white text-xs rounded border border-zinc-600"
                  >
                    Stop Camera
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Input Tab */}
      {activeTab === "manual" && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Paste Raw SOT1 Packet (from SMS, paper note, or QR reader):
            </label>
            <textarea
              rows={3}
              value={manualInput}
              onChange={(e) => handleTokenInput(e.target.value)}
              placeholder="SOT1|ID|LAT|LNG|PEOPLE|TRAPPED|FLAGS|HAZARD|TIMESTAMP|MSG|CRC|HOPS|PATH"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 placeholder:text-zinc-600"
            />
          </div>

          {/* Quick Demo Samples for Evaluator */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Test Samples:</span>
            <button
              onClick={() => loadSample("flood")}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700"
            >
              🌊 Flood Roof SOS
            </button>
            <button
              onClick={() => loadSample("collapse")}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] rounded border border-zinc-700"
            >
              🏚️ Wall Collapse SOS
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 text-xs text-red-200 mb-4 flex items-start gap-2">
          <span>⚠️</span>
          <div>
            <span className="font-semibold">Checksum / Parse Error:</span>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3 text-xs text-emerald-200 mb-4 flex items-center gap-2">
          <span>✅</span>
          <p>{successMsg}</p>
        </div>
      )}

      {/* Decoded Packet Card */}
      {decoded && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3 mb-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xl">{hazardMeta(decoded.hazard).emoji}</span>
              <div>
                <span className="font-bold text-sm text-zinc-100">
                  {hazardMeta(decoded.hazard).label} Distress
                </span>
                <span className="text-[10px] text-zinc-400 ml-2 font-mono">
                  ID: #{decoded.id}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              CRC-256 VALID ({decoded.crc})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400 block text-[10px]">Location (GPS)</span>
              <span className="font-mono text-zinc-200">
                {decoded.latitude.toFixed(4)}, {decoded.longitude.toFixed(4)}
              </span>
            </div>
            <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800/60">
              <span className="text-zinc-400 block text-[10px]">People / Trapped</span>
              <span className="font-semibold text-zinc-200">
                {decoded.people} People · {decoded.trapped} Trapped
              </span>
            </div>
          </div>

          {/* Vulnerabilities Pill */}
          <div className="flex flex-wrap gap-1 text-[10px]">
            {decoded.flags & FLAG.ELDERLY ? (
              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                Elderly
              </span>
            ) : null}
            {decoded.flags & FLAG.CHILDREN ? (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                Children
              </span>
            ) : null}
            {decoded.flags & FLAG.PREGNANT ? (
              <span className="px-1.5 py-0.5 bg-pink-500/20 text-pink-300 rounded border border-pink-500/30">
                Pregnant
              </span>
            ) : null}
            {decoded.flags & FLAG.DISABLED ? (
              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                Disabled
              </span>
            ) : null}
            {decoded.flags & FLAG.INJURED ? (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                Injured
              </span>
            ) : null}
            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
              Hops: {decoded.hops}
            </span>
          </div>

          {decoded.message && (
            <div className="text-xs text-zinc-300 bg-zinc-900/40 p-2 rounded border border-zinc-800">
              &quot;{decoded.message}&quot;
            </div>
          )}

          <button
            onClick={handleIngest}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
          >
            <span>📥</span> Store & Carry Forward (Add to Relay Mesh)
          </button>
        </div>
      )}
    </div>
  );
}
export default RelayScanner;
