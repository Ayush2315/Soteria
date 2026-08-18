/**
 * SOTERIA Backend API Client & TypeScript Interfaces
 * Multimodal AI Ingestion, PostGIS Spatial Triage, WebSockets, Dispatch & AI Closed-Loop Verification.
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
export type VolunteerStatus = "AVAILABLE" | "DISPATCHED" | "BUSY" | "OFFLINE";

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
  verification_data?: {
    is_verified?: boolean;
    confidence_score?: number;
    visual_observations?: string;
    hazard_clearance_status?: string;
    closure_summary?: string;
    proof_photo_url?: string;
    closure_notes?: string;
    closed_by_volunteer_id?: number;
    resolved_at?: string;
  };
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

export interface Volunteer {
  id: number;
  name: string;
  phone: string;
  skills: string[];
  status: VolunteerStatus;
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  last_ping: string;
}

export interface VolunteerWithDistance extends Volunteer {
  distance_meters: number;
  distance_km: number;
}

export interface DispatchAssignRequest {
  incident_id: number;
  volunteer_id?: number;
  volunteer_ids?: number[];
  notes?: string;
}

export interface DispatchAssignResponse {
  incident_id: number;
  volunteer?: Volunteer;
  volunteers?: Volunteer[];
  incident_status: string;
  safety_sop: Record<string, any>;
  assigned_at: string;
  message: string;
}

export interface RescueVerificationAuditResult {
  is_verified: boolean;
  confidence_score: number;
  visual_observations: string;
  hazard_clearance_status: string;
  closure_summary: string;
}

export interface RescueVerificationResponse {
  incident_id: number;
  previous_status: string;
  current_status: string;
  audit_result: RescueVerificationAuditResult;
  proof_photo_url?: string | null;
  resolved_at: string;
  volunteer_id?: number | null;
  closure_notes?: string | null;
}

export interface SitRepSummary {
  time_window: string;
  total_active_incidents: number;
  critical_p1_count: number;
  urgent_p2_count: number;
  moderate_p3_count: number;
  low_p4_count: number;
  resolved_count: number;
  volunteers_deployed: number;
  top_hazard_zones: string[];
  bullet_1_hotspot_status: string;
  bullet_2_operational_bottlenecks: string;
  bullet_3_priority_action_plan: string;
}

export interface SitRepResponse {
  sitrep: SitRepSummary;
  generated_at: string;
  is_fallback: boolean;
}

export interface CommandStats {
  total_incidents: number;
  critical_p1: number;
  urgent_p2: number;
  moderate_p3: number;
  low_p4: number;
  dispatched_count: number;
  resolved_count: number;
  total_volunteers: number;
  available_volunteers: number;
  dispatched_volunteers: number;
  offline_cached_count: number;
  system_status: string;
}

export interface SectorClusterMetrics {
  totalIncidents: number;
  maxTriageScore: number;
  avgTriageScore: number;
  totalTrappedCount: number;
  criticalP1Count: number;
  urgentP2Count: number;
  moderateP3Count: number;
  lowP4Count: number;
}

export interface SectorClusterData {
  sectorName: string;
  centroid: [number, number]; // [longitude, latitude]
  metrics: SectorClusterMetrics;
  incidents: Incident[];
  isSinglePin: boolean;
}

export interface WebSocketIncidentEvent {
  event: "CONNECTED" | "PONG" | "INCIDENT_CREATED" | "INCIDENT_UPDATED" | "DISPATCH_ASSIGNED" | "INCIDENT_RESOLVED" | "TRIAGE_ALERT";
  data?: Incident;
  triage_breakdown?: TriageBreakdown;
  message?: string;
  active_clients?: number;
  timestamp?: string;
}


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getWebSocketUrl(): string {
  const wsUrlEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (wsUrlEnv) return wsUrlEnv;

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    return `${protocol}//${host}:8000/ws/incidents`;
  }
  return "ws://localhost:8000/ws/incidents";
}

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
      version: "0.4.0",
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
    // Return high-quality deterministic scenario incidents for client demonstration
    return [
      {
        id: 101,
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        source_type: "VOICE",
        raw_payload: "बाढ़ का पानी छत तक पहुँच गया है! 4 लोग फंसे हैं, एक बच्चा और बुजुर्ग हैं, नाव भेजो!",
        audio_url: undefined,
        image_urls: [],
        location_name: "North Ghat, Sector 3, Sangam, Prayagraj",
        latitude: 25.4358,
        longitude: 81.8463,
        triage_score: 94.0,
        triage_category: "CRITICAL_P1",
        status: "TRIAGED",
        extracted_entities: {
          trapped_count: 4,
          is_trapped: true,
          medical_needs: ["HYPOTHERMIA_RISK", "MOBILITY_ASSISTANCE"],
          hazard_types: ["FLOOD"],
          hazard_severity: 10,
          people_affected: 4,
          vulnerable_people: { elderly: 1, children: 1, pregnant: 0, disabled: 0 },
          detected_language: "Hindi / Bhojpuri",
          translation_en: "Flood water has reached the roof! 4 people are trapped, including a child and an elderly person, send a boat!",
          confidence_score: 0.98,
        },
        safety_sop: {
          urgency_summary: "Rapid water ingress with marooned casualties. Watercraft extraction protocol active.",
          hazards_detected: ["SURGING_WATER", "SUBMERGED_DEBRIS"],
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
        raw_payload: "Two-story masonry wall collapsed over alleyway, electricity transformer sparking nearby.",
        image_urls: ["https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80"],
        location_name: "Old City Main Bazaar, Lane 4, Prayagraj",
        latitude: 25.4412,
        longitude: 81.8329,
        triage_score: 88.5,
        triage_category: "CRITICAL_P1",
        status: "DISPATCHED",
        extracted_entities: {
          trapped_count: 2,
          is_trapped: true,
          medical_needs: ["CRUSH_SYNDROME_IV", "TRAUMA_BANDAGING"],
          hazard_types: ["STRUCTURAL_COLLAPSE", "ELECTRICAL"],
          hazard_severity: 9,
          people_affected: 3,
          vulnerable_people: { elderly: 1, children: 0, pregnant: 0, disabled: 0 },
          detected_language: "English",
          translation_en: "Two-story masonry wall collapsed over alleyway, electricity transformer sparking nearby.",
          confidence_score: 0.94,
        },
        safety_sop: {
          urgency_summary: "Live electrical arcing near collapsed masonry. Power isolation required before debris removal.",
          hazards_detected: ["ELECTRICAL", "STRUCTURAL_COLLAPSE"],
          recommended_gear: ["Dielectric Safety Gloves (10kV)", "Hard Hat", "Pneumatic Lifting Bags"],
          protocol_steps: [
            "1. Establish 25-meter safety perimeter and request emergency power grid isolation.",
            "2. Approach upwind wearing dielectric gloves (10kV) and erect pneumatic shoring supports.",
            "3. Extract victims and initiate immediate crush syndrome fluid resuscitation.",
          ],
        },
        is_offline_cached: true,
      },
      {
        id: 103,
        created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        source_type: "TEXT",
        raw_payload: "Food and clean drinking water running low at community shelter. 50 people housed here.",
        image_urls: [],
        location_name: "Sharda Relief Camp, Zone 2, Prayagraj",
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
          people_affected: 50,
          vulnerable_people: { elderly: 10, children: 15, pregnant: 2, disabled: 2 },
          detected_language: "English",
          translation_en: "Food and clean drinking water running low at community shelter. 50 people housed here.",
          confidence_score: 0.99,
        },
        safety_sop: {
          urgency_summary: "Supply replenishment request. No immediate active physical trauma.",
          hazards_detected: ["RESOURCE_SHORTAGE"],
          recommended_gear: ["Supply Transport Vehicle", "Water Purification Tablets", "ORS Sachets"],
          protocol_steps: [
            "1. Deliver 300L potable water and ration kits to shelter intake.",
            "2. Confirm shelter coordinator signature.",
            "3. Verify sanitary facility holding chlorination.",
          ],
        },
        is_offline_cached: false,
      },
    ];
  }
}

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

export async function fetchVolunteers(statusFilter?: VolunteerStatus): Promise<Volunteer[]> {
  try {
    const url = statusFilter
      ? `${API_BASE}/api/v1/dispatch/volunteers?status=${statusFilter}`
      : `${API_BASE}/api/v1/dispatch/volunteers`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch volunteers");
    return await res.json();
  } catch {
    return [
      {
        id: 1,
        name: "Capt. Rajesh Verma",
        phone: "+91-9876543210",
        skills: ["BOAT_OPERATOR", "SWIMMER", "WATER_RESCUE"],
        status: "AVAILABLE",
        current_latitude: 25.4320,
        current_longitude: 81.8510,
        is_active: true,
        last_ping: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Dr. Ananya Sharma",
        phone: "+91-9876543211",
        skills: ["PARAMEDIC", "TRAUMA_SURGERY", "HYPOTHERMIA_CARE"],
        status: "AVAILABLE",
        current_latitude: 25.4480,
        current_longitude: 81.8340,
        is_active: true,
        last_ping: new Date().toISOString(),
      },
      {
        id: 3,
        name: "Vikram Singh (NDRF)",
        phone: "+91-9876543212",
        skills: ["STRUCTURAL_SHORING", "HEAVY_RESCUE", "K9_HANDLER"],
        status: "AVAILABLE",
        current_latitude: 25.4390,
        current_longitude: 81.8620,
        is_active: true,
        last_ping: new Date().toISOString(),
      },
      {
        id: 4,
        name: "Mohammed Tariq",
        phone: "+91-9876543214",
        skills: ["HIGH_VOLTAGE_ISOLATION", "FIRE_SUPPRESSION", "SCBA_BREACH"],
        status: "AVAILABLE",
        current_latitude: 25.4410,
        current_longitude: 81.8290,
        is_active: true,
        last_ping: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchNearbyVolunteers(
  incidentId: number,
  radiusMeters: number = 15000,
  limit: number = 5
): Promise<VolunteerWithDistance[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/dispatch/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_id: incidentId,
        radius_meters: radiusMeters,
        limit: limit,
      }),
    });
    if (!res.ok) throw new Error("Failed to query nearby volunteers");
    return await res.json();
  } catch {
    return [
      {
        id: 1,
        name: "Capt. Rajesh Verma",
        phone: "+91-9876543210",
        skills: ["BOAT_OPERATOR", "SWIMMER", "WATER_RESCUE"],
        status: "AVAILABLE",
        current_latitude: 25.4320,
        current_longitude: 81.8510,
        is_active: true,
        last_ping: new Date().toISOString(),
        distance_meters: 640.5,
        distance_km: 0.64,
      },
      {
        id: 3,
        name: "Vikram Singh (NDRF)",
        phone: "+91-9876543212",
        skills: ["STRUCTURAL_SHORING", "HEAVY_RESCUE"],
        status: "AVAILABLE",
        current_latitude: 25.4390,
        current_longitude: 81.8620,
        is_active: true,
        last_ping: new Date().toISOString(),
        distance_meters: 1650.0,
        distance_km: 1.65,
      },
      {
        id: 2,
        name: "Dr. Ananya Sharma",
        phone: "+91-9876543211",
        skills: ["PARAMEDIC", "TRAUMA_SURGERY"],
        status: "AVAILABLE",
        current_latitude: 25.4480,
        current_longitude: 81.8340,
        is_active: true,
        last_ping: new Date().toISOString(),
        distance_meters: 1820.0,
        distance_km: 1.82,
      },
    ];
  }
}

export async function assignVolunteer(
  incidentId: number,
  volunteerIdOrIds: number | number[],
  notes?: string
): Promise<DispatchAssignResponse> {
  const isArray = Array.isArray(volunteerIdOrIds);
  const payload = {
    incident_id: incidentId,
    volunteer_id: isArray ? volunteerIdOrIds[0] : volunteerIdOrIds,
    volunteer_ids: isArray ? volunteerIdOrIds : [volunteerIdOrIds],
    notes: notes,
  };

  const res = await fetch(`${API_BASE}/api/v1/dispatch/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Dispatch assignment failed: ${errText}`);
  }

  return await res.json();
}

export async function verifyIncidentResolution(formData: FormData): Promise<RescueVerificationResponse> {
  const res = await fetch(`${API_BASE}/api/v1/dispatch/verify`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI Verification failed: ${errText}`);
  }

  return await res.json();
}

export async function fetchSitRep(timeWindowMinutes: number = 30): Promise<SitRepResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/command/sitrep?time_window_minutes=${timeWindowMinutes}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch SitRep");
    return await res.json();
  } catch {
    return {
      sitrep: {
        time_window: "Last 30 Minutes",
        total_active_incidents: 4,
        critical_p1_count: 2,
        urgent_p2_count: 2,
        moderate_p3_count: 1,
        low_p4_count: 0,
        resolved_count: 1,
        volunteers_deployed: 3,
        top_hazard_zones: ["North Ghat Sangam", "Old City Bazaar", "Civil Lines Sector 4"],
        bullet_1_hotspot_status: "Hotspot Status: 2 Critical (P1) and 2 Urgent (P2) operations active across North Ghat and Old City. 1 flood rescue successfully verified and resolved.",
        bullet_2_operational_bottlenecks: "Operational Bottlenecks: 3 watercraft and structural shoring teams deployed in field. Transformer electrical isolation pending in Old City Bazaar.",
        bullet_3_priority_action_plan: "Priority Action Plan: Prioritize high-water extraction in North Ghat before river crest; standby rapid relocation of medical supplies to Sharda Relief Camp.",
      },
      generated_at: new Date().toISOString(),
      is_fallback: true,
    };
  }
}

export async function triggerSitRep(timeWindowMinutes: number = 30): Promise<SitRepResponse> {
  const res = await fetch(`${API_BASE}/api/v1/command/sitrep?time_window_minutes=${timeWindowMinutes}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to trigger SitRep generation");
  return await res.json();
}

export async function fetchCommandStats(): Promise<CommandStats> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/command/stats`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch command stats");
    return await res.json();
  } catch {
    return {
      total_incidents: 6,
      critical_p1: 2,
      urgent_p2: 2,
      moderate_p3: 1,
      low_p4: 0,
      dispatched_count: 2,
      resolved_count: 1,
      total_volunteers: 8,
      available_volunteers: 6,
      dispatched_volunteers: 2,
      offline_cached_count: 2,
      system_status: "OPERATIONAL",
    };
  }
}

/* ========================================================================= */
/* AUTHENTICATION & RBAC API METHODS */
/* ========================================================================= */

