# SOTERIA — Platform Change Log

All notable changes, architectural decisions, and package configurations across development milestones are recorded in this document.

---

## [Milestone 7] - Multi-Volunteer Dispatch, Recon Approvals, Dynamic Quotas & Relief Supply Drops
**Date:** 2026-08-19  
**Status:** Completed  
**Branch:** `feature/cartodb-gis-map`  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added & Modified Components

#### 1. Backend Service (`/backend`)
- `app/schemas/dispatch.py`:
  - Extended `DispatchAssignRequest` and `DispatchAssignResponse` with `volunteer_ids: Optional[List[int]]` and `volunteers: Optional[List[VolunteerRead]]`.
- `app/services/dispatch_service.py`:
  - Updated PostGIS proximity search to return all nearby responders with live statuses (`AVAILABLE` vs `DISPATCHED`).
  - Added batch multi-volunteer dispatch assignment with atomic database transactions.
- `app/api/v1/endpoints/relief.py`:
  - `POST /api/v1/relief/tasks/{task_id}/volunteer`: Atomic join/leave quota balancing for field volunteer tasks.
  - `GET /api/v1/relief/nominated-spots`: Status-filtered crowdsourced supply drop spots.
  - `POST /api/v1/relief/dispatch-supply`: Command HQ 1-click supply airdrop/convoy deployment with tracking codes.
  - `POST /api/v1/relief/verify-spot`: Volunteer ground recon approval persisting to `APPROVED_ACTIVE` and marking recon tasks as `APPROVED_SAFE`.

#### 2. Frontend Application (`/frontend`)
- `src/components/VolunteerDispatchDrawer.tsx`:
  - Multi-select checkboxes for batch volunteer dispatching.
  - `🟢 AVAILABLE` vs `🟡 ACTIVE ON MISSION` status badges with busy reassignment warning banners.
  - Quick action buttons `[ Select Available ]` and `[ Clear ]`.
- `src/components/VolunteerVerificationCard.tsx`:
  - Scoped state resets with `useEffect` on `incident.id` to prevent completion screen bleeding across tickets.
  - Past resolution receipt display with re-audit toggle.
- `src/components/stitch/StitchVolunteerHub.tsx`:
  - Interactive `[ ✋ Volunteer for Mission (+1) ]` / `[ Joined (Click to Leave) ]` buttons updating live quotas.
  - Ground recon spot approval form with instant optimistic safe airdrop badge.
- `src/components/stitch/StitchHQCommander.tsx`:
  - "Approved Crowdsourced Supply Drop Spots" modal with verified spots list and volunteer clearance receipts.
  - 1-click supply payload checklist and transport selection (`Helicopter Airdrop`, `Rescue Boat Convoy`, `4x4 Amphibious Truck`).
- `src/components/stitch/StitchCitizenPortal.tsx`:
  - Safe Havens with exact GPS coordinates, elevation, and "🧭 Safe Path & Compass Navigation Guide" modal.
  - Spot nomination receipt cards with generated Spot ID.
- `src/lib/api.ts`:
  - Added `volunteerForTask`, `fetchNominatedSpots`, `dispatchSupplyDrop`, and updated `assignVolunteer`.

---

## [Milestone 6] - Stitch AI Visual Redesign & Complete Multi-Role Disaster Hub Integration
**Date:** 2026-08-19  
**Status:** Completed  
**Branch:** `feature/cartodb-gis-map`  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added & Modified Components

#### 1. Backend Service (`/backend`)
- `app/api/v1/endpoints/relief.py` [NEW]:
  - `GET /api/v1/relief/safe-havens`: Certified safe haven shelters with capacity quotas, medical readiness, and flood danger zones (`HZ-01` to `HZ-03`).
  - `POST /api/v1/relief/nominate`: Hyperlocal supply drop spot nominations from citizens with elevation details.
  - `GET /api/v1/relief/volunteer-tasks`: Field response missions with transparent Level 1-4 risk ratings, PPE requirements, and capacity quota balancing meters.
  - `POST /api/v1/relief/verify-spot`: Field volunteer ground reconnaissance audits for nominated supply drop spots.
- `app/api/v1/router.py` [MODIFIED]:
  - Mounted `/relief` router under `/api/v1/relief`.

