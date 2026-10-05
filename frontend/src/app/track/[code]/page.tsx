"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";

interface IncidentStatusData {
  tracking_code: string;
  incident_id: number;
  status: "REPORTED" | "TRIAGED" | "DISPATCHED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  triage_category: "CRITICAL_P1" | "URGENT_P2" | "MODERATE_P3" | "LOW_P4";
  triage_score: number;
  hazard_type: string;
  location_name?: string;
  latitude: number;
  longitude: number;
  reporter_count: number;
  created_at: string;
  updated_at: string;
  assigned_volunteer?: {
    id: number;
    name: string;
    phone: string;
    skills: string[];
  } | null;
  safety_sop?: {
    urgency_summary?: string;
    protocol_steps?: string[];
    recommended_gear?: string[];
  };
  verification_data?: {
    proof_photo_url?: string;
    closure_notes?: string;
  };
}

const STAGES = [
  { key: "REPORTED", label: "Reported", desc: "Signal logged & timestamped" },
  { key: "TRIAGED", label: "Triaged", desc: "Priority evaluated & safety SOP generated" },
  { key: "DISPATCHED", label: "Dispatched", desc: "First responder unit assigned" },
  { key: "IN_PROGRESS", label: "In Progress", desc: "Rescue team en route or on site" },
  { key: "RESOLVED", label: "Resolved", desc: "All casualties safe & confirmed" },
] as const;

export default function IncidentTrackingPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const resolvedParams = typeof (params as Promise<{ code: string }>).then === "function"
    ? use(params as Promise<{ code: string }>)
    : (params as { code: string });

  const code = (resolvedParams.code || "").toUpperCase();

  const [data, setData] = useState<IncidentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchStatus = async () => {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/v1/incidents/track/${encodeURIComponent(code)}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Incident code '${code}' not found in the emergency registry.`);
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch status";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [code]);

  const getStageIndex = (status: string) => {
    if (status === "CLOSED" || status === "RESOLVED") return 4;
    if (status === "IN_PROGRESS") return 3;
    if (status === "DISPATCHED") return 2;
    if (status === "TRIAGED") return 1;
    return 0;
  };

  const currentStageIndex = data ? getStageIndex(data.status) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium"
            >
              ← Back to SOS Portal
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Incident Status
            </h1>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        {/* Tracking Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block">
                Incident Reference Code
              </span>
              <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1">
                {code}
              </h2>
            </div>
            {data && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    data.triage_category === "CRITICAL_P1"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : data.triage_category === "URGENT_P2"
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {data.triage_category.replace("_", " ")} · Score {Math.round(data.triage_score)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {data.hazard_type}
                </span>
                {data.reporter_count > 1 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    👥 {data.reporter_count} Merged Reports
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Location & Time Subheader */}
          {data && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="truncate">{data.location_name || `GPS: ${data.latitude}, ${data.longitude}`}</span>
              </div>
              <div className="flex items-center gap-2 sm:justify-end text-slate-500">
                <span>Updated:</span>
                <span className="font-medium text-slate-700">{new Date(data.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] text-slate-400">Auto-refresh every 15s</span>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-800 text-xs">
            <h3 className="font-bold text-sm mb-1">Incident Lookup Notice</h3>
            <p>{error}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-slate-600">Try demo codes:</span>
              {["SOT-DEMO1", "SOT-DEMO2", "SOT-DEMO3"].map((demo) => (
                <Link
                  key={demo}
                  href={`/track/${demo}`}
                  className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded font-mono text-xs"
                >
                  {demo}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5-Stage Stepper Card */}
        {data && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
              Rescue Lifecycle
            </h3>

            {/* Stepper Progress Bar */}
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                style={{
                  width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%`,
                }}
              />

              {/* Steps */}
              <div className="grid grid-cols-5 gap-2 relative z-10">
                {STAGES.map((stage, idx) => {
                  const isDone = idx < currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div key={stage.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        }`}
                      >
                        {isDone ? "✓" : idx + 1}
                      </div>
                      <span
                        className={`mt-2 font-semibold text-xs ${
                          isCurrent
                            ? "text-emerald-700"
                            : isDone
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.label}
                      </span>
                      <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                        {stage.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Status Highlight Box */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <span className="text-2xl">
                {currentStageIndex === 4
                  ? "🎉"
                  : currentStageIndex === 3
                  ? "🚤"
                  : currentStageIndex === 2
                  ? "🚨"
                  : "⏳"}
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Current Status: {data.status.replace("_", " ")}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {currentStageIndex === 4
                    ? "Rescue operations for this signal are complete. Ground team confirmed casualty safety."
                    : currentStageIndex === 3
                    ? "Field responders have arrived in the sector and are conducting active operations."
                    : currentStageIndex === 2
                    ? `Assigned responder unit has been dispatched to coordinates (${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}).`
                    : "Incident has been analyzed by AI triage model. Ready for nearest field unit assignment."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Safety Instructions & Assigned Responder */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety SOP */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-lg">🛡️</span>
                <h3 className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                  Safety Guidance
                </h3>
              </div>
              {data.safety_sop?.urgency_summary && (
                <p className="text-xs text-slate-800 font-medium bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                  {data.safety_sop.urgency_summary}
                </p>
              )}
              {data.safety_sop?.protocol_steps && data.safety_sop.protocol_steps.length > 0 && (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {data.safety_sop.protocol_steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-blue-600 font-semibold text-xs">▸</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Assigned Volunteer or Verification Data */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-lg">🧑‍🚒</span>
                <h3 className="font-semibold text-xs text-slate-800 tracking-wider uppercase">
                  Assigned Response Unit
                </h3>
              </div>

              {data.assigned_volunteer ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      {data.assigned_volunteer.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-medium">
                      Active Responder
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Emergency Phone: {data.assigned_volunteer.phone}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.assigned_volunteer.skills?.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] text-slate-700 rounded"
                      >
                        {sk.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center py-6">
                  <p className="text-xs text-slate-500">
                    No field unit assigned yet. Central Command HQ is mobilizing the nearest responder in this sector.
                  </p>
                </div>
              )}

              {/* Photo Proof (if resolved) */}
              {data.verification_data?.proof_photo_url && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    Closure Proof Photo:
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.verification_data.proof_photo_url}
                    alt="Closure verification proof"
                    className="w-full h-32 object-cover rounded-lg border border-slate-200"
                  />
                  {data.verification_data.closure_notes && (
                    <p className="text-xs text-slate-600 italic mt-1">
                      {data.verification_data.closure_notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        SOTERIA Emergency Response System · Public Incident Registry
      </footer>
    </div>
  );
}
