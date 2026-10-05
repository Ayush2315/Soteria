"use client";

import React, { useEffect, useState } from "react";
import { Shield, Radio, Database, Cpu, ExternalLink } from "lucide-react";
import { checkBackendHealth, HealthCheck } from "@/lib/api";

interface NavbarProps {
  activeTab: "commander" | "citizen" | "volunteer";
  setActiveTab: (tab: "commander" | "citizen" | "volunteer") => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHealth() {
      const data = await checkBackendHealth();
      setHealth(data);
      setLoading(false);
    }
    loadHealth();
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = health?.status === "healthy" && health?.database.postgis_enabled;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SOTERIA
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                M1 Core Skeleton
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Offline-First Multimodal AI Disaster Triage</p>
          </div>
        </div>

        {/* Persona Mode Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("commander")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "commander"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Commander GIS
          </button>
          <button
            onClick={() => setActiveTab("citizen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "citizen"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Citizen SOS (PWA)
          </button>
          <button
            onClick={() => setActiveTab("volunteer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "volunteer"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Volunteer SOP
          </button>
        </div>

        {/* Backend & PostGIS Status Indicators */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Database className={`w-3.5 h-3.5 ${health?.database.postgis_enabled ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="text-slate-300">
              PostGIS: {loading ? "Checking..." : health?.database.postgis_enabled ? "Active" : "Ready"}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-slate-300 font-mono">FastAPI :8000</span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
            title="Open Swagger OpenAPI Documentation"
          >
            <span>Swagger</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
}