#### 2. Frontend Application (`/frontend`)
- `src/components/stitch/StitchHQCommander.tsx` [NEW]:
  - 3-Pane Tactical Command layout with Left Strategic Ops Nav, Center 3D GIS Deck.gl radar map bounded canvas, top coordinate badges, bottom pulsing **P1 Critical Alert Ticker**, and Right Ops Triage Rail with active incident tickets and 1-click Proximity Dispatch.
- `src/components/stitch/StitchCitizenPortal.tsx` [NEW]:
  - 1-Tap Voice SOS with browser `MediaRecorder`, animated audio visualizer waves, disaster scene photo upload, and offline IndexedDB fallback.
  - "Where to Go" live safe havens vs danger zones with capacity progress bars.
  - Hyperlocal Supply Drop Spot nomination form.
- `src/components/stitch/StitchVolunteerHub.tsx` [NEW]:
  - Field missions with Level 1-4 risk badges and PPE requirements.
  - Capacity quota balancing meters (`2/4 Needed`, `3/3 Full - Redirect`).
  - Ground recon micro-task verification with approve/reject actions.
  - AI closed-loop photo verification using `<VolunteerVerificationCard />` and Gemini Vision.
- `src/lib/api.ts` [MODIFIED]:
  - Added TypeScript interfaces and fetch helpers for relief, safe havens, and volunteer tasks.
- `src/app/page.tsx` [MODIFIED]:
  - Master coordinator seamlessly routing between Stitch views (`HQ_COMMANDER`, `CITIZEN`, `VOLUNTEER`) with auth state integration.
- `tailwind.config.js` & `postcss.config.js` [NEW]:
  - Configured dark/light color tokens, glowing animations, and CommonJS module compatibility.

---

## [Milestone 5] - JWT Authentication, Role-Based Access Control (RBAC) & Access Gateway
**Date:** 2026-08-19  
**Status:** Completed  
**Branch:** `feature/cartodb-gis-map`  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added & Modified Components

#### 1. Backend Service (`/backend`)
- `app/models/user.py` [NEW]:
  - SQLAlchemy `User` model with `UserRole` enum (`CITIZEN`, `VOLUNTEER`, `HQ_COMMANDER`), hashed password storage, phone, certifications list, and timestamps.
- `app/schemas/user.py` [NEW]:
  - Pydantic models for `UserCreate`, `UserLogin`, `UserResponse`, and `TokenResponse` with JWT token payloads.
- `app/core/security.py` [NEW]:
  - Password hashing and verification using native `bcrypt`.
  - JWT token creation (`create_access_token`) and decoding (`decode_access_token`).
  - FastAPI dependencies `get_current_user`, `get_current_user_optional`, and `require_roles()`.
- `app/api/v1/endpoints/auth.py` [NEW]:
  - Mounted `/api/v1/auth/register`, `/api/v1/auth/login`, and `/api/v1/auth/me`.
- `app/api/v1/router.py` [MODIFIED]:
  - Registered `/auth` router under `/api/v1/auth`.
- `seed_disaster_data.py` [MODIFIED]:
  - Seeded pre-configured accounts for `HQ_COMMANDER` (`commander@soteria.gov`), `VOLUNTEER` (`aarav.volunteer@soteria.org`), and `CITIZEN` (`citizen@soteria.org`).

#### 2. Frontend Application (`/frontend`)
- `src/lib/auth.tsx` [NEW]:
  - React `AuthContext` provider and `useAuth()` hook for persistent session state, login, registration, logout, and 1-click demo helpers.
- `src/components/AuthModal.tsx` [NEW]:
  - Glassmorphic authentication modal with 1-click **"Fill Demo Commander"** and **"Fill Demo Volunteer"** buttons, error handling, and role selection.
- `src/lib/api.ts` [MODIFIED]:
  - Added `getAuthHeaders()` to inject `Authorization: Bearer <token>` into API requests and typed auth methods (`loginUser`, `registerUser`, `fetchCurrentUser`).
- `src/app/layout.tsx` [MODIFIED]:
  - Wrapped root component tree with `<AuthProvider>`.
