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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#0B101D] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
              <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">30-Minute Executive Operational SitRep</h2>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  Gemini Synthesis
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated PostGIS incident aggregation & 3-bullet military-grade operational digest
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSynthesizeNow}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              title="Force Regenerate"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Synthesizing..." : "Synthesize Now"}
            </button>

            <button
              id="btn-close-sitrep"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-400">
                Aggregating PostGIS casualty clusters & prompting Gemini Operational Engine...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {error}
            </div>
          ) : sitrep ? (
            <div className="space-y-6">
              {/* Aggregate Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Incidents</span>
                  <span className="text-xl font-black text-white">{sitrep.total_active_incidents}</span>
                </div>
                <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/40 text-center">
                  <span className="text-[10px] font-mono uppercase text-red-300 block">Critical (P1)</span>
                  <span className="text-xl font-black text-red-400">{sitrep.critical_p1_count}</span>
                </div>
                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40 text-center">
                  <span className="text-[10px] font-mono uppercase text-emerald-300 block">Resolved</span>
                  <span className="text-xl font-black text-emerald-400">{sitrep.resolved_count}</span>
                </div>
                <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/40 text-center">
                  <span className="text-[10px] font-mono uppercase text-indigo-300 block">Teams Deployed</span>
                  <span className="text-xl font-black text-indigo-400">{sitrep.volunteers_deployed}</span>
                </div>
              </div>

              {/* Active Hotspot Zones */}
              {sitrep.top_hazard_zones && sitrep.top_hazard_zones.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-mono text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> Hotspot Sectors:
                  </span>
                  {sitrep.top_hazard_zones.map((zone, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-900 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-800/40 text-[11px]"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              )}

              {/* 3-Bullet Executive Directives */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  3-Bullet Executive Operational Directive
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Bullet 1 */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-mono font-bold text-amber-400 uppercase text-[10px] block">
                      1. Casualty & Hotspot Status
                    </span>
                    <p className="text-slate-200 leading-relaxed">{sitrep.bullet_1_hotspot_status}</p>
                  </div>

                  {/* Bullet 2 */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-mono font-bold text-red-400 uppercase text-[10px] block">
                      2. Operational Bottlenecks & Hazards
                    </span>
                    <p className="text-slate-200 leading-relaxed">{sitrep.bullet_2_operational_bottlenecks}</p>
                  </div>

                  {/* Bullet 3 */}
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-cyan-500/40 bg-cyan-950/20 space-y-1">
                    <span className="font-mono font-bold text-cyan-300 uppercase text-[10px] block">
                      3. Priority Action Plan & Resource Redeployments
                    </span>
                    <p className="text-cyan-100 font-semibold leading-relaxed">{sitrep.bullet_3_priority_action_plan}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Operational Period: Last 30 Minutes</span>
          {sitrepData && <span>Generated: {new Date(sitrepData.generated_at).toLocaleTimeString()}</span>}
        </div>
      </div>
    </div>
  );
}
