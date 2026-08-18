"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Incident,
  WebSocketIncidentEvent,
  getWebSocketUrl,
} from "@/lib/api";

/**
 * Synthesizes a high-urgency rescue alert tone using Web Audio API.
 * Guarantees zero external audio file dependencies.
 */
function playEmergencyChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Tone 1: High frequency alert beep (880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2: Harmonized descending urgent chime (587.33 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(587.33, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn("Web Audio API chime could not play (user interaction may be required):", err);
  }
}

export function useIncidentWebSocket(initialIncidents: Incident[] = []) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [isConnected, setIsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState<{
    incident: Incident;
    event: string;
    triage_breakdown?: any;
  } | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backoffRef = useRef<number>(1000);
  const isMountedRef = useRef<boolean>(true);

  // Sync initial incidents when loaded from REST API
  useEffect(() => {
    if (initialIncidents.length > 0) {
      setIncidents((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newOnes = initialIncidents.filter((i) => !existingIds.has(i.id));
        return [...prev, ...newOnes];
      });
    }
  }, [initialIncidents]);

  const connectWebSocket = useCallback(() => {
    if (typeof window === "undefined") return;

    // Close any previous socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const wsUrl = getWebSocketUrl();
    console.log(`[SOTERIA WS] Connecting to ${wsUrl}...`);

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.log("[SOTERIA WS] Connected to live incident broadcast stream.");
        setIsConnected(true);
        backoffRef.current = 1000; // Reset backoff on successful connection
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload: WebSocketIncidentEvent = JSON.parse(event.data);

          if (payload.event === "INCIDENT_CREATED" && payload.data) {
            const newIncident = payload.data;
            console.log(`[SOTERIA WS] Ingested Incident #${newIncident.id} [${newIncident.triage_category}] Score: ${newIncident.triage_score}`);

            // Prepend new incident to state
            setIncidents((prev) => [
              newIncident,
              ...prev.filter((i) => i.id !== newIncident.id),
            ]);

            setLatestAlert({
              incident: newIncident,
              event: payload.event,
              triage_breakdown: payload.triage_breakdown,
            });

            // Play synthesized emergency chime for CRITICAL_P1 incidents
            if (newIncident.triage_category === "CRITICAL_P1") {
              playEmergencyChime();
            }
          } else if (
            (payload.event === "INCIDENT_UPDATED" ||
              payload.event === "DISPATCH_ASSIGNED" ||
              payload.event === "INCIDENT_RESOLVED") &&
            payload.data
          ) {
            const updated = payload.data;
            console.log(`[SOTERIA WS] Event ${payload.event}: Incident #${updated.id} status is now ${updated.status}`);

            setIncidents((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );

            setLatestAlert({
              incident: updated,
              event: payload.event,
              triage_breakdown: payload.triage_breakdown,
            });
          }
        } catch (parseErr) {
          console.warn("[SOTERIA WS] Could not parse WebSocket message:", parseErr);
        }
      };

      ws.onerror = (error) => {
        console.warn("[SOTERIA WS] Socket connection error:", error);
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        console.log(`[SOTERIA WS] Socket closed (code ${event.code}). Retrying in ${backoffRef.current}ms...`);
        setIsConnected(false);
        socketRef.current = null;

        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 1.5, 10000);
          connectWebSocket();
        }, backoffRef.current);
      };
    } catch (err) {
      console.error("[SOTERIA WS] Connection initialization failed:", err);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connectWebSocket();

    // Periodic heartbeat ping every 25 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send("ping");
      }
    }, 25000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connectWebSocket]);

  const clearLatestAlert = () => setLatestAlert(null);

  return {
    incidents,
    setIncidents,
    isConnected,
    latestAlert,
    clearLatestAlert,
  };
}