- `src/app/page.tsx` [MODIFIED]:
  - Added authenticated user profile pill and Sign In / Sign Out actions in top header.
  - Added role guards to Volunteer Hub and Commander Dispatch workflows while preserving friction-free guest access for Citizen SOS.

#### 3. Architecture Documentation
- `Decisions.md`: Added ADR 008 (Slack 3-Pane Disaster Ops Interface) and ADR 009 (JWT Role-Based Access Control & Access Gateway).

**Date:** 2026-08-18  
**Status:** Completed  
**Branch:** `feature/cartodb-gis-map`  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added & Modified Components

#### 1. Backend Service (`/backend`)
- `app/schemas/volunteer.py`, `app/schemas/dispatch.py`, `app/schemas/sitrep.py` [NEW]:
  - Pydantic models for volunteer tracking, spatial distance match queries, dispatch assignment, Gemini Vision photo audit receipts, and 3-bullet SitReps.
- `app/services/dispatch_service.py` [NEW]:
  - PostGIS spatial math queries (`ST_DWithin` / `ST_Distance` / Haversine) to compute nearest certified responders in meters/kilometers.
  - State machine for volunteer assignment and status transitions (`AVAILABLE` $\to$ `DISPATCHED`).
- `app/services/sitrep_service.py` [NEW]:
  - Aggregates active vs. resolved incident clusters in PostGIS and prompts Gemini for structured 3-bullet operational summaries.
- `app/services/gemini_service.py` [MODIFIED]:
  - Added `verify_rescue_resolution` (Gemini Vision audit comparing resolution photo against initial hazard) and `generate_sitrep_summary`.
- `app/api/v1/endpoints/dispatch.py` [NEW]:
  - Mounted `/api/v1/dispatch/nearby`, `/api/v1/dispatch/assign`, `/api/v1/dispatch/verify`, and `/api/v1/dispatch/volunteers`.
- `app/api/v1/endpoints/command.py` [NEW]:
  - Mounted `/api/v1/command/sitrep` and `/api/v1/command/stats`.
- `app/api/v1/router.py` [MODIFIED]:
  - Registered `dispatch` and `command` routers.
- `seed_disaster_data.py` [NEW]:
  - 1-command deterministic database seeder with 8 Prayagraj certified field volunteers and 6 multi-hazard incidents across P1-P4 tiers.

#### 2. Frontend Application (`/frontend`)
- `public/manifest.json` & `public/sw.js` [NEW]:
  - PWA manifest configuration and Service Worker for offline shell asset caching.
- `src/lib/offlineStorage.ts` [NEW]:
  - Native typed IndexedDB storage engine (`soteria_offline_db`) queueing audio/photo Blobs and distress forms in dead-zones.
- `src/hooks/useOfflineSync.ts` [NEW]:
  - Background synchronization hook listening for `online` reconnection events and auto-flushing queued reports.
- `src/components/OfflineBanner.tsx` [NEW]:
  - Top notification banner displaying offline state, pending queue count, and manual sync trigger.
- `src/components/VolunteerDispatchDrawer.tsx` [NEW]:
  - Commander responder dispatch drawer with PostGIS proximity ranking, skill badges, and dynamic 3-bullet AI Safety SOP briefing.
- `src/components/VolunteerVerificationCard.tsx` [NEW]:
  - Interactive photo proof-of-action upload and Gemini Vision audit receipt with confidence rating.
- `src/components/SitRepModal.tsx` [NEW]:
  - 30-minute automated 3-bullet executive operational briefing modal and on-demand synthesis trigger.
- `src/components/CitizenSOSForm.tsx` [MODIFIED]:
  - Wired seamless IndexedDB offline queueing fallback when cellular connectivity drops.
- `src/hooks/useIncidentWebSocket.ts` [MODIFIED]:
  - Added support for `DISPATCH_ASSIGNED` and `INCIDENT_RESOLVED` events.
- `src/lib/api.ts` [MODIFIED]:
  - Added typed API callers for dispatch, verification, volunteers, and SitReps.
- `src/app/layout.tsx` & `src/app/page.tsx` [MODIFIED]:
  - Registered Service Worker and wired all new modals, drawer, and verification widgets.

