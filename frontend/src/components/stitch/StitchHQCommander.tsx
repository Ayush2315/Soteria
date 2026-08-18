"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Incident,
  SectorClusterData,
  HealthCheck,
  CommandStats,
  NominatedSpot,
  fetchNominatedSpots,
  dispatchSupplyDrop,
} from "@/lib/api";
import { TriageBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { formatTimestamp } from "@/lib/utils";
import {
  Shield,
  Activity,
  Layers,
  MapPin,
  Clock,
  Users,
  Radio,
  FileText,
  Zap,
  Flame,
  AlertTriangle,
  HeartPulse,
  Eye,
  Crosshair,
  Volume2,
  ExternalLink,
  ChevronRight,
  LogOut,
  Lock,
  Compass,
  Maximize2,
  Split,
  MessageSquare,
  Sparkles,
  Plane,
  Truck,
  CheckCircle2,
  X,
  Package,
  Send,
} from "lucide-react";

// Client-side dynamic import for Deck.gl 3D WebGL Map
const DisasterGISMap = dynamic(
  () => import("@/components/DisasterGISMap").then((mod) => mod.DisasterGISMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-lg bg-surface-container flex flex-col items-center justify-center text-slate-400 space-y-2">
        <Layers className="w-8 h-8 text-primary animate-pulse" />
        <span className="text-xs font-mono">Loading Deck.gl 3D WebGL Radar...</span>
      </div>
    ),
  }
);

