# SOTERIA — Offline-First Multimodal AI Disaster Triage & Volunteer Dispatch Platform

> **"From Chaos to Clarity — Disaster Response at the Speed of AI"**

[![Automate India 2026](https://img.shields.io/badge/Competition-Automate_India_2026_(NIET_Chapter)-blue.svg)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_(Python_3.11+)-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14_(App_Router)-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![Deck.gl](https://img.shields.io/badge/3D_GIS-Deck.gl_WebGL_+_MapLibre-FF4081.svg?logo=webgl&logoColor=white)](https://deck.gl)
[![PostGIS](https://img.shields.io/badge/Database-PostgreSQL_16_+_PostGIS_3.4-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![Google Gemini](https://img.shields.io/badge/AI_Engine-Google_Gemini_1.5_Flash-4285F4.svg?logo=google&logoColor=white)](https://aistudio.google.com)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://docker.com)

---

## 👥 Team Soteria
- **Aryan Singh**
- **Ayush Kumar Singh**
- **Ayush Bhatt**
- **Abhijeet Mukherjee**

*Automate India 2026 — NIET Chapter*

---

## 🌪️ Executive Summary & Problem Briefing

In the initial hours of a catastrophic disaster (floods, earthquakes, building collapses), emergency command centers are inundated with thousands of chaotic, unstructured distress signals: frantic voice notes in localized dialects, blurry smartphone photos, and fragmented SMS messages. 

### Critical Pain Points in Legacy Systems:
1. **Unstructured Data Floods:** Victims send audio notes and blurry photos rather than filling out complex tabular web forms under duress.
2. **Manual Sifting & Cognitive Overload:** Incident commanders manually listen to audio recordings and review tweets under extreme operational pressure.
3. **Reactive Dispatch:** Prioritization becomes reactive—the loudest request or easiest call gets attention instead of the most critical life-threatening situation.
4. **Offline Blindness:** Cellular towers frequently collapse or become congested during disasters; ground teams arrive blind without knowing current hazards.

### The Core Thesis:
> **"The missing layer is automated understanding, not just data collection."**  
> We are not building just another SOS application. Instead, we are building the critical missing understanding layer that uses AI to convert chaotic human communication into structured, prioritized, geospatially indexed rescue operations in real time.

---

## 🚀 Key Platform Capabilities (Milestones 1, 2, 3 & 4 Active)

| Capability | Legacy Approach | Soteria Platform |
| :--- | :--- | :--- |
| **Mass Distress Intake** | Manual call centers, language limited | **Multimodal Voice (Dialects), Photo, Text Intake** |
| **Triage Prioritization** | First-come, first-served or loudest caller | **Deterministic 0–100 AI Urgency Triage with Explainable Math** |
| **3D Geospatial Visualization** | Static 2D pins with visual clutter | **Deck.gl 3D WebGL HexagonLayer + CartoDB Dark Matter** |
| **Real-Time Stream Sync** | 15–30s polling latency | **FastAPI WebSockets (`/ws/incidents`) with Sub-100ms Broadcast** |
| **Connectivity Failure** | Complete failure in cellular dead-zones | **Offline-First PWA (IndexedDB) with Auto-Reconnect Burst** |
| **Volunteer Coordination** | Uncoordinated WhatsApp groups | **PostGIS Geodesic Dispatch (`ST_Distance`) & 3-Bullet AI SOPs** |
| **AI Verification** | Unverified word-of-mouth tickets | **Gemini Vision Closed-Loop Photo Proof Verification** |
| **Command Reporting** | Manual hours-long reporting delays | **Automated 30-Minute 3-Bullet GenAI SitRep Engine** |

---

## 🛠️ Architecture & Tech Stack

```
                                  SOTERIA PLATFORM ARCHITECTURE
                                  
    ┌─────────────────────────── CLIENT & MOBILE LAYER ───────────────────────────┐
    │                                                                             │
    │   [ Citizen SOS Portal (PWA) ]   [ Commander 3D GIS ]   [ Volunteer Hub ]   │
    │   • Live Voice Note (Dialects)   • Deck.gl 3D WebGL Map • Dynamic AI SOPs   │
    │   • IndexedDB Offline Queue      • WebSocket Live Push  • Photo Verification│
    │   • Auto-Sync on Signal Return   • PostGIS Dispatch     • Closed-Loop Audit │
    │                                                                             │
    └──────────────────────────────────────┬──────────────────────────────────────┘
                                           │ HTTP/REST & WebSockets (ws://)
                                           ▼
    ┌───────────────────────────── API & BACKEND LAYER ───────────────────────────┐
    │                                                                             │
    │   FastAPI (Python 3.11+) Asynchronous REST & WebSocket Gateway              │
    │   • Async Session Management (asyncpg)                                      │
    │   • ConnectionManager WebSocket Stream (/ws/incidents)                      │
    │   • Multimodal GenAI Pipeline (google-genai SDK)                            │
    │   • Deterministic 0-100 Urgency Math Engine                                 │
    │   • PostGIS Nearest Volunteer Matcher (ST_DWithin / ST_Distance)            │
    │   • Gemini Vision Photo Proof Verification & 30-Min SitRep Engine           │
    │                                                                             │
    └──────────────────────┬───────────────────────────────┬──────────────────────┘
                           │                               │
                           ▼                               ▼
    ┌──────────────── SPATIAL DATABASE ────────┐  ┌──────── MULTIMODAL AI ────────┐
    │                                          │  │                               │
    │   PostgreSQL 16 + PostGIS 3.4 (SRID 4326)│  │   Google Gemini 1.5 Flash     │
    │   • Geodesic Distance (ST_Distance)      │  │   • Regional Dialect Parser   │
    │   • Hexagonal Risk Binning (ST_Hexagon)  │  │   • Vision Hazard Audit       │
    │   • R-Tree Spatial Indexing (GIST)       │  │   • Structured Pydantic JSON  │
    │                                          │  │                               │
    └──────────────────────────────────────────┘  └───────────────────────────────┘
```

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React Icons, Deck.gl WebGL (`@deck.gl/react`, `@deck.gl/aggregation-layers`), MapLibre GL with CartoDB Dark Matter, IndexedDB (`soteria_offline_db`), Service Worker PWA, HTML5 MediaRecorder & Geolocation API.
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 (Async), `asyncpg`, GeoAlchemy2, Pydantic v2 Settings, FastAPI WebSockets.
- **Database:** PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`) with EPSG:4326 WGS 84 spatial indexing.
- **AI Intelligence:** Google Gemini Multimodal APIs (`google-genai` & `google-generativeai`) with resilient zero-key mock fallback.
- **Orchestration:** Docker Compose multi-container networking with persistent named volumes.

---

## ⚡ Quickstart Guide (1-Command Startup)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24.0+) & [Docker Compose](https://docs.docker.com/compose/) (v2.20+)
- Git

### 1. Clone & Configure Environment
```bash
# Clone the repository
git clone https://github.com/Ayush2315/Soteria.git
cd soteria

# Create your environment configuration from the template
cp .env.example .env
```

### 2. Launch the Entire System via Docker Compose
```bash
docker compose up --build
```

### 3. (Optional) Populate Deterministic Multi-Hazard Demo Seed Dataset
Populate 8 certified field volunteers across Prayagraj and 6 multi-hazard incidents with 1 command:
```bash
docker compose exec backend python seed_disaster_data.py
# Or locally:
python backend/seed_disaster_data.py
```

### 4. Access the Live Applications:
- 🌐 **Web Command Center & 3D GIS Map:** [http://localhost:3000](http://localhost:3000)
- ⚙️ **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **System & PostGIS Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- 🚨 **Multimodal Triage Endpoint:** `POST http://localhost:8000/api/v1/triage/multimodal`
- 📡 **Real-Time WebSocket Stream:** `ws://localhost:8000/ws/incidents`
- 🦺 **Volunteer Proximity Dispatch:** `POST http://localhost:8000/api/v1/dispatch/nearby`
- 🔍 **AI Closed-Loop Photo Verification:** `POST http://localhost:8000/api/v1/dispatch/verify`
- 📋 **Automated 30-Minute SitRep:** `GET http://localhost:8000/api/v1/command/sitrep`

---

## 🧭 Judge Evaluation Workflow (Demonstration Walkthrough)

### 1. Offline-First PWA & IndexedDB Dead-Zone Test
1. Navigate to **Citizen SOS** tab on [http://localhost:3000](http://localhost:3000).
2. Click **"Mode: Cellular Dead-Zone"** to simulate disconnected cell reception.
3. Record a short voice note SOS in Hindi or English (or type a message) and click **"Transmit Multimodal Distress Signal"**.
4. Observe the yellow banner: `"Distress signal safely queued in local IndexedDB offline storage."`
5. Switch back to **"Network: Online Relay"** (or click **"Sync All Now"**) — the queued distress payload bursts directly to FastAPI and appears instantly on the Commander 3D map!

### 2. PostGIS Volunteer Proximity Dispatch & 3-Bullet AI SOP
1. Navigate to **Commander Dashboard** and click on Incident **#101** (North Ghat, Prayagraj).
2. Click **"Dispatch Responder"** to open the Proximity Dispatch Drawer.
3. Observe nearest responders calculated via PostGIS `ST_Distance` (e.g., *Capt. Rajesh Verma — 0.64 km away*).
4. Review the dynamic 3-bullet AI Safety SOP briefing and click **"Dispatch Responder with AI SOP"**.
5. Observe instant status transition to `DISPATCHED` across all connected dashboards via WebSockets!

### 3. Google GenAI Vision Closed-Loop Photo Verification
1. Navigate to the **Volunteer Response Hub** tab.
2. Select the assigned mission (e.g. Incident #101).
3. Upload a rescue resolution photo (or take a photo) and click **"Submit AI Photo Audit & Verify Resolution"**.
4. Watch Google Gemini Vision audit the photo against the initial flood hazard and output the verified closure receipt (Confidence: 98%, Status: `HAZARD_RESOLVED`).

### 4. Automated 30-Minute Executive Operational SitRep
1. In the Commander Dashboard, click **"30-Min SitRep Briefing"**.
2. Click **"Synthesize Now"** to watch PostGIS aggregate casualty metrics and prompt Gemini to generate a structured 3-bullet operational summary for leadership.

---

## 📡 Complete REST & WebSocket API Reference

### System & Health
- `GET /` : Platform metadata, version `0.4.0`, and API documentation links.
- `GET /api/v1/health` : PostgreSQL & PostGIS healthcheck.

### Real-Time WebSockets
- `WS /ws/incidents` : Real-time bi-directional streaming channel pushing `INCIDENT_CREATED`, `INCIDENT_UPDATED`, `DISPATCH_ASSIGNED`, and `INCIDENT_RESOLVED` payloads.

### Multimodal AI Triage
- `POST /api/v1/triage/multimodal` : Multimodal multipart ingestion (audio, photo, text, GPS) with Gemini structured extraction and deterministic 0-100 mathematical scoring.
- `GET /api/v1/incidents/` : Query prioritized incident queue with filters.
- `GET /api/v1/incidents/{id}` : Detailed incident dossier and safety SOP briefing.

### Volunteer Dispatch & Verification
- `GET /api/v1/dispatch/volunteers` : List registered field responders with GPS coordinates and skill tags.
- `POST /api/v1/dispatch/nearby` : PostGIS geodesic nearest-neighbor query (`ST_DWithin` / `ST_Distance`).
- `POST /api/v1/dispatch/assign` : Assign volunteer to incident with WebSocket broadcast.
- `POST /api/v1/dispatch/verify` : Multipart post-rescue photo audit with Gemini Vision and ticket resolution.

### Commander SitReps & Statistics
- `GET /api/v1/command/sitrep` : Fetch or generate 30-minute 3-bullet operational SitRep.
- `POST /api/v1/command/sitrep` : Force on-demand regeneration of executive SitRep.
- `GET /api/v1/command/stats` : Real-time dashboard operational counts.

---

## 🗺️ Completed Milestones & Roadmap

- **Milestone 1 (Completed):** Project Foundation, Docker Environment, PostGIS Integration, Base FastAPI & Next.js Skeletons, and Core Architecture Documentation.
- **Milestone 2 (Completed):** Gemini Multimodal Audio/Vision Ingestion Pipeline, Regional Dialect Translation, Deterministic 0–100 Triage Scoring Engine, Dynamic Responder Safety SOPs, and Citizen SOS + Live Triage Result Card UI.
- **Milestone 3 (Completed):** Real-Time Hexagonal 3D GIS Map (Deck.gl + CartoDB Dark Matter), WebSockets (`/ws/incidents`), Auto-Reconnecting State Reducer, and Web Audio Emergency Chime Alerts.
- **Milestone 4 (Completed):** Offline-First Citizen PWA (IndexedDB Sync), PostGIS Volunteer Proximity Dispatch, AI Closed-Loop Photo Verification, 30-Minute SitRep Synthesis Engine, and Deterministic Scenario Data Seeder (`seed_disaster_data.py`).

---

## 📄 License & Compliance
Developed for **Automate India 2026 (NIET Chapter)** by Team Soteria.  
All code is released under the MIT Open Source License.
