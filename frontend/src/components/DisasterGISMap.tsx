"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import DeckGL from "@deck.gl/react/typed";
import { Map } from "react-map-gl/maplibre";
import { HexagonLayer } from "@deck.gl/aggregation-layers/typed";
import { ScatterplotLayer } from "@deck.gl/layers/typed";
import { FlyToInterpolator } from "@deck.gl/core/typed";
import "maplibre-gl/dist/maplibre-gl.css";

import { Incident, SectorClusterData, SectorClusterMetrics } from "@/lib/api";
import { MapTooltip } from "@/components/MapTooltip";
import {
  Layers,
  Box,
  Compass,
  Maximize2,
  Minimize2,
  RefreshCw,
  Radio,
  Shield,
  Eye,
  Sliders,
} from "lucide-react";

// CartoDB Dark Matter style JSON for open-access dark aesthetic
const CARTO_DARK_MATTER_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// 6-class emergency severity color palette
const HEXAGON_COLOR_RANGE: [number, number, number][] = [
  [16, 185, 129],  // Low (Emerald 500)
  [52, 211, 153],  // Low-Moderate (Emerald 400)
  [251, 191, 36],  // Moderate (Amber 400)
  [245, 158, 11],  // Urgent-Moderate (Amber 500)
  [249, 115, 22],  // Urgent (Orange 500)
  [239, 68, 68],   // Critical (Red 500)
];

interface DisasterGISMapProps {
  incidents: Incident[];
  selectedIncident?: Incident | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectCluster?: (cluster: SectorClusterData) => void;
}

/**
 * Calculates aggregate cluster metrics from an array of grouped disaster incidents.
 */
function buildClusterData(
  clusterIncidents: Incident[],
  centroid: [number, number],
  isSinglePin: boolean
): SectorClusterData {
  const totalIncidents = clusterIncidents.length;
  const scores = clusterIncidents.map((i) => i.triage_score || 0);
  const maxTriageScore = scores.length > 0 ? Math.max(...scores) : 0;
  const avgTriageScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const totalTrappedCount = clusterIncidents.reduce(
    (sum, i) => sum + (i?.extracted_entities?.trapped_count || 0),
    0
  );

  const criticalP1Count = clusterIncidents.filter(
    (i) => i.triage_category === "CRITICAL_P1"
  ).length;
  const urgentP2Count = clusterIncidents.filter(
    (i) => i.triage_category === "URGENT_P2"
  ).length;
  const moderateP3Count = clusterIncidents.filter(
    (i) => i.triage_category === "MODERATE_P3"
  ).length;
  const lowP4Count = clusterIncidents.filter(
    (i) => i.triage_category === "LOW_P4"
  ).length;

  // Derive human-readable sector name from highest priority incident
  const topIncident = [...clusterIncidents].sort(
    (a, b) => (b.triage_score || 0) - (a.triage_score || 0)
  )[0];

  const sectorName =
    topIncident?.location_name ||
    `Sector Cluster [${centroid[1].toFixed(3)}, ${centroid[0].toFixed(3)}]`;

  const metrics: SectorClusterMetrics = {
    totalIncidents,
    maxTriageScore,
    avgTriageScore,
    totalTrappedCount,
    criticalP1Count,
    urgentP2Count,
    moderateP3Count,
    lowP4Count,
  };

  return {
    sectorName,
    centroid,
    metrics,
    incidents: clusterIncidents,
    isSinglePin,
  };
}

