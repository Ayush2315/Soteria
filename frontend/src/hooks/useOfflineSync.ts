"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPendingDistressQueue,
  removeQueuedDistress,
  getPendingCount,
  OfflineDistressPayload,
} from "@/lib/offlineStorage";
import { submitMultimodalIncident, MultimodalTriageResponse } from "@/lib/api";

interface UseOfflineSyncOptions {
  onSyncComplete?: (results: MultimodalTriageResponse[]) => void;
}

export function useOfflineSync(options?: UseOfflineSyncOptions) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  // Update online state and count
  const refreshStatus = useCallback(async () => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const count = await getPendingCount();
      setPendingCount(count);
    }
  }, []);

  // Flush all queued distress reports to backend
  const flushQueue = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine || isSyncing) return;

    const queue: OfflineDistressPayload[] = await getPendingDistressQueue();
    if (queue.length === 0) {
      setPendingCount(0);
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(`Syncing ${queue.length} offline emergency distress reports...`);
    console.log(`[SOTERIA OfflineSync] Flushing ${queue.length} reports to backend...`);

    const syncedResults: MultimodalTriageResponse[] = [];

    for (const item of queue) {
      try {
        const formData = new FormData();
        if (item.text) formData.append("text", item.text);
        if (item.locationName) formData.append("location_name", item.locationName);
        formData.append("latitude", item.latitude.toString());
        formData.append("longitude", item.longitude.toString());
        formData.append("is_offline_cached", "true");

        if (item.audioBlob) {
          const ext = item.audioBlob.type.includes("webm") ? "webm" : "wav";
          formData.append("audio", item.audioBlob, `offline_voice_${item.uuid}.${ext}`);
        }

        if (item.imageBlob) {
          const imgName = item.imageName || `offline_photo_${item.uuid}.jpg`;
          formData.append("image", item.imageBlob, imgName);
        }

        const res = await submitMultimodalIncident(formData);
        syncedResults.push(res);

        if (item.id !== undefined) {
          await removeQueuedDistress(item.id);
        }
      } catch (err: any) {
        console.error(`[SOTERIA OfflineSync] Failed to sync item #${item.id}:`, err);
      }
    }

    const remaining = await getPendingCount();
    setPendingCount(remaining);
    setIsSyncing(false);

    if (syncedResults.length > 0) {
      setLastSyncResult(`Successfully synced ${syncedResults.length} distress reports!`);
      if (options?.onSyncComplete) {
        options.onSyncComplete(syncedResults);
      }
      setTimeout(() => setLastSyncResult(null), 6000);
    }
  }, [isSyncing, options]);

  useEffect(() => {
    refreshStatus();

    const handleOnline = () => {
      console.log("[SOTERIA OfflineSync] Network connectivity RESTORED. Triggering queue burst.");
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      console.log("[SOTERIA OfflineSync] Network DISCONNECTED. Offline caching active.");
      setIsOnline(false);
      refreshStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic check for pending count
    const interval = setInterval(refreshStatus, 4000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [refreshStatus, flushQueue]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    refreshStatus,
    syncNow: flushQueue,
  };
}
