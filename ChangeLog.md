# SOTERIA — Platform Change Log

All notable changes, architectural decisions, and package configurations across development milestones are recorded in this document.

---

## [Milestone 1] - Initial Foundation, Docker Environment, Base Skeletons, and Core Architecture
**Date:** 2026-08-17  
**Status:** Completed  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added Files & Directory Structure

#### 1. Root & Orchestration
- `.env.example`: Environment variables template defining database credentials, Gemini AI model parameters, Mapbox public tokens, and disaster response priority thresholds.
- `.gitignore`: Comprehensive ignore rules for Python bytecode, virtual environments, Node.js packages, `.next` build caches, SQLite/PostgreSQL data directories, and environment secrets.
- `docker-compose.yml`: Multi-container Docker orchestration connecting:
  - `db`: `postgis/postgis:16-3.4` container with healthchecks and persistent named volume `soteria_postgres_data`.
  - `backend`: FastAPI Python 3.11 container with hot-reloading and automatic health check dependency on `db`.
  - `frontend`: Next.js 14 container with node_modules volume caching and mapped port `3000`.
- `docs/screenshots/.gitkeep`: Dedicated directory for hackathon walkthrough screenshots and media.

#### 2. Backend Service (`/backend`)
- `requirements.txt`: Specified production dependencies:
  - `fastapi` & `uvicorn[standard]` (REST API Framework)
  - `pydantic` & `pydantic-settings` (Environment configuration & type validation)
  - `sqlalchemy` & `asyncpg` & `psycopg2-binary` (Async ORM & PostgreSQL drivers)
  - `geoalchemy2` & `shapely` (PostGIS spatial geometry handling)
  - `google-genai` & `google-generativeai` (Gemini Multimodal AI SDKs)
  - `httpx` & `python-multipart` (Async HTTP and multipart form uploads)
- `Dockerfile`: Debian-based multi-stage container including system packages `libpq-dev`, `libgeos-dev`, `libproj-dev`, `gdal-bin`, `libgdal-dev`.
- `.dockerignore`: Filtered build context for backend images.
- `main.py`: FastAPI application entrypoint with lifespan event, CORS middleware explicitly allowing `http://localhost:3000` and `http://127.0.0.1:3000`, root system info metadata endpoint `GET /`, and mounted v1 API routers.
- `app/core/config.py`: Pydantic `BaseSettings` reading environment variables with dynamic CORS array parsing and disaster triage threshold constants.
- `app/core/database.py`: Asynchronous SQLAlchemy engine (`create_async_engine`) and session generator. Implements `init_db()` executing `CREATE EXTENSION IF NOT EXISTS postgis;` inside an async connection block.
- `app/models/incident.py`: SQLAlchemy ORM model for disaster incidents featuring:
  - Spatial point column `Geometry(geometry_type='POINT', srid=4326)`
  - Modality enums (`VOICE`, `IMAGE`, `TEXT`, `SOCIAL`, `SENSOR`)
  - Triage category enums (`CRITICAL_P1`, `URGENT_P2`, `MODERATE_P3`, `LOW_P4`)
  - JSON columns for `extracted_entities`, `safety_sop`, and `verification_data`
- `app/models/volunteer.py`: SQLAlchemy ORM model for field responders with skill arrays, real-time spatial ping coordinates, and availability statuses.
- `app/schemas/health.py`: Pydantic schemas validating database and PostGIS extension health state.
- `app/schemas/incident.py`: Validation models for incident ingestion (`IncidentCreate`), response serialization (`IncidentRead`), updates (`IncidentUpdate`), and structured safety SOPs (`SafetySOPResponse`).
- `app/api/v1/endpoints/health.py`: `GET /api/v1/health` returning system and PostGIS extension diagnostics.
- `app/api/v1/endpoints/incidents.py`: Endpoints for `POST /api/v1/incidents/` (ingestion with preliminary heuristic triage), `GET /api/v1/incidents/` (priority-sorted spatial listing), `GET /api/v1/incidents/{id}`, and `PATCH /api/v1/incidents/{id}`.
- `app/api/v1/router.py`: Aggregated router mounting health and incident routes under `/api/v1`.

#### 3. Frontend Application (`/frontend`)
- `package.json`: Configured Next.js 14, React 18, Tailwind CSS, Lucide React icons, `clsx`, and `tailwind-merge`.
- `tsconfig.json`: TypeScript compiler options and `@/*` path alias configuration.
- `tailwind.config.ts`: Custom disaster command center theme with triage hazard tokens (Critical Red, Urgent Orange, Moderate Yellow, Low Green) and dark slate surface palettes.
- `postcss.config.mjs`: PostCSS configuration for Tailwind.
- `next.config.mjs`: Standalone build configuration with `/api/proxy` rewrites to the FastAPI backend.
- `Dockerfile`: Node.js 20 Alpine container setup.
- `src/app/globals.css`: Inter font integration, dark background baseline, glassmorphism panel styles, and glow pulse utilities.
- `src/app/layout.tsx`: Root layout with metadata and responsive viewport settings.
- `src/lib/api.ts`: Typed API client interfaces, backend health polling, incident ingestion helpers, and resilient fallback mock data.
- `src/lib/utils.ts`: Classname merge and timestamp formatting utilities.
- `src/components/ui/StatusBadge.tsx`: Reusable priority status indicators (`P1 CRITICAL`, `P2 URGENT`, `DISPATCHED`, `RESOLVED`) with pulsing animations.
- `src/components/Navbar.tsx`: Header component with real-time backend connection status, PostGIS indicator, and role tab navigation.
- `src/app/page.tsx`: Interactive multi-role portal featuring:
  - **Commander View:** Real-time prioritized triage queue, 0-100 AI score breakdown, dynamic volunteer safety SOP briefing.
  - **Citizen SOS (PWA):** Multimodal emergency distress signal intake (Voice, Photo, Text) with offline queue simulation.
  - **Volunteer SOP Hub:** Safety checklist and AI-verified proof-of-action closure receipt preview.

#### 4. Architecture Documentation
- `Decisions.md`: Architectural Decision Records (ADRs 001-004) covering framework choices, PostGIS rationale, Docker strategy, and multimodal offline sync.
- `Flow.md`: Complete end-to-end data flow specifications with Mermaid diagrams and ASCII charts.
- `README.md`: Comprehensive hackathon documentation with project background, architecture overview, prerequisites, 1-command startup instructions, and roadmap.
