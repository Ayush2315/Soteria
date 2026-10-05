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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                SOTERIA
              </span>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded">
                Operational Core
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Offline-Resilient Multimodal Disaster Response</p>
          </div>
        </div>

        {/* Persona Mode Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("commander")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "commander"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Commander HQ
          </button>
          <button
            onClick={() => setActiveTab("citizen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "citizen"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Citizen SOS
          </button>
          <button
            onClick={() => setActiveTab("volunteer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "volunteer"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Volunteer Hub
          </button>
        </div>

        {/* Backend & PostGIS Status Indicators */}
        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <Database className={`w-3.5 h-3.5 ${health?.database.postgis_enabled ? "text-emerald-600" : "text-amber-600"}`} />
            <span className="text-slate-700 font-medium">
              PostGIS: {loading ? "Checking..." : health?.database.postgis_enabled ? "Active" : "Ready"}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-slate-700 font-mono">FastAPI</span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors font-medium"
            title="Open Swagger OpenAPI Documentation"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
}
