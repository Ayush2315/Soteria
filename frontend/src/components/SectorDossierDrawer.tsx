"use client";

import React from "react";
import {
  Incident,
  SectorClusterData,
} from "@/lib/api";
import { TriageBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { formatTimestamp } from "@/lib/utils";
import {
  X,
  Shield,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  Flame,
  Radio,
  Layers,
  Sparkles,
  FileText,
  Navigation,
  ExternalLink,
  Volume2,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

export interface SectorDossierDrawerProps {
  cluster: SectorClusterData | null;
  selectedIncident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectIncidentInCluster: (incident: Incident) => void;
  onOpenDispatch: (incident: Incident) => void;
}

export function SectorDossierDrawer({
  cluster,
  selectedIncident,
  isOpen,
  onClose,
  onSelectIncidentInCluster,
  onOpenDispatch,
}: SectorDossierDrawerProps) {
  if (!isOpen) return null;

  // Fallback cluster synthesis if cluster is not set yet
  const resolvedCluster: SectorClusterData = cluster || {
    sectorName: selectedIncident?.location_name || (selectedIncident ? `Sector #${selectedIncident.id}` : "Disaster Sector"),
    centroid: [selectedIncident?.longitude || 81.8463, selectedIncident?.latitude || 25.4358],
    metrics: {
      totalIncidents: selectedIncident ? 1 : 0,
      maxTriageScore: selectedIncident?.triage_score || 0,
      avgTriageScore: selectedIncident?.triage_score || 0,
      totalTrappedCount: selectedIncident?.extracted_entities?.trapped_count || 0,
      criticalP1Count: selectedIncident?.triage_category === "CRITICAL_P1" ? 1 : 0,
      urgentP2Count: selectedIncident?.triage_category === "URGENT_P2" ? 1 : 0,
      moderateP3Count: selectedIncident?.triage_category === "MODERATE_P3" ? 1 : 0,
      lowP4Count: selectedIncident?.triage_category === "LOW_P4" ? 1 : 0,
    },
    incidents: selectedIncident ? [selectedIncident] : [],
    isSinglePin: true,
  };

  const incidentsList = resolvedCluster.incidents || [];

  // Active incident to display in dossier details
  const activeIncident =
    selectedIncident && incidentsList.some((i) => i.id === selectedIncident.id)
      ? selectedIncident
      : incidentsList[0] || null;
  const isMultiIncident = incidentsList.length > 1;

  // Determine highest severity category for cluster badge
  const highestCategory =
    (resolvedCluster.metrics?.criticalP1Count || 0) > 0
      ? "CRITICAL_P1"
      : (resolvedCluster.metrics?.urgentP2Count || 0) > 0
      ? "URGENT_P2"
      : (resolvedCluster.metrics?.moderateP3Count || 0) > 0
      ? "MODERATE_P3"
      : "LOW_P4";

  const centroidLat = resolvedCluster.centroid?.[1] ?? 25.4358;
  const centroidLng = resolvedCluster.centroid?.[0] ?? 81.8463;
  const maxScore = resolvedCluster.metrics?.maxTriageScore ?? (activeIncident?.triage_score ?? 0);

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Slide-over Tactical Dossier Drawer Panel */}
      <aside
        className="w-full max-w-2xl bg-[#090D18] border-l border-cyan-500/40 text-slate-100 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Sector Dossier Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Layers className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-wider text-cyan-400">
                  SECTOR DOSSIER HUD
                </h2>
                <TriageBadge category={highestCategory} score={maxScore} />
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3 h-3 text-red-400" />
                {resolvedCluster.sectorName} ({centroidLat.toFixed(4)}, {centroidLng.toFixed(4)})
                <span className="text-slate-500">•</span>
                <span>{resolvedCluster.isSinglePin ? "Incident Pin" : "500m Hexagonal Risk Bin"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Close Sector Dossier"
          >
            ✕ Close
          </button>
        </div>

        {/* Aggregate Cluster Threat Ribbon */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Casualty Count</span>
            <span className="font-black text-sm text-white">{incidentsList.length} SOS</span>
          </div>
          <div className="bg-red-950/40 p-2 rounded-lg border border-red-900/40">
            <span className="text-[10px] text-red-300 block uppercase">P1 Critical</span>
            <span className="font-black text-sm text-red-400">{resolvedCluster.metrics?.criticalP1Count || 0}</span>
          </div>
          <div className="bg-amber-950/40 p-2 rounded-lg border border-amber-900/40">
            <span className="text-[10px] text-amber-300 block uppercase">Trapped</span>
            <span className="font-black text-sm text-amber-400">{resolvedCluster.metrics?.totalTrappedCount || 0} People</span>
          </div>
          <div className="bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/40">
            <span className="text-[10px] text-cyan-300 block uppercase">Max Severity</span>
            <span className="font-black text-sm text-cyan-400">{maxScore.toFixed(1)}/100</span>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Multi-Incident Switcher Tabs (Only if hexagon contains >= 2 incidents) */}
          {isMultiIncident && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  Cluster Incident Stream ({incidentsList.length} Emergencies in this Cell)
                </span>
                <span className="text-[10px] font-mono text-slate-500">Click to inspect dossier</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {incidentsList.map((inc) => {
                  const isCurrent = activeIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => onSelectIncidentInCluster(inc)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isCurrent
                          ? "bg-cyan-950/50 border-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                          : "bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono font-bold text-[11px]">#{inc.id}</span>
                        <TriageBadge category={inc.triage_category} score={inc.triage_score} />
                      </div>
                      <p className="line-clamp-1 text-[11px] text-slate-300">
                        {inc.raw_payload || inc.location_name || "Emergency report"}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/60 font-mono">
                        <span>{inc.source_type}</span>
                        <span>{formatTimestamp(inc.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Incident Full Dossier Details */}
          {activeIncident ? (
            <div className="space-y-6">
              
              {/* Incident Header Card */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-cyan-300">
                      Incident #{activeIncident.id}
                    </span>
                    <TriageBadge category={activeIncident.triage_category} score={activeIncident.triage_score} />
                    <IncidentStatusBadge status={activeIncident.status} />
                  </div>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimestamp(activeIncident.created_at)}
                  </span>
                </div>

                {/* Urgency Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Urgency Priority Index</span>
                    <span className="font-bold text-red-400">{(activeIncident.triage_score || 0).toFixed(1)} / 100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (activeIncident.triage_score || 0) >= 80
                          ? "bg-gradient-to-r from-orange-500 to-red-600"
                          : (activeIncident.triage_score || 0) >= 60
                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                          : (activeIncident.triage_score || 0) >= 40
                          ? "bg-gradient-to-r from-blue-500 to-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, activeIncident.triage_score || 0))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Dialect Voice/Photo & Verbatim Translation Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Multimodal GenAI Dialect Extraction
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Language: {activeIncident.extracted_entities?.detected_language || "Auto-Detected"}
                  </span>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block mb-1">
                      Verbatim Transcript / Ingested Distress:
                    </span>
                    <p className="text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-sans italic">
                      &quot;{activeIncident.raw_payload || "Multimodal voice recording ingested."}&quot;
                    </p>
                  </div>

                  {activeIncident.extracted_entities?.translation_en && (
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wide block mb-1">
                        English Translation (Commander View):
                      </span>
                      <p className="text-emerald-200 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-900/40 font-sans font-medium">
                        {activeIncident.extracted_entities.translation_en}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Demographics & Medical Hazards Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    Vulnerable Demographics
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] pt-1">
                    <span className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      Trapped: <strong className="text-red-400">{activeIncident.extracted_entities?.trapped_count || 0}</strong>
                    </span>
                    <span className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      Elderly: <strong className="text-amber-300">{activeIncident.extracted_entities?.vulnerable_people?.elderly || 0}</strong>
                    </span>
                    <span className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      Children: <strong className="text-blue-300">{activeIncident.extracted_entities?.vulnerable_people?.children || 0}</strong>
                    </span>
                    <span className="bg-slate-950 p-1.5 rounded border border-slate-800">
                      Disabled: <strong className="text-purple-300">{activeIncident.extracted_entities?.vulnerable_people?.disabled || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    Active Perils & Medical Needs
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activeIncident.extracted_entities?.hazard_types || ["GENERAL_HAZARD"]).map((h, i) => (
                      <span key={i} className="text-[10px] font-mono bg-red-950/60 text-red-300 px-2 py-0.5 rounded border border-red-800/40">
                        ⚠️ {h}
                      </span>
                    ))}
                    {(activeIncident.extracted_entities?.medical_needs || []).map((m, i) => (
                      <span key={i} className="text-[10px] font-mono bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded border border-blue-800/40">
                        🩺 {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic 3-Bullet AI Safety SOP Briefing */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  Dynamic 3-Bullet Responder Safety SOP
                </h3>

                <div className="p-4 bg-cyan-950/20 rounded-xl border border-cyan-500/30 text-xs space-y-3">
                  <p className="text-cyan-200 font-semibold leading-relaxed">
                    {activeIncident.safety_sop?.urgency_summary || "Ground response active. Approach with certified PPE."}
                  </p>

                  {activeIncident.safety_sop?.recommended_gear && activeIncident.safety_sop.recommended_gear.length > 0 && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block mb-1">
                        Mandatory Responder Equipment:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeIncident.safety_sop.recommended_gear.map((gear, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800"
                          >
                            🛡️ {gear}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeIncident.safety_sop?.protocol_steps && activeIncident.safety_sop.protocol_steps.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-cyan-900/40">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block mb-1">
                        Tactical Rescue Protocol:
                      </span>
                      <ul className="space-y-1.5 text-slate-300">
                        {activeIncident.safety_sop.protocol_steps.map((step, idx) => (
                          <li key={idx} className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[11px] leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No active incident selected in this sector.
            </div>
          )}

        </div>

        {/* Tactical Footer Action Handoff to Dispatch Drawer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Dossier
          </button>

          {activeIncident && (
            <button
              onClick={() => {
                onOpenDispatch(activeIncident);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Dispatch Nearest Volunteer to #{activeIncident.id}
            </button>
          )}
        </div>

      </aside>
    </div>
  );
}
