# SOTERIA — Architecture Decision Records (ADRs)

This document details the critical architectural decisions, rationale, context, and trade-offs made during the design and implementation of the **SOTERIA** disaster triage platform.

---

## ADR 001: Selection of FastAPI (Python 3.11+) Backend and Next.js 14 App Router Frontend

### Context & Problem Statement
Disaster response systems experience extreme bursts of unstructured, high-concurrency data during mass casualty events (e.g., flash floods, earthquakes). The system requires:
1. Low-latency async processing of multimodal payloads (audio streams, high-resolution photos, real-time sensor pings).
2. Direct integration with state-of-the-art Python AI ecosystems (Google Gemini SDKs, Hugging Face, GeoPandas, Shapely).
3. Highly responsive, lightweight Progressive Web App (PWA) capabilities on the client side with sub-second rendering for emergency commanders and field responders.

### Decision
We selected **FastAPI** with `asyncpg` / `uvicorn` for the backend microservice and **Next.js 14 (App Router)** with **Tailwind CSS** for the frontend client interface.

### Rationale
- **FastAPI**:
  - Native asynchronous I/O via Starlette and `asyncpg` enables thousands of concurrent distress signal ingestion requests without blocking the event loop.
  - Native integration with Python AI libraries (`google-genai`, `google-generativeai`, `geoalchemy2`) avoids inter-process serialization overhead.
  - Automatic OpenAPI/Swagger documentation generation provides type-safe contract alignment between frontend and backend.
- **Next.js 14 (App Router)**:
  - Hybrid rendering (Server-Side Rendering + Static Route Segments) delivers instant initial page load for bandwidth-constrained field devices.
  - App Router simplifies role-based navigation (Commander GIS, Citizen PWA, Volunteer Hub).
  - Built-in PWA service worker support enables offline caching and background synchronization.

### Consequences
- **Positive:** High performance, rapid iteration, strong typing across Python (Pydantic v2) and TypeScript, zero friction AI integration.
- **Trade-off:** Python and Node.js require independent container environments, coordinated via Docker Compose.

---

## ADR 002: Architectural Choice of PostgreSQL with PostGIS Spatial Extension over Standard SQL

### Context & Problem Statement
During a disaster, standard relational queries (`WHERE lat BETWEEN ... AND lon BETWEEN ...`) fail to compute accurate spatial clustering, geodesic distances on the Earth's curvature (WGS 84 ellipsoid), or topological intersections (e.g., determining which victims lie inside a flood polygon).

### Decision
We adopted **PostgreSQL 16** with the **PostGIS 3.4** spatial extension (`postgis/postgis:16-3.4`) using EPSG:4326 (WGS 84 GPS coordinate system) and R-Tree spatial indexing (`GIST`).

### Rationale
- **True Geodesic Distance Calculations:** PostGIS provides `ST_DWithin` and `ST_Distance` using spatial ellipsoids, avoiding flat-plane Euclidean distortion.
- **Spatial Indexing (`GIST`):** Spatial bounding-box indexes allow sub-millisecond queries across hundreds of thousands of incident coordinates.
- **Hexagonal Spatial Clustering:** PostGIS natively enables spatial binning (`ST_HexagonGrid`) to generate real-time risk-density heatmaps for commanders without loading all raw points into client memory.
- **GeoAlchemy2 Integration:** Seamlessly maps SQLAlchemy models to PostGIS spatial geometry types (`Geometry(geometry_type='POINT', srid=4326)`).

### Consequences
- **Positive:** Sub-millisecond geographic proximity queries, native spatial indexing, and direct compatibility with Mapbox GL JS and GIS data layers.
- **Trade-off:** Requires spatial libraries (`libgeos`, `libproj`, `libgdal`) in the backend container build.

---

## ADR 003: Docker Containerization, Network Bridge, and Volume Persistence Strategy

### Context & Problem Statement
The SOTERIA platform must guarantee 1-command startup (`docker compose up --build`) across diverse developer and disaster deployment environments (local laptops, field edge servers, AWS/GCP cloud instances) without manual PostgreSQL or PostGIS setup.

### Decision
We established a containerized monorepo orchestrated via `docker-compose.yml` with three distinct services (`db`, `backend`, `frontend`) connected via a dedicated bridge network (`soteria_network`) and a persistent named volume (`soteria_postgres_data`).

