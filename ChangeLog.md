# SOTERIA — Platform Change Log

All notable changes, architectural decisions, and package configurations across development milestones are recorded in this document.

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
