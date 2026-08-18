"use client";

import React, { useState, useEffect } from "react";
import {
  Incident,
  VolunteerWithDistance,
  fetchNearbyVolunteers,
  assignVolunteer,
  DispatchAssignResponse,
} from "@/lib/api";
import { TriageBadge } from "@/components/ui/StatusBadge";
import {
  X,
  Shield,
  MapPin,
  Clock,
  Phone,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Radio,
  Send,
  Sparkles,
} from "lucide-react";

interface VolunteerDispatchDrawerProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatchComplete: (response: DispatchAssignResponse) => void;
}

export function VolunteerDispatchDrawer({
  incident,
  isOpen,
  onClose,
  onDispatchComplete,
}: VolunteerDispatchDrawerProps) {
  const [nearbyVolunteers, setNearbyVolunteers] = useState<VolunteerWithDistance[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<number | null>(null);
  const [commanderNotes, setCommanderNotes] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    if (incident && isOpen) {
      setLoadingVolunteers(true);
      setDispatchError(null);
      setDispatchSuccess(false);

      fetchNearbyVolunteers(incident.id, 15000, 5)
        .then((vols) => {
          setNearbyVolunteers(vols);
          if (vols.length > 0) {
            setSelectedVolunteerId(vols[0].id);
          }
        })
        .catch((err) => {
          console.error("Failed to load nearby volunteers:", err);
          setDispatchError("Could not calculate nearest responders via PostGIS.");
        })
        .finally(() => setLoadingVolunteers(false));
    }
  }, [incident, isOpen]);

  if (!isOpen || !incident) return null;

  const handleDispatch = async () => {
    if (!selectedVolunteerId) {
      setDispatchError("Please select an available volunteer responder.");
      return;
    }

    setIsDispatching(true);
    setDispatchError(null);

    try {
      const response = await assignVolunteer(incident.id, selectedVolunteerId, commanderNotes);
      setDispatchSuccess(true);
      setTimeout(() => {
        onDispatchComplete(response);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Dispatch assignment failed:", err);
      setDispatchError(err?.message || "Failed to dispatch volunteer.");
    } finally {
      setIsDispatching(false);
    }
  };

  const selectedVolunteer = nearbyVolunteers.find((v) => v.id === selectedVolunteerId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0B101D] border-l border-indigo-500/30 text-slate-100 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Volunteer Proximity Dispatch Hub</h2>
                <TriageBadge category={incident.triage_category} />
              </div>
              <p className="text-xs text-slate-400">
                Incident #{incident.id} — PostGIS Geodesic Matcher & AI SOP Briefing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Incident Context Card */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                {incident.location_name || `Coordinates: ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                Priority: {incident.triage_score.toFixed(1)} / 100
              </span>
            </div>
            <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800 italic">
              &quot;{incident.raw_payload || "Multimodal emergency distress call ingested."}&quot;
            </p>
          </div>

          {/* Dynamic 3-Bullet AI Safety SOP Briefing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Automated Responder Safety SOP Briefing
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Gemini 1.5 Flash Directive</span>
            </div>

            <div className="p-4 bg-cyan-950/20 rounded-xl border border-cyan-500/30 text-xs space-y-3">
              <p className="text-cyan-200 font-semibold leading-relaxed">
                {incident.safety_sop.urgency_summary || "Ground response active. Proceed with certified equipment."}
              </p>

              {/* Recommended Gear */}
              {incident.safety_sop.recommended_gear && incident.safety_sop.recommended_gear.length > 0 && (
                <div>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Required PPE / Rescue Gear:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {incident.safety_sop.recommended_gear.map((gear, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-900 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800"
                      >
                        🛡️ {gear}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 3-Bullet Protocol Steps */}
              {incident.safety_sop.protocol_steps && incident.safety_sop.protocol_steps.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-cyan-900/40">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide">Tactical Steps:</span>
                  <ul className="space-y-1.5 text-slate-300">
                    {incident.safety_sop.protocol_steps.map((step, idx) => (
                      <li key={idx} className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[11px] leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* PostGIS Nearest Volunteers Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-indigo-400" />
                Nearest Certified Responders (PostGIS Spatial Rank)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Within 15km Search Radius</span>
            </div>

            {loadingVolunteers ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <Navigation className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Querying PostGIS geodesic distances...</p>
              </div>
            ) : nearbyVolunteers.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/60 rounded-xl border border-slate-800">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300">No active volunteers found within 15km radius.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nearbyVolunteers.map((vol) => {
                  const isSelected = vol.id === selectedVolunteerId;
                  return (
                    <div
                      key={vol.id}
                      onClick={() => setSelectedVolunteerId(vol.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/10"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-indigo-400 bg-indigo-500" : "border-slate-600"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white">{vol.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2 font-mono flex items-center gap-1 inline-flex">
                              <Phone className="w-2.5 h-2.5" />
                              {vol.phone}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {vol.distance_km} km away
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mt-2.5 ml-6">
                        {vol.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Commander Custom Deployment Notes */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
              Commander Deployment Directives (Optional):
            </label>
            <textarea
              value={commanderNotes}
              onChange={(e) => setCommanderNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Deploy inflatable boat from upstream Sangam pier. Prioritize infant evacuation."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          </div>

          {/* Error / Success feedback */}
          {dispatchError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {dispatchError}
            </div>
          )}

          {dispatchSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Volunteer successfully dispatched! Real-time WebSocket broadcast transmitted.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleDispatch}
            disabled={isDispatching || !selectedVolunteerId || nearbyVolunteers.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xl shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {isDispatching ? (
              <>
                <Radio className="w-4 h-4 animate-spin text-white" />
                Transmitting Dispatch Order...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Dispatch {selectedVolunteer?.name || "Responder"} with AI SOP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
