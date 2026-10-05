import React from "react";
import { TriageCategory, IncidentStatus } from "@/lib/api";
import { AlertCircle, Clock, ShieldAlert, CheckCircle2, Navigation, Activity } from "lucide-react";

interface TriageBadgeProps {
  category: TriageCategory;
  score?: number;
  showScore?: boolean;
}

export function TriageBadge({ category, score, showScore = true }: TriageBadgeProps) {
  switch (category) {
    case "CRITICAL_P1":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 glow-critical">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <ShieldAlert className="w-3.5 h-3.5" />
          P1 CRITICAL {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
    case "URGENT_P2":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 glow-urgent">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <AlertCircle className="w-3.5 h-3.5" />
          P2 URGENT {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
    case "MODERATE_P3":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <Clock className="w-3.5 h-3.5" />
          P3 MODERATE {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
    case "LOW_P4":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <CheckCircle2 className="w-3.5 h-3.5" />
          P4 LOW {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
  }
}

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
}

export function IncidentStatusBadge({ status }: IncidentStatusBadgeProps) {
  switch (status) {
    case "REPORTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-slate-400 bg-slate-800 border border-slate-700">
          <Activity className="w-3 h-3 text-slate-400" /> REPORTED
        </span>
      );
    case "TRIAGED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-700/50">
          <Activity className="w-3 h-3 text-indigo-400" /> AI-TRIAGED
        </span>
      );
    case "DISPATCHED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-700/50">
          <Navigation className="w-3 h-3 text-cyan-400" /> DISPATCHED
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-yellow-400 bg-yellow-950/60 border border-yellow-700/50">
          <Clock className="w-3 h-3 text-yellow-400" /> IN PROGRESS
        </span>
      );
    case "RESOLVED":
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/50">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> RESOLVED
        </span>
      );
  }
}
