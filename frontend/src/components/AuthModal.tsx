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
  X,
  AlertCircle,
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    }
  };

  const handleDemoFill = async (demoRole: UserRole) => {
    setError(null);
    try {
      await loginAsDemo(demoRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Demo login failed";
      setError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-slate-900 font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shadow-sm">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            {mode === "login" ? "Personnel Authentication" : "Register Personnel Account"}
          </h2>
          <p className="text-xs text-slate-500">
            {authModalRole === "HQ_COMMANDER"
              ? "Command HQ credentials required for operational dispatch."
              : authModalRole === "VOLUNTEER"
              ? "Volunteer credentials required for ground SOPs and verification."
              : "Role-Based Access Control for disaster response staff."}
          </p>
        </div>

        {/* 1-Click Test Credentials */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-700 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              1-Click Demo Accounts:
            </span>
            <span className="text-[10px] text-slate-400">Quick Access</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoFill("HQ_COMMANDER")}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-600" />
              <span>Commander</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoFill("VOLUNTEER")}
              className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              <span>Volunteer</span>
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
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
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === "register" && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Commander Rajiv Malhotra"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-medium mb-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                required
                placeholder="commander@soteria.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
              >
                <option value="HQ_COMMANDER">HQ Commander (GIS Map & Dispatch)</option>
                <option value="VOLUNTEER">Volunteer Responder (Tasks & Closure Audit)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating...</span>
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

        {/* Guest Citizen SOS */}
        <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>In immediate danger? </span>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Report SOS without account ➔
          </button>
        </div>
      </div>
    </div>
  );
}
export default AuthModal;