export type UserRole = "CITIZEN" | "VOLUNTEER" | "HQ_COMMANDER";

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  certifications: string[];
  created_at: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface UserRegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  phone?: string;
  certifications?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user: UserResponse;
}

/**
 * Returns Authorization header with JWT Bearer token from localStorage or argument.
 */
export function getAuthHeaders(explicitToken?: string | null): Record<string, string> {
  const token = explicitToken || (typeof window !== "undefined" ? localStorage.getItem("soteria_access_token") : null);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(payload: UserLoginPayload): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Authentication failed. Check your email and password.");
  }

  return await res.json();
}

export async function registerUser(payload: UserRegisterPayload): Promise<TokenResponse> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed. Try again.");
  }

  return await res.json();
}

export async function fetchCurrentUser(explicitToken?: string | null): Promise<UserResponse> {
  const headers = getAuthHeaders(explicitToken);
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: {
      ...headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch authenticated user profile");
  }

  return await res.json();
}

/* ========================================================================= */
/* RELIEF OPERATIONS, SAFE HAVENS & VOLUNTEER TASKS */
/* ========================================================================= */

export interface SafeHaven {
  id: string;
  name: string;
  type: string;
  status: "OPEN_CAPACITY" | "NEAR_CAPACITY" | "FULL_REDIRECT";
  capacity_total: number;
  capacity_used: number;
  latitude: number;
  longitude: number;
  elevation_meters?: number;
  supplies: string[];
  medical_team_on_site: boolean;
  safe_zone_radius_meters: number;
  distance_to_flood_meters: number;
  safe_corridor_route?: string;
}

