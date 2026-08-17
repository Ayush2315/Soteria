"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { TriageBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { Incident, fetchIncidents, submitIncident, SourceType } from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";
import {
  Mic,
  Camera,
  Send,
  AlertTriangle,
  Flame,
  Activity,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Shield,
  WifiOff,
  Radio,
  FileText,
  HelpCircle,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"commander" | "citizen" | "volunteer">("commander");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  // Citizen SOS Form State
  const [sosText, setSosText] = useState("");
  const [sosSource, setSosSource] = useState<SourceType>("VOICE");
  const [sosLat, setSosLat] = useState("25.4358");
  const [sosLng, setSosLng] = useState("81.8463");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineSimulated, setOfflineSimulated] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchIncidents();
        setIncidents(data);
        if (data.length > 0) {
          setSelectedIncident(data[0]);
        }
      } catch (err) {
        console.error("Failed to load incidents", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sosText.trim()) return;

    setIsSubmitting(true);
    try {
      const newIncident = await submitIncident({
        source_type: sosSource,
        raw_payload: sosText,
        latitude: parseFloat(sosLat) || 25.4358,
        longitude: parseFloat(sosLng) || 81.8463,
        location_name: "Citizen SOS Report (Live Ingest)",
        is_offline_cached: offlineSimulated,
      });

      setIncidents((prev) => [newIncident, ...prev]);
      setSelectedIncident(newIncident);
      setSosText("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error("Submit error", err);
      alert("Submission simulated locally. Backend will sync once running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const criticalCount = incidents.filter((i) => i.triage_category === "CRITICAL_P1").length;
  const urgentCount = incidents.filter((i) => i.triage_category === "URGENT_P2").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

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
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Total Distress Signals</p>
              <h3 className="text-2xl font-black text-blue-400 mt-1">{incidents.length} Ingested</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">PostGIS spatial indexed</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 border-l-indigo-500">
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Automated SitRep</p>
              <h3 className="text-2xl font-black text-indigo-400 mt-1">30 min</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">3-Bullet GenAI summary</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* TAB 1: COMMANDER GIS TRIAGE DASHBOARD */}
        {activeTab === "commander" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Real-time Prioritized Incidents Feed */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Live Multimodal Triage Queue
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time ranking by composite AI urgency score (0-100) & vulnerability weighting
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/40">
                  Auto-sync active
                </span>
              </div>

              <div className="space-y-3">
                {incidents.map((incident) => {
                  const isSelected = selectedIncident?.id === incident.id;
                  return (
                    <div
                      key={incident.id}
                      onClick={() => setSelectedIncident(incident)}
                      className={`glass-panel p-4 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? "border-blue-500 bg-slate-800/80 shadow-lg shadow-blue-500/10"
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

            {/* Right: Detailed Dossier & Dynamic Safety SOP */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                AI Triage Dossier & Safety SOP
              </h2>

              {selectedIncident ? (
                <div className="glass-panel p-5 rounded-xl space-y-5 border border-indigo-500/30">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-slate-400">INCIDENT ID #{selectedIncident.id}</span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {selectedIncident.location_name}
                      </h3>
                    </div>
                    <TriageBadge category={selectedIncident.triage_category} score={selectedIncident.triage_score} />
                  </div>

                  {/* Geospatial info */}
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>PostGIS Coordinates:</span>
                      <span className="font-mono text-cyan-300">
                        {selectedIncident.latitude.toFixed(6)}, {selectedIncident.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Spatial Projection:</span>
                      <span className="font-mono text-slate-300">EPSG:4326 (WGS 84)</span>
                    </div>
                  </div>

                  {/* Extracted Entities */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Multimodal Extraction Entities
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Trapped Count</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {selectedIncident.extracted_entities.trapped_count ?? "None"}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-slate-400">Dialect / Lang</span>
                        <p className="text-sm font-bold text-white mt-0.5">
                          {selectedIncident.extracted_entities.detected_language || "English"}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <span className="text-slate-400">Medical Needs:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedIncident.extracted_entities.medical_needs?.map((need, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/40 text-[11px]">
                            {need}
                          </span>
                        )) || <span className="text-slate-400">None specified</span>}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Volunteer Safety SOP */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Dynamic Safety Briefing (SOP)
                    </h4>
                    <div className="p-3 bg-amber-500/5 rounded-lg border border-amber-500/20 text-xs space-y-2">
                      <p className="text-amber-200 font-medium">
                        {selectedIncident.safety_sop.urgency_summary || "Standard caution advised."}
                      </p>
                      <div>
                        <span className="text-slate-400 font-semibold">Recommended Gear:</span>
                        <ul className="list-disc list-inside text-slate-300 mt-1 space-y-0.5">
                          {selectedIncident.safety_sop.recommended_gear?.map((gear, idx) => (
                            <li key={idx}>{gear}</li>
                          )) || <li>Standard responder equipment</li>}
                        </ul>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Protocol Steps:</span>
                        <ul className="space-y-1 text-slate-300 mt-1">
                          {selectedIncident.safety_sop.protocol_steps?.map((step, idx) => (
                            <li key={idx} className="bg-slate-900/80 p-1.5 rounded text-[11px] border border-slate-800">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass-panel p-8 rounded-xl text-center text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
                  <p>Select an incident from the triage feed to view AI extraction and SOP.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: CITIZEN OFFLINE-FIRST SOS (PWA) SIMULATOR */}
        {activeTab === "citizen" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/40">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Citizen SOS Portal</h2>
                    <p className="text-xs text-slate-400">Offline-capable emergency distress signal intake</p>
                  </div>
                </div>
                
                {/* Offline toggle simulator */}
                <button
                  type="button"
                  onClick={() => setOfflineSimulated(!offlineSimulated)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                    offlineSimulated
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                  }`}
                >
                  {offlineSimulated ? (
                    <>
                      <WifiOff className="w-3.5 h-3.5" /> Network: Dead Zone (Cached)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Network: Online
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSosSubmit} className="mt-5 space-y-4">
                {/* Input Modality Selectors */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Select Distress Modality
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSosSource("VOICE")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        sosSource === "VOICE"
                          ? "bg-blue-600/30 text-blue-300 border-blue-500 shadow-sm"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <Mic className="w-4 h-4 text-blue-400" />
                      Voice Note
                    </button>
                    <button
                      type="button"
                      onClick={() => setSosSource("IMAGE")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        sosSource === "IMAGE"
                          ? "bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-sm"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <Camera className="w-4 h-4 text-indigo-400" />
                      Photo SOS
                    </button>
                    <button
                      type="button"
                      onClick={() => setSosSource("TEXT")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                        sosSource === "TEXT"
                          ? "bg-cyan-600/30 text-cyan-300 border-cyan-500 shadow-sm"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Text SOS
                    </button>
                  </div>
                </div>

                {/* Distress text / transcript input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Emergency Details / Voice Transcript
                  </label>
                  <textarea
                    rows={4}
                    value={sosText}
                    onChange={(e) => setSosText(e.target.value)}
                    placeholder="E.g., 3 people trapped on rooftop due to rising flood water, elderly woman needs insulin..."
                    className="w-full rounded-xl bg-slate-900/90 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">GPS Latitude</label>
                    <input
                      type="text"
                      value={sosLat}
                      onChange={(e) => setSosLat(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">GPS Longitude</label>
                    <input
                      type="text"
                      value={sosLng}
                      onChange={(e) => setSosLng(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Transmitting Distress Signal..." : "Transmit Emergency SOS"}
                </button>

                {submitSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Distress signal ingested, triaged by AI heuristic, and stored in PostGIS.</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: VOLUNTEER HAZARD SOP & CLOSED-LOOP HUB */}
        {activeTab === "volunteer" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
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
            </div>
          </div>
        )}

        {/* Milestone 1 Architecture Footer Overview */}
        <section className="glass-panel p-5 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2 font-mono">
            <span className="text-slate-300 font-bold">SOTERIA Core Architecture (Milestone 1)</span>
            <span className="text-emerald-400">PostGIS + FastAPI (asyncpg) + Next.js 14 App Router</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            All services containerized via Docker Compose. Geometries stored with SRID 4326 PostGIS extension. Async database initialization ensures high-throughput ingestion of disaster voice and photo signals.
          </p>
        </section>

      </main>
    </div>
  );
}
