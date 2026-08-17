# SOTERIA — System Data Flow & Architecture Diagrams

This document details the high-level request lifecycle, AI extraction pipelines, geospatial processing, and offline synchronization mechanisms powering the SOTERIA platform.

---

## 1. High-Level System Architecture Overview

```mermaid
flowchart TD
    subgraph Clients["1. Target User Clients"]
        Citizen["📱 Citizen SOS (PWA / Offline Voice & Photo)"]
        Commander["🖥️ Commander GIS Dashboard (Heatmaps & SitReps)"]
        Volunteer["🦺 Volunteer Response Hub (SOPs & AI Photo Closure)"]
    end

    subgraph IngestionGateway["2. Ingestion & Offline Sync Layer"]
        SyncQueue["IndexedDB Local Storage & Service Worker Queue"]
        APIGateway["FastAPI Async REST Gateway (:8000)"]
    end

    subgraph IntelligenceLayer["3. Multimodal AI & Triage Engine"]
        GeminiFlash["Google Gemini 1.5 Flash (Multimodal Audio & Image Parser)"]
        TriageEngine["0-100 Urgency Scoring & Vulnerability Algorithm"]
        SOPGenerator["Dynamic Hazard & Responder SOP Generator"]
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

    PostGIS -->|Proximity Geo-Queries| ProximityMatcher
    ProximityMatcher -->|Dispatch Mission + SOP| Volunteer
    PostGIS -->|Periodic Incident Batch| SitRepCron
    SitRepCron -->|3-Bullet Digest| Commander
    Volunteer -->|Upload Closure Photo| PhotoClosure
    PhotoClosure -->|Verify & Close Ticket| PostGIS
```

---

## 2. End-to-End Multimodal SOS Ingestion & AI Triage Flow

```
[Victim in Disaster Zone]
       │
       ▼ (Sends frantic voice note in dialect or snaps photo)
[Citizen PWA Interface]
       │
       ├──[Network Offline?] ──► [IndexedDB Local Encrypted Queue]
       │                                     │
       │                                     ▼ (Network signal returns)
       └──[Network Online]  ─────────────────┘
                    │
                    ▼ HTTP POST /api/v1/incidents/
[FastAPI Ingestion Endpoint (Async Worker)]
       │
       ├──► [GeoAlchemy2: Convert GPS to ST_SetSRID(ST_MakePoint(lng, lat), 4326)]
       │
       ├──► [Stream Payload to Google Gemini Multimodal API]
       │            │
       │            ▼
       │      [Structured JSON Extraction]
       │      • Trapped Persons Count: 3
       │      • Vulnerable: Elderly (2), Infant (1)
       │      • Hazard: Rapid Flood + Transformer Arcing
       │      • Medical: Hypothermia & Trauma
       │
       ├──► [Compute 0-100 Triage Composite Score]
       │      Score = Base(30) + Trapped(20) + Vulnerable(20) + Hazard(20) = 90.0 (CRITICAL_P1)
       │
       ├──► [Synthesize Dynamic Volunteer Safety SOP]
       │      • Gear: Inflatable Boat, High-Voltage Insulated Boots, Infant PFD
       │      • Protocol: De-energize transformer -> Approach upstream -> Evacuate infant first
       │
       ▼
[Persist Incident in PostGIS Database]
       │
       ├──► [Trigger Real-Time Webhook to GIS Dashboard (Mapbox Heatmap)]
       └──► [Trigger Proximity Match: Find nearest qualified responders within 5km]
```

---

## 3. PostGIS Hexagonal Risk Density & Spatial Clustering

```
                       [Incoming Incident Points (SRID:4326)]
                                       │
                                       ▼
    ┌────────────────────────────────────────────────────────────────────────┐
    │ PostGIS Spatial Binning Query:                                         │
    │ SELECT ST_HexagonGrid(500, ST_SetSRID(ST_EstimatedExtent(...), 4326)) │
    │ JOIN incidents ON ST_Intersects(geom, hex_geom)                        │
    │ GROUP BY hex_geom                                                      │
    │ CALCULATE: AVG(triage_score) * COUNT(incidents) = Risk Intensity       │
    └────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                       [Real-Time Commander Heatmap]
          ╔══════════════╦══════════════╦══════════════╗
          ║  HEX-01: P4  ║  HEX-02: P1  ║  HEX-03: P2  ║
          ║  Low (12.0)  ║ Critical(94) ║ Urgent (71)  ║
          ╚══════════════╩══════════════╩══════════════╝
```

---

## 4. Volunteer Dispatch, Dynamic SOP & Closed-Loop Verification

```mermaid
sequenceDiagram
    autonumber
    actor C as Citizen
    participant API as FastAPI Backend
    participant DB as PostGIS DB
    participant AI as Gemini Multimodal Engine
    actor V as Field Volunteer
    actor CMD as Commander

    C->>API: 1. Ingest Distress Signal (Audio / Photo / GPS)
    API->>AI: 2. Extract Entities, Triage Score & SOP
    AI-->>API: 3. Structured Triage JSON + Safety Protocol
    API->>DB: 4. Insert Incident with PostGIS Point (SRID 4326)
    DB-->>CMD: 5. Live Feed Update & Heatmap Refresh
    API->>DB: 6. Spatial Query ST_DWithin(volunteer_geom, incident_geom, 5000)
    DB-->>API: 7. Selected Nearest Responder: VOL-8842
    API->>V: 8. Push Mission Alert with Dynamic Safety SOP Briefing
    V->>V: 9. Executes On-Site Rescue following SOP checklist
    V->>API: 10. Uploads Rescue Proof Photo to Close Ticket
    API->>AI: 11. Multimodal Verification: Compare Initial Scene vs. Resolution Photo
    AI-->>API: 12. Verification Approved (Confidence: 97%)
    API->>DB: 13. Update Incident Status = CLOSED / RESOLVED
    DB-->>CMD: 14. Real-time Mission Completed Confirmation
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
