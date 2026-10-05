"use client";

import React, { useState, useEffect } from "react";
import {
  fetchSitRep,
  triggerSitRep,
  SitRepResponse,
} from "@/lib/api";
import {
  FileText,
  X,
  RefreshCw,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Activity,
  MapPin,
} from "lucide-react";

interface SitRepModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SitRepModal({ isOpen, onClose }: SitRepModalProps) {
  const [sitrepData, setSitrepData] = useState<SitRepResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSitRep = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSitRep(30);
      setSitrepData(data);
    } catch (err: any) {
      console.error("Failed to load SitRep:", err);
      setError("Unable to generate situation report.");
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeNow = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await triggerSitRep(30);
      setSitrepData(data);
    } catch (err: any) {
      console.error("Failed to trigger SitRep:", err);
      setError("Failed to synthesize fresh SitRep.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSitRep();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sitrep = sitrepData?.sitrep;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">30-Minute Situation Report</h2>
                <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                  Gemini Synthesis
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated incident aggregation and operational briefing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSynthesizeNow}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
              title="Force Regenerate"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Synthesizing..." : "Refresh"}
            </button>

            <button
              id="btn-close-sitrep"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">
                Aggregating incident clusters and synthesizing SitRep...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {error}
            </div>
          ) : sitrep ? (
            <div className="space-y-6">
              {/* Aggregate Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] uppercase text-slate-500 font-medium block">Active Incidents</span>
                  <span className="text-xl font-bold text-slate-900">{sitrep.total_active_incidents}</span>
                </div>
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <span className="text-[10px] uppercase text-rose-700 font-medium block">Critical (P1)</span>
                  <span className="text-xl font-bold text-rose-800">{sitrep.critical_p1_count}</span>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <span className="text-[10px] uppercase text-emerald-700 font-medium block">Resolved</span>
                  <span className="text-xl font-bold text-emerald-800">{sitrep.resolved_count}</span>
                </div>
                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] uppercase text-blue-700 font-medium block">Teams Deployed</span>
                  <span className="text-xl font-bold text-blue-800">{sitrep.volunteers_deployed}</span>
                </div>
              </div>

              {/* Active Hotspot Zones */}
              {sitrep.top_hazard_zones && sitrep.top_hazard_zones.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> Hotspot Sectors:
                  </span>
                  {sitrep.top_hazard_zones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 text-[11px] font-medium"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              )}

              {/* 3-Bullet Executive Directives */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Executive Operational Directive
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Bullet 1 */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-semibold text-amber-800 uppercase text-[10px] block">
                      1. Casualty & Hotspot Status
                    </span>
                    <p className="text-slate-700 leading-relaxed">{sitrep.bullet_1_hotspot_status}</p>
                  </div>

                  {/* Bullet 2 */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-semibold text-rose-800 uppercase text-[10px] block">
                      2. Operational Bottlenecks & Hazards
                    </span>
                    <p className="text-slate-700 leading-relaxed">{sitrep.bullet_2_operational_bottlenecks}</p>
                  </div>

                  {/* Bullet 3 */}
                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                    <span className="font-semibold text-blue-900 uppercase text-[10px] block">
                      3. Priority Action Plan & Resource Redeployments
                    </span>
                    <p className="text-blue-950 font-medium leading-relaxed">{sitrep.bullet_3_priority_action_plan}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <span>Operational Period: Last 30 Minutes</span>
          {sitrepData && <span>Generated: {new Date(sitrepData.generated_at).toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  );
}