### Strategy Details
1. **Database Healthcheck Synchronization:**
   - The `db` container uses a native PostgreSQL healthcheck (`pg_isready -U postgres -d soteria_db`).
   - The `backend` container specifies `depends_on: { db: { condition: service_healthy } }`, guaranteeing that FastAPI will not launch until PostgreSQL is ready to accept connections.
2. **Volume Persistence & Hot Reloading:**
   - A named volume `postgres_data` mounts to `/var/lib/postgresql/data`, ensuring spatial incident logs survive container restarts.
   - Host volumes `./backend:/app` and `./frontend:/app` (with anonymous volume `/app/node_modules`) provide live code reloading during development.
3. **Async PostGIS Extension Initialization:**
   - The FastAPI backend lifespan triggers `CREATE EXTENSION IF NOT EXISTS postgis;` within an async transaction, ensuring zero manual database setup steps.

### Consequences
- **Positive:** Reliable, reproducible, zero-configuration local and cloud startup.
- **Trade-off:** Initial container build requires downloading base images (~1-2 mins on fresh environments).

---

## ADR 004: Multimodal AI Ingestion & Offline-First Synchronization with Gemini API

### Context & Problem Statement
Victims in disaster zones often experience cellular blackout or degraded 2G connectivity. Furthermore, users under severe trauma cannot fill out complex forms; they send short voice notes in local dialects or snap frantic photos.

### Decision
We architected a two-stage multimodal ingestion and offline sync protocol:
1. **Client-Side Edge Cache (PWA):**
   - The Citizen PWA stores recorded voice notes, captured photos, and GPS timestamps locally in IndexedDB when offline.
   - When network connectivity is restored (detected via `navigator.onLine` and `ServiceWorker` sync events), the client bursts queued payloads to `POST /api/v1/incidents/`.
2. **Multimodal GenAI Triage Pipeline (Gemini API):**
   - Raw audio and image payloads are streamed to Google Gemini models with structured JSON schema outputs.
   - The pipeline extracts:
     - Casualty count and trapped status.
     - Specific trauma medical needs.
     - Environmental hazards (downed power lines, flood height, fire).
     - Composite Triage Urgency Score (0 to 100).
     - Dynamic Volunteer Safety Standard Operating Procedure (SOP).
3. **Closed-Loop AI Verification:**
   - Field volunteers submit resolution photos that Gemini audits against the initial incident description to close the ticket with verified proof.

### Consequences
- **Positive:** Zero data loss in dead-zones, accessibility across languages and trauma states, actionable structured intelligence for commanders.
- **Trade-off:** Gemini API calls require fallback heuristic scoring during network latency or token rate-limiting.

---

## ADR 005: Deterministic Triage Urgency Math Engine with Explainable Subscores

### Context & Problem Statement
While Large Language Models (LLMs) excel at qualitative reasoning, natural language parsing, and dialect translation, relying purely on an LLM to generate numerical priority ranks introduces hallucination risks, non-deterministic sorting, and lack of mathematical explainability for government incident commanders and military disaster responders.

### Decision
We decoupled **Multimodal Intelligence Extraction** (handled by Google Gemini 1.5 Flash with Pydantic JSON schemas) from **Numerical Urgency Scoring** (handled by a pure, deterministic mathematical engine in Python).

### Rationale
- **Guaranteed Bounded Scoring (0.0 to 100.0):** The triage formula combines five distinct, bounded mathematical factors:
  1. $H_{\text{sev}}$: Hazard Severity (Max 35.0 pts)
  2. $T_{\text{rap}}$: Trapped Persons Factor (Max 25.0 pts)
  3. $V_{\text{uln}}$: Vulnerability Demographics (Max 25.0 pts)
  4. $M_{\text{ed}}$: Medical Trauma & Wounds (Max 10.0 pts)
  5. $R_{\text{ec}}$: Recency / Freshness Offset (Max 5.0 pts)
- **Explainable AI (XAI):** Commanders can inspect exactly why an incident received a score of 93.5 vs 74.0, viewing the exact subscore contributions in the UI.
- **Strict Tier Mapping:** Eliminates subjective ambiguity by mapping deterministically to `CRITICAL_P1` (80-100), `URGENT_P2` (60-79), `MODERATE_P3` (40-59), and `LOW_P4` (0-39).
- **Resilient Zero-Key Fallback:** If Gemini API is unreachable, the system applies heuristic text keyword analysis without interrupting the deterministic math pipeline.

### Consequences
- **Positive:** 100% reproducible, auditable, explainable prioritization with zero hallucination in emergency dispatch ranking.
- **Trade-off:** Requires maintaining strict Pydantic schemas across the GenAI service and the math scoring engine.

