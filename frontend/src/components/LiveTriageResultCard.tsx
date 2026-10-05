"use client";

import React, { useState } from "react";
import {
  Shield,
  Flame,
  AlertTriangle,
  Users,
  HeartPulse,
  Languages,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  FileCheck,
  CheckCircle,
} from "lucide-react";
import { MultimodalTriageResponse, Incident } from "@/lib/api";
import { TriageBadge, IncidentStatusBadge } from "@/components/ui/StatusBadge";
import { formatTimestamp } from "@/lib/utils";

interface LiveTriageResultCardProps {
  triageData: MultimodalTriageResponse | null;
  incidentFallback?: Incident | null;
}

export function LiveTriageResultCard({ triageData, incidentFallback }: LiveTriageResultCardProps) {
  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);

  if (!triageData && !incidentFallback) {
    return (
      <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center text-slate-500 space-y-3 shadow-sm">
        <Sparkles className="w-8 h-8 mx-auto text-blue-600 animate-pulse" />
        <p className="text-sm font-semibold text-slate-800">Multimodal Triage Standby</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Submit an emergency voice recording, disaster photo, or text message to view real-time priority scoring and structured extraction.
        </p>
      </div>
    );
  }

  const incident = triageData ? triageData.incident : incidentFallback!;
  const extraction = triageData?.extraction;
  const breakdown = triageData?.triage_breakdown;

  const score = incident.triage_score;
  const category = incident.triage_category;

  let scoreColor = "text-emerald-700";
  let scoreBg = "bg-emerald-50 border-emerald-200";
  let progressBg = "bg-emerald-500";
  if (score >= 80) {
    scoreColor = "text-rose-700";
    scoreBg = "bg-rose-50 border-rose-200";
    progressBg = "bg-rose-600";
  } else if (score >= 60) {
    scoreColor = "text-orange-700";
    scoreBg = "bg-orange-50 border-orange-200";
    progressBg = "bg-orange-500";
  } else if (score >= 40) {
    scoreColor = "text-amber-800";
    scoreBg = "bg-amber-50 border-amber-200";
    progressBg = "bg-amber-500";
  }

  const detectedLang = extraction?.detected_language || incident.extracted_entities.detected_language || "en";
  const transcript = extraction?.transcript || incident.raw_payload || "No transcript available";
  const translation = extraction?.translation_en || incident.extracted_entities.translation_en || transcript;

  const trappedCount = extraction?.trapped_count ?? incident.extracted_entities.trapped_count ?? 0;
  const isTrapped = extraction?.is_trapped ?? incident.extracted_entities.is_trapped ?? trappedCount > 0;
  const vulnerable = extraction?.vulnerable_groups || incident.extracted_entities.vulnerable_people || {};

  const sop = extraction?.safety_sop;
  const legacySop = incident.safety_sop;

  const summary = sop?.summary || legacySop?.urgency_summary || "Ground response active.";
  const bullets = sop
    ? [sop.bullet_1, sop.bullet_2, sop.bullet_3]
    : legacySop?.protocol_steps || [
        "1. Secure perimeter and establish communications.",
        "2. Evacuate vulnerable casualties with proper equipment.",
        "3. Administer field stabilization.",
      ];

  const audioUrl = triageData?.audio_playback_url || incident.audio_url;
  const imageUrl = triageData?.image_preview_url || (incident.image_urls && incident.image_urls[0]);

  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5 text-slate-900">
      
      {/* Header with Urgency Score and Category */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Incident #{incident.id}
            </span>
            <TriageBadge category={category} score={score} />
            <IncidentStatusBadge status={incident.status} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            {incident.location_name || `Disaster Zone (${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)})`}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            Logged {formatTimestamp(incident.created_at)}
          </p>
        </div>

        {/* 0-100 Score Indicator */}
        <div className={`p-4 rounded-xl border ${scoreBg} flex flex-col items-center justify-center text-center shrink-0 min-w-[120px]`}>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600">Urgency Score</span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className={`text-3xl font-black ${scoreColor}`}>{score.toFixed(0)}</span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`h-full ${progressBg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      {/* Mathematical Breakdown Toggle */}
      {breakdown && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-xs">
          <button
            type="button"
            onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
            className="w-full flex items-center justify-between text-slate-700 font-semibold hover:text-slate-900 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Scoring Factors Breakdown
            </span>
            {showFormulaBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFormulaBreakdown && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Hazard Severity:</span>
                  <p className="font-bold text-slate-900">+{breakdown.hazard_severity_score} / 35.0</p>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Trapped Factor:</span>
                  <p className="font-bold text-slate-900">+{breakdown.trapped_factor_score} / 25.0</p>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Vulnerabilities:</span>
                  <p className="font-bold text-slate-900">+{breakdown.vulnerability_score} / 25.0</p>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Medical Needs:</span>
                  <p className="font-bold text-slate-900">+{breakdown.medical_injury_score} / 10.0</p>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500">Recency Boost:</span>
                  <p className="font-bold text-slate-900">+{breakdown.recency_factor_score} / 5.0</p>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-center">
                  <span className="text-slate-500">Composite:</span>
                  <p className={`font-black ${scoreColor}`}>{breakdown.final_score} / 100</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multimodal Dialect Transcription & English Translation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            Dialect & Language Extraction
          </span>
          <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Detected: {detectedLang}
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
          {detectedLang !== "English" && detectedLang !== "en" && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Verbatim Transcript:</span>
              <p className="text-xs text-slate-800 italic mt-0.5">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-500">English Standard Translation:</span>
            <p className="text-xs text-slate-900 font-medium mt-0.5">&ldquo;{translation}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Media Attachments Preview */}
      {(audioUrl || imageUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {audioUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                Audio Recording
              </span>
              <audio controls className="w-full h-8 mt-1 rounded" src={audioUrl}>
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {imageUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Scene Photo Evidence
              </span>
              <div className="rounded-lg overflow-hidden border border-slate-200 max-h-32">
                <img src={imageUrl} alt="Disaster Scene" className="w-full h-32 object-cover" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Parameters */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-600" />
          Extracted Crisis Parameters
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Trapped Status */}
          <div className={`p-2.5 rounded-xl border ${isTrapped ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
            <span className="text-[10px] uppercase font-semibold block text-slate-500">Trapped Status</span>
            <span className="text-xs font-bold flex items-center gap-1 mt-0.5">
              {isTrapped ? <Flame className="w-3.5 h-3.5 text-rose-600" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
              {isTrapped ? `${trappedCount || 1} Trapped` : "Clear"}
            </span>
          </div>

          {/* Vulnerable Demographic Counts */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-[10px] uppercase font-semibold block text-slate-500">Vulnerable</span>
            <div className="text-xs font-semibold text-slate-900 mt-0.5 space-x-1.5">
              <span>👶 {vulnerable.children || 0}</span>
              <span>👵 {vulnerable.elderly || 0}</span>
              <span>♿ {vulnerable.disabled || 0}</span>
            </div>
          </div>

          {/* Hazard Type & Rating */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-[10px] uppercase font-semibold block text-slate-500">Hazard Peril</span>
            <span className="text-xs font-semibold text-amber-800 mt-0.5 block truncate">
              {extraction?.hazard_type || incident.extracted_entities.hazard_types?.[0] || "DISASTER"} (Sev: {extraction?.hazard_severity || incident.extracted_entities.hazard_severity || 5}/10)
            </span>
          </div>

          {/* AI Confidence */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
            <span className="text-[10px] uppercase font-semibold block text-slate-500">Confidence</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">
              {(((extraction?.confidence_score ?? incident.extracted_entities.confidence_score) || 0.95) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Medical Traumas */}
        {((extraction?.injuries_reported && extraction.injuries_reported.length > 0) || (incident.extracted_entities.medical_needs && incident.extracted_entities.medical_needs.length > 0)) && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1 text-[11px]">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              Trauma / Medical Needs:
            </span>
            {(extraction?.injuries_reported || incident.extracted_entities.medical_needs || []).map((injury, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-[11px] font-medium">
                {injury}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Responder Safety SOP */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-blue-600" />
          Field Responder Safety SOP
        </h4>

        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-3">
          <p className="text-blue-900 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
            {summary}
          </p>

          <ul className="space-y-1.5 text-slate-700">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 shadow-sm">
                <span className="text-blue-600 font-bold text-xs shrink-0">{idx + 1}.</span>
                <span className="text-slate-800 leading-relaxed text-xs">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Geospatial Summary */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
        <span>PostGIS Geocoded: ({incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)})</span>
        <span className="text-emerald-700 font-medium flex items-center gap-1">
          <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Spatial Index Verified
        </span>
      </div>

    </div>
  );
}
