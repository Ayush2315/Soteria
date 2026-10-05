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
  Users,
  CheckSquare,
  Square,
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
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<number[]>([]);
  const [commanderNotes, setCommanderNotes] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  useEffect(() => {
    if (incident && isOpen) {
      setLoadingVolunteers(true);
      setDispatchError(null);
      setDispatchSuccess(false);

      fetchNearbyVolunteers(incident.id, 15000, 10)
        .then((vols) => {
          setNearbyVolunteers(vols);
          const avail = vols.filter((v) => v.status === "AVAILABLE");
          if (avail.length > 0) {
            setSelectedVolunteerIds([avail[0].id]);
          } else if (vols.length > 0) {
            setSelectedVolunteerIds([vols[0].id]);
          } else {
            setSelectedVolunteerIds([]);
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

  const toggleVolunteer = (id: number) => {
    setSelectedVolunteerIds((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id]
    );
  };

  const selectAllAvailable = () => {
    const availIds = nearbyVolunteers
      .filter((v) => v.status === "AVAILABLE")
      .map((v) => v.id);
    setSelectedVolunteerIds(availIds.length > 0 ? availIds : nearbyVolunteers.map((v) => v.id));
  };

  const clearSelection = () => {
    setSelectedVolunteerIds([]);
  };

  const handleDispatch = async () => {
    if (selectedVolunteerIds.length === 0) {
      setDispatchError("Please select at least one volunteer responder.");
      return;
    }

    setIsDispatching(true);
    setDispatchError(null);

    try {
      const response = await assignVolunteer(
        incident.id,
        selectedVolunteerIds,
        commanderNotes
      );
      setDispatchSuccess(true);
      setTimeout(() => {
        onDispatchComplete(response);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Dispatch assignment failed:", err);
      setDispatchError(err?.message || "Failed to dispatch volunteer(s).");
    } finally {
      setIsDispatching(false);
    }
  };

  const selectedVolunteers = nearbyVolunteers.filter((v) =>
    selectedVolunteerIds.includes(v.id)
  );
  const anyBusySelected = selectedVolunteers.some(
    (v) => v.status === "DISPATCHED" || v.status === "BUSY"
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border-l border-slate-200 text-slate-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Volunteer Dispatch</h2>
                <TriageBadge category={incident.triage_category} />
              </div>
              <p className="text-xs text-slate-500">
                Incident #{incident.id} — Proximity Matching & Safety Briefing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Incident Context Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {incident.location_name || `Coordinates: ${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
              </span>
              <span className="font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                Priority: {incident.triage_score.toFixed(1)} / 100
              </span>
            </div>
            <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
              &quot;{incident.raw_payload || "Multimodal emergency distress call ingested."}&quot;
            </p>
          </div>

          {/* Dynamic AI Safety SOP Briefing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Responder Safety SOP Briefing
              </h3>
              <span className="text-[11px] text-slate-400">Gemini Directive</span>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-3">
              <p className="text-blue-950 font-medium leading-relaxed">
                {incident.safety_sop.urgency_summary || "Ground response active. Proceed with certified equipment."}
              </p>

              {/* Recommended Gear */}
              {incident.safety_sop.recommended_gear && incident.safety_sop.recommended_gear.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Required PPE / Equipment:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {incident.safety_sop.recommended_gear.map((gear, idx) => (
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

              {/* 3-Bullet Protocol Steps */}
              {incident.safety_sop.protocol_steps && incident.safety_sop.protocol_steps.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-blue-200">
                  <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Action Steps:</span>
                  <ul className="space-y-1.5 text-slate-700">
                    {incident.safety_sop.protocol_steps.map((step, idx) => (
                      <li key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed shadow-sm">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* PostGIS Nearest Volunteers Multi-Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  Nearest Responders
                </h3>
                <span className="text-[11px] text-slate-500">Select responders for deployment</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllAvailable}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium cursor-pointer"
                >
                  Select Available
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingVolunteers ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <Navigation className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Calculating distances via PostGIS...</p>
              </div>
            ) : nearbyVolunteers.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600">No active volunteers found within 15km.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nearbyVolunteers.map((vol) => {
                  const isSelected = selectedVolunteerIds.includes(vol.id);
                  const isAvailable = vol.status === "AVAILABLE";

                  return (
                    <div
                      key={vol.id}
                      onClick={() => toggleVolunteer(vol.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-50/70 border-blue-500 shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={isSelected ? "text-blue-600" : "text-slate-400"}>
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900">{vol.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                  isAvailable
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {isAvailable ? "Available" : "Active on Mission"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {vol.phone}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {vol.distance_km} km away
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mt-2.5 ml-7">
                        {vol.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
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

          {/* Busy Warning Banner */}
          {anyBusySelected && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> One or more selected responders are currently on another task. Assigning will reassign them.
              </span>
            </div>
          )}

          {/* Commander Custom Deployment Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Deployment Directives (Optional):
            </label>
            <textarea
              value={commanderNotes}
              onChange={(e) => setCommanderNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Deploy team with inflatable boat from Sangam North."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Error / Success feedback */}
          {dispatchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {dispatchError}
            </div>
          )}

          {dispatchSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Volunteer team successfully dispatched!
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleDispatch}
            disabled={isDispatching || selectedVolunteerIds.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            {isDispatching ? (
              <>
                <Radio className="w-4 h-4 animate-spin text-white" />
                Transmitting Dispatch...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Dispatch {selectedVolunteerIds.length} Responder(s)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