---

## ADR 006: Deck.gl WebGL Hexagonal GIS Layering & Real-Time WebSocket Synchronization

### Context & Problem Statement
Traditional 2D mapping tools (Leaflet, standard Mapbox markers) struggle when rendering thousands of disaster points in dense casualty sectors, causing browser UI lag and cognitive clutter for commanders. Furthermore, HTTP polling (`setInterval` polling) introduces 15–30 second latency in emergency dispatch and overloads server connection pools.

### Decision
We adopted **Deck.gl** (`@deck.gl/react`, `@deck.gl/aggregation-layers`) with **MapLibre GL** and **CartoDB Dark Matter** open-access vector tiles for the frontend GIS layer, coupled with a persistent **FastAPI WebSocket** (`/ws/incidents`) broadcast architecture.

### Rationale
- **Hardware-Accelerated WebGL Rendering:** Deck.gl offloads spatial point rendering and 3D geometric calculations directly to the client GPU, effortlessly handling 100,000+ spatial points at 60 FPS.
- **3D Hexagonal Risk Density (`HexagonLayer`):** Dynamically clusters incident points into 500m hexagonal bins with 3D extruded columns. Column height represents cumulative urgency while color ramp represents severity tier.
- **Zero-Key Base Map:** CartoDB Dark Matter tiles (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) provide a high-contrast emergency theme without external API key quotas, billing limits, or credit card dependencies.
- **Sub-100ms WebSocket Broadcasts:** As soon as an incident is validated and stored in PostGIS, FastAPI pushes the structured JSON event to all connected dashboard sockets, eliminating polling latency.
- **Audio Alarm Synthesis:** Uses native browser Web Audio API to synthesize emergency chimes on `CRITICAL_P1` incoming alerts with zero external audio assets.

### Consequences
- **Positive:** Sub-second situational awareness, 3D spatial hotspot visualization, zero map API dependencies, and high-performance WebGL rendering.
- **Trade-off:** Requires dynamic client-side loading (`ssr: false`) in Next.js to prevent server-side WebGL canvas initialization errors.

---

## ADR 007: Offline-First Client Architecture (IndexedDB & Service Workers), Volunteer Spatial Dispatch, and Closed-Loop Vision Verification

### Context & Problem Statement
Disaster victims and field responders operate under degraded or non-existent cellular infrastructure (power grid collapses, tower submersion). Standard web applications fail immediately when `fetch()` fails. Furthermore, emergency commanders require automated, sub-second nearest-neighbor spatial matching for certified volunteers, and an objective, closed-loop verification mechanism to ensure dispatched tasks are actually completed before tickets are closed.

### Decision
We implemented a three-tier resilience and dispatch architecture:
1. **Client-Side Offline Engine (IndexedDB & Service Workers):**
   - Implemented `soteria_offline_db` with a typed object store (`pending_sos_queue`) capable of storing raw audio Blobs, photos, and GPS metadata client-side.
   - PWA Service Worker (`/sw.js`) pre-caches core static application shell assets.
   - Auto-flush background listener (`useOfflineSync`) monitors `window.addEventListener('online')` and automatically bursts queued emergency payloads to `POST /api/v1/triage/multimodal` with `is_offline_cached: true`.
2. **PostGIS Geodesic Proximity Dispatch:**
   - Implemented `POST /api/v1/dispatch/nearby` and `/api/v1/dispatch/assign` using PostGIS spatial math (`ST_DWithin` / `ST_Distance`) to compute nearest available certified responders.
   - Attached dynamic 3-bullet AI Safety SOP briefings to dispatch directives.
3. **Google GenAI Vision Closed-Loop Verification (`/api/v1/dispatch/verify`):**
   - Field volunteers upload post-rescue proof photos.
   - Google Gemini Vision audits the photo evidence against the initial hazard profile to output an explainable verification verdict (`HAZARD_RESOLVED`), updates PostGIS status to `RESOLVED`, and broadcasts the resolution over WebSockets.
4. **Automated 30-Minute SitRep Synthesis Engine (`/api/v1/command/sitrep`):**
   - Periodically aggregates active vs. resolved incident clusters in PostGIS and prompts Gemini to generate a structured 3-bullet executive operational briefing.

### Consequences
- **Positive:** Zero data loss in dead-zones, instant geodesic volunteer matching, hallucination-resistant photo closure audits, and automated executive operational awareness.
- **Trade-off:** Client storage is bounded by browser IndexedDB quotas (~50MB-1GB depending on device).

