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

---

## 6. Offline-First IndexedDB Caching & Auto-Sync Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor C as 📱 Citizen (Dead-Zone)
    participant Form as CitizenSOSForm (PWA)
    participant IDB as IndexedDB (soteria_offline_db)
    participant Hook as useOfflineSync Hook
    participant API as FastAPI Backend (:8000)
    participant Gemini as Google GenAI Multimodal
    participant DB as PostgreSQL + PostGIS (SRID 4326)
    participant WS as WebSocket Stream (/ws/incidents)
    actor CMD as Commander (3D GIS Map)

    C->>Form: 1. Records voice SOS note & attaches scene photo
    Note over C,Form: Cellular network DOWN (navigator.onLine === false)
    Form->>IDB: 2. storeOfflineDistress({ audioBlob, imageBlob, lat, lng, text })
    IDB-->>Form: 3. Payload queued with ID #OFF-101
    Form-->>C: 4. Offline banner: "Distress Queued Safely. Will auto-sync on reconnect."

    Note over C,Hook: Cell signal restored! (online event fires)
    Hook->>IDB: 5. getPendingDistressQueue()
    IDB-->>Hook: 6. Returns [#OFF-101]
    Hook->>API: 7. POST /api/v1/triage/multimodal (FormData with is_offline_cached=true)
    API->>Gemini: 8. Extract dialect transcript, entities & Safety SOP
    Gemini-->>API: 9. MultimodalGeminiExtraction JSON
    API->>DB: 10. INSERT incident (SRID 4326, is_offline_cached=true)
    DB-->>API: 11. Incident persisted (#106)
    API->>WS: 12. ws_manager.broadcast_incident("INCIDENT_CREATED", incident_data)
    WS-->>CMD: 13. Commander Map updates in real-time
    API-->>Hook: 14. HTTP 201 Response
    Hook->>IDB: 15. removeQueuedDistress(#OFF-101)
    Hook-->>C: 16. Toast: "Offline emergency distress report successfully synced!"
```

---

## 7. AI Closed-Loop Photo Verification & Closure Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Vol as 🦺 Field Volunteer
    participant VHub as Volunteer Hub UI
    participant API as FastAPI Backend (:8000)
    participant Gemini as Gemini 1.5 Flash Vision
    participant DB as PostgreSQL + PostGIS (SRID 4326)
    participant WS as WebSocket Stream (/ws/incidents)
    actor CMD as Commander (3D GIS Map)

    Vol->>VHub: 1. Completes rescue, captures post-action resolution photo & notes
    VHub->>API: 2. POST /api/v1/dispatch/verify (incident_id, photo, notes)
    API->>DB: 3. Fetch initial hazard context & description
    DB-->>API: 4. Initial hazard: "FLOOD / 4 trapped on roof"
    API->>Gemini: 5. Audit resolution photo against initial hazard
    Note over API,Gemini: Gemini Vision inspects image: verifies water receded, casualties safe
    Gemini-->>API: 6. RescueVerificationAuditResult (is_verified: true, conf: 0.98, status: HAZARD_RESOLVED)
    API->>DB: 7. UPDATE incident SET status = 'RESOLVED', verification_data = audit_result
    API->>DB: 8. UPDATE volunteer SET status = 'AVAILABLE'
    DB-->>API: 9. Transaction committed
    API->>WS: 10. ws_manager.broadcast_incident("INCIDENT_RESOLVED", incident_data)
    par Real-Time Push
        WS-->>CMD: 11a. Incident badge turns green (RESOLVED) on Commander Map
    and Verification Receipt
        API-->>VHub: 11b. HTTP 200 RescueVerificationResponse
        VHub-->>Vol: 12b. Renders AI Closed-Loop Verification Receipt (Confidence: 98%)
    end
```

---

## 8. Role-Based Authentication (RBAC) & Access Gateway Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Evaluator / Commander / Volunteer
    participant App as Next.js 14 Frontend
    participant AuthContext as React AuthContext (localStorage)
    participant AuthAPI as FastAPI Auth Router (/api/v1/auth)
    participant DB as PostgreSQL Users Table

    alt 1-Click Demo Commander Access
        User->>App: 1. Clicks "Demo Commander" pill in AuthModal
        App->>AuthAPI: 2. POST /api/v1/auth/login { email: "commander@soteria.gov", password: "..." }
        AuthAPI->>DB: 3. Fetch user record and verify bcrypt hash
        AuthAPI-->>App: 4. Returns JWT Token (sub: email, role: "HQ_COMMANDER", exp: 24h)
        App->>AuthContext: 5. Store soteria_access_token & soteria_user_profile
        AuthContext-->>App: 6. Top Header updates to "Chief Commander Rajiv Malhotra [HQ_COMMANDER]"
        App-->>User: 7. Unlocks 3D Tactical GIS Map & 1-Click Dispatch Actions
    else Unauthenticated Volunteer Access Guard
        User->>App: 8. Clicks "Volunteer Hub" tab while in Guest mode
        App->>AuthContext: 9. Check isAuthenticated && (role === 'VOLUNTEER' || role === 'HQ_COMMANDER')
        Note over App,User: Access Denied (Guest) -> Prompts AuthModal with "VOLUNTEER" target role
        User->>App: 10. Clicks "Demo Volunteer"
        App->>AuthAPI: 11. POST /api/v1/auth/login { email: "aarav.volunteer@soteria.org", password: "..." }
        AuthAPI-->>App: 12. Returns JWT Token (role: "VOLUNTEER")
        App->>AuthContext: 13. Update auth state
        App-->>User: 14. Unlocks Mission SOPs and AI Closed-Loop Photo Verification
    else Friction-Free Citizen SOS (Zero Auth Barrier)
        User->>App: 15. Clicks "New SOS" / Records Distress Note
        Note over App: Zero auth check — instant public SOS intake enabled!
        App-->>User: 16. Submits distress payload immediately
    end
```

---

## 9. Crowdsourced Relief Spot Nomination & Multi-Volunteer Proximity Dispatch Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as 📱 Citizen (Hyperlocal Scout)
    actor Volunteer as 🦺 Volunteer Responder (Field Recon)
    actor Commander as 🖥️ HQ Commander (Tactical Lead)
    participant App as Next.js 14 Frontend
    participant API as FastAPI Relief & Dispatch Endpoints
    participant PostGIS as PostgreSQL 16 + PostGIS Spatial Engine
    participant WS as WebSocket Stream (/ws/incidents)

    %% 1. Nomination
    Citizen->>App: 1. Submits Drop Spot ("St. Peter Church Terrace", FLAT_ROOFTOP, Dry High Ground)
    App->>API: 2. POST /api/v1/relief/nominate
    API->>PostGIS: 3. Store NominatedSpot (Status: PENDING_RECON) & auto-create VolunteerTask (#TASK-803)
    API-->>App: 4. Returns Spot ID #SPOT-103 receipt card to Citizen

    %% 2. Recon Verification & Quota Balancing
    Volunteer->>App: 5. Views Volunteer Hub Task Queue & clicks "[ ✋ Volunteer for Mission (+1) ]"
    App->>API: 6. POST /api/v1/relief/tasks/TASK-803/volunteer { action: "join" }
    API-->>App: 7. Atomic quota update (1/2 Responders Assigned)
    Volunteer->>App: 8. Conducts on-site inspection & clicks "Approve Spot" (Clear for airdrop)
    App->>API: 9. POST /api/v1/relief/verify-spot { spot_id: "SPOT-103", is_approved: true }
    API->>PostGIS: 10. Update Spot Status -> "APPROVED_ACTIVE" & Task -> "APPROVED_SAFE"
    API-->>WS: 11. Broadcast Spot Approval Event to Command HQ

    %% 3. Supply Dispatch
    Commander->>App: 12. Opens "Approved Relief Spots" Modal in Command HQ
    App->>API: 13. GET /api/v1/relief/nominated-spots?status=APPROVED_ACTIVE
    API-->>App: 14. Returns verified drop spots list
    Commander->>App: 15. Selects 48H Rations, Potable Water, Trauma Kits & Helicopter Airdrop
    App->>API: 16. POST /api/v1/relief/dispatch-supply
    API-->>App: 17. Returns tracking convoy receipt (e.g. AIRDROP-SPOT-103-8842)
    API-->>WS: 18. Broadcasts Supply Convoy Active status to GIS map

    %% 4. Multi-Volunteer Proximity Team Dispatch
    Commander->>App: 19. Opens Proximity Dispatch Drawer for P1 incident #55
    App->>API: 20. GET /api/v1/dispatch/nearby?incident_id=55 (Returns all nearby responders)
    Commander->>App: 21. Multi-selects Capt. Rajesh Verma (Boat Lead) + Pooja Deshmukh (Paramedic)
    App->>API: 22. POST /api/v1/dispatch/assign { volunteer_ids: [1, 2], notes: "Deploy boat from Sangam North" }
    API->>PostGIS: 23. Batch update volunteer statuses to DISPATCHED
    API-->>WS: 24. Real-time broadcast: 2 responders deployed to Incident #55
```



