"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Incident,
  SectorClusterData,
  fetchIncidents,
  MultimodalTriageResponse,
  DispatchAssignResponse,
  RescueVerificationResponse,
  checkBackendHealth,
  HealthCheck,
} from "@/lib/api";
import { useIncidentWebSocket } from "@/hooks/useIncidentWebSocket";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";
import { OfflineBanner } from "@/components/OfflineBanner";
import { VolunteerDispatchDrawer } from "@/components/VolunteerDispatchDrawer";
import { SectorDossierDrawer } from "@/components/SectorDossierDrawer";
import { SitRepModal } from "@/components/SitRepModal";
import { StitchHQCommander } from "@/components/stitch/StitchHQCommander";
import { StitchCitizenPortal } from "@/components/stitch/StitchCitizenPortal";
import { StitchVolunteerHub } from "@/components/stitch/StitchVolunteerHub";

export default function Home() {
  const { user, role, isAuthenticated, logout, openAuthModal } = useAuth();

  // Active Role Portal ("HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER")
  const [activePortal, setActivePortal] = useState<"HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER">("HQ_COMMANDER");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const [initialIncidents, setInitialIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthCheck | null>(null);

  // Modals & Drawers State
  const [activeSectorCluster, setActiveSectorCluster] = useState<SectorClusterData | null>(null);
  const [isSectorDrawerOpen, setIsSectorDrawerOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isSitRepOpen, setIsSitRepOpen] = useState(false);

  // Hook up Real-Time WebSocket state stream
  const { incidents, setIncidents, isConnected, latestAlert, clearLatestAlert } =
    useIncidentWebSocket(initialIncidents);

  // Hook up Offline-First IndexedDB synchronization
  const {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncResult,
    syncNow,
  } = useOfflineSync({
    onSyncComplete: (synced) => {
      if (synced.length > 0) {
        const newIncidents = synced.map((s) => s.incident);
        setIncidents((prev) => [...newIncidents, ...prev.filter((p) => !newIncidents.some((n) => n.id === p.id))]);
      }
    },
  });

  // Toggle Theme Class on Root HTML
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Load initial incidents and backend health
  useEffect(() => {
    async function loadData() {
      try {
        const [incidentsData, healthData] = await Promise.all([
          fetchIncidents(),
          checkBackendHealth(),
        ]);
        setInitialIncidents(incidentsData);
        setHealth(healthData);
        if (incidentsData.length > 0) {
          setSelectedIncident(incidentsData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch initial incidents or health", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update active portal when user logs in with a specific role
  useEffect(() => {
    if (user?.role === "VOLUNTEER") {
      setActivePortal("VOLUNTEER");
    } else if (user?.role === "HQ_COMMANDER") {
      setActivePortal("HQ_COMMANDER");
    }
  }, [user]);

  const handleSwitchRole = (targetRole: "HQ_COMMANDER" | "CITIZEN" | "VOLUNTEER") => {
    if (targetRole === "CITIZEN") {
      setActivePortal("CITIZEN");
    } else if (targetRole === "VOLUNTEER") {
      if (!isAuthenticated || (user?.role !== "VOLUNTEER" && user?.role !== "HQ_COMMANDER")) {
        openAuthModal("VOLUNTEER");
      } else {
        setActivePortal("VOLUNTEER");
      }
    } else {
      // HQ_COMMANDER
      if (!isAuthenticated || user?.role !== "HQ_COMMANDER") {
        openAuthModal("HQ_COMMANDER");
      } else {
        setActivePortal("HQ_COMMANDER");
      }
    }
  };

  const handleDispatchComplete = useCallback((res: DispatchAssignResponse) => {
    const assignedId = res.volunteer?.id || res.volunteers?.[0]?.id || 1;
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === res.incident_id
          ? {
              ...inc,
              status: "DISPATCHED" as const,
              assigned_volunteer_id: assignedId,
            }
          : inc
      )
    );
    setSelectedIncident((prev) =>
      prev && prev.id === res.incident_id
        ? {
            ...prev,
            status: "DISPATCHED" as const,
            assigned_volunteer_id: assignedId,
          }
        : prev
    );
  }, [setIncidents]);

  const handleVerificationComplete = useCallback((res: RescueVerificationResponse) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === res.incident_id
          ? {
              ...inc,
              status: "RESOLVED" as const,
            }
          : inc
      )
    );
    setSelectedIncident((prev) =>
      prev && prev.id === res.incident_id
        ? {
            ...prev,
            status: "RESOLVED" as const,
          }
        : prev
    );
  }, [setIncidents]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-on-background selection:bg-primary selection:text-white font-sans">
      
      {/* Offline Sync Banner */}
      <OfflineBanner
        isOnline={isOnline}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        lastSyncResult={lastSyncResult}
        onSyncNow={syncNow}
      />

      {/* RENDER ACTIVE STITCH VIEW */}
      {activePortal === "HQ_COMMANDER" && (
        <StitchHQCommander
          incidents={incidents}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => {
            setSelectedIncident(inc);
          }}
          onSelectCluster={(cluster) => {
            setActiveSectorCluster(cluster);
            setIsSectorDrawerOpen(true);
          }}
          onOpenDispatch={(inc) => {
            if (!isAuthenticated || user?.role !== "HQ_COMMANDER") {
              openAuthModal("HQ_COMMANDER");
            } else {
              setSelectedIncident(inc);
              setIsDispatchOpen(true);
            }
          }}
          onOpenSitRep={() => setIsSitRepOpen(true)}
          onSwitchRole={handleSwitchRole}
          isConnected={isConnected}
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          onOpenAuth={(role) => openAuthModal(role as any)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {activePortal === "CITIZEN" && (
        <StitchCitizenPortal
          onSwitchRole={handleSwitchRole}
          onSOSCreated={(newInc) => {
            setIncidents((prev) => [newInc, ...prev]);
            setSelectedIncident(newInc);
          }}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {activePortal === "VOLUNTEER" && (
        <StitchVolunteerHub
          incidents={incidents}
          onSwitchRole={handleSwitchRole}
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          onOpenAuth={(role) => openAuthModal(role as any)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onIncidentResolved={handleVerificationComplete}
        />
      )}

      {/* Global Modals & Slide-over Drawers */}
      <SectorDossierDrawer
        cluster={activeSectorCluster}
        selectedIncident={selectedIncident}
        isOpen={isSectorDrawerOpen}
        onClose={() => setIsSectorDrawerOpen(false)}
        onSelectIncidentInCluster={(inc) => {
          setSelectedIncident(inc);
        }}
        onOpenDispatch={(inc) => {
          if (!isAuthenticated || user?.role !== "HQ_COMMANDER") {
            openAuthModal("HQ_COMMANDER");
          } else {
            setSelectedIncident(inc);
            setIsDispatchOpen(true);
          }
        }}
      />

      <VolunteerDispatchDrawer
        incident={selectedIncident}
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onDispatchComplete={handleDispatchComplete}
      />

      <SitRepModal
        isOpen={isSitRepOpen}
        onClose={() => setIsSitRepOpen(false)}
      />

      {/* Role-Based Authentication & Access Gateway Modal */}
      <AuthModal />
    </div>
  );
}