#### 3. Architecture Documentation
- `Decisions.md`: Added ADR 007 (Offline-First IndexedDB Architecture & Closed-Loop Vision Audit).
- `Flow.md`: Added sequence diagrams for Offline Sync and AI Closed-Loop Photo Verification.
- `README.md`: Updated with Milestone 4 features, 1-command seed instructions, and end-to-end judge evaluation guide.

---

## [Milestone 3] - Real-Time Hexagonal GIS & WebSocket Synchronization
**Date:** 2026-08-18  
**Status:** Completed  
**Branch:** `feature/cartodb-gis-map`  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added & Modified Components

#### 1. Backend Service (`/backend`)
- `app/core/websockets.py` [NEW]:
  - Thread-safe asynchronous `ConnectionManager` singleton tracking connected dashboards.
  - Handles client connections, initial handshakes, ping/pong heartbeats, and automatic pruning of stale sockets.
  - Implements `broadcast_incident(event_type, incident_data, triage_breakdown)` broadcasting structured JSON to all connected clients.
- `main.py` [MODIFIED]:
  - Mounted `/ws/incidents` and `/api/v1/ws/incidents` WebSocket routes.
  - Bumped platform version to `0.3.0`.
- `app/api/v1/endpoints/triage.py` [MODIFIED]:
  - Injected WebSocket broadcast hook immediately after PostGIS database insertion on `POST /api/v1/triage/multimodal`.
- `app/api/v1/endpoints/incidents.py` [MODIFIED]:
  - Injected WebSocket broadcast on `POST /api/v1/incidents/` (`INCIDENT_CREATED`) and `PATCH /api/v1/incidents/{id}` (`INCIDENT_UPDATED`).

#### 2. Frontend Application (`/frontend`)
- `package.json` [MODIFIED]:
  - Added dependencies for `deck.gl`, `@deck.gl/react`, `@deck.gl/layers`, `@deck.gl/aggregation-layers`, `@deck.gl/core`, `maplibre-gl`, `react-map-gl`.
- `src/lib/api.ts` [MODIFIED]:
  - Added `getWebSocketUrl()` and `WebSocketIncidentEvent` interface.
- `src/hooks/useIncidentWebSocket.ts` [NEW]:
  - Custom React hook managing WebSocket lifecycle, auto-reconnection with exponential backoff (1s-10s), and state reducer.
  - Synthesizes an emergency rescue chime using the Web Audio API on `CRITICAL_P1` incoming alerts without external audio assets.
- `src/components/DisasterGISMap.tsx` [NEW]:
  - Interactive 3D WebGL map component using Deck.gl with CartoDB Dark Matter open-access vector style.
  - `HexagonLayer`: Aggregates incident density and composite triage urgency scores into 3D extruded columns (radius 500m) with 6-class emergency severity color palette (`#10B981` $\to$ `#EF4444`).
  - `ScatterplotLayer`: Pinpoints individual disaster incidents with category color coding and click-to-select dossier integration.
  - Camera toolbar: 2D/3D toggle, layer mode selector (All/Hexagons/Pins), 3D height slider, and camera reset.
- `src/components/MapTooltip.tsx` [NEW]:
  - Interactive hover card rendering aggregate stats for hexagonal risk bins (incident count, average score, trapped count) and single incident pins.
- `src/app/page.tsx` [MODIFIED]:
  - Client-side dynamic import of `DisasterGISMap` (`ssr: false`).
  - Integrated `useIncidentWebSocket` hook for real-time multi-tab state sync and emergency toast alerts.

#### 3. Architecture Documentation
- `Decisions.md`: Added ADR 006 (Deck.gl WebGL Hexagonal GIS & WebSocket Protocol).
- `Flow.md`: Updated real-time broadcast and 3D geospatial rendering sequence diagrams.
- `README.md`: Updated with Milestone 3 details, WebSocket documentation, and Deck.gl setup.

---

## [Milestone 2] - Multimodal GenAI Extraction & Urgency Triage Engine
**Date:** 2026-08-18  
**Status:** Completed  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

---

## [Milestone 1] - Initial Foundation, Docker Environment, Base Skeletons, and Core Architecture
**Date:** 2026-08-17  
**Status:** Completed  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter
