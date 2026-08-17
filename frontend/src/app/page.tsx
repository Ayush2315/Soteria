"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { TriageBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { CitizenSOSForm } from "@/components/CitizenSOSForm";
import { LiveTriageResultCard } from "@/components/LiveTriageResultCard";
import {
  Incident,
  fetchIncidents,
  MultimodalTriageResponse,
} from "@/lib/api";
import { useIncidentWebSocket } from "@/hooks/useIncidentWebSocket";
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

  // Hook up Real-Time WebSocket state stream
  const { incidents, isConnected, latestAlert, clearLatestAlert } = useIncidentWebSocket(initialIncidents);

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

  const criticalCount = incidents.filter((i) => i.triage_category === "CRITICAL_P1").length;
  const urgentCount = incidents.filter((i) => i.triage_category === "URGENT_P2").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100 selection:bg-red-500/30">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-semibold text-[11px] transition-colors"
              >
                Inspect on 3D Map
              </button>
              <button
                type="button"
                onClick={clearLatestAlert}
                className="p-1 text-slate-400 hover:text-white"
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
              <h3 className="text-2xl font-black text-orange-400 mt-1">{urgentCount} Dispatched</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Priority rescue queue</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-blue-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">PostGIS Spatial Feed</p>
              <h3 className="text-2xl font-black text-blue-400 mt-1">{incidents.length} Ingested</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">SRID 4326 Index Active</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">WebSocket Stream</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                {isConnected ? "Live 0-Lag" : "Connecting..."}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Auto-broadcast active</p>
            </div>
            <div className={`p-3 rounded-xl ${isConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
              <Wifi className={`w-6 h-6 ${isConnected ? "animate-pulse" : ""}`} />
            </div>
          </div>
        </section>

        {/* TAB 1: COMMANDER 3D GIS & TRIAGE DASHBOARD */}
        {activeTab === "commander" && (
          <div className="space-y-6">
            
            {/* Top: Full-Width Interactive Deck.gl 3D Hexagonal GIS Map */}
            <section className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">
                    3D Hexagonal Risk Density Map (Deck.gl + CartoDB Dark Matter)
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/40 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    Live WebGL Clustering
                  </span>
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
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-700">
                              {incident.source_type}
                            </span>
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
                  {latestTriageResponse && (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/40">
                      Live Response Attached
                    </span>
                  )}
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
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Volunteer Safety Briefings & Task Hub</h2>
                    <p className="text-xs text-slate-400">Dynamic SOP briefings and AI-verified closure receipts</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-700/40">
                  Responder ID: VOL-8842
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Pre-Deployment Safety Checklist
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-emerald-500" />
                      Verify Personal Protective Equipment (PPE)
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-emerald-500" />
                      Download offline GIS map cache for assigned sector
                    </li>
                    <li className="flex items-center gap-2">
                      <input type="checkbox" className="rounded border-slate-700 text-emerald-500" />
                      Synchronize Bluetooth mesh relay peer discovery
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-400" />
                    AI-Verified Photo Closure (Closed-Loop)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload timestamped rescue verification photo to allow GenAI to audit task completion and close ticket.
                  </p>
                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                    <Camera className="w-6 h-6 mx-auto text-slate-500 mb-1" />
                    <span className="text-xs text-slate-400">Click to capture proof-of-action photo</span>
                  </div>
                </div>
              </div>

              {/* Responder's Active Assigned Incident SOP */}
              {selectedIncident && (
                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Active Assigned Mission Safety Briefing (#{selectedIncident.id} - {selectedIncident.location_name})
                  </h3>
                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-2">
                    <p className="text-amber-300 font-semibold">
                      {selectedIncident.safety_sop.urgency_summary || "Ground response active."}
                    </p>
                    <ul className="space-y-1.5 text-slate-300 mt-2">
                      {selectedIncident.safety_sop.protocol_steps?.map((step, idx) => (
                        <li key={idx} className="bg-slate-900 p-2 rounded border border-slate-800">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Milestone 3 Architecture Footer Overview */}
        <section className="glass-panel p-5 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2 font-mono">
            <span className="text-slate-300 font-bold">SOTERIA Real-Time Hexagonal GIS & WebSocket Layer (Milestone 3)</span>
            <span className="text-cyan-400">Deck.gl 3D WebGL + CartoDB Dark Matter + FastAPI WebSockets</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Streaming endpoint <code className="text-cyan-300 font-mono">ws://localhost:8000/ws/incidents</code> broadcasts all incoming emergency signals instantly to connected Commander terminals. The Deck.gl 3D HexagonLayer performs spatial density aggregation and height extrusion with zero lag.
          </p>
        </section>

      </main>
    </div>
  );
}
