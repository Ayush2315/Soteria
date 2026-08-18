"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { TriageBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { CitizenSOSForm } from "@/components/CitizenSOSForm";
import { LiveTriageResultCard } from "@/components/LiveTriageResultCard";
import { OfflineBanner } from "@/components/OfflineBanner";
import { VolunteerDispatchDrawer } from "@/components/VolunteerDispatchDrawer";
import { VolunteerVerificationCard } from "@/components/VolunteerVerificationCard";
import { SitRepModal } from "@/components/SitRepModal";
import {
  Incident,
  fetchIncidents,
  MultimodalTriageResponse,
  DispatchAssignResponse,
  RescueVerificationResponse,
} from "@/lib/api";
import { useIncidentWebSocket } from "@/hooks/useIncidentWebSocket";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { formatTimestamp } from "@/lib/utils";
import {
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  MapPin,
  Clock,
  Users,
  Shield,
  WifiOff,
  FileText,
  Camera,
  Sparkles,
  Radio,
  Wifi,
  X,
  Volume2,
  Send,
  Navigation,
} from "lucide-react";

// Client-side dynamic import for Deck.gl WebGL Map to prevent SSR canvas issues
const DisasterGISMap = dynamic(
  () => import("@/components/DisasterGISMap").then((mod) => mod.DisasterGISMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <Layers className="w-8 h-8 text-indigo-500 animate-pulse" />
        <span className="text-xs font-mono">Initializing Deck.gl 3D WebGL Spatial Engine...</span>
      </div>
    ),
  }
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<"commander" | "citizen" | "volunteer">("commander");
  const [initialIncidents, setInitialIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [latestTriageResponse, setLatestTriageResponse] = useState<MultimodalTriageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers State
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isSitRepOpen, setIsSitRepOpen] = useState(false);

  // Hook up Real-Time WebSocket state stream
  const { incidents, setIncidents, isConnected, latestAlert, clearLatestAlert } =
    useIncidentWebSocket(initialIncidents);

  // Hook up Offline-First IndexedDB synchronization
  const {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    syncNow,
  } = useOfflineSync({
    onSyncComplete: (synced) => {
      if (synced.length > 0) {
        const newIncidents = synced.map((s) => s.incident);
        setIncidents((prev) => [...newIncidents, ...prev.filter((p) => !newIncidents.some((n) => n.id === p.id))]);
      }
    },
  });

  // Load initial incidents from backend via REST API
  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchIncidents();
        setInitialIncidents(data);
        if (data.length > 0) {
          setSelectedIncident(data[0]);
        }
      } catch (err) {
        console.error("Failed to load initial incidents", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update selected incident if none selected or incoming P1
  useEffect(() => {
    if (!selectedIncident && incidents.length > 0) {
      setSelectedIncident(incidents[0]);
    }
  }, [incidents, selectedIncident]);

  // Handle incoming live multimodal triage response from CitizenSOSForm
  const handleTriageComplete = (response: MultimodalTriageResponse) => {
    setLatestTriageResponse(response);
    setSelectedIncident(response.incident);
  };

  // Handle dispatch completion callback
  const handleDispatchComplete = (response: DispatchAssignResponse) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === response.incident_id
          ? {
              ...item,
              status: "DISPATCHED",
              assigned_volunteer_id: response.volunteer.id,
            }
          : item
      )
    );
    if (selectedIncident?.id === response.incident_id) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              status: "DISPATCHED",
              assigned_volunteer_id: response.volunteer.id,
            }
          : null
      );
    }
  };

  // Handle volunteer AI photo verification completion
  const handleVerificationComplete = (response: RescueVerificationResponse) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === response.incident_id
          ? {
              ...item,
              status: "RESOLVED",
              verification_data: {
                is_verified: response.audit_result.is_verified,
                confidence_score: response.audit_result.confidence_score,
                visual_observations: response.audit_result.visual_observations,
                hazard_clearance_status: response.audit_result.hazard_clearance_status,
                closure_summary: response.audit_result.closure_summary,
                proof_photo_url: response.proof_photo_url || undefined,
                closure_notes: response.closure_notes || undefined,
                resolved_at: response.resolved_at,
              },
            }
          : item
      )
    );
    if (selectedIncident?.id === response.incident_id) {
      setSelectedIncident((prev) =>
        prev
          ? {
              ...prev,
              status: "RESOLVED",
            }
          : null
      );
    }
  };

  const criticalCount = incidents.filter((i) => i.triage_category === "CRITICAL_P1" && i.status !== "RESOLVED").length;
  const urgentCount = incidents.filter((i) => i.triage_category === "URGENT_P2" && i.status !== "RESOLVED").length;
  const resolvedCount = incidents.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100 selection:bg-red-500/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Offline Sync Banner Indicator */}
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        lastSyncResult={lastSyncResult}
        onSyncNow={syncNow}
      />

      {/* Real-time WebSocket Alert Banner Toast */}
      {latestAlert && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-b border-red-500/40 px-4 py-2.5 shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-red-600 text-white animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
              </span>
              <span className="font-bold text-red-300 font-mono uppercase">
                Incoming {latestAlert.incident.triage_category} SOS:
              </span>
              <span className="text-slate-200 truncate max-w-md">
                {latestAlert.incident.location_name} — {latestAlert.incident.raw_payload}
              </span>
              <span className="font-black text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                Score: {latestAlert.incident.triage_score.toFixed(1)}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedIncident(latestAlert.incident);
                  setActiveTab("commander");
                  clearLatestAlert();
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-semibold text-[11px] transition-colors cursor-pointer"
              >
                Inspect on 3D Map
              </button>
              <button
                type="button"
                onClick={clearLatestAlert}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Real-time Status Metric Ribbons */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-red-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">P1 Critical Triage</p>
              <h3 className="text-2xl font-black text-red-400 mt-1">{criticalCount} Active</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Life-threatening immediate</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-orange-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">P2 Urgent Triage</p>
              <h3 className="text-2xl font-black text-orange-400 mt-1">{urgentCount} Pending</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Priority rescue queue</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">AI Verified Closed</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{resolvedCount} Resolved</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Vision Audit Verified</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">WebSocket Stream</p>
              <h3 className="text-2xl font-black text-blue-400 mt-1 flex items-center gap-1.5">
                {isConnected ? "Live 0-Lag" : "Connecting..."}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">SRID 4326 GIS Active</p>
            </div>
            <div className={`p-3 rounded-xl ${isConnected ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
              <Wifi className={`w-6 h-6 ${isConnected ? "animate-pulse" : ""}`} />
            </div>
          </div>
        </section>

        {/* TAB 1: COMMANDER 3D GIS & TRIAGE DASHBOARD */}
        {activeTab === "commander" && (
          <div className="space-y-6">
            
            {/* Top: Full-Width Interactive Deck.gl 3D Hexagonal GIS Map with Operational Action Bar */}
            <section className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">
                    3D Hexagonal Risk Density Map (Deck.gl + CartoDB Dark Matter)
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* SitRep Synthesis Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsSitRepOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-bold shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-cyan-400" />
                    30-Min SitRep Briefing
                  </button>

                  {/* Proximity Dispatch Button for Selected Incident */}
                  {selectedIncident && (
                    <button
                      type="button"
                      onClick={() => setIsDispatchOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4" />
                      Dispatch Responder (#{selectedIncident.id})
                    </button>
                  )}
                </div>
              </div>

              {/* Render 3D Deck.gl Map */}
              <DisasterGISMap
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(incident) => {
                  setSelectedIncident(incident);
                  setLatestTriageResponse(null);
                }}
              />
            </section>

            {/* Bottom Grid: Live Prioritized Queue (Left) & AI Dossier / Safety SOP (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Real-time Prioritized Incidents Feed */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-400" />
                      Prioritized Multimodal Triage Queue
                    </h2>
                    <p className="text-xs text-slate-400">
                      Real-time stream sorted by deterministic 0-100 urgency score
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {incidents.length} Records
                  </span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {incidents.map((incident) => {
                    const isSelected = selectedIncident?.id === incident.id;
                    return (
                      <div
                        key={incident.id}
                        onClick={() => {
                          setSelectedIncident(incident);
                          if (latestTriageResponse && latestTriageResponse.incident.id !== incident.id) {
                            setLatestTriageResponse(null);
                          }
                        }}
                        className={`glass-panel p-4 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? "border-blue-500 bg-slate-800/90 shadow-lg shadow-blue-500/10"
                            : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <TriageBadge category={incident.triage_category} score={incident.triage_score} />
                              <IncidentStatusBadge status={incident.status} />
                              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(incident.created_at)}
                              </span>
                              {incident.is_offline_cached && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                                  <WifiOff className="w-2.5 h-2.5" /> OFFLINE QUEUE
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-200 font-medium line-clamp-2 mt-2">
                              {incident.raw_payload || "Multimodal payload received"}
                            </p>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-700">
                              {incident.source_type}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedIncident(incident);
                                setIsDispatchOpen(true);
                              }}
                              className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 hover:bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/40 transition-colors"
                            >
                              Dispatch →
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            {incident.location_name || `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                          </span>
                          <div className="flex items-center gap-3">
                            {incident.extracted_entities.trapped_count ? (
                              <span className="text-red-400 font-semibold flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {incident.extracted_entities.trapped_count} Trapped
                              </span>
                            ) : null}
                            <span className="text-indigo-300 font-mono">
                              Conf: {((incident.extracted_entities.confidence_score || 0.95) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Detailed Dossier & Dynamic Safety SOP via LiveTriageResultCard */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    AI Triage Dossier & Ground Safety SOP
                  </h2>
                  <div className="flex items-center gap-2">
                    {selectedIncident && (
                      <button
                        type="button"
                        onClick={() => setIsDispatchOpen(true)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Dispatch Nearby Volunteer
                      </button>
                    )}
                  </div>
                </div>

                <LiveTriageResultCard
                  triageData={latestTriageResponse}
                  incidentFallback={selectedIncident}
                />
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: CITIZEN MULTIMODAL SOS PORTAL & LIVE AI TRIAGE */}
        {activeTab === "citizen" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <CitizenSOSForm onTriageComplete={handleTriageComplete} />
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Instant GenAI Multimodal Extraction
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Dialect Translation + 0-100 Score
                </span>
              </div>

              <LiveTriageResultCard
                triageData={latestTriageResponse}
                incidentFallback={selectedIncident}
              />
            </div>
          </div>
        )}

        {/* TAB 3: VOLUNTEER HAZARD SOP & CLOSED-LOOP HUB */}
        {activeTab === "volunteer" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Active Incident SOP & Mission Selector */}
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Volunteer Safety Briefings & Task Hub</h2>
                    <p className="text-xs text-slate-400">PostGIS proximity assignments, dynamic SOPs, and AI photo closure</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-700/40">
                    Responder ID: VOL-8842 (Capt. Rajesh Verma)
                  </span>
                </div>
              </div>

              {/* Active Incident Selector for Field Volunteer */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Select Assigned Rescue Incident:
                </label>
                <select
                  value={selectedIncident?.id || ""}
                  onChange={(e) => {
                    const found = incidents.find((i) => i.id === parseInt(e.target.value));
                    if (found) setSelectedIncident(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      #{inc.id} — [{inc.triage_category}] {inc.location_name || "Unknown Location"} ({inc.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Assigned Incident SOP Briefing */}
              {selectedIncident && (
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Assigned Mission Safety SOP (#{selectedIncident.id} - {selectedIncident.location_name})
                    </h3>
                    <IncidentStatusBadge status={selectedIncident.status} />
                  </div>

                  <p className="text-amber-300 font-semibold leading-relaxed">
                    {selectedIncident.safety_sop.urgency_summary || "Ground response active."}
                  </p>

                  {selectedIncident.safety_sop.protocol_steps && (
                    <ul className="space-y-1.5 text-slate-300">
                      {selectedIncident.safety_sop.protocol_steps.map((step, idx) => (
                        <li key={idx} className="bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
                          {step}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* AI Closed-Loop Verification Card */}
            <VolunteerVerificationCard
              incident={selectedIncident}
              volunteerId={1}
              onVerified={handleVerificationComplete}
            />
          </div>
        )}

        {/* Milestone 4 Architecture Footer Overview */}
        <section className="glass-panel p-5 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2 font-mono">
            <span className="text-slate-300 font-bold">SOTERIA Milestone 4: Offline PWA, Spatial Dispatch & AI Closed-Loop</span>
            <span className="text-emerald-400">IndexedDB Sync + PostGIS ST_Distance + Gemini Vision Verification</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Offline PWA client queues multimodal distress signals locally in IndexedDB and burst-syncs upon cell tower reconnection. PostGIS evaluates geodesic nearest responders for 1-click dispatch with AI Safety SOPs, and Google GenAI Vision verifies post-rescue photo proof to safely close emergency tickets.
          </p>
        </section>

      </main>

      {/* Volunteer Dispatch Drawer Component */}
      <VolunteerDispatchDrawer
        incident={selectedIncident}
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onDispatchComplete={handleDispatchComplete}
      />

      {/* SitRep Synthesis Modal Component */}
      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={() => setIsSitRepOpen(false)}
      />
    </div>
  );
}
