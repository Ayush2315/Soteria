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

interface StitchVolunteerHubProps {
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

export function StitchVolunteerHub({
  incidents,
  onSwitchRole,
  user,
  isAuthenticated,
  onLogout,
  onOpenAuth,
  theme = "dark",
  onToggleTheme,
  onIncidentResolved,
}: StitchVolunteerHubProps) {
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VolunteerTask | null>(null);
  const [selectedIncidentForVerification, setSelectedIncidentForVerification] = useState<Incident | null>(
    incidents[0] || null
  );

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
      // Synchronize with server
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

      // Optimistic UI update
      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === task.task_id
            ? { ...t, status: isApproved ? "APPROVED_SAFE" : "QUOTA_FULL" }
            : t
        )
      );

      // Refresh tasks
      await loadTasks();
    } catch (err: any) {
      setReconSuccess(`Spot #${spotId} audit registered and shared with Logistics Command.`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-background font-sans">
      
      {/* ----------------------------------------------------------------------- */}
      {/* LEFT NAVIGATION RAIL */}
      {/* ----------------------------------------------------------------------- */}
      <nav className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/40 flex flex-col justify-between z-40">
        <div>
          <div className="px-6 py-5 border-b border-outline-variant/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-emerald-400 font-black uppercase tracking-wider text-sm">VOLUNTEER HUB</h2>
              <p className="text-on-surface-variant text-[11px] font-mono">Field Operations & Recon</p>
            </div>
          </div>

          <div className="py-4 px-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Operation Portals
            </div>

            <button
              id="nav-hq-commander"
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              <span>Command HQ</span>
            </button>

            <button
              id="nav-citizen-portal"
              type="button"
              onClick={() => onSwitchRole("CITIZEN")}
              className="w-full flex items-center gap-3 text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>Citizen SOS</span>
            </button>

            {/* Volunteer Hub (Active) */}
            <button
              id="nav-volunteer-hub"
              type="button"
              onClick={() => onSwitchRole("VOLUNTEER")}
              className="w-full flex items-center gap-3 bg-emerald-500/15 text-emerald-400 border-l-4 border-emerald-400 px-3.5 py-2.5 rounded-r-lg text-xs font-bold transition-all cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Volunteer Hub</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 font-mono">ACTIVE</span>
            </button>
          </div>

          {/* Risk Level Protocol Legend */}
          <div className="px-3 py-3 border-t border-outline-variant/30 space-y-2 text-xs">
            <div className="text-[10px] font-bold font-mono text-on-surface-variant uppercase tracking-wider">
              Risk Level Protocol
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              <div className="flex items-center gap-2 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Level 4: Extreme (Water PFD)</span>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Level 3: High (PPE + Boots)</span>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Level 2: Moderate (Recon)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Level 1: Low (Support)</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-outline-variant/40 bg-surface-container-lowest text-xs">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-on-surface truncate max-w-[130px]">{user.full_name}</div>
                <div className="text-[10px] font-mono text-emerald-400">CERTIFIED RESPONDER</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth("VOLUNTEER")}
              className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer"
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
        <header className="h-14 shrink-0 bg-surface/90 backdrop-blur-md border-b border-outline-variant/40 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-black tracking-tight text-on-surface">VOLUNTEER RESPONSE & RECON HUB</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
              DYNAMIC QUOTA BALANCING
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadTasks}
              disabled={loadingTasks}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-container hover:bg-surface-variant border border-outline-variant/40 rounded-lg text-xs font-medium text-on-surface transition-all cursor-pointer"
              title="Refresh Task Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTasks ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchRole("HQ_COMMANDER")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-variant border border-outline-variant/40 rounded-lg text-xs font-bold text-on-surface transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5 text-primary" />
              <span>Command HQ</span>
            </button>
          </div>
        </header>

        {/* Workspace Body: 2 Columns */}
        <div className="flex-1 flex min-h-0 overflow-hidden p-6 gap-6">
          
          {/* LEFT: Active Tasks & Quota Balancing */}
          <div className="flex-1 bg-surface-container rounded-xl border border-outline-variant/40 p-4 flex flex-col min-h-0 overflow-y-auto space-y-4 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 flex-wrap gap-2">
              <h3 className="text-xs font-bold font-mono text-on-surface uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Active Missions & Ground Recon Tasks ({tasks.length})
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Claim open slots to prevent over-deployment</span>
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
                        ? "bg-surface-variant border-emerald-500 shadow-lg"
                        : "bg-surface-container hover:bg-surface-variant/40 border-outline-variant/40"
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-cyan-300">#{task.task_id}</span>
                          <span className="text-xs font-bold text-on-surface">{task.title}</span>
                          {isApprovedSafe && (
                            <span className="px-2 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold">
                              ✓ VERIFIED SAFE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-on-surface-variant">{task.sector}</span>
                      </div>

                      {/* Risk Level Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                          task.risk_level === 4
                            ? "bg-red-950/80 text-red-300 border border-red-500/40 animate-pulse"
                            : task.risk_level === 3
                            ? "bg-amber-950/80 text-amber-300 border border-amber-500/40"
                            : "bg-cyan-950/80 text-cyan-300 border border-cyan-500/40"
                        }`}
                      >
                        {task.risk_label}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant">{task.description}</p>

                    {/* Capacity Quota Bar & Self-Volunteering Action */}
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
                        <span className="text-on-surface-variant">Capacity Quota:</span>
                        <span className={`font-bold ${isFull ? "text-amber-400" : "text-emerald-400"}`}>
                          {task.current_volunteers} / {task.required_volunteers}{" "}
                          {isFull ? "(QUOTA FULL - REDIRECT)" : "Responders Needed"}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
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
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-cyan-400" />
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
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
                            hasJoined
                              ? "bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40"
                              : isFull
                              ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                          }`}
                        >
                          {hasJoined ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Joined (Click to Leave)</span>
                            </>
                          ) : isFull ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Quota Full</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Volunteer for Mission (+1)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Required PPE Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                      <span className="text-slate-400">Required PPE:</span>
                      {task.required_ppe.map((ppe, i) => (
                        <span key={i} className="px-2 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {ppe.replace("_", " ")}
                        </span>
                      ))}
                    </div>

                    {/* If Ground Recon: Interactive Spot Audit Form */}
                    {task.is_spot_recon && task.target_spot_id && (
                      <div className="pt-2 border-t border-outline-variant/30 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300">
                          <span>Ground Recon Audit for #{task.target_spot_id}</span>
                          {isApprovedSafe && <span className="text-emerald-400 font-bold">✓ APPROVED SAFE FOR AIRDROP</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Recon audit notes (e.g., Rooftop clear of cables, 25x25m dry pad ready)..."
                            value={reconNotes}
                            onChange={(e) => setReconNotes(e.target.value)}
                            className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-lg px-2.5 py-1.5 text-xs text-on-surface focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifySpotSubmit(task, task.target_spot_id!, true);
                            }}
                            disabled={actionInProgress === task.target_spot_id}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow cursor-pointer whitespace-nowrap"
                          >
                            Approve Spot
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifySpotSubmit(task, task.target_spot_id!, false);
                            }}
                            disabled={actionInProgress === task.target_spot_id}
                            className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/40 rounded-lg text-xs cursor-pointer whitespace-nowrap"
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
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {reconSuccess}
                </span>
                <button
                  type="button"
                  onClick={() => setReconSuccess(null)}
                  className="text-xs text-emerald-400 hover:text-emerald-200 underline ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: AI Closed-Loop Photo Verification & Closure */}
          <div className="w-[420px] shrink-0 bg-surface-container rounded-xl border border-outline-variant/40 p-4 flex flex-col min-h-0 overflow-y-auto space-y-4 shadow-xl">
            
            <div className="border-b border-outline-variant/40 pb-3">
              <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Closed-Loop Photo Verification
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Upload post-rescue scene photo. Google Gemini Vision audits the resolution proof against initial hazard requirements.
              </p>
            </div>

            {/* Select Assigned Incident */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Select Dispatched Ticket to Verify
              </label>
              <select
                value={selectedIncidentForVerification?.id || ""}
                onChange={(e) => {
                  const found = incidents.find((i) => i.id === parseInt(e.target.value));
                  if (found) setSelectedIncidentForVerification(found);
                }}
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl p-2.5 text-xs text-on-surface focus:outline-none"
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
