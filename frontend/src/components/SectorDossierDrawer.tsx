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
      className="fixed inset-0 z-[99999] overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Slide-over Dossier Drawer Panel */}
      <aside
        className="w-full max-w-2xl bg-white border-l border-slate-200 text-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sector Dossier Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Sector Overview
                </h2>
                <TriageBadge category={highestCategory} score={maxScore} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {resolvedCluster.sectorName} ({centroidLat.toFixed(4)}, {centroidLng.toFixed(4)})
                <span className="text-slate-300">•</span>
                <span>{resolvedCluster.isSinglePin ? "Incident Location" : "Spatial Cluster"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Sector Dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aggregate Threat Metrics */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Casualties</span>
            <span className="font-bold text-sm text-slate-900">{incidentsList.length} Reports</span>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 shadow-sm">
            <span className="text-[10px] text-rose-700 block uppercase font-medium">P1 Critical</span>
            <span className="font-bold text-sm text-rose-800">{resolvedCluster.metrics?.criticalP1Count || 0}</span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 shadow-sm">
            <span className="text-[10px] text-amber-700 block uppercase font-medium">Trapped</span>
            <span className="font-bold text-sm text-amber-800">{resolvedCluster.metrics?.totalTrappedCount || 0}</span>
          </div>
          <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 shadow-sm">
            <span className="text-[10px] text-blue-700 block uppercase font-medium">Max Score</span>
            <span className="font-bold text-sm text-blue-800">{maxScore.toFixed(0)}/100</span>
          </div>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Multi-Incident Switcher Tabs (Only if hexagon contains >= 2 incidents) */}
          {isMultiIncident && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  Cluster Incidents ({incidentsList.length} in this area)
                </span>
                <span className="text-[11px] text-slate-400">Select to inspect</span>
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
                          ? "bg-blue-50/70 border-blue-500 shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-[11px] text-slate-900">#{inc.id}</span>
                        <TriageBadge category={inc.triage_category} score={inc.triage_score} />
                      </div>
                      <p className="line-clamp-1 text-[11px] text-slate-600">
                        {inc.raw_payload || inc.location_name || "Emergency report"}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
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
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      Incident #{activeIncident.id}
                    </span>
                    <TriageBadge category={activeIncident.triage_category} score={activeIncident.triage_score} />
                    <IncidentStatusBadge status={activeIncident.status} />
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimestamp(activeIncident.created_at)}
                  </span>
                </div>

                {/* Urgency Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Urgency Index</span>
                    <span className="font-bold text-slate-900">{(activeIncident.triage_score || 0).toFixed(0)} / 100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (activeIncident.triage_score || 0) >= 80
                          ? "bg-rose-500"
                          : (activeIncident.triage_score || 0) >= 60
                          ? "bg-orange-500"
                          : (activeIncident.triage_score || 0) >= 40
                          ? "bg-amber-500"
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
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Report Transcript & Translation
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Language: {activeIncident.extracted_entities?.detected_language || "Hindi / Awadhi"}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 text-xs shadow-sm">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                      Distress Ingested:
                    </span>
                    <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 italic">
                      &quot;{activeIncident.raw_payload || "Multimodal voice recording ingested."}&quot;
                    </p>
                  </div>

                  {activeIncident.extracted_entities?.translation_en && (
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide block mb-1">
                        English Translation:
                      </span>
                      <p className="text-slate-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-200">
                        {activeIncident.extracted_entities.translation_en}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Demographics & Medical Hazards Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs shadow-sm">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    Vulnerable Demographics
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700 text-xs pt-1">
                    <span className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      Trapped: <strong className="text-rose-600">{activeIncident.extracted_entities?.trapped_count || 0}</strong>
                    </span>
                    <span className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      Elderly: <strong className="text-amber-700">{activeIncident.extracted_entities?.vulnerable_people?.elderly || 0}</strong>
                    </span>
                    <span className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      Children: <strong className="text-blue-700">{activeIncident.extracted_entities?.vulnerable_people?.children || 0}</strong>
                    </span>
                    <span className="bg-slate-50 p-1.5 rounded border border-slate-200">
                      Disabled: <strong className="text-purple-700">{activeIncident.extracted_entities?.vulnerable_people?.disabled || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2 text-xs shadow-sm">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Hazards & Medical Needs
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activeIncident.extracted_entities?.hazard_types || ["FLOOD_WATER"]).map((h, i) => (
                      <span key={i} className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                        {h}
                      </span>
                    ))}
                    {(activeIncident.extracted_entities?.medical_needs || []).map((m, i) => (
                      <span key={i} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic 3-Bullet AI Safety SOP */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Responder Safety Guidelines
                </h3>

                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-3">
                  <p className="text-blue-950 font-medium leading-relaxed">
                    {activeIncident.safety_sop?.urgency_summary || "Ground response active. Approach with certified gear."}
                  </p>

                  {activeIncident.safety_sop?.recommended_gear && activeIncident.safety_sop.recommended_gear.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
                        Mandatory Equipment:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeIncident.safety_sop.recommended_gear.map((gear, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-white text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 shadow-sm"
                          >
                            {gear}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeIncident.safety_sop?.protocol_steps && activeIncident.safety_sop.protocol_steps.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-blue-200">
                      <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide block mb-1">
                        Protocol Steps:
                      </span>
                      <ul className="space-y-1.5 text-slate-700">
                        {activeIncident.safety_sop.protocol_steps.map((step, idx) => (
                          <li key={idx} className="bg-white p-2.5 rounded border border-slate-200 text-[11px] leading-relaxed shadow-sm">
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
            <div className="p-8 text-center text-xs text-slate-500">
              No active incident selected in this sector.
            </div>
          )}

        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>

          {activeIncident && (
            <button
              onClick={() => {
                onOpenDispatch(activeIncident);
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              Dispatch Responder to #{activeIncident.id}
            </button>
          )}
        </div>

      </aside>
    </div>
  );
}