export interface HazardDangerZone {
  id: string;
  name: string;
  hazard_type: string;
  severity: string;
  inundation_depth_meters: number;
  active_advisory: string;
  evacuation_status: string;
}

export interface SafeHavensResponse {
  safe_havens: SafeHaven[];
  hazard_danger_zones: HazardDangerZone[];
  last_updated: string;
}

export interface NominatedSpot {
  id: string;
  spot_name: string;
  latitude: number;
  longitude: number;
  terrain_type: string;
  status: "PENDING_RECON" | "APPROVED_ACTIVE" | "REJECTED" | "SUPPLY_DISPATCHED";
  nominated_by: string;
  nominated_at: string;
  accessibility_notes?: string;
  cleared_by_volunteer?: string;
  verified_at?: string;
  last_supply_dispatch?: {
    transport_type: string;
    supplies: string[];
    dispatched_at: string;
    convoy_code: string;
    notes?: string;
  };
}

export interface VolunteerTask {
  task_id: string;
  title: string;
  category: string;
  risk_level: number;
  risk_label: string;
  required_ppe: string[];
  sector: string;
  required_volunteers: number;
  current_volunteers: number;
  status: "OPEN" | "QUOTA_FULL" | "IN_PROGRESS" | "APPROVED_SAFE";
  description: string;
  is_spot_recon?: boolean;
  target_spot_id?: string;
  volunteer_names?: string[];
}

