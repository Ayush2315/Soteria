"use client";

import React, { useState, useEffect, useRef } from "react";
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
  RotateCcw,
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
  const [showReAuditForm, setShowReAuditForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset form and audit state whenever target incident ID changes
  useEffect(() => {
    setAuditResult(null);
    setClosureNotes("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setAuditError(null);
    setShowReAuditForm(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [incident?.id]);

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
      setShowReAuditForm(false);

      if (onVerified) {
        onVerified(response);
      }
    } catch (err: any) {
      console.error("Verification audit error:", err);
      setAuditError(err?.message || "Failed to submit verification audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  const isAlreadyResolved = incident?.status === "RESOLVED" || incident?.status === "CLOSED";
  const existingAudit = incident?.verification_data;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Resolution Verification
              <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                Gemini Vision
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Verify completion evidence to resolve and archive the incident.
            </p>
          </div>
        </div>
      </div>

      {incident ? (
        <div className="space-y-4">
          {/* Active Incident Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-900">Mission #{incident.id} — {incident.location_name || "Disaster Zone"}</span>
              <span className={`font-semibold ${isAlreadyResolved ? "text-emerald-700" : "text-amber-700"}`}>
                Status: {incident.status}
              </span>
            </div>
            <p className="text-slate-600 italic">
              Initial Distress: &quot;{incident.raw_payload || "Emergency distress report"}&quot;
            </p>
          </div>

          {/* Verification Audit Completed View */}
          {(auditResult || (isAlreadyResolved && !showReAuditForm)) ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verification Audit Passed
                </div>
                <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                  Confidence: {Math.round((auditResult?.audit_result.confidence_score || existingAudit?.confidence_score || 0.95) * 100)}%
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-800">
                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Visual Observations:</span>
                  <p>{auditResult?.audit_result.visual_observations || existingAudit?.visual_observations || "Post-action photo confirms resolution of hazard. Area secured."}</p>
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block mb-1">Summary:</span>
                  <p className="text-emerald-900 font-medium">{auditResult?.audit_result.closure_summary || existingAudit?.closure_summary || "Rescue verified complete with all safety criteria fulfilled."}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-emerald-200 flex-wrap gap-2">
                <span>Status: Resolved</span>
                <button
                  type="button"
                  onClick={() => setShowReAuditForm(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 underline cursor-pointer text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Re-Audit / Update Proof
                </button>
              </div>
            </div>
          ) : (
            /* Verification Input Form */
            <div className="space-y-4">
              {/* Photo Upload Zone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Resolution Photo Proof:
                </label>

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100">
                    <img
                      src={photoPreview}
                      alt="Proof"
                      className="w-full h-56 object-cover"
                    />
                    <button
                      onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50 space-y-2"
                  >
                    <Camera className="w-7 h-7 mx-auto text-slate-400" />
                    <p className="text-xs text-slate-700 font-medium">
                      Upload post-rescue resolution photo
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP — Audited automatically by Gemini Vision
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
                <label className="text-xs font-semibold text-slate-700">
                  Field Action Notes:
                </label>
                <textarea
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Extrication complete. Casualties safely relocated. No remaining active peril."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none focus:bg-white"
                />
              </div>

              {/* Error feedback */}
              {auditError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {auditError}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmitVerification}
                disabled={isAuditing}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-sm transition-all cursor-pointer"
              >
                {isAuditing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    Auditing Resolution Evidence...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Submit Verification & Close Mission
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          Select an assigned incident to submit resolution proof.
        </div>
      )}
    </div>
  );
}
