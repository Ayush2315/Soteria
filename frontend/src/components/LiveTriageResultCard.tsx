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
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center text-slate-400 space-y-3">
        <Sparkles className="w-8 h-8 mx-auto text-indigo-500/60 animate-pulse" />
        <p className="text-sm font-medium text-slate-300">Live AI Multimodal Triage Standby</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Submit an emergency voice note, disaster photo, or text message above to see real-time Gemini structured extraction and 0-100 urgency scoring.
        </p>
      </div>
    );
  }

  // Derive data from either the live triage response or the selected incident fallback
  const incident = triageData ? triageData.incident : incidentFallback!;
  const extraction = triageData?.extraction;
  const breakdown = triageData?.triage_breakdown;

  const score = incident.triage_score;
  const category = incident.triage_category;

  // Determine score color theme
  let scoreColor = "text-emerald-400";
  let scoreBg = "bg-emerald-500/10 border-emerald-500/30";
  let progressBg = "bg-emerald-500";
  if (score >= 80) {
    scoreColor = "text-red-400";
    scoreBg = "bg-red-500/10 border-red-500/30";
    progressBg = "bg-gradient-to-r from-red-600 to-rose-500";
  } else if (score >= 60) {
    scoreColor = "text-orange-400";
    scoreBg = "bg-orange-500/10 border-orange-500/30";
    progressBg = "bg-gradient-to-r from-orange-500 to-amber-500";
  } else if (score >= 40) {
    scoreColor = "text-yellow-400";
    scoreBg = "bg-yellow-500/10 border-yellow-500/30";
    progressBg = "bg-yellow-500";
  }

  // Language info
  const detectedLang = extraction?.detected_language || incident.extracted_entities.detected_language || "en";
  const transcript = extraction?.transcript || incident.raw_payload || "No transcript available";
  const translation = extraction?.translation_en || incident.extracted_entities.translation_en || transcript;

  // Trapped and Vulnerability info
  const trappedCount = extraction?.trapped_count ?? incident.extracted_entities.trapped_count ?? 0;
  const isTrapped = extraction?.is_trapped ?? incident.extracted_entities.is_trapped ?? trappedCount > 0;
  const vulnerable = extraction?.vulnerable_groups || incident.extracted_entities.vulnerable_people || {};

  // Safety SOP info
  const sop = extraction?.safety_sop;
  const legacySop = incident.safety_sop;

  const summary = sop?.summary || legacySop?.urgency_summary || "Ground response active.";
  const bullets = sop
    ? [sop.bullet_1, sop.bullet_2, sop.bullet_3]
    : legacySop?.protocol_steps || [
        "1. Secure perimeter and establish communications.",
        "2. Evacuate vulnerable casualties with proper PPE.",
        "3. Administer field stabilization.",
      ];

  const audioUrl = triageData?.audio_playback_url || incident.audio_url;
  const imageUrl = triageData?.image_preview_url || (incident.image_urls && incident.image_urls[0]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-5 relative overflow-hidden">
      
      {/* Header with Urgency Score and Category */}
      <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              INCIDENT #{incident.id}
            </span>
            <TriageBadge category={category} score={score} />
            <IncidentStatusBadge status={incident.status} />
          </div>
          <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            {incident.location_name || `Disaster Zone (${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)})`}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            Logged {formatTimestamp(incident.created_at)}
          </p>
        </div>

        {/* Big 0-100 Score Indicator */}
        <div className={`p-4 rounded-2xl border ${scoreBg} flex flex-col items-center justify-center text-center shrink-0 min-w-[120px]`}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Urgency Score</span>
          <div className="flex items-baseline gap-0.5 mt-0.5">
            <span className={`text-3xl font-black ${scoreColor}`}>{score.toFixed(1)}</span>
            <span className="text-xs text-slate-500 font-mono">/100</span>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`h-full ${progressBg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
          </div>
        </div>
      </div>

      {/* Mathematical Breakdown Toggle (Explainable AI) */}
      {breakdown && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3 text-xs">
          <button
            type="button"
            onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
            className="w-full flex items-center justify-between text-slate-300 font-semibold hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5 text-cyan-300 font-mono text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Explainable Triage Scoring Math (Click to expand)
            </span>
            {showFormulaBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFormulaBreakdown && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 font-mono text-[11px] text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Hazard Severity:</span>
                  <p className="text-white font-bold">+{breakdown.hazard_severity_score} / 35.0</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Trapped Penalty:</span>
                  <p className="text-white font-bold">+{breakdown.trapped_factor_score} / 25.0</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Vulnerabilities:</span>
                  <p className="text-white font-bold">+{breakdown.vulnerability_score} / 25.0</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Medical Trauma:</span>
                  <p className="text-white font-bold">+{breakdown.medical_injury_score} / 10.0</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500">Recency Boost:</span>
                  <p className="text-white font-bold">+{breakdown.recency_factor_score} / 5.0</p>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center">
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-blue-400" />
            Multilingual AI Dialect Extraction
          </span>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
            Detected: {detectedLang}
          </span>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
          {detectedLang !== "English" && detectedLang !== "en" && (
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-500">Verbatim Transcript:</span>
              <p className="text-xs text-slate-200 font-medium italic mt-0.5">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500">English Standard Translation:</span>
            <p className="text-xs text-slate-100 font-semibold mt-0.5">&ldquo;{translation}&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Media Attachments Preview (Audio & Photo) */}
      {(audioUrl || imageUrl) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          {audioUrl && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                Spoken Distress Voice Note
              </span>
              <audio controls className="w-full h-8 mt-1 rounded" src={audioUrl}>
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {imageUrl && (
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Scene Photo Evidence
              </span>
              <div className="rounded-lg overflow-hidden border border-slate-700 max-h-32">
                <img src={imageUrl} alt="Disaster Scene" className="w-full h-32 object-cover" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured Entity Extraction Grid */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Extracted Crisis Parameters
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Trapped Status */}
          <div className={`p-2.5 rounded-xl border ${isTrapped ? "bg-red-500/10 border-red-500/40 text-red-300" : "bg-slate-900/80 border-slate-800 text-slate-300"}`}>
            <span className="text-[10px] uppercase font-mono block text-slate-400">Trapped Status</span>
            <span className="text-sm font-bold flex items-center gap-1 mt-0.5">
              {isTrapped ? <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
              {isTrapped ? `${trappedCount || 1} Trapped` : "Clear"}
            </span>
          </div>

          {/* Vulnerable Demographic Counts */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-[10px] uppercase font-mono block text-slate-400">Vulnerable Groups</span>
            <div className="text-xs font-bold text-white mt-0.5 space-x-1.5">
              <span>👶 {vulnerable.children || 0}</span>
              <span>👵 {vulnerable.elderly || 0}</span>
              <span>🤰 {vulnerable.pregnant || 0}</span>
              <span>♿ {vulnerable.disabled || 0}</span>
            </div>
          </div>

          {/* Hazard Type & Rating */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-[10px] uppercase font-mono block text-slate-400">Hazard Peril</span>
            <span className="text-xs font-bold text-amber-300 mt-0.5 block truncate">
              {extraction?.hazard_type || incident.extracted_entities.hazard_types?.[0] || "DISASTER"} (Sev: {extraction?.hazard_severity || incident.extracted_entities.hazard_severity || 5}/10)
            </span>
          </div>

          {/* AI Confidence */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="text-[10px] uppercase font-mono block text-slate-400">GenAI Confidence</span>
            <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
              {(((extraction?.confidence_score ?? incident.extracted_entities.confidence_score) || 0.95) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Medical Traumas */}
        {((extraction?.injuries_reported && extraction.injuries_reported.length > 0) || (incident.extracted_entities.medical_needs && incident.extracted_entities.medical_needs.length > 0)) && (
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-mono flex items-center gap-1 text-[11px]">
              <HeartPulse className="w-3.5 h-3.5 text-red-400" />
              Trauma / Medical Needs:
            </span>
            {(extraction?.injuries_reported || incident.extracted_entities.medical_needs || []).map((injury, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-red-950/80 border border-red-800/50 text-red-300 rounded text-[11px] font-medium">
                {injury}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic 3-Bullet Responder Safety SOP */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-amber-400" />
          Dynamic Ground Responder Safety SOP (3-Bullet Action Protocol)
        </h4>

        <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs space-y-3">
          <p className="text-amber-200 font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            {summary}
          </p>

          <ul className="space-y-2 text-slate-200">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
                <span className="text-cyan-400 font-mono font-bold text-xs shrink-0">{idx + 1}.</span>
                <span className="text-slate-200 leading-relaxed text-[11px]">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Geospatial PostGIS Projection Summary */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-wrap gap-2">
        <span>PostGIS SRID 4326: ({incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)})</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <FileCheck className="w-3.5 h-3.5" /> Spatial Index Verified
        </span>
      </div>

    </div>
  );
}