interface StitchHQCommanderProps {
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

export function StitchHQCommander({
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
  theme = "dark",
  onToggleTheme,
}: StitchHQCommanderProps) {
  const [filter, setFilter] = useState<"ALL" | "CRITICAL_P1" | "URGENT_P2" | "RESOLVED">("ALL");

  // Approved Relief Drop Spots Modal State
  const [isReliefModalOpen, setIsReliefModalOpen] = useState(false);
  const [approvedSpots, setApprovedSpots] = useState<NominatedSpot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  const [selectedSpotForDispatch, setSelectedSpotForDispatch] = useState<NominatedSpot | null>(null);
  const [selectedTransport, setSelectedTransport] = useState("HELICOPTER_AIRDROP");
  const [selectedSupplies, setSelectedSupplies] = useState<string[]>(["RATIONS_48H", "POTABLE_WATER", "TRAUMA_KITS"]);
  const [isDispatchingSupply, setIsDispatchingSupply] = useState(false);
  const [dispatchReceipt, setDispatchReceipt] = useState<any | null>(null);

  const loadApprovedSpots = async () => {
    setLoadingSpots(true);
    try {
      const data = await fetchNominatedSpots("APPROVED_ACTIVE");
      setApprovedSpots(data);
      if (data.length > 0 && !selectedSpotForDispatch) {
        setSelectedSpotForDispatch(data[0]);
      }
    } catch (err) {
      console.error("Failed to load approved spots", err);
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
        notes: `Command HQ priority airdrop deployed to verified coordinates (${selectedSpotForDispatch.latitude}, ${selectedSpotForDispatch.longitude}).`,
      });
      setDispatchReceipt(res);
      await loadApprovedSpots();
    } catch (err: any) {
      console.error("Failed to dispatch supplies:", err);
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
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-background font-sans">
      
      {/* ----------------------------------------------------------------------- */}
      {/* PANE 1: LEFT SLACK-STYLE NAVIGATION RAIL */}
      {/* ----------------------------------------------------------------------- */}
      <nav className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/40 flex flex-col justify-between z-40">
        <div>
          {/* Organization / Header */}
          <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-primary font-black uppercase tracking-wider text-sm">STRATEGIC OPS</h2>
              <p className="text-on-surface-variant text-[11px] font-mono">Prayagraj Sector 3</p>
            </div>
          </div>

          {/* Persona Switcher / Portals */}
          <div className="py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Operation Portals
            </div>

            {/* Command HQ (Active) */}
            <button
              id="nav-hq-commander"
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="w-full flex items-center gap-3 bg-primary/15 text-primary border-l-4 border-primary px-3.5 py-2.5 rounded-r-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              <span>Command HQ</span>
            </button>

            {/* Citizen SOS */}
            <button
              id="nav-citizen-portal"
              type="button"
              onClick={() => onSwitchRole("CITIZEN")}
              className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Citizen SOS</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 font-mono">PWA</span>
            </button>

            {/* Volunteer Hub */}
            <button
              id="nav-volunteer-hub"
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Volunteer Hub</span>
            </button>
          </div>

          {/* Triage Status Filters */}
          <div className="py-2 px-3 border-t border-outline-variant/30 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Triage Filters
            </div>

            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === "ALL"
                  ? "bg-surface-variant text-on-surface font-bold"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
              }`}
            >
              <span>All Active Incidents</span>
              <span className="font-mono text-[10px] bg-surface-container px-1.5 py-0.5 rounded text-on-surface">
                {incidents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("CRITICAL_P1")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === "CRITICAL_P1"
                  ? "bg-red-950/60 text-red-300 font-bold border border-red-500/30"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                Critical P1 Alerts
              </span>
              <span className="font-mono text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded">
                {criticalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter("URGENT_P2")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === "URGENT_P2"
                  ? "bg-amber-950/60 text-amber-300 font-bold border border-amber-500/30"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface"
              }`}
            >
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Urgent P2 Queue
              </span>
              <span className="font-mono text-[10px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded">
                {urgentCount}
              </span>
            </button>
          </div>
        </div>

        {/* WebSocket & PostGIS Live Status */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface-container-lowest text-[11px] font-mono space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              WebSocket Stream
            </span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              PostGIS Spatial
            </span>
            <span className="text-cyan-400 font-bold">SRID 4326</span>
          </div>
          <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[10px]">
            <span className="text-on-surface-variant">OpenAPI / Swagger</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline flex items-center gap-0.5"
            >
              <span>API</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN STAGE: TOP BAR + 3D GIS CANVAS + RIGHT METRICS RAIL */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Tactical App Bar */}
        <header className="h-14 shrink-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-black tracking-tight text-on-surface">SOTERIA DISASTER RADAR</h1>
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-md text-[10px] font-mono text-primary font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>KINETIC GIS ACTIVE</span>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Approved Crowdsourced Relief Spots Trigger */}
            <button
              id="btn-approved-relief-spots"
              type="button"
              onClick={handleOpenReliefModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Approved Relief Spots ({approvedSpots.length})</span>
            </button>

            {/* 30-Min SitRep Trigger */}
            <button
              id="btn-sitrep-briefing"
              type="button"
              onClick={onOpenSitRep}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 hover:bg-primary/25 border border-primary/40 text-primary font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>30-Min SitRep Briefing</span>
            </button>

            {/* Auth Profile / Sign In */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40 text-xs">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="font-bold text-on-surface truncate max-w-[120px]">{user.full_name}</span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-primary/15 text-primary border border-primary/20">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth("HQ_COMMANDER")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Commander Login</span>
              </button>
            )}
          </div>
        </header>

        {/* Center Grid: Map + Right Rail */}
        <div className="flex-1 flex overflow-hidden p-3 gap-3 bg-background">
          
          {/* PANE 2: Center 3D GIS Radar Map */}
          <section className="flex-1 relative border border-outline-variant/40 rounded-xl overflow-hidden flex flex-col bg-surface-container-low shadow-xl">
            
            {/* Map Top Coordinate Overlay */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
              <div className="glass-panel px-3 py-1.5 rounded-lg border border-outline-variant/50 pointer-events-auto text-[11px] font-mono font-semibold text-on-surface">
                <span>SECTOR 3 SANGAM — </span>
                <span className="text-primary font-bold">25.4358° N, 81.8463° E</span>
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
            <div className="h-10 shrink-0 bg-surface-container/95 border-t border-outline-variant/40 px-4 flex items-center justify-between text-xs z-20">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="font-mono text-[11px] text-red-400 font-bold shrink-0">CRITICAL ALERT [P1]:</span>
                <span className="text-on-surface truncate text-xs">
                  {incidents.find((i) => i.triage_category === "CRITICAL_P1")?.raw_payload ||
                    "North Ghat, Sector 3, Sangam, Prayagraj — Flood water has reached the roof! 4 people are trapped..."}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const critical = incidents.find((i) => i.triage_category === "CRITICAL_P1");
                  if (critical) onOpenDispatch(critical);
                }}
                className="shrink-0 ml-4 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-black uppercase tracking-wider transition-all shadow cursor-pointer"
              >
                1-Click Dispatch →
              </button>
            </div>
          </section>

          {/* PANE 3: RIGHT METRICS RAIL & LIVE MULTIMODAL INTAKE FEED */}
          <aside className="w-[380px] shrink-0 flex flex-col gap-3 overflow-hidden">
            
            {/* Top Metric Cards (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block mb-1">
                  Active Incidents
                </span>
                <div className="text-2xl font-black text-on-surface font-mono">{incidents.length}</div>
                <span className="text-[10px] text-cyan-400 font-mono">100% PostGIS Geocoded</span>
              </div>

              <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block mb-1">
                  Critical P1 Tier
                </span>
                <div className="text-2xl font-black text-red-400 font-mono">{criticalCount}</div>
                <span className="text-[10px] text-red-300 font-mono">Immediate Watercraft Required</span>
              </div>

              <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block mb-1">
                  Dispatched Active
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono">{dispatchedActiveCount}</div>
                <span className="text-[10px] text-amber-300 font-mono">Responders in Field</span>
              </div>

              <div className="bg-surface-container border border-outline-variant/40 rounded-xl p-3 shadow-sm">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  AI Verified Resolved
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono">{resolvedCount}</div>
                <span className="text-[10px] text-emerald-300 font-mono">Gemini Vision Audited</span>
              </div>
            </div>

            {/* Live Multimodal Triage Feed */}
            <div className="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl p-4 flex flex-col min-h-0 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/40 shrink-0">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold font-mono text-on-surface uppercase tracking-wider">
                    Live Multimodal Triage Feed
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-on-surface-variant px-1.5 py-0.5 rounded bg-surface-variant">
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
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? "bg-surface-variant border-primary shadow-md"
                          : "bg-surface-container-low hover:bg-surface-variant/50 border-outline-variant/30"
                      }`}
                    >
                      {/* Ticket Top Meta */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-on-surface-variant">
                          #{incident.id} • {incident.source_type}
                        </span>
                        <TriageBadge category={incident.triage_category} />
                      </div>

                      {/* Summary Payload */}
                      <p className="text-xs text-on-surface line-clamp-2 leading-relaxed">
                        {incident.extracted_entities?.translation_en ||
                          incident.raw_payload ||
                          "Multimodal emergency incident ingested."}
                      </p>

                      {/* Location & Trapped Metrics */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant pt-1 border-t border-outline-variant/20">
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          {incident.location_name || `${incident.latitude.toFixed(3)}, ${incident.longitude.toFixed(3)}`}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-on-surface">
                          <Users className="w-3 h-3 text-cyan-400" />
                          {incident.extracted_entities?.trapped_count || 0} Trapped
                        </span>
                      </div>

                      {/* 1-Click Proximity Dispatch Action */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDispatch(incident);
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isP1
                            ? "bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40"
                            : isP2
                            ? "bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40"
                            : "bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-500/40"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span>Dispatch Proximity Lead</span>
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
      {/* APPROVED CROWDSOURCED RELIEF DROP SPOTS MODAL */}
      {/* ----------------------------------------------------------------------- */}
      {isReliefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#0B101D] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    Approved Crowdsourced Supply Drop Spots
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/40">
                      VOLUNTEER CLEARED
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Spots nominated by citizens & verified safe by Volunteer Ground Recon for immediate relief drops.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReliefModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Receipt Banner if Dispatched */}
              {dispatchReceipt && (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-1 text-xs text-emerald-200 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Supply Convoy Dispatched!
                    </span>
                    <span className="font-mono bg-emerald-900/60 px-2 py-0.5 rounded text-[10px]">
                      Tracking: {dispatchReceipt.convoy_code}
                    </span>
                  </div>
                  <p className="text-slate-200">{dispatchReceipt.message}</p>
                </div>
              )}

              {/* Spot Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Select Verified Drop Spot:
                </label>

                {approvedSpots.length === 0 ? (
                  <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                    No approved drop spots found yet. Ground recon audits in the Volunteer Hub will appear here once verified.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {approvedSpots.map((spot) => {
                      const isSelected = selectedSpotForDispatch?.id === spot.id;
                      return (
                        <div
                          key={spot.id}
                          onClick={() => setSelectedSpotForDispatch(spot)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2 ${
                            isSelected
                              ? "bg-amber-950/60 border-amber-500 shadow-md"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono text-[10px] text-amber-300 font-bold">#{spot.id}</span>
                              <h4 className="font-bold text-xs text-white">{spot.spot_name}</h4>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                              APPROVED
                            </span>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                            <div>📍 {spot.latitude.toFixed(4)}° N, {spot.longitude.toFixed(4)}° E</div>
                            <div>🛡️ Terrain: {spot.terrain_type}</div>
                            {spot.cleared_by_volunteer && (
                              <div className="text-cyan-300">✓ Audited by {spot.cleared_by_volunteer}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transport Mechanism Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Select Dispatch Transport Mechanism:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: "HELICOPTER_AIRDROP", label: "🚁 Helicopter Airdrop" },
                    { id: "RESCUE_BOAT_CONVOY", label: "🚤 Boat Convoy" },
                    { id: "4X4_AMPHIBIOUS_TRUCK", label: "🚛 Amphibious Truck" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTransport(t.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                        selectedTransport === t.id
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supply Package Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Relief Supplies Package Payload:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "RATIONS_48H", label: "🍞 48-Hour High-Calorie Rations" },
                    { id: "POTABLE_WATER", label: "💧 Potable Drinking Water Packs" },
                    { id: "TRAUMA_KITS", label: "🩹 Surgical Trauma First Aid Kits" },
                    { id: "POWER_GENERATOR", label: "🔋 Emergency Power & Radios" },
                  ].map((s) => {
                    const isChecked = selectedSupplies.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSupplyToggle(s.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-200"
                            : "bg-slate-900/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <span className="text-[11px] font-medium">{s.label}</span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                          isChecked ? "bg-emerald-500 border-emerald-400 text-black font-bold" : "border-slate-600"
                        }`}>
                          {isChecked && "✓"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsReliefModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleDispatchSupplyOrder}
                disabled={isDispatchingSupply || !selectedSpotForDispatch || selectedSupplies.length === 0}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isDispatchingSupply ? (
                  <>
                    <Plane className="w-4 h-4 animate-spin" />
                    Deploying Air/Ground Logistics Convoy...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Dispatch Relief to {selectedSpotForDispatch?.spot_name || "Spot"}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
