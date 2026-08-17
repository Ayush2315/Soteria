/**
 * SOTERIA Backend API Client & TypeScript Interfaces
 * Multimodal AI Ingestion, PostGIS Spatial Triage, and Responder Operations.
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

export interface VulnerableGroupBreakdown {
  elderly: number;
  children: number;
  pregnant: number;
  disabled: number;
}

export interface SafetySOP {
  summary: string;
  bullet_1: string;
  bullet_2: string;
  bullet_3: string;
}

export interface MultimodalGeminiExtraction {
  detected_language: string;
  transcript: string;
  translation_en: string;
  hazard_type: string;
  hazard_severity: number;
  people_affected: number;
  vulnerable_groups: VulnerableGroupBreakdown;
  is_trapped: boolean;
  trapped_count: number;
  injuries_reported: string[];
  extracted_location?: string;
  safety_sop: SafetySOP;
  confidence_score: number;
}

export interface TriageBreakdown {
  hazard_severity_score: number;
  trapped_factor_score: number;
  vulnerability_score: number;
  medical_injury_score: number;
  recency_factor_score: number;
  final_score: number;
  triage_category: TriageCategory;
}

export interface Incident {
  id: number;
  created_at: string;
  updated_at: string;
  source_type: SourceType;
  raw_payload?: string;
  audio_url?: string;
  image_urls: string[];
  location_name?: string;
  latitude: number;
  longitude: number;
  triage_score: number;
  triage_category: TriageCategory;
  status: IncidentStatus;
  extracted_entities: {
    trapped_count?: number;
    is_trapped?: boolean;
    medical_needs?: string[];
    hazard_types?: string[];
    hazard_severity?: number;
    people_affected?: number;
    vulnerable_people?: {
      elderly?: number;
      children?: number;
      pregnant?: number;
      disabled?: number;
    };
    detected_language?: string;
    translation_en?: string;
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

export interface MultimodalTriageResponse {
  incident: Incident;
  extraction: MultimodalGeminiExtraction;
  triage_breakdown: TriageBreakdown;
  audio_playback_url?: string | null;
  image_preview_url?: string | null;
}

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
      version: "0.2.0",
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
    // Return rich sample triage incidents for demonstration during initial startup
    return [
      {
        id: 101,
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        source_type: "VOICE",
        raw_payload: "बाढ़ का पानी छत तक पहुँच गया है! 3 लोग फंसे हैं, एक बच्चा और बुजुर्ग हैं।",
        audio_url: undefined,
        image_urls: [],
        location_name: "North Ghat, Sector 3, Prayagraj",
        latitude: 25.4358,
        longitude: 81.8463,
        triage_score: 93.5,
        triage_category: "CRITICAL_P1",
        status: "TRIAGED",
        extracted_entities: {
          trapped_count: 3,
          is_trapped: true,
          medical_needs: ["HYPOTHERMIA_RISK", "MOBILITY_ASSISTANCE"],
          hazard_types: ["FLOOD"],
          hazard_severity: 9,
          people_affected: 3,
          vulnerable_people: { elderly: 1, children: 1, pregnant: 0, disabled: 0 },
          detected_language: "Hindi / Bhojpuri",
          translation_en: "Flood water has reached the roof! 3 people are trapped, including a child and an elderly person.",
          confidence_score: 0.96,
        },
        safety_sop: {
          urgency_summary: "Rapid water ingress with marooned casualties. Watercraft extraction protocol active.",
          hazards_detected: ["FLOOD"],
          recommended_gear: ["Inflatable Motorized Boat", "PFDs (Adult & Child)", "Thermal Blankets", "Rope Rescue Rig"],
          protocol_steps: [
            "1. Deploy inflatable rescue boat with upstream anchoring to prevent capsizing in swift currents.",
            "2. Equip all casualties with PFDs; prioritize evacuation of infants and elderly to dry triage vessel.",
            "3. Administer thermal foil blankets for hypothermia and transport to Primary Evacuation Hub.",
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
        triage_score: 76.0,
        triage_category: "URGENT_P2",
        status: "DISPATCHED",
        extracted_entities: {
          trapped_count: 1,
          is_trapped: true,
          medical_needs: ["TRAUMA_BANDAGING"],
          hazard_types: ["ELECTRICAL", "STRUCTURAL_COLLAPSE"],
          hazard_severity: 8,
          people_affected: 2,
          vulnerable_people: { elderly: 0, children: 0, pregnant: 0, disabled: 0 },
          detected_language: "English",
          translation_en: "Photo SOS: Wall collapsed over alleyway, electricity transformer sparking nearby.",
          confidence_score: 0.91,
        },
        safety_sop: {
          urgency_summary: "Live electrical arcing near collapsed masonry. Power isolation required before debris removal.",
          hazards_detected: ["ELECTRICAL", "STRUCTURAL_COLLAPSE"],
          recommended_gear: ["Dielectric Safety Gloves (10kV)", "Hard Hat", "Crowbars / Hydraulic Spreader"],
          protocol_steps: [
            "1. Establish 20-meter safety perimeter and request emergency power grid isolation.",
            "2. Approach upwind wearing dielectric gloves (10kV) and SCBA breathing apparatus.",
            "3. Extract victims away from toxic smoke plume and initiate high-flow oxygen therapy.",
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
          is_trapped: false,
          medical_needs: ["POTABLE_WATER", "RATION_SUPPLIES"],
          hazard_types: ["RESOURCE_SHORTAGE"],
          hazard_severity: 4,
          people_affected: 45,
          vulnerable_people: { elderly: 8, children: 12, pregnant: 1, disabled: 2 },
          detected_language: "English",
          translation_en: "Food and clean drinking water running low at community shelter. 45 people housed here.",
          confidence_score: 0.98,
        },
        safety_sop: {
          urgency_summary: "Supply replenishment request. No immediate active physical trauma.",
          hazards_detected: ["RESOURCE_SHORTAGE"],
          recommended_gear: ["Supply Transport Vehicle (High Clearance)", "Water Purification Tablets"],
          protocol_steps: [
            "1. Deliver 50 ration kits and 200L clean water jugs.",
            "2. Confirm shelter coordinator signature.",
            "3. Check sanitary facilities and establish medical triage station if required.",
          ],
        },
        is_offline_cached: false,
      },
    ];
  }
}

/**
 * Submits a multimodal SOS payload (audio, image, text, coordinates) to the FastAPI backend.
 */
export async function submitMultimodalIncident(formData: FormData): Promise<MultimodalTriageResponse> {
  const res = await fetch(`${API_BASE}/api/v1/triage/multimodal`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Multimodal triage failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Legacy JSON submission helper for backwards compatibility.
 */
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
