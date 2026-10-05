"use client";

import React from "react";
import { MapPin, Loader2 } from "lucide-react";

interface LocateButtonProps {
  onLocate: (coords: { latitude: number; longitude: number; locationName: string }) => void;
  loading?: boolean;
  className?: string;
}

export function LocateButton({ onLocate, loading = false, className = "" }: LocateButtonProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);

  const handleClick = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setInternalLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let locName = `Coordinates: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;

        // Attempt 2.5s Nominatim reverse geocode if online
        if (navigator.onLine) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
              { signal: controller.signal }
            );
            clearTimeout(timer);
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(",").slice(0, 3).join(",").trim();
                locName = parts;
              }
            }
          } catch (_e) {
            // timeout/network fail fallback
          } finally {
            clearTimeout(timer);
          }
        }

        setInternalLoading(false);
        onLocate({ latitude: lat, longitude: lng, locationName: locName });
      },
      (err) => {
        console.warn("Geolocation failed, using Prayagraj center fallback:", err.message);
        setInternalLoading(false);
        onLocate({
          latitude: 25.4358,
          longitude: 81.8463,
          locationName: "North Ghat, Sangam, Prayagraj (Default)",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const isLoading = loading || internalLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
      ) : (
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
      )}
      <span>{isLoading ? "Acquiring GPS..." : "Auto-Locate Me"}</span>
    </button>
  );
}
export default LocateButton;
