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
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white/95 shadow-xl text-xs space-y-2 min-w-[200px] max-w-xs backdrop-blur-md text-slate-800">
        
        {isHexagon ? (
          /* Hexagonal Cluster Tooltip */
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Cluster Zone
              </span>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                500m Area
              </span>
            </div>

            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Incidents:</span>
                <span className="font-bold text-slate-900">{object.points?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Average Priority:</span>
                <span className="font-bold text-rose-700">
                  {(
                    (object.points || []).reduce(
                      (acc: number, p: any) => acc + (p.source?.triage_score || 0),
                      0
                    ) / (object.points?.length || 1)
                  ).toFixed(0)}
                  /100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trapped Count:</span>
                <span className="font-semibold text-amber-800 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-600" />
                  {(object.points || []).reduce(
                    (acc: number, p: any) =>
                      acc + (p.source?.extracted_entities?.trapped_count || 0),
                    0
                  )}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
              Click to view detailed sector dossier
            </p>
          </>
        ) : (
          /* Individual Incident Pin Tooltip */
          (() => {
            const incident = (object as Incident) || object?.source;
            if (!incident) return null;

            return (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Incident #{incident.id}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      incident.triage_category === "CRITICAL_P1"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : incident.triage_category === "URGENT_P2"
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {incident.triage_category}
                  </span>
                </div>

                <p className="text-slate-700 font-medium line-clamp-2 text-xs">
                  {incident.location_name || `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                </p>

                <div className="space-y-1 text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Priority Index:</span>
                    <span className="font-bold text-slate-900">
                      {incident.triage_score.toFixed(0)}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-slate-800">
                      {incident.status}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-blue-600 font-medium pt-1 border-t border-slate-100">
                  Click to inspect & dispatch
                </p>
              </>
            );
          })()
        )}

      </div>
    </div>
  );
}
