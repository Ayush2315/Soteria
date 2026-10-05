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
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
              <span className="font-semibold tracking-wide text-xs text-amber-900">
                Offline Mode (No Connection)
              </span>
              <span className="text-amber-700 hidden sm:inline text-xs">
                — Distress audio, photos & reports are queued safely on your device.
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-medium">
                {pendingCount} SOS {pendingCount === 1 ? "report" : "reports"} queued
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Online with Pending Reports Waiting for Sync */}
      {isOnline && pendingCount > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-blue-950">
                Signal Restored
              </span>
              <span className="text-blue-800">
                {pendingCount} offline {pendingCount === 1 ? "report is" : "reports are"} ready to sync.
              </span>
            </div>
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync All Now"}
            </button>
          </div>
        </div>
      )}

      {/* 3. Sync Completion Notification */}
      {lastSyncResult && isOnline && pendingCount === 0 && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-950">{lastSyncResult}</span>
            </div>
            <span className="text-xs text-emerald-700 font-medium">Sync Complete</span>
          </div>
        </div>
      )}
    </div>
  );
}
