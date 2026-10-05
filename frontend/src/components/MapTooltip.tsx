"use client";

import React from "react";
import { Users, Flame, MapPin, Activity, ShieldAlert, Layers } from "lucide-react";
import { Incident } from "@/lib/api";

interface MapTooltipProps {
  info: any;
}

export function MapTooltip({ info }: MapTooltipProps) {
  if (!info || !info.object || info.x === undefined || info.y === undefined) {
    return null;
  }

  const { x, y, object, layer } = info;
  const isHexagon = layer?.id === "hexagon-layer";

  return (
    <div
      className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full mb-3"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="glass-panel p-3.5 rounded-xl border border-slate-700 bg-slate-900/95 shadow-2xl text-xs space-y-2 min-w-[200px] max-w-xs backdrop-blur-md">
        
        {isHexagon ? (
          /* Hexagonal Cluster Tooltip */
          <>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Hexagonal Risk Cluster
              </span>
              <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                Radius 500m
              </span>
            </div>

            <div className="space-y-1 text-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Incidents:</span>
                <span className="font-bold text-white">{object.points?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average Triage Score:</span>
                <span className="font-black text-red-400">
                  {(
                    (object.points || []).reduce(
                      (acc: number, p: any) => acc + (p.source?.triage_score || 0),
                      0
                    ) / (object.points?.length || 1)
                  ).toFixed(1)}
                  /100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Trapped Count:</span>
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {(object.points || []).reduce(
                    (acc: number, p: any) =>
                      acc + (p.source?.extracted_entities?.trapped_count || 0),
                    0
                  )}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/80">
              Click hexagon to zoom into localized crisis zone
            </p>
          </>
        ) : (
          /* Individual Incident Pin Tooltip */
          (() => {
            const incident = (object as Incident) || object?.source;
            if (!incident) return null;

            return (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    Incident #{incident.id}
                  </span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      incident.triage_category === "CRITICAL_P1"
                        ? "bg-red-950 text-red-400 border border-red-800"
                        : incident.triage_category === "URGENT_P2"
                        ? "bg-orange-950 text-orange-400 border border-orange-800"
                        : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    }`}
                  >
                    {incident.triage_category}
                  </span>
                </div>

                <p className="text-slate-300 font-medium line-clamp-2 text-[11px]">
                  {incident.location_name || `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Triage Score:</span>
                  <span className="font-black text-red-400">{incident.triage_score.toFixed(1)}/100</span>
                </div>

                {incident.extracted_entities?.trapped_count ? (
                  <div className="flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                    <Flame className="w-3 h-3 animate-pulse" />
                    <span>{incident.extracted_entities.trapped_count} People Trapped</span>
                  </div>
                ) : null}

                <p className="text-[10px] text-cyan-300 italic">Click marker to inspect full AI dossier</p>
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
