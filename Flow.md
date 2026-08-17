# SOTERIA — System Data Flow & Architecture Diagrams

This document details the high-level request lifecycle, AI extraction pipelines, geospatial processing, and offline synchronization mechanisms powering the SOTERIA platform.

---

## 1. High-Level System Architecture Overview

```mermaid
flowchart TD
    subgraph Clients["1. Target User Clients"]
        Citizen["📱 Citizen SOS (PWA / Live Voice Note & Photo Upload)"]
        Commander["🖥️ Commander 3D GIS Dashboard (Deck.gl WebGL & WebSocket Stream)"]
        Volunteer["🦺 Volunteer Response Hub (SOPs & AI Photo Closure)"]
    end

    subgraph IngestionGateway["2. Ingestion & WebSocket Broadcast Layer"]
        SyncQueue["IndexedDB Local Storage & Service Worker Queue"]
        APIGateway["FastAPI Async REST Gateway (:8000)"]
        WSManager["FastAPI ConnectionManager WebSocket Stream (/ws/incidents)"]
    end

    subgraph IntelligenceLayer["3. Multimodal GenAI & Triage Engine"]
        GeminiFlash["Google Gemini 1.5 Flash (Structured Pydantic Extraction)"]
        TriageEngine["0-100 Mathematical Urgency Engine (Explainable XAI)"]
        SOPGenerator["Dynamic 3-Bullet Responder Safety SOP Generator"]
    end

    subgraph SpatialDatabase["4. Geospatial Data Layer"]
        PostGIS[("PostgreSQL 16 + PostGIS Spatial Engine (:5432)")]
        SpatialIndex["R-Tree (GIST) Spatial Point & Hexagonal Grid Index"]
    end

    subgraph DispatchAndReports["5. Automated Action & SitReps"]
        ProximityMatcher["PostGIS ST_DWithin Volunteer Nearest-Neighbor Matcher"]
        SitRepCron["30-Minute Automated 3-Bullet Commander SitRep Engine"]
        PhotoClosure["AI Verification & Proof-of-Action Closure"]
    end

    Citizen -->|Offline Capture| SyncQueue
    SyncQueue -->|Reconnection Burst| APIGateway
    Citizen -->|Direct Online SOS| APIGateway
    Commander -->|GIS Spatial Queries| APIGateway
    Volunteer -->|Status & Closure Proof| APIGateway

    APIGateway -->|Stream Audio / Photo| GeminiFlash
    GeminiFlash -->|Structured JSON Entities| TriageEngine
    TriageEngine -->|Urgency & Hazard Tags| SOPGenerator

    APIGateway -->|Persist SRID:4326 Geom & Triage| PostGIS
    PostGIS --- SpatialIndex

    APIGateway -->|Trigger Real-Time Push| WSManager
    WSManager -->|Instant JSON Broadcast| Commander

    PostGIS -->|Proximity Geo-Queries| ProximityMatcher
    ProximityMatcher -->|Dispatch Mission + SOP| Volunteer
    PostGIS -->|Periodic Incident Batch| SitRepCron
    SitRepCron -->|3-Bullet Digest| Commander
    Volunteer -->|Upload Closure Photo| PhotoClosure
    PhotoClosure -->|Verify & Close Ticket| PostGIS
```

---

## 2. Milestone 3: Real-Time WebSocket & Deck.gl 3D GIS Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor C as Citizen / Responder
    participant NextJS as Next.js 14 Frontend
    participant API as FastAPI Backend (:8000)
    participant WS as WebSocket Manager (/ws/incidents)
    participant Gemini as Google Gemini 1.5 Flash
    participant Engine as 0-100 Triage Math Engine
    participant DB as PostgreSQL 16 + PostGIS (SRID 4326)
    actor CMD as Commander (Deck.gl GIS)

    CMD->>WS: 1. Connects to ws://localhost:8000/ws/incidents
    WS-->>CMD: 2. Handshake: CONNECTED (Active Clients: 1)
    C->>NextJS: 3. Citizen submits voice note SOS in regional dialect
    NextJS->>API: 4. POST /api/v1/triage/multimodal (multipart/form-data)
    API->>Gemini: 5. Extract structured entities, dialect translation, SOP
    Gemini-->>API: 6. MultimodalGeminiExtraction JSON
    API->>Engine: 7. calculate_triage_score(extraction) -> Score: 93.5 [CRITICAL_P1]
    API->>DB: 8. INSERT incident with PostGIS geometry (SRID 4326)
    DB-->>API: 9. Incident persisted (ID: 105)
    API->>WS: 10. ws_manager.broadcast_incident("INCIDENT_CREATED", incident_data)
    par Instant WebSocket Broadcast
        WS-->>CMD: 11a. Push structured JSON payload to connected dashboard socket
        CMD->>CMD: 12a. Synthesizes Web Audio chime & elevates 3D HexagonLayer column in Deck.gl
    and HTTP 201 Response
        API-->>NextJS: 11b. HTTP 201 MultimodalTriageResponse
        NextJS->>C: 12b. Render LiveTriageResultCard
    end
