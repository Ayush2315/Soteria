# SOTERIA — Offline-First Multimodal AI Disaster Triage Platform

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

## 🚀 Key Platform Capabilities (Milestones 1, 2 & 3 Active)

| Capability | Legacy Approach | Soteria Platform |
| :--- | :--- | :--- |
| **Mass Distress Intake** | Manual call centers, language limited | **Multimodal Voice (Dialects), Photo, Text Intake** |
| **Triage Prioritization** | First-come, first-served or loudest caller | **Deterministic 0–100 AI Urgency Triage with Explainable Math** |
| **3D Geospatial Visualization** | Static 2D pins with visual clutter | **Deck.gl 3D WebGL HexagonLayer + CartoDB Dark Matter** |
| **Real-Time Stream Sync** | 15–30s polling latency | **FastAPI WebSockets (`/ws/incidents`) with Sub-100ms Broadcast** |
| **Connectivity Failure** | Complete failure in cellular dead-zones | **Offline-First PWA with Edge Queuing & Auto-Sync** |
| **Volunteer Coordination** | Uncoordinated WhatsApp groups | **Dynamic Hazard SOPs & AI-Verified Photo Closure** |
| **Command Reporting** | Manual hours-long reporting delays | **Automated 30-Minute 3-Bullet GenAI SitReps** |

---

## 🛠️ Architecture & Tech Stack

```
                                  SOTERIA PLATFORM ARCHITECTURE
                                  
    ┌─────────────────────────── CLIENT & MOBILE LAYER ───────────────────────────┐
    │                                                                             │
    │   [ Citizen SOS Portal (PWA) ]   [ Commander 3D GIS ]   [ Volunteer Hub ]   │
    │   • Live Voice Note Recording    • Deck.gl 3D WebGL Map • Safety SOPs       │
    │   • Photo Capture & Upload       • WebSocket Live Push  • Photo Verification│
    │   • HTML5 GPS Auto-Detection     • Explainable XAI Math • Task Action Logs  │
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
    │   • Deterministic 0-100 Triage Engine                                       │
    │   • Static Audio/Image Media Mount (/uploads)                               │
    │                                                                             │
    └──────────────────────┬───────────────────────────────┬──────────────────────┘
                           │                               │
                           ▼                               ▼
    ┌──────────────── SPATIAL DATABASE ────────┐  ┌──────── MULTIMODAL AI ────────┐
    │                                          │  │                               │
    │   PostgreSQL 16 + PostGIS 3.4 (SRID 4326)│  │   Google Gemini 1.5 Flash     │
    │   • Geodesic Distance (ST_DWithin)       │  │   • Regional Dialect Parser   │
    │   • Hexagonal Risk Binning (ST_Hexagon)  │  │   • Vision Hazard Extraction  │
    │   • R-Tree Spatial Indexing (GIST)       │  │   • Structured Pydantic JSON  │
    │                                          │  │                               │
    └──────────────────────────────────────────┘  └───────────────────────────────┘
```

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React Icons, Deck.gl WebGL (`@deck.gl/react`, `@deck.gl/aggregation-layers`), MapLibre GL with CartoDB Dark Matter, HTML5 MediaRecorder & Geolocation API.
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

Docker Compose will automatically:
1. Spin up the PostGIS 16 spatial database and wait for healthy initialization.
2. Build and launch the Python 3.11 FastAPI backend and automatically run `CREATE EXTENSION IF NOT EXISTS postgis;`.
3. Build and launch the Next.js 14 Command Center on port `3000`.

### 3. Access the Live Applications:
- 🌐 **Web Command Center & 3D GIS Map:** [http://localhost:3000](http://localhost:3000)
- ⚙️ **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **System & PostGIS Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- 🚨 **Multimodal Triage Endpoint:** `POST http://localhost:8000/api/v1/triage/multimodal`
- 📡 **Real-Time WebSocket Stream:** `ws://localhost:8000/ws/incidents`
- 📊 **Incidents Triage Feed:** [http://localhost:8000/api/v1/incidents/](http://localhost:8000/api/v1/incidents/)

---

## 🧪 Testing the WebSocket & Multimodal GenAI Engine

### Test 1: Multipart SOS Ingestion & WebSocket Broadcast
```bash
curl -X POST "http://localhost:8000/api/v1/triage/multimodal" \
  -F "text=Flood water has risen 4 feet near North Bridge! 3 people trapped on roof including elderly grandmother and infant." \
  -F "latitude=25.4358" \
  -F "longitude=81.8463" \
  -F "location_name=Sector 3 North Bridge, Prayagraj"
```
*Note: Any open Commander dashboard on [http://localhost:3000](http://localhost:3000) will instantly elevate a 3D hexagon column on the Deck.gl map and play an emergency audio alert without page refresh!*

---

## 📡 REST & WebSocket API Reference

### System & Health Endpoints
- `GET /` : Platform metadata, version `0.3.0`, and API documentation links.
- `GET /api/v1/health` : Live healthcheck returning PostgreSQL connection status and PostGIS extension activation details.

### Real-Time WebSockets
- `WS /ws/incidents` : Real-time bi-directional streaming channel pushing `INCIDENT_CREATED` and `INCIDENT_UPDATED` payloads to connected dashboards.

### Multimodal AI Triage & Disaster Incidents
- `POST /api/v1/triage/multimodal` : Accepts `multipart/form-data` with audio note, scene photo, text message, and coordinates. Executes Google Gemini structured extraction, computes 0-100 deterministic urgency score, logs spatial point in PostGIS, and broadcasts over WebSockets.
- `POST /api/v1/incidents/` : Ingest JSON distress signal and stores PostGIS geometry.
- `GET /api/v1/incidents/` : Query prioritized incident queue with filters (`status`, `category`, `min_score`, `limit`, `offset`).
- `GET /api/v1/incidents/{id}` : Fetch complete incident dossier with structured extracted entities and dynamic volunteer safety SOP.
- `PATCH /api/v1/incidents/{id}` : Update incident status (`DISPATCHED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), assign volunteers, or attach proof-of-action verification data.

---

## 🗺️ Staged Roadmap

- **Milestone 1 (Completed):** Project Foundation, Docker Environment, PostGIS Integration, Base FastAPI & Next.js Skeletons, and Core Architecture Documentation (`ChangeLog.md`, `Decisions.md`, `Flow.md`, `README.md`).
- **Milestone 2 (Completed):** Gemini Multimodal Audio/Vision Ingestion Pipeline, Regional Dialect Translation, Deterministic 0–100 Triage Scoring Engine, Dynamic Responder Safety SOPs, and Citizen SOS + Live Triage Result Card UI components.
- **Milestone 3 (Completed):** Real-Time Hexagonal 3D GIS Map (Deck.gl + CartoDB Dark Matter), WebSockets (`/ws/incidents`), Auto-Reconnecting State Reducer, and Web Audio Emergency Chime Alerts.

---

## 📄 License & Compliance
Developed for **Automate India 2026 (NIET Chapter)** by Team Soteria.
All code is released under the MIT Open Source License.
