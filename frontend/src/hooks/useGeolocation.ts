"use client";

import { useState, useCallback, useEffect } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  locationName: string;
  loading: boolean;
  error: string | null;
  locate: () => Promise<{ latitude: number; longitude: number; locationName: string } | null>;
}

/**
 * Format coordinates into human-readable string: e.g. "Coordinates: 25.4358° N, 81.8463° E"
 */
function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `Coordinates: ${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Perform reverse geocoding via OpenStreetMap Nominatim with strict 2.5-second timeout.
 * When offline or on timeout/network failure, falls back to formatted GPS string immediately.
 */
async function reverseGeocodeWithTimeout(lat: number, lng: number): Promise<string> {
  const fallback = formatCoordinates(lat, lng);

  // If browser reports offline, skip network request entirely
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return fallback;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "en",
        "User-Agent": "SoteriaDisasterApp/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallback;
    }

    const data = await res.json();
    if (data && data.display_name) {
      // Return a concise address snippet (e.g. road / suburb / city)
      const addr = data.address || {};
      const parts = [
        addr.road || addr.pedestrian || addr.suburb,
        addr.neighbourhood || addr.city_district || addr.city || addr.town || addr.county,
        addr.state,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(", ") : data.display_name.split(",").slice(0, 3).join(",").trim();
    }

    return fallback;
  } catch (_err) {
    // Aborted or network error -> return coordinate fallback without throwing
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * One-tap HTML5 GPS auto-locate hook with reverse geocoding and strict offline fallback.
 */
export function useGeolocation(autoLocateOnMount = false): GeolocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async (): Promise<{ latitude: number; longitude: number; locationName: string } | null> => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const acc = position.coords.accuracy;

          setLatitude(lat);
          setLongitude(lng);
          setAccuracy(acc);

          // Reverse geocode with 2.5s strict timeout
          const resolvedName = await reverseGeocodeWithTimeout(lat, lng);
          setLocationName(resolvedName);
          setLoading(false);

          resolve({
            latitude: lat,
            longitude: lng,
            locationName: resolvedName,
          });
        },
        async (geoErr) => {
          // Fallback to Prayagraj default disaster zone if permission denied or unavailable in dev
          console.warn("Geolocation prompt failed or denied:", geoErr.message);
          const fallbackLat = 25.4358;
          const fallbackLng = 81.8463;
          const fallbackName = "North Ghat, Sangam, Prayagraj (Default)";

          setLatitude(fallbackLat);
          setLongitude(fallbackLng);
          setAccuracy(50);
          setLocationName(fallbackName);
          setError(`Using default location (${geoErr.message})`);
          setLoading(false);

          resolve({
            latitude: fallbackLat,
            longitude: fallbackLng,
            locationName: fallbackName,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  }, []);

  useEffect(() => {
    if (autoLocateOnMount) {
      locate();
    }
  }, [autoLocateOnMount, locate]);

  return {
    latitude,
    longitude,
    accuracy,
    locationName,
    loading,
    error,
    locate,
  };
}
