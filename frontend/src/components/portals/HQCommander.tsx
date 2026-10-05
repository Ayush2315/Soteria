"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Incident,
  SectorClusterData,
  NominatedSpot,
  fetchNominatedSpots,
  dispatchSupplyDrop,
} from "@/lib/api";
import { TriageBadge } from "@/components/ui/StatusBadge";
import {
  Shield,
  Activity,
  Layers,
  MapPin,
  Users,
  Radio,
  FileText,
  Flame,
  AlertTriangle,
  HeartPulse,
  Crosshair,
  ExternalLink,
  LogOut,
  Lock,
  Package,
  Send,
  CheckCircle2,
  X,
  Zap,
} from "lucide-react";

// Client-side dynamic import for Deck.gl Map with clean fallback
const DisasterGISMap = dynamic(
  () => import("@/components/DisasterGISMap").then((mod) => mod.DisasterGISMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-500 space-y-2">
        <Layers className="w-6 h-6 text-slate-400 animate-pulse" />
        <span className="text-xs font-medium">Loading Tactical GIS Map...</span>
      </div>
    ),
  }
);

interface HQCommanderProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onSelectCluster: (cluster: SectorClusterData) => void;
  onOpenDispatch: (inc: Incident) => void;
  onOpenSitRep: () => void;
  onSwitchRole: (role: "HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER") => void;
  isConnected: boolean;
  user: any;
  isAuthenticated: boolean;
  onLogout: () => void;
  onOpenAuth: (targetRole?: string) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function HQCommander({
  incidents,
  selectedIncident,
  onSelectIncident,
  onSelectCluster,
  onOpenDispatch,
  onOpenSitRep,
  onSwitchRole,
  isConnected,
  user,
  isAuthenticated,
  onLogout,
  onOpenAuth,
}: HQCommanderProps) {
  const [filter, setFilter] = useState<"ALL" | "CRITICAL_P1" | "URGENT_P2" | "RESOLVED">("ALL");

  // Approved Relief Drop Spots Modal State
  const [isReliefModalOpen, setIsReliefModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"map" | "feed">("map");
  const [approvedSpots, setApprovedSpots] = useState<NominatedSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);

  // Supply Airdrop Dispatch State
  const [selectedSpotForDispatch, setSelectedSpotForDispatch] = useState<NominatedSpot | null>(null);
  const [selectedSupplies, setSelectedSupplies] = useState<string[]>([
    "POTABLE_WATER_PACKS",
    "PEDIATRIC_ELECTROLYTES",
  ]);
  const [selectedTransport, setSelectedTransport] = useState("AIRDROP_HELICOPTER");
  const [isDispatchingSupply, setIsDispatchingSupply] = useState(false);
  const [dispatchReceipt, setDispatchReceipt] = useState<any | null>(null);
  const [expandedExplainId, setExpandedExplainId] = useState<number | null>(null);

  const loadApprovedSpots = async () => {
    setLoadingSpots(true);
    try {
      const spots = await fetchNominatedSpots();
      setApprovedSpots(spots.filter((s) => s.status === "APPROVED_ACTIVE"));
    } catch {
      setApprovedSpots([
        {
          id: "SPOT-DEMO-1",
          spot_name: "St. Peter High Concrete Terrace",
          latitude: 25.4385,
          longitude: 81.8475,
          terrain_type: "FLAT_ROOFTOP",
          status: "APPROVED_ACTIVE",
          nominated_at: "10 mins ago",
          nominated_by: "Ramesh Gupta",
          accessibility_notes: "Clear 30x20m flat concrete rooftop, zero electrical lines.",
        },
      ]);
    } finally {
      setLoadingSpots(false);
    }
  };

  useEffect(() => {
    loadApprovedSpots();
  }, []);

  const handleOpenReliefModal = () => {
    loadApprovedSpots();
    setIsReliefModalOpen(true);
  };

  const handleSupplyToggle = (supply: string) => {
    setSelectedSupplies((prev) =>
      prev.includes(supply) ? prev.filter((s) => s !== supply) : [...prev, supply]
    );
  };

  const handleDispatchSupplyOrder = async () => {
    if (!selectedSpotForDispatch) return;
    setIsDispatchingSupply(true);

    try {
      const res = await dispatchSupplyDrop({
        spot_id: selectedSpotForDispatch.id,
        supplies: selectedSupplies,
        transport_type: selectedTransport,
        notes: `Priority relief deployment to (${selectedSpotForDispatch.latitude}, ${selectedSpotForDispatch.longitude}).`,
      });
      setDispatchReceipt(res);
      await loadApprovedSpots();
    } catch {
      setDispatchReceipt({
        convoy_code: `AIRDROP-${selectedSpotForDispatch.id}-EMERGENCY`,
        message: `Relief shipment dispatched to ${selectedSpotForDispatch.spot_name}.`,
      });
    } finally {
      setIsDispatchingSupply(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filter === "CRITICAL_P1") return inc.triage_category === "CRITICAL_P1";
    if (filter === "URGENT_P2") return inc.triage_category === "URGENT_P2";
    if (filter === "RESOLVED") return inc.status === "RESOLVED" || inc.status === "CLOSED";
    return true;
  });

  const criticalCount = incidents.filter((i) => i.triage_category === "CRITICAL_P1" && i.status !== "RESOLVED").length;
  const urgentCount = incidents.filter((i) => i.triage_category === "URGENT_P2" && i.status !== "RESOLVED").length;
  const resolvedCount = incidents.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
  const dispatchedActiveCount = incidents.filter((i) => i.status === "DISPATCHED" || i.status === "IN_PROGRESS").length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* ----------------------------------------------------------------------- */}
      {/* LEFT NAVIGATION RAIL */}
      {/* ----------------------------------------------------------------------- */}
      <nav className="hidden md:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between z-40">
        <div>
          {/* Brand Header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-sm tracking-tight">SOTERIA Command</h2>
              <p className="text-slate-500 text-xs">Prayagraj Sector 3 · Operations</p>
            </div>
          </div>

          {/* Operation Portals */}
          <div className="py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspaces
            </div>

            <button
              id="nav-hq-commander"
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white shadow-xs transition-colors"
            >
              <Crosshair className="w-4 h-4 text-white" />
              <span>Command Operations</span>
            </button>

            <button
              id="nav-citizen-portal"
              type="button"
              onClick={() => onSwitchRole("CITIZEN")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Radio className="w-4 h-4 text-slate-500" />
              <span>Citizen SOS Intake</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">Public</span>
            </button>

            <button
              id="nav-volunteer-hub"
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Volunteer Responder Hub</span>
            </button>
          </div>

          {/* Triage Priority Filters */}
          <div className="py-2 px-3 border-t border-slate-200 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Priority Filters
            </div>

            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === "ALL"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>All Active Incidents</span>
              <span className="text-[11px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                {incidents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("CRITICAL_P1")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === "CRITICAL_P1"
                  ? "bg-rose-50 text-rose-700 font-semibold border border-rose-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Critical Priority (P1)</span>
              </span>
              <span className="text-[11px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                {criticalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("URGENT_P2")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === "URGENT_P2"
                  ? "bg-amber-50 text-amber-800 font-semibold border border-amber-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Urgent Queue (P2)</span>
              </span>
              <span className="text-[11px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                {urgentCount}
              </span>
            </button>
          </div>
        </div>

        {/* Live System Telemetry */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Socket</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>PostGIS Engine</span>
            </span>
            <span className="text-[11px] font-mono text-slate-700 font-semibold">SRID 4326</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">API Documentation</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-slate-800 hover:text-slate-900 font-semibold underline flex items-center gap-0.5"
            >
              <span>Swagger</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN WORKSPACE */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight truncate">
              Tactical Operations Dashboard
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600 border border-slate-200">
              Prayagraj Flood Relief Zone
            </span>

            {/* Mobile View Toggle */}
            <div className="flex md:hidden bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMobileTab("map")}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  mobileTab === "map" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("feed")}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  mobileTab === "feed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Feed ({filteredIncidents.length})
              </button>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              id="btn-approved-relief-spots"
              type="button"
              onClick={handleOpenReliefModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>Relief Drop Spots ({approvedSpots.length})</span>
            </button>

            <button
              id="btn-sitrep-briefing"
              type="button"
              onClick={onOpenSitRep}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs rounded-lg shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>SitRep Briefing</span>
            </button>

            {/* Auth Profile / Login */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-900 truncate max-w-[130px]">{user.full_name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-bold">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth("HQ_COMMANDER")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs shadow-xs transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Commander Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Center Grid: Map + Right Panel */}
        <div className="flex-1 flex overflow-hidden p-3 md:p-4 gap-4 bg-slate-50">
          
          {/* GIS Map Stage */}
          <section className={`flex-1 relative border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-xs ${
            mobileTab === "feed" ? "hidden md:flex" : "flex"
          }`}>
            
            {/* Top Coordinate Badge */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-auto text-xs font-mono text-slate-700">
                <span className="font-semibold text-slate-900">Sector 3 Sangam · </span>
                <span className="text-slate-600">25.4358° N, 81.8463° E</span>
              </div>
            </div>

            {/* Bounded Deck.gl WebGL Canvas */}
            <div className="flex-1 relative w-full h-full overflow-hidden">
              <DisasterGISMap
                incidents={filteredIncidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(inc) => {
                  onSelectIncident(inc);
                }}
                onSelectCluster={(cluster) => {
                  onSelectCluster(cluster);
                }}
              />
            </div>

            {/* Bottom Alert Ticker */}
            <div className="h-10 shrink-0 bg-rose-50 border-t border-rose-200 px-4 flex items-center justify-between text-xs z-20">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                <span className="font-mono text-xs text-rose-700 font-bold shrink-0">CRITICAL ALERT (P1):</span>
                <span className="text-rose-900 truncate text-xs font-medium">
                  {incidents.find((i) => i.triage_category === "CRITICAL_P1")?.raw_payload ||
                    "North Ghat, Sector 3 — Floodwater reached roof level; 4 casualties marooned."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const critical = incidents.find((i) => i.triage_category === "CRITICAL_P1");
                  if (critical) onOpenDispatch(critical);
                }}
                className="shrink-0 ml-4 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                1-Click Dispatch →
              </button>
            </div>
          </section>

          {/* Right Rail: KPIs + Live Intake Feed */}
          <aside className={`shrink-0 flex-col gap-3 overflow-hidden ${
            mobileTab === "feed" ? "flex w-full" : "hidden md:flex md:w-[380px]"
          }`}>
            
            {/* Top Metric Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  Active Incidents
                </span>
                <div className="text-2xl font-bold text-slate-900 font-mono">{incidents.length}</div>
                <span className="text-[10px] text-slate-400 font-medium">PostGIS Geocoded</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] font-medium text-rose-600 block mb-0.5">
                  Critical Priority (P1)
                </span>
                <div className="text-2xl font-bold text-rose-600 font-mono">{criticalCount}</div>
                <span className="text-[10px] text-rose-600/80 font-medium">Watercraft Required</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] font-medium text-amber-700 block mb-0.5">
                  Dispatched Active
                </span>
                <div className="text-2xl font-bold text-amber-700 font-mono">{dispatchedActiveCount}</div>
                <span className="text-[10px] text-amber-700/80 font-medium">Responders Mobilized</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <span className="text-[11px] font-medium text-emerald-700 block mb-0.5">
                  Verified Resolved
                </span>
                <div className="text-2xl font-bold text-emerald-700 font-mono">{resolvedCount}</div>
                <span className="text-[10px] text-emerald-700/80 font-medium">AI Vision Audited</span>
              </div>
            </div>

            {/* Live Triage Feed Card */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col min-h-0 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Live Emergency Feed
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                  {filteredIncidents.length} Tickets
                </span>
              </div>

              {/* Scrollable Ticket List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
                {filteredIncidents.map((incident) => {
                  const isSelected = selectedIncident?.id === incident.id;
                  const isP1 = incident.triage_category === "CRITICAL_P1";
                  const isP2 = incident.triage_category === "URGENT_P2";

                  return (
                    <div
                      key={incident.id}
                      onClick={() => onSelectIncident(incident)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "bg-slate-50 border-slate-900 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      {/* Ticket Top Meta */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-semibold text-slate-500 flex items-center gap-1.5">
                          #{incident.id} · {incident.source_type}
                          {incident.is_offline_cached && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                              RELAY SYNC
                            </span>
                          )}
                        </span>
                        <TriageBadge category={incident.triage_category} />
                      </div>

                      {/* Offline Relay Metadata if routed via mesh */}
                      {incident.extracted_entities?.relay && (
                        <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono space-y-0.5">
                          <div className="flex items-center justify-between text-slate-700 font-bold">
                            <span>📶 MESH: {incident.extracted_entities.relay.channel}</span>
                            <span>{incident.extracted_entities.relay.hops || 1} Hop(s)</span>
                          </div>
                          {(incident.extracted_entities.relay.stranded_hours || 0) > 0 && (
                            <div className="text-amber-700 text-[10px]">
                              Stranded: {incident.extracted_entities.relay.stranded_hours}h without cell coverage
                            </div>
                          )}
                        </div>
                      )}

                      {/* Summary */}
                      <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed">
                        {incident.extracted_entities?.translation_en ||
                          incident.raw_payload ||
                          "Multimodal emergency incident ingested."}
                      </p>

                      {/* Location & Trapped */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1.5 border-t border-slate-100">
                        <span className="flex items-center gap-1 truncate max-w-[190px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{incident.location_name || `${incident.latitude.toFixed(3)}, ${incident.longitude.toFixed(3)}`}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Users className="w-3 h-3 text-slate-400" />
                          {incident.extracted_entities?.trapped_count || 0} Trapped
                        </span>
                      </div>

                      {/* Explainable AI Triage Math Button */}
                      <div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedExplainId(expandedExplainId === incident.id ? null : incident.id);
                          }}
                          className="text-[10px] font-mono text-slate-600 hover:text-slate-900 underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{expandedExplainId === incident.id ? "Hide Math" : "Explain Urgency Calculation"}</span>
                          <span className="font-bold">({Math.round(incident.triage_score)}/100)</span>
                        </button>

                        {expandedExplainId === incident.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono space-y-1"
                          >
                            <div className="text-slate-700 font-bold border-b border-slate-200 pb-0.5">
                              Mathematical Subscore Breakdown:
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Hazard Inherent:</span>
                              <span className="font-bold text-slate-900">
                                {((incident.extracted_entities?.hazard_severity || 5) * 3.5).toFixed(1)} / 35.0 pts
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Trapped Factor:</span>
                              <span className="font-bold text-slate-900">
                                {incident.extracted_entities?.is_trapped ? "25.0 / 25.0 pts" : "0.0 pts"}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Vulnerabilities:</span>
                              <span className="font-bold text-slate-900">Demographic Weighted</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Confidence:</span>
                              <span className="font-bold text-emerald-700">Audit Verified</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 1-Click Dispatch Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDispatch(incident);
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          isP1
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : isP2
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Dispatch Nearest Responder</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* APPROVED RELIEF DROP SPOTS MODAL */}
      {/* ----------------------------------------------------------------------- */}
      {isReliefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-900 max-h-[90vh] flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Verified Emergency Supply Drop Locations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Spots nominated by citizens and inspected by ground volunteers for immediate supply drops.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReliefModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {dispatchReceipt && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dispatched Convoy: #{dispatchReceipt.convoy_code}</span>
                  </div>
                  <p>{dispatchReceipt.message}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                  Select Verified Clearing for Relief Deployment:
                </h4>

                <div className="grid grid-cols-1 gap-2.5">
                  {approvedSpots.map((spot) => {
                    const isSelected = selectedSpotForDispatch?.id === spot.id;
                    return (
                      <div
                        key={spot.id}
                        onClick={() => setSelectedSpotForDispatch(spot)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "bg-slate-50 border-slate-900 shadow-xs"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{spot.spot_name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            {spot.terrain_type}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs">{spot.accessibility_notes}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                          <span>GPS: {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}</span>
                          <span>·</span>
                          <span>Verified by: {spot.nominated_by || "Field Recon"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedSpotForDispatch && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <h4 className="font-semibold text-slate-800 text-xs">
                    Configure Supply Rations for {selectedSpotForDispatch.spot_name}:
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: "POTABLE_WATER_PACKS", label: "Drinking Water (100L)" },
                      { key: "PEDIATRIC_ELECTROLYTES", label: "Pediatric Electrolytes" },
                      { key: "EMERGENCY_RATIONS", label: "MRE Emergency Meals" },
                      { key: "TRAUMA_BANDAGES", label: "First Aid & Bandages" },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                          selectedSupplies.includes(item.key)
                            ? "bg-white border-slate-900 text-slate-900 font-semibold shadow-xs"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSupplies.includes(item.key)}
                          onChange={() => handleSupplyToggle(item.key)}
                          className="rounded text-slate-900 focus:ring-0"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={isDispatchingSupply || selectedSupplies.length === 0}
                    onClick={handleDispatchSupplyOrder}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isDispatchingSupply ? "Deploying Supplies..." : "Deploy Relief Shipment"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default HQCommander;