export async function fetchSafeHavens(): Promise<SafeHavensResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/relief/safe-havens`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch safe havens");
    return await res.json();
  } catch {
    return {
      safe_havens: [
        {
          id: "SH-01",
          name: "Prayagraj Sports Complex Elevated Levee",
          type: "ELEVATED_STADIUM",
          status: "OPEN_CAPACITY",
          capacity_total: 500,
          capacity_used: 180,
          latitude: 25.4425,
          longitude: 81.8490,
          elevation_meters: 104.5,
          supplies: ["DRINKING_WATER", "RATIONS_48H", "BLANKETS", "POWER_GENERATOR"],
          medical_team_on_site: true,
          safe_zone_radius_meters: 450,
          distance_to_flood_meters: 850,
          safe_corridor_route: "Approach via MG Marg North bypass. Avoid riverfront embankment.",
        },
        {
          id: "SH-02",
          name: "Sharda Inter College Disaster Relief Camp",
          type: "HIGH_SCHOOL_CAMP",
          status: "NEAR_CAPACITY",
          capacity_total: 250,
          capacity_used: 235,
          latitude: 25.4289,
          longitude: 81.8541,
          elevation_meters: 98.2,
          supplies: ["DRINKING_WATER", "INFANT_NUTRITION", "PEDIATRIC_CARE"],
          medical_team_on_site: true,
          safe_zone_radius_meters: 300,
          distance_to_flood_meters: 400,
          safe_corridor_route: "Enter via Southern elevated overpass. Eastern lane is cordoned.",
        },
      ],
      hazard_danger_zones: [
        {
          id: "HZ-01",
          name: "North Ghat Riverfront Submersion Sector",
          hazard_type: "FLOOD_CURRENT",
          severity: "EXTREME_P1",
          inundation_depth_meters: 3.8,
          active_advisory: "Rooftop-level flooding with high-velocity current. DO NOT ATTEMPT WADING.",
          evacuation_status: "IMMEDIATE_AIR_BOAT_EVACUATION",
        },
      ],
      last_updated: new Date().toISOString(),
    };
  }
}

export async function nominateDropSpot(payload: {
  spot_name: string;
  latitude: number;
  longitude: number;
  terrain_type: string;
  accessibility_notes?: string;
  nominated_by_name?: string;
  phone?: string;
}): Promise<{ success: boolean; spot: NominatedSpot; task_id?: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/relief/nominate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to nominate drop spot");
  }

  return await res.json();
}

export async function fetchNominatedSpots(status?: string): Promise<NominatedSpot[]> {
  try {
    const url = status ? `${API_BASE}/api/v1/relief/nominated-spots?status=${status}` : `${API_BASE}/api/v1/relief/nominated-spots`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch nominated spots");
    return await res.json();
  } catch {
    return [
      {
        id: "SPOT-102",
        spot_name: "Daraganj Overbridge High Levee",
        latitude: 25.4350,
        longitude: 81.8590,
        terrain_type: "ELEVATED_LEVEE",
        status: "APPROVED_ACTIVE",
        nominated_by: "Capt. Rajesh Verma",
        nominated_at: "25 mins ago",
        accessibility_notes: "Broad concrete embankment 4.5m above flood water. Boat tie-offs accessible.",
        cleared_by_volunteer: "Capt. Aarav Sharma",
        verified_at: "15 mins ago",
      },
    ];
  }
}

export async function fetchVolunteerTasks(): Promise<VolunteerTask[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/relief/volunteer-tasks`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch volunteer tasks");
    return await res.json();
  } catch {
    return [
      {
        task_id: "TASK-801",
        title: "North Ghat Flood Rescue & Pediatric Life Vest Evacuation",
        category: "WATER_RESCUE",
        risk_level: 4,
        risk_label: "Level 4: Extreme (Severe Flood Current)",
        required_ppe: ["TYPE_V_PFD", "HELMET_WATER", "DRYSUIT", "THROW_LINE"],
        sector: "North Ghat Sector 3",
        required_volunteers: 4,
        current_volunteers: 2,
        status: "OPEN",
        description: "Assisting 4 marooned casualties (infant + elderly) on submerged rooftop at North Ghat.",
        volunteer_names: ["Vikram Singh", "Priya Nair"],
      },
      {
        task_id: "TASK-802",
        title: "Old City Masonry Wall Shoring & Power Cordon",
        category: "STRUCTURAL_RESCUE",
        risk_level: 3,
        risk_label: "Level 3: High (Falling Debris + Live Arcing)",
        required_ppe: ["HARD_HAT", "STEEL_TOE_BOOTS", "INSULATED_GLOVES", "HIGH_VIS_VEST"],
        sector: "Old City Market Lane 4",
        required_volunteers: 3,
        current_volunteers: 3,
        status: "QUOTA_FULL",
        description: "Shoring unstable two-story masonry wall near sparking electrical transformer.",
        volunteer_names: ["Rohit Mehra", "Anjali Verma", "Deepak Joshi"],
      },
      {
        task_id: "TASK-803",
        title: "Ground Recon: Inspect St. Peter Church Supply Drop Spot",
        category: "SUPPLY_AIRDROP_RECON",
        risk_level: 2,
        risk_label: "Level 2: Moderate (Foot Reconnaissance)",
        required_ppe: ["SAFETY_BOOTS", "HIGH_VIS_VEST", "WATERPROOF_RADIO"],
        sector: "Sangam Grid Sector 2",
        required_volunteers: 2,
        current_volunteers: 0,
        status: "OPEN",
        description: "Inspect nominated spot #SPOT-101 for clear helicopter/boat airdrop clearance.",
        is_spot_recon: true,
        target_spot_id: "SPOT-101",
        volunteer_names: [],
      },
    ];
  }
}

export async function volunteerForTask(
  taskId: string,
  volunteerId: number,
  action: "join" | "leave" = "join",
  volunteerName?: string
): Promise<{ success: boolean; task: VolunteerTask; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/relief/tasks/${taskId}/volunteer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      volunteer_id: volunteerId,
      volunteer_name: volunteerName,
      action: action,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to update volunteer quota.");
  }

  return await res.json();
}

export async function verifyDropSpot(payload: {
  spot_id: string;
  volunteer_id: number;
  volunteer_name?: string;
  is_approved: boolean;
  hazard_clearance_notes: string;
  suitable_for_helicopter?: boolean;
  suitable_for_boat?: boolean;
}): Promise<{ success: boolean; spot_id: string; status: string; spot?: NominatedSpot; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/relief/verify-spot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to verify spot");
  return await res.json();
}

export async function dispatchSupplyDrop(payload: {
  spot_id: string;
  supplies: string[];
  transport_type: string;
  notes?: string;
}): Promise<{ success: boolean; spot: NominatedSpot; convoy_code: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/v1/relief/dispatch-supply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Failed to dispatch supplies to spot.");
  }

  return await res.json();
}


