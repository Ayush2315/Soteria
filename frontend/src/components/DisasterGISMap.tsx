"use client";

import React, { useState, useMemo, useEffect } from "react";
import DeckGL from "@deck.gl/react/typed";
import { Map } from "react-map-gl/maplibre";
import { HexagonLayer } from "@deck.gl/aggregation-layers/typed";
import { ScatterplotLayer } from "@deck.gl/layers/typed";
import "maplibre-gl/dist/maplibre-gl.css";

import { Incident } from "@/lib/api";
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
}

export function DisasterGISMap({
  incidents,
  selectedIncident,
  onSelectIncident,
}: DisasterGISMapProps) {
  // Default camera centered on disaster zone (e.g., Prayagraj Sector 3)
  const [viewState, setViewState] = useState({
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

  // Recenter camera when selected incident changes
  useEffect(() => {
    if (selectedIncident) {
      setViewState((prev) => ({
        ...prev,
        longitude: selectedIncident.longitude,
        latitude: selectedIncident.latitude,
        zoom: Math.max(prev.zoom, 14),
        transitionDuration: 800,
      }));
    }
  }, [selectedIncident]);

  // Toggle 2D / 3D Pitch
  const toggle3D = () => {
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    setViewState((prev) => ({
      ...prev,
      pitch: nextIs3D ? 45 : 0,
      bearing: nextIs3D ? -15 : 0,
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
      });
    }
  };

  // Build Deck.gl Layers
  const layers = useMemo(() => {
    const activeLayers = [];

    // 1. Deck.gl 3D HexagonLayer (Spatial Clustering & Risk Density)
    if (layerMode === "both" || layerMode === "hexagons") {
      activeLayers.push(
        new HexagonLayer({
          id: "hexagon-layer",
          data: incidents,
          pickable: true,
          extruded: is3D,
          radius: hexRadius,
          elevationScale: is3D ? elevationScale : 0,
          coverage: 0.9,
          getPosition: (d: Incident) => [d.longitude, d.latitude],
          getColorWeight: (d: Incident) => d.triage_score,
          getElevationWeight: (d: Incident) => d.triage_score,
          colorRange: HEXAGON_COLOR_RANGE,
          onHover: (info: any) => setHoverInfo(info),
          onClick: (info: any) => {
            if (info.object?.points?.[0]?.source && onSelectIncident) {
              onSelectIncident(info.object.points[0].source);
            }
          },
          updateTriggers: {
            elevationScale: [is3D, elevationScale],
            radius: [hexRadius],
          },
        })
      );
    }

    // 2. Deck.gl ScatterplotLayer (Incident Pinpoint & Focus Mode)
    if (layerMode === "both" || layerMode === "pins") {
      activeLayers.push(
        new ScatterplotLayer({
          id: "scatterplot-layer",
          data: incidents,
          pickable: true,
          opacity: 0.9,
          stroked: true,
          filled: true,
          radiusScale: 6,
          radiusMinPixels: 6,
          radiusMaxPixels: 25,
          lineWidthMinPixels: 2,
          getPosition: (d: Incident) => [d.longitude, d.latitude],
          getRadius: (d: Incident) => Math.max(60, d.triage_score * 3),
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
          onHover: (info: any) => setHoverInfo(info),
          onClick: (info: any) => {
            if (info.object && onSelectIncident) {
              onSelectIncident(info.object as Incident);
            }
          },
          updateTriggers: {
            getLineColor: [selectedIncident?.id],
            getLineWidth: [selectedIncident?.id],
          },
        })
      );
    }

    return activeLayers;
  }, [incidents, layerMode, is3D, hexRadius, elevationScale, selectedIncident, onSelectIncident]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl bg-slate-950">
      
      {/* Deck.gl Canvas Overlay with CartoDB Dark Matter Base Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={true}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "default")}
      >
        <Map
          reuseMaps
          mapLib={import("maplibre-gl")}
          mapStyle={CARTO_DARK_MATTER_STYLE}
          preventStyleDiffing={true}
        />
      </DeckGL>

      {/* Interactive Tooltip Card on Hover */}
      <MapTooltip info={hoverInfo} />

      {/* Floating Control Toolbar (Top Right) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 flex-wrap">
        
        {/* Layer View Mode Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-lg text-xs">
          <button
            type="button"
            onClick={() => setLayerMode("both")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              layerMode === "both"
                ? "bg-blue-600 text-white shadow-sm"
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
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Hexagons
          </button>
          <button
            type="button"
            onClick={() => setLayerMode("pins")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              layerMode === "pins"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Pins
          </button>
        </div>

        {/* 2D / 3D Extrusion Toggle */}
        <button
          type="button"
          onClick={toggle3D}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
            is3D
              ? "bg-indigo-600/90 text-white border-indigo-500 shadow-indigo-500/20"
              : "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700"
          }`}
          title="Toggle 3D Elevation Columns"
        >
          <Box className="w-3.5 h-3.5" />
          {is3D ? "3D Mesh On" : "2D Flat"}
        </button>

        {/* Camera Reset */}
        <button
          type="button"
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white shadow-lg backdrop-blur-md transition-colors"
          title="Reset Camera Coordinates"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating System Metric Badges (Top Left) */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shadow-lg text-xs font-mono">
          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="text-white font-bold">{incidents.length} Geospatial Incidents</span>
          <span className="text-[10px] text-slate-400 border-l border-slate-800 pl-2">EPSG:4326</span>
        </div>
      </div>

      {/* Bottom Severity Legend */}
      <div className="absolute bottom-3 left-3 z-30 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-slate-800 shadow-lg text-xs space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
          Hexagon Risk Density
        </span>
        <div className="flex items-center gap-1.5">
          <div className="flex h-2.5 w-28 rounded-full overflow-hidden">
            <div className="w-1/4 bg-emerald-500" />
            <div className="w-1/4 bg-amber-400" />
            <div className="w-1/4 bg-orange-500" />
            <div className="w-1/4 bg-red-600" />
          </div>
          <div className="flex justify-between w-28 text-[9px] font-mono text-slate-400">
            <span>Low</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Hex Radius & Elevation Slider Drawer (Bottom Right) */}
      {is3D && (
        <div className="absolute bottom-3 right-3 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-lg text-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>3D Height:</span>
            <input
              type="range"
              min="5"
              max="40"
              value={elevationScale}
              onChange={(e) => setElevationScale(Number(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

    </div>
  );
}