```

---

## 3. Explainable 0-100 Urgency Triage Math Formula

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SOTERIA URGENCY TRIAGE FORMULA                            │
│                                                                                        │
│   Final Score = clamp(0, 100, H_sev + T_rap + V_uln + M_ed + R_ec)                     │
├──────────────────────────┬───────────┬─────────────────────────────────────────────────┤
│ Factor                   │ Max Pts   │ Mathematical Formula / Criteria                 │
├──────────────────────────┼───────────┼─────────────────────────────────────────────────┤
│ Hazard Severity (H_sev)  │ 35.0 pts  │ hazard_severity (1-10) * 3.5                    │
│ Trapped Factor (T_rap)   │ 25.0 pts  │ If trapped: 15.0 + min(10.0, trapped_count*2.5) │
│ Vulnerability (V_uln)    │ 25.0 pts  │ min(25.0, 3.0*eld + 3.5*chd + 4.0*preg + 4*dis) │
│ Medical Trauma (M_ed)    │ 10.0 pts  │ min(10.0, len(injuries_reported) * 3.5)         │
│ Recency Freshness (R_ec) │  5.0 pts  │ Fresh (<=15m): 5.0 | Older: max(0, 5 - dt/30)   │
└──────────────────────────┴───────────┴─────────────────────────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────┬────────────────────┬────────────────────┐
       │ CRITICAL_P1 (>=80) │  URGENT_P2 (60-79) │ MODERATE_P3 (40-59)│
       │ Life Threat (<10m) │ Rescue Queue (<30m)│ Sustenance (<2h)   │
       └────────────────────┴────────────────────┴────────────────────┘
```

---

## 4. Deck.gl 3D Hexagonal Aggregation Layering

```
                     [Incoming Real-Time Coordinates (SRID:4326)]
                                          │
                                          ▼
     ┌─────────────────────────────────────────────────────────────────────────┐
     │ Deck.gl HexagonLayer:                                                   │
     │ Radius: 500m | Extruded: True | ElevationScale: 15 | Coverage: 0.9      │
     │ Aggregates incident counts & composite triage scores into 3D columns    │
     │ Color Range: Emerald (#10B981) -> Amber (#F59E0B) -> Red (#EF4444)      │
     └─────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                     [Deck.gl WebGL Canvas + CartoDB Dark Matter]
           ╔══════════════╦══════════════╦══════════════╗
           ║  HEX-01: P4  ║  HEX-02: P1  ║  HEX-03: P2  ║
           ║  Low (12.0)  ║ Critical(94) ║ Urgent (71)  ║
           ║  Flat 2D     ║ 3D Extruded  ║ Mid Elevation║
           ╚══════════════╩══════════════╩══════════════╝
```

---

## 5. Automated 30-Minute SitRep Generation Lifecycle

```
[System Clock Trigger (Every 30 Minutes)]
                  │
                  ▼
[Query PostGIS: Incidents Ingested in Last 30 mins]
• Total Ingested: 142
• P1 Critical: 18 | Resolved: 12 | In Progress: 6
• Active Hazard Hotspot: Prayagraj North Ghat (Hex-02)
                  │
                  ▼
[Submit Batch Metrics to Gemini Generative Model]
                  │
                  ▼
[Generate Structured 3-Bullet Situation Report (SitRep)]
  • 1. Hotspot Status: 18 P1 flood rescues logged in Sector 3; 12 resolved by Boat Teams.
  • 2. Bottlenecks: Electrical transformer hazard cleared in Sector 4; 6 P1 pending boat evacuation.
  • 3. Priority Action: Redeploy 4 watercraft teams to North Bridge before river crests at 20:00.
                  │
                  ▼
[Broadcast SitRep to Emergency Commanders via Webhook & Dashboard]
```
