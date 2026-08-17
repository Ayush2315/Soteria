/**
 * SOTERIA Backend API Client & TypeScript Interfaces
 */

export interface DatabaseHealth {
  status: string;
  postgis_enabled: boolean;
  postgis_version?: string;
  error?: string;
}

export interface HealthCheck {
  app: string;
  version: string;
  status: "healthy" | "degraded" | "error";
  timestamp: string;
  environment: string;
  database: DatabaseHealth;
}

export type SourceType = "VOICE" | "IMAGE" | "TEXT" | "SOCIAL" | "SENSOR";
export type TriageCategory = "CRITICAL_P1" | "URGENT_P2" | "MODERATE_P3" | "LOW_P4";
export type IncidentStatus = "REPORTED" | "TRIAGED" | "DISPATCHED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Incident {
  id: number;
  created_at: string;
  updated_at: string;
  source_type: SourceType;
  raw_payload?: string;
  audio_url?: string;
  image_urls: string[];
  location_name?: string;
  latitude: float;
  longitude: float;
  triage_score: number;
  triage_category: TriageCategory;
  status: IncidentStatus;
  extracted_entities: {
    trapped_count?: number;
    medical_needs?: string[];
    hazard_types?: string[];
    vulnerable_people?: {
      elderly?: number;
      children?: number;
      disabled?: number;
    };
    detected_language?: string;
    confidence_score?: number;
  };
  safety_sop: {
    urgency_summary?: string;
    hazards_detected?: string[];
    recommended_gear?: string[];
    protocol_steps?: string[];
  };
  assigned_volunteer_id?: number | null;
  verification_data?: Record<string, any>;
  is_offline_cached: boolean;
  client_timestamp?: string;
}

// Ensure float type helper
type float = number;

export interface IncidentCreatePayload {
  source_type: SourceType;
  raw_payload?: string;
  audio_url?: string;
  image_urls?: string[];
  location_name?: string;
  latitude: number;
  longitude: number;
  is_offline_cached?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkBackendHealth(): Promise<HealthCheck> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/health`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Health check failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      app: "SOTERIA",
      version: "0.1.0",
      status: "degraded",
      timestamp: new Date().toISOString(),
      environment: "client-fallback",
      database: {
        status: "connecting",
        postgis_enabled: false,
        error: err?.message || "Backend offline or starting up",
      },
    };
  }
}

export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/incidents?limit=50`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch incidents: ${res.status}`);
    }
    return await res.json();
  } catch {
    // Return sample triage incidents for demonstration during initial startup
    return [
      {
        id: 101,
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        source_type: "VOICE",
        raw_payload: "Water level rose 4 feet in 20 minutes near North Bridge! 2 elderly people and 1 child trapped on second floor roof.",
        image_urls: [],
        location_name: "North Ghat, Sector 3, Prayagraj",
        latitude: 25.4358,
        longitude: 81.8463,
        triage_score: 92.5,
        triage_category: "CRITICAL_P1",
        status: "TRIAGED",
        extracted_entities: {
          trapped_count: 3,
          medical_needs: ["HYPOTHERMIA_RISK", "MOBILITY_ASSISTANCE"],
          hazard_types: ["RAPID_FLOOD", "STRUCTURAL_COLLAPSE"],
          vulnerable_people: { elderly: 2, children: 1, disabled: 0 },
          detected_language: "Hindi / Bhojpuri dialect",
          confidence_score: 0.96,
        },
        safety_sop: {
          urgency_summary: "High-risk water ingress with vulnerable individuals. Watercraft rescue required.",
          hazards_detected: ["Fast Water Currents", "Submerged Obstacles", "Power Grid Exposure"],
          recommended_gear: ["Inflatable Motorized Boat", "PFDs (Adult & Child)", "Thermal Blankets", "Rope Rescue Rig"],
          protocol_steps: [
            "1. Approach building from upstream eddy to prevent boat capsizing.",
            "2. Secure safety anchor to second-story balcony frame.",
            "3. Transfer child first with infant PFD, followed by elderly victims.",
            "4. Immediate transport to Dry Evac Hub A.",
          ],
        },
        is_offline_cached: false,
      },
      {
        id: 102,
        created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        source_type: "IMAGE",
        raw_payload: "Photo SOS: Wall collapsed over alleyway, electricity transformer sparking nearby.",
        image_urls: ["https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80"],
        location_name: "Old City Main Market, Lane 7",
        latitude: 25.4412,
        longitude: 81.8329,
        triage_score: 74.0,
        triage_category: "URGENT_P2",
        status: "DISPATCHED",
        extracted_entities: {
          trapped_count: 1,
          medical_needs: ["TRAUMA_BANDAGING"],
          hazard_types: ["ELECTRICAL_HAZARD", "STRUCTURAL_DEBRIS"],
          vulnerable_people: { elderly: 0, children: 0, disabled: 0 },
          detected_language: "en",
          confidence_score: 0.91,
        },
        safety_sop: {
          urgency_summary: "Live electrical arcing near collapsed masonry. Power isolation required before debris removal.",
          hazards_detected: ["High Voltage Arcing", "Unstable Wall Sections"],
          recommended_gear: ["Dielectric Safety Gloves (10kV)", "Hard Hat", "Crowbars / Hydraulic Spreader"],
          protocol_steps: [
            "1. Cordon off 15m radius around sparking transformer.",
            "2. Coordinate with municipal electrical grid team for localized shutdown.",
            "3. Extract victim from under light debris pile.",
          ],
        },
        is_offline_cached: true,
      },
      {
        id: 103,
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        source_type: "TEXT",
        raw_payload: "Food and clean drinking water running low at community shelter. 45 people housed here.",
        image_urls: [],
        location_name: "Sharda High School Shelter, Zone 2",
        latitude: 25.4289,
        longitude: 81.8541,
        triage_score: 48.0,
        triage_category: "MODERATE_P3",
        status: "IN_PROGRESS",
        extracted_entities: {
          trapped_count: 0,
          medical_needs: ["POTABLE_WATER", "RATION_SUPPLIES"],
          hazard_types: ["RESOURCE_SHORTAGE"],
          vulnerable_people: { elderly: 8, children: 12, disabled: 2 },
          detected_language: "en",
          confidence_score: 0.98,
        },
        safety_sop: {
          urgency_summary: "Supply replenishment request. No immediate active physical trauma.",
          hazards_detected: ["Road Obstructions on Approach"],
          recommended_gear: ["Supply Transport Vehicle (High Clearance)", "Water Purification Tablets"],
          protocol_steps: [
            "1. Deliver 50 ration kits and 200L clean water jugs.",
            "2. Confirm shelter coordinator signature.",
          ],
        },
        is_offline_cached: false,
      },
    ];
  }
}

export async function submitIncident(payload: IncidentCreatePayload): Promise<Incident> {
  const res = await fetch(`${API_BASE}/api/v1/incidents/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit incident: ${res.statusText}`);
  }
  return await res.json();
}
