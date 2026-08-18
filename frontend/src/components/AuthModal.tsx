"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { UserRole } from "@/lib/api";
import {
  Shield,
  Lock,
  Mail,
  User,
  HeartPulse,
  Monitor,
  Radio,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalRole,
    closeAuthModal,
    login,
    register,
    loginAsDemo,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>(authModalRole || "HQ_COMMANDER");
  const [error, setError] = useState<string | null>(null);

  // Sync role if modal was triggered with a target role requirement
  React.useEffect(() => {
    if (authModalRole) {
      setRole(authModalRole);
    }
  }, [authModalRole]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          role,
        });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    }
  };

  const handleDemoFill = async (demoRole: UserRole) => {
    setError(null);
    try {
      await loginAsDemo(demoRole);
    } catch (err: any) {
      setError(err.message || "Demo login failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1A1D21] border border-[#2C3136] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative font-sans">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#2C3136] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {mode === "login" ? "Sign In to Soteria Gateway" : "Create Soteria Account"}
          </h2>
          <p className="text-xs text-slate-400">
            {authModalRole === "HQ_COMMANDER"
              ? "HQ Commander role required to access 3D Tactical GIS and Dispatch."
              : authModalRole === "VOLUNTEER"
              ? "Volunteer or Commander role required to access Mission SOPs and Verification."
              : "Role-Based JWT Authentication for Emergency Personnel."}
          </p>
        </div>

        {/* 1-Click Demo Evaluation Fill Pills */}
        <div className="p-3 bg-[#222529] rounded-xl border border-[#2C3136] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              1-Click Demo Logins:
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Evaluator Quick-Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoFill("HQ_COMMANDER")}
              className="px-2.5 py-1.5 bg-[#350d36] hover:bg-[#522653] border border-[#522653] hover:border-cyan-400 text-cyan-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer text-center"
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Demo Commander</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoFill("VOLUNTEER")}
              className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/50 hover:border-emerald-400 text-emerald-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer text-center"
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
              <span>Demo Volunteer</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher (Sign In / Create Account) */}
        <div className="flex items-center bg-[#222529] p-1 rounded-xl border border-[#2C3136] text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              mode === "login"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              mode === "register"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === "register" && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Commander Rajiv Malhotra"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#222529] border border-[#383F45] focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                required
                placeholder="e.g. commander@soteria.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#222529] border border-[#383F45] focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#222529] border border-[#383F45] focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-[#222529] border border-[#383F45] focus:border-cyan-400 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="HQ_COMMANDER">HQ Commander (Full Tactical GIS & Dispatch)</option>
                <option value="VOLUNTEER">Volunteer Responder (Safety SOPs & Closure Audit)</option>
                <option value="CITIZEN">Citizen (Emergency SOS Reporting)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating with Soteria PostGIS...</span>
            ) : mode === "login" ? (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest Citizen Disclaimer */}
        <div className="pt-2 border-t border-[#2C3136] text-center text-[11px] text-slate-400">
          <span>In an immediate life-safety peril? </span>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-cyan-400 hover:underline font-semibold cursor-pointer"
          >
            Report SOS without account ➔
          </button>
        </div>

      </div>
    </div>
  );
}
