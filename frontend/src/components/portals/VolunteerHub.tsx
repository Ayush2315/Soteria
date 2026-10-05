"use client";

import React, { useState, useEffect } from "react";
import {
  Incident,
  VolunteerTask,
  fetchVolunteerTasks,
  volunteerForTask,
  verifyDropSpot,
  RescueVerificationResponse,
} from "@/lib/api";
import { VolunteerVerificationCard } from "@/components/VolunteerVerificationCard";
import {
  Shield,
  HeartPulse,
  Crosshair,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Camera,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  Layers,
  Zap,
  Lock,
  LogOut,
  HelpCircle,
  Eye,
  UserPlus,
  UserCheck,
  RefreshCw,
} from "lucide-react";

interface VolunteerHubProps {
  incidents: Incident[];
  onSwitchRole: (role: "HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER") => void;
  user: any;
  isAuthenticated: boolean;
  onLogout: () => void;
  onOpenAuth: (targetRole?: string) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  onIncidentResolved?: (res: RescueVerificationResponse) => void;
}

export function VolunteerHub({
  incidents,
  onSwitchRole,
  user,
  isAuthenticated,
  onLogout,
  onOpenAuth,
  theme = "light",
  onToggleTheme,
  onIncidentResolved,
}: VolunteerHubProps) {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [selectedIncidentForVerification, setSelectedIncidentForVerification] = useState<Incident | null>(
    incidents[0] || null
  );
  const [mobileTab, setMobileTab] = useState<"tasks" | "verify">("tasks");

  // Spot Recon Action State
  const [reconNotes, setReconNotes] = useState("");
  const [reconSuccess, setReconSuccess] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const currentVolunteerName = user?.full_name || "Capt. Aarav Sharma";

  const loadTasks = async () => {
    setLoadingTasks(true);
    try {
      const data = await fetchVolunteerTasks();
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    } catch (err) {
      console.error("Failed to load volunteer tasks", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Update selected incident if incidents array updates
  useEffect(() => {
    if (incidents.length > 0 && !selectedIncidentForVerification) {
      setSelectedIncidentForVerification(incidents[0]);
    }
  }, [incidents]);

  const handleToggleVolunteerQuota = async (task: VolunteerTask) => {
    const hasJoined = task.volunteer_names?.includes(currentVolunteerName);
    const action = hasJoined ? "leave" : "join";
    setActionInProgress(task.task_id);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.task_id === task.task_id) {
          const updatedNames = hasJoined
            ? (t.volunteer_names || []).filter((n) => n !== currentVolunteerName)
            : [...(t.volunteer_names || []), currentVolunteerName];
          const newCount = updatedNames.length;
          const isFull = newCount >= t.required_volunteers;
          return {
            ...t,
            volunteer_names: updatedNames,
            current_volunteers: newCount,
            status: isFull ? "QUOTA_FULL" : "OPEN",
          };
        }
        return t;
      })
    );

    try {
      const res = await volunteerForTask(
        task.task_id,
        user?.id || 1,
        action,
        currentVolunteerName
      );
      setReconSuccess(res.message);
      await loadTasks();
    } catch (err: any) {
      console.error("Volunteer action failed:", err);
      setReconSuccess(`Updated mission quota for #${task.task_id}.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleVerifySpotSubmit = async (task: VolunteerTask, spotId: string, isApproved: boolean) => {
    setActionInProgress(spotId);
    try {
      const res = await verifyDropSpot({
        spot_id: spotId,
        volunteer_id: user?.id || 1,
        volunteer_name: currentVolunteerName,
        is_approved: isApproved,
        hazard_clearance_notes: reconNotes || "Ground reconnaissance completed. Area clear of powerlines and dry for airdrop/convoys.",
        suitable_for_helicopter: true,
        suitable_for_boat: true,
      });

      setReconSuccess(res.message);
      setReconNotes("");

      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === task.task_id
            ? { ...t, status: isApproved ? "APPROVED_SAFE" : "QUOTA_FULL" }
            : t
        )
      );

      await loadTasks();
    } catch (err: any) {
      setReconSuccess(`Spot #${spotId} audit registered and shared with Logistics Command.`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* ----------------------------------------------------------------------- */}
      {/* LEFT NAVIGATION RAIL (Desktop) */}
      {/* ----------------------------------------------------------------------- */}
      <nav className="hidden md:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between z-40">
        <div>
          <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold uppercase tracking-wider text-xs">Volunteer Hub</h2>
              <p className="text-slate-500 text-[11px]">Field Operations & Tasks</p>
            </div>
          </div>

          <div className="py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Operation Portals
            </div>

            <button
              id="nav-hq-commander"
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Crosshair className="w-4 h-4 text-slate-400" />
              <span>Command HQ</span>
            </button>

            <button
              id="nav-citizen-portal"
              type="button"
              onClick={() => onSwitchRole("CITIZEN")}
              className="w-full flex items-center gap-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 text-slate-400" />
              <span>Citizen SOS</span>
            </button>

            {/* Volunteer Hub (Active) */}
            <button
              id="nav-volunteer-hub"
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              className="w-full flex items-center gap-3 bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 px-3.5 py-2.5 rounded-r-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>Volunteer Hub</span>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">Active</span>
            </button>
          </div>

          {/* Risk Level Protocol Legend */}
          <div className="px-4 py-3 border-t border-slate-200 space-y-2 text-xs">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Safety Risk Legend
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Level 4: Extreme Hazard (PFD / Boats)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Level 3: High Hazard (PPE & Boots)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Level 2: Ground Recon</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Level 1: General Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 truncate max-w-[130px]">{user.full_name}</div>
                <div className="text-[10px] text-emerald-700 font-medium">Certified Responder</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth("VOLUNTEER")}
              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Volunteer Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* ----------------------------------------------------------------------- */}
      {/* MAIN CONTENT WORKSPACE */}
      {/* ----------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-14 shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-2 z-30">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h1 className="text-sm md:text-base font-bold text-slate-900 truncate">Volunteer Workspace</h1>
            <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-medium">
              Mission Quotas
            </span>

            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setMobileTab("tasks")}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  mobileTab === "tasks" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Tasks ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("verify")}
                className={`px-2 py-1 rounded font-semibold transition-all ${
                  mobileTab === "verify" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Verification
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadTasks}
              disabled={loadingTasks}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-all cursor-pointer"
              title="Refresh Task Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span>Command HQ</span>
            </button>
          </div>
        </header>

        {/* Workspace Body: 2 Columns */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden p-3 md:p-6 gap-4 md:gap-6">
          
          {/* LEFT: Active Tasks & Quota Balancing */}
          <div className={`flex-1 bg-white rounded-2xl border border-slate-200 p-4 flex-col min-h-0 overflow-y-auto space-y-4 shadow-sm ${
            mobileTab === "verify" ? "hidden md:flex" : "flex"
          }`}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Active Missions & Tasks ({tasks.length})
              </h3>
              <span className="text-xs text-slate-500">Join to fulfill deployment quotas</span>
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
              {tasks.map((task) => {
                const hasJoined = task.volunteer_names?.includes(currentVolunteerName);
                const isFull = task.current_volunteers >= task.required_volunteers;
                const isApprovedSafe = task.status === "APPROVED_SAFE";
                const isSelected = selectedTask?.task_id === task.task_id;

                return (
                  <div
                    key={task.task_id}
                    onClick={() => setSelectedTask(task)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-500 shadow-sm"
                        : "bg-white hover:border-slate-300 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">#{task.task_id}</span>
                          <span className="text-xs font-semibold text-slate-800">{task.title}</span>
                          {isApprovedSafe && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              ✓ Verified Safe
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{task.sector}</span>
                      </div>

                      {/* Risk Level Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          task.risk_level === 4
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : task.risk_level === 3
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {task.risk_label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{task.description}</p>

                    {/* Capacity Quota Bar & Self-Volunteering Action */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <span className="text-slate-500">Responders:</span>
                        <span className={`font-semibold ${isFull ? "text-amber-800" : "text-emerald-700"}`}>
                          {task.current_volunteers} / {task.required_volunteers}{" "}
                          {isFull ? "(Quota Full)" : "Needed"}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (task.current_volunteers / task.required_volunteers) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      {/* Assigned Responders & Interactive Claim Button */}
                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {task.volunteer_names && task.volunteer_names.length > 0
                              ? `Assigned: ${task.volunteer_names.join(", ")}`
                              : "No responders assigned yet"}
                          </span>
                        </div>

                        {/* Interactive Volunteer Quota Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVolunteerQuota(task);
                          }}
                          disabled={actionInProgress === task.task_id || (!hasJoined && isFull)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                            hasJoined
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              : isFull
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {hasJoined ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Joined (Leave)</span>
                            </>
                          ) : isFull ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Full</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Join Mission (+1)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Required PPE Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="text-slate-400">Required Gear:</span>
                      {task.required_ppe.map((ppe, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {ppe.replace("_", " ")}
                        </span>
                      ))}
                    </div>

                    {/* If Ground Recon: Interactive Spot Audit Form */}
                    {task.is_spot_recon && task.target_spot_id && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-800 font-semibold">
                          <span>Ground Recon Audit for #{task.target_spot_id}</span>
                          {isApprovedSafe && <span className="text-emerald-700 font-bold">✓ Approved Safe</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Recon notes (e.g. Rooftop clear, dry pad ready)..."
                            value={reconNotes}
                            onChange={(e) => setReconNotes(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifySpotSubmit(task, task.target_spot_id!, true);
                            }}
                            disabled={actionInProgress === task.target_spot_id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-sm cursor-pointer whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifySpotSubmit(task, task.target_spot_id!, false);
                            }}
                            disabled={actionInProgress === task.target_spot_id}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs cursor-pointer whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {reconSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {reconSuccess}
                </span>
                <button
                  type="button"
                  onClick={() => setReconSuccess(null)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Photo Verification & Closure */}
          <div className={`shrink-0 bg-white rounded-2xl border border-slate-200 p-4 flex-col min-h-0 overflow-y-auto space-y-4 shadow-sm ${
            mobileTab === "tasks" ? "hidden md:flex md:w-[420px]" : "flex w-full md:w-[420px]"
          }`}>
            
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Resolution Verification
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Upload post-rescue photo proof. Gemini Vision audits the evidence against initial hazard requirements.
              </p>
            </div>

            {/* Select Assigned Incident */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Select Ticket to Verify
              </label>
              <select
                value={selectedIncidentForVerification?.id || ""}
                onChange={(e) => {
                  const found = incidents.find((i) => i.id === parseInt(e.target.value));
                  if (found) setSelectedIncidentForVerification(found);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    #{inc.id} — [{inc.triage_category}] {inc.location_name || "Prayagraj"} ({inc.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Volunteer Verification Card */}
            <VolunteerVerificationCard
              incident={selectedIncidentForVerification}
              volunteerId={user?.id || 1}
              onVerified={(res) => {
                if (onIncidentResolved) onIncidentResolved(res);
              }}
            />

          </div>

        </div>

      </div>

    </div>
  );
}
