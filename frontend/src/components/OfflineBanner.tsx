"use client";

import React from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncResult: string | null;
  onSyncNow: () => void;
}

export function OfflineBanner({
  isOnline,
  pendingCount,
  isSyncing,
  lastSyncResult,
  onSyncNow,
}: OfflineBannerProps) {
  // If online, zero pending items, and no recent sync result toast, render nothing
  if (isOnline && pendingCount === 0 && !lastSyncResult) {
    return null;
  }

  return (
    <div className="w-full transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 1. Offline Mode Indicator */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/50 px-4 py-2 text-xs text-amber-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-bold tracking-wide uppercase font-mono text-[11px] text-amber-300">
                Offline Mode Active (Dead-Zone)
              </span>
              <span className="text-slate-400 hidden sm:inline">
                — Distress audio, photos & forms are queued safely in IndexedDB.
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded border border-amber-600/40">
                {pendingCount} SOS {pendingCount === 1 ? "report" : "reports"} queued
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Online with Pending Reports Waiting for Sync */}
      {isOnline && pendingCount > 0 && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/50 px-4 py-2 text-xs text-indigo-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">
                Cellular Signal Restored!
              </span>
              <span className="text-slate-300">
                {pendingCount} offline distress {pendingCount === 1 ? "report is" : "reports are"} ready to sync.
              </span>
            </div>
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold text-[11px] shadow-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing to PostGIS..." : "Sync All Now"}
            </button>
          </div>
        </div>
      )}

      {/* 3. Sync Completion Notification */}
      {lastSyncResult && isOnline && pendingCount === 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/50 px-4 py-2 text-xs text-emerald-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-emerald-300">{lastSyncResult}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">PostGIS + Gemini Ingest Complete</span>
          </div>
        </div>
      )}
    </div>
  );
}