export function DisasterGISMap({
  incidents,
  selectedIncident,
  onSelectIncident,
  onSelectCluster,
}: DisasterGISMapProps) {
  // Default camera centered on disaster zone (e.g., Prayagraj Sector 3)
  const [viewState, setViewState] = useState<any>({
    longitude: 81.8463,
    latitude: 25.4358,
    zoom: 12.5,
    pitch: 45,
    bearing: -15,
    maxZoom: 20,
    minZoom: 3,
  });

  // Layer & Display Controls
  const [layerMode, setLayerMode] = useState<"both" | "hexagons" | "pins">("both");
  const [is3D, setIs3D] = useState(true);
  const [hexRadius, setHexRadius] = useState(500);
  const [elevationScale, setElevationScale] = useState(15);
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  // Recenter camera when selected incident changes externally
  useEffect(() => {
    if (selectedIncident && selectedIncident.longitude && selectedIncident.latitude) {
      setViewState((prev: any) => ({
        ...prev,
        longitude: selectedIncident.longitude,
        latitude: selectedIncident.latitude,
        zoom: Math.max(prev.zoom || 12.5, 14.5),
        pitch: is3D ? 50 : 0,
        bearing: is3D ? -15 : 0,
        transitionDuration: 800,
        transitionInterpolator: new FlyToInterpolator(),
      }));
    }
  }, [selectedIncident, is3D]);

  // Unified Spatial Click Handler for Hexagons, Pins, and Canvas Clicks
  const handleSpatialClick = useCallback(
    (info: any) => {
      if (!info) return false;

      let clusterIncidents: Incident[] = [];

      // 1. Deck.gl HexagonLayer Points Array
      if (Array.isArray(info.object?.points) && info.object.points.length > 0) {
        clusterIncidents = info.object.points
          .map((p: any) => p?.source || p)
          .filter(Boolean);
      }
      // 2. Single Point or Direct Incident object (ScatterplotLayer)
      else if (info.object) {
        const candidate = (info.object.source || info.object) as Incident;
        if (candidate && (candidate.latitude !== undefined || candidate.id !== undefined)) {
          clusterIncidents = [candidate];
        }
      }

      // 3. Proximity search fallback by coordinate
      if (clusterIncidents.length === 0 && incidents.length > 0) {
        if (info.coordinate) {
          const [lng, lat] = info.coordinate;
          const sorted = [...incidents].sort((a, b) => {
            const dA = (a.longitude - lng) ** 2 + (a.latitude - lat) ** 2;
            const dB = (b.longitude - lng) ** 2 + (b.latitude - lat) ** 2;
            return dA - dB;
          });
          clusterIncidents = [sorted[0]];
        } else {
          clusterIncidents = [incidents[0]];
        }
      }

      if (clusterIncidents.length === 0) return false;

      const isSinglePin = clusterIncidents.length === 1;
      const centroid: [number, number] = info.coordinate || [
        clusterIncidents[0]?.longitude || 81.8463,
        clusterIncidents[0]?.latitude || 25.4358,
      ];

      // Smooth camera flyTo
      setViewState((prev: any) => ({
        ...prev,
        longitude: centroid[0],
        latitude: centroid[1],
        zoom: isSinglePin ? 15.0 : 14.5,
        pitch: 50,
        bearing: -15,
        transitionDuration: 1000,
        transitionInterpolator: new FlyToInterpolator(),
      }));

      // Calculate cluster summary
      const clusterData = buildClusterData(clusterIncidents, centroid, isSinglePin);

      // Trigger callbacks
      if (onSelectCluster) {
        onSelectCluster(clusterData);
      }

      if (onSelectIncident) {
        const topIncident = [...clusterIncidents].sort(
          (a, b) => (b.triage_score || 0) - (a.triage_score || 0)
        )[0];
        onSelectIncident(topIncident);
      }

      return true;
    },
    [incidents, onSelectCluster, onSelectIncident]
  );

  // Toggle 2D / 3D Pitch
  const toggle3D = () => {
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    setViewState((prev: any) => ({
      ...prev,
      pitch: nextIs3D ? 45 : 0,
      bearing: nextIs3D ? -15 : 0,
      transitionDuration: 600,
      transitionInterpolator: new FlyToInterpolator(),
    }));
  };

  // Reset to default overview coordinates
  const handleResetCamera = () => {
    if (incidents.length > 0) {
      const avgLat =
        incidents.reduce((sum, i) => sum + i.latitude, 0) / incidents.length;
      const avgLng =
        incidents.reduce((sum, i) => sum + i.longitude, 0) / incidents.length;
      setViewState({
        longitude: avgLng,
        latitude: avgLat,
        zoom: 12.5,
        pitch: is3D ? 45 : 0,
        bearing: is3D ? -15 : 0,
        maxZoom: 20,
        minZoom: 3,
        transitionDuration: 800,
        transitionInterpolator: new FlyToInterpolator(),
      });
    } else {
      setViewState({
        longitude: 81.8463,
        latitude: 25.4358,
        zoom: 12.5,
        pitch: is3D ? 45 : 0,
        bearing: -15,
        maxZoom: 20,
        minZoom: 3,
        transitionDuration: 800,
        transitionInterpolator: new FlyToInterpolator(),
      });
    }
  };

  // Build Deck.gl Layers
  const layers = useMemo(() => {
    const activeLayers = [];

    // 1. Deck.gl 3D HexagonLayer (Spatial Clustering & Risk Density)
    if (layerMode === "both" || layerMode === "hexagons") {
      activeLayers.push(
        new HexagonLayer<Incident>({
          id: "hexagon-layer",
          data: incidents,
          pickable: true,
          autoHighlight: true,
          highlightColor: [0, 240, 255, 100],
          extruded: is3D,
          radius: hexRadius,
          elevationScale: is3D ? elevationScale : 0,
          coverage: 0.9,
          getPosition: (d: Incident) => [d.longitude, d.latitude],
          getColorWeight: (d: Incident) => d.triage_score || 0,
          getElevationWeight: (d: Incident) => d.triage_score || 0,
          colorRange: HEXAGON_COLOR_RANGE,
          onHover: (info: any) => {
            setHoverInfo(info);
            return true;
          },
          onClick: (info: any) => handleSpatialClick(info),
          updateTriggers: {
            elevationScale: [is3D, elevationScale],
            radius: [hexRadius],
          },
        } as any)
      );
    }

    // 2. Deck.gl ScatterplotLayer (Incident Pinpoint & Focus Mode)
    if (layerMode === "both" || layerMode === "pins") {
      activeLayers.push(
        new ScatterplotLayer<Incident>({
          id: "scatterplot-layer",
          data: incidents,
          pickable: true,
          autoHighlight: true,
          highlightColor: [0, 240, 255, 120],
          opacity: 0.9,
          stroked: true,
          filled: true,
          radiusScale: 6,
          radiusMinPixels: 6,
          radiusMaxPixels: 25,
          lineWidthMinPixels: 2,
          getPosition: (d: Incident) => [d.longitude, d.latitude],
          getRadius: (d: Incident) => Math.max(60, (d.triage_score || 0) * 3),
          getFillColor: (d: Incident) => {
            if (d.triage_category === "CRITICAL_P1") return [239, 68, 68, 230];
            if (d.triage_category === "URGENT_P2") return [249, 115, 22, 220];
            if (d.triage_category === "MODERATE_P3") return [251, 191, 36, 200];
            return [16, 185, 129, 190];
          },
          getLineColor: (d: Incident) =>
            selectedIncident?.id === d.id
              ? [255, 255, 255, 255]
              : [0, 0, 0, 160],
          getLineWidth: (d: Incident) => (selectedIncident?.id === d.id ? 4 : 2),
          onHover: (info: any) => {
            setHoverInfo(info);
            return true;
          },
          onClick: (info: any) => handleSpatialClick(info),
          updateTriggers: {
            getLineColor: [selectedIncident?.id],
            getLineWidth: [selectedIncident?.id],
          },
        } as any)
      );
    }

    return activeLayers;
  }, [
    incidents,
    layerMode,
    is3D,
    hexRadius,
    elevationScale,
    selectedIncident,
    handleSpatialClick,
  ]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-slate-950">
      
      {/* Deck.gl Canvas Overlay strictly confined within bounded box */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={{ doubleClickZoom: false, dragRotate: true }}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "default")}
        style={{ position: "absolute", left: "0px", top: "0px", width: "100%", height: "100%" }}
        onClick={(info: any) => {
          if (info && info.object) {
            let clusterIncidents: Incident[] = [];
            if (Array.isArray(info.object.points)) {
              clusterIncidents = info.object.points.map((p: any) => p.source || p).filter(Boolean);
            } else if (info.object.point) {
              clusterIncidents = [info.object.point.source || info.object.point].filter(Boolean);
            } else if (info.object.id) {
              clusterIncidents = [info.object as Incident];
            } else if (info.object.source) {
              clusterIncidents = [info.object.source as Incident];
            }

            if (clusterIncidents.length > 0 && onSelectCluster) {
              const coords: [number, number] = info.coordinate || [
                clusterIncidents[0].longitude,
                clusterIncidents[0].latitude,
              ];
              const isSinglePin = clusterIncidents.length === 1;
              setViewState((prev: any) => ({
                ...prev,
                longitude: coords[0],
                latitude: coords[1],
                zoom: isSinglePin ? 15.0 : 14.5,
                pitch: 50,
                bearing: -15,
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator(),
              }));
              const clusterData = buildClusterData(clusterIncidents, coords, isSinglePin);
              onSelectCluster(clusterData);
              if (onSelectIncident) {
                const topIncident = [...clusterIncidents].sort(
                  (a, b) => (b.triage_score || 0) - (a.triage_score || 0)
                )[0];
                onSelectIncident(topIncident);
              }
            }
          } else if (info && info.coordinate) {
            handleSpatialClick(info);
          }
        }}
      >
        <Map
          reuseMaps
          mapLib={import("maplibre-gl")}
          mapStyle={CARTO_DARK_MATTER_STYLE}
        />
      </DeckGL>

      {/* Interactive Tooltip Card on Hover */}
      <MapTooltip info={hoverInfo} />

      {/* Floating Control Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 flex-wrap">
        
        {/* Layer View Mode Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-lg text-xs">
          <button
            type="button"
            onClick={() => setLayerMode("both")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              layerMode === "both"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Layers
          </button>
          <button
            type="button"
            onClick={() => setLayerMode("hexagons")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              layerMode === "hexagons"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3D Hexagons
          </button>
          <button
            type="button"
            onClick={() => setLayerMode("pins")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              layerMode === "pins"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pins Only
          </button>
        </div>

        {/* 2D / 3D Toggle */}
        <button
          type="button"
          onClick={toggle3D}
          className={`p-2 rounded-xl border shadow-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
            is3D
              ? "bg-indigo-600/90 border-indigo-500 text-white shadow-indigo-600/20"
              : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800"
          }`}
          title="Toggle 2D / 3D Extrusion"
        >
          <Box className="w-4 h-4" />
          <span>{is3D ? "3D Extruded" : "2D Flat"}</span>
        </button>

        {/* Reset Camera View */}
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 shadow-lg transition-colors cursor-pointer"
          title="Reset Camera Center"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Floating 3D Parameters Controls (Bottom Left) */}
      {is3D && layerMode !== "pins" && (
        <div className="absolute bottom-4 left-4 z-30 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl space-y-2 text-xs w-64">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Hexagon Radius
            </span>
            <span className="font-mono text-indigo-300">{hexRadius}m</span>
          </div>
          <input
            type="range"
            min="200"
            max="1200"
            step="50"
            value={hexRadius}
            onChange={(e) => setHexRadius(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <div className="flex items-center justify-between text-slate-300 font-medium pt-1">
            <span>Height Extrusion</span>
            <span className="font-mono text-indigo-300">{elevationScale}x</span>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            step="1"
            value={elevationScale}
            onChange={(e) => setElevationScale(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {/* Live Map Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-30 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-xl text-[11px] flex items-center gap-3 font-mono">
        <span className="text-slate-400">Risk Intensity:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" title="Low (0-39)" />
          <span className="text-slate-300">P4</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" title="Moderate (40-59)" />
          <span className="text-slate-300">P3</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" title="Urgent (60-79)" />
          <span className="text-slate-300">P2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" title="Critical (80-100)" />
          <span className="text-red-400 font-bold">P1</span>
        </div>
      </div>

    </div>
  );
}
