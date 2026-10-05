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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          P1 Critical {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
    case "URGENT_P2":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          P2 Urgent {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
    case "MODERATE_P3":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          P3 Moderate {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
        </span>
      );
    case "LOW_P4":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          P4 Low {showScore && score !== undefined ? `(${score.toFixed(0)})` : ""}
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200">
          <Activity className="w-3 h-3 text-slate-500" /> Reported
        </span>
      );
    case "TRIAGED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200">
          <Activity className="w-3 h-3 text-indigo-600" /> Triaged
        </span>
      );
    case "DISPATCHED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200">
          <Navigation className="w-3 h-3 text-blue-600" /> Dispatched
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" /> In Progress
        </span>
      );
    case "RESOLVED":
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
        </span>
      );
  }
}
