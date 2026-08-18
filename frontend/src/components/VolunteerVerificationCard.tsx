"use client";

import React, { useState, useRef } from "react";
import {
  Incident,
  verifyIncidentResolution,
  RescueVerificationResponse,
} from "@/lib/api";
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Clock,
  Trash2,
  Send,
  Radio,
} from "lucide-react";

interface VolunteerVerificationCardProps {
  incident: Incident | null;
  volunteerId?: number;
  onVerified?: (response: RescueVerificationResponse) => void;
}

export function VolunteerVerificationCard({
  incident,
  volunteerId = 1,
  onVerified,
}: VolunteerVerificationCardProps) {
  const [closureNotes, setClosureNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<RescueVerificationResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
      setAuditError(null);
    }
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitVerification = async () => {
    if (!incident) return;
    if (!photoFile && !closureNotes.trim()) {
      setAuditError("Please upload a resolution photo or provide field completion notes.");
      return;
    }

    setIsAuditing(true);
    setAuditError(null);

    try {
      const formData = new FormData();
      formData.append("incident_id", incident.id.toString());
      formData.append("volunteer_id", volunteerId.toString());
      if (closureNotes.trim()) formData.append("closure_notes", closureNotes.trim());
      if (photoFile) formData.append("photo", photoFile, photoFile.name);

      const response = await verifyIncidentResolution(formData);
      setAuditResult(response);

      if (onVerified) {
        onVerified(response);
      }
    } catch (err: any) {
      console.error("AI Verification Audit error:", err);
      setAuditError(err?.message || "Failed to submit verification audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-xl border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              AI Closed-Loop Verification & Photo Proof Audit
              <span className="text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                Gemini Vision
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit post-rescue evidence against the initial hazard profile to safely close ticket.
            </p>
          </div>
        </div>
      </div>

      {incident ? (
        <div className="space-y-4">
          {/* Active Incident Summary */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-mono">
              <span>Target Mission: #{incident.id} — {incident.location_name || "Disaster Zone"}</span>
              <span className="text-amber-400 font-bold">Status: {incident.status}</span>
            </div>
            <p className="text-slate-300 italic">
              Initial Distress: &quot;{incident.raw_payload || "Emergency distress report"}&quot;
            </p>
          </div>

          {/* Verification Audit Completed Card */}
          {auditResult ? (
            <div className="p-5 bg-emerald-950/30 rounded-xl border border-emerald-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Gemini Vision Closed-Loop Verification PASSED
                </div>
                <span className="text-xs font-mono bg-emerald-900/60 text-emerald-300 px-2.5 py-1 rounded border border-emerald-600/40">
                  Confidence: {Math.round(auditResult.audit_result.confidence_score * 100)}%
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-200">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Visual Observations:</span>
                  <p>{auditResult.audit_result.visual_observations}</p>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="font-mono text-slate-400 uppercase text-[10px] block mb-1">Closure Executive Receipt:</span>
                  <p className="text-emerald-300 font-semibold">{auditResult.audit_result.closure_summary}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-emerald-900/40">
                <span>Incident State: RESOLVED</span>
                <span>Verified at: {new Date(auditResult.resolved_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            /* Verification Input Form */
            <div className="space-y-4">
              {/* Photo Upload Zone */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Post-Rescue Photo Evidence (Resolution Proof):
                </label>

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-indigo-500/40 max-h-56 bg-slate-950">
                    <img
                      src={photoPreview}
                      alt="Proof"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-lg"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/40 space-y-2"
                  >
                    <Camera className="w-8 h-8 mx-auto text-slate-400 animate-pulse" />
                    <p className="text-xs text-slate-300 font-semibold">
                      Click to upload or capture resolution proof photo
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WEBP — Audited automatically by Gemini 1.5 Flash Vision
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Field Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wide">
                  Field Action & Resolution Notes:
                </label>
                <textarea
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g., Extrication complete. 4 casualties transferred to dry triage boat. No active peril remaining."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              {/* Error feedback */}
              {auditError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  {auditError}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitVerification}
                disabled={isAuditing}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xl shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {isAuditing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    Gemini Vision Auditing Resolution Evidence...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Submit AI Photo Audit & Verify Resolution
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400">
          Select an assigned incident to submit resolution verification proof.
        </div>
      )}
    </div>
  );
}
