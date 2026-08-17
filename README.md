# SOTERIA — Offline-First Multimodal AI Disaster Triage Platform

> **"From Chaos to Clarity — Disaster Response at the Speed of AI"**

[![Automate India 2026](https://img.shields.io/badge/Competition-Automate_India_2026_(NIET_Chapter)-blue.svg)](https://github.com)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_(Python_3.11+)-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14_(App_Router)-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
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

## 🚀 Key Platform Capabilities

| Capability | Legacy Approach | Soteria Platform |
| :--- | :--- | :--- |
| **Mass Distress Intake** | Manual call centers, language limited | **Automated Multimodal Voice, Photo, Text Intake** |
| **Triage Prioritization** | First-come, first-served or loudest caller | **0–100 AI Urgency Triage with Equity Weighting** |
| **Connectivity Failure** | Complete failure in cellular dead-zones | **Offline-First PWA with Edge Queuing & Auto-Sync** |
| **Spatial Mapping** | Static GIS points with historical lag | **PostGIS Real-Time Hexagonal Risk Heatmaps** |
| **Volunteer Coordination** | Uncoordinated WhatsApp groups | **Dynamic Hazard SOPs & AI-Verified Photo Closure** |
| **Command Reporting** | Manual hours-long reporting delays | **Automated 30-Minute 3-Bullet GenAI SitReps** |

---

## 🛠️ Architecture & Tech Stack

```
                                  SOTERIA PLATFORM ARCHITECTURE
                                  
    ┌─────────────────────────── CLIENT & MOBILE LAYER ───────────────────────────┐
    │                                                                             │
    │   [ Citizen SOS Portal (PWA) ]   [ Commander GIS ]   [ Volunteer SOP Hub ]  │
    │   • Offline Voice & Photo Intake • Live Urgency Feed • Safety SOP Briefings │
    │   • IndexedDB Edge Sync Queue    • PostGIS Heatmap   • AI Photo Verification│
    │                                                                             │
    └──────────────────────────────────────┬──────────────────────────────────────┘
                                           │ HTTP/REST (JSON & Multipart)
                                           ▼
    ┌───────────────────────────── API & BACKEND LAYER ───────────────────────────┐
    │                                                                             │
    │   FastAPI (Python 3.11+) Asynchronous REST Gateway                          │
    │   • Async Session Management (asyncpg)                                      │
    │   • Automated PostGIS Spatial Engine Initialization                         │
    │   • Preliminary Heuristic & Multimodal AI Routing                           │
    │                                                                             │
    └──────────────────────┬───────────────────────────────┬──────────────────────┘
                           │                               │
                           ▼                               ▼
    ┌──────────────── SPATIAL DATABASE ────────┐  ┌──────── MULTIMODAL AI ────────┐
    │                                          │  │                               │
    │   PostgreSQL 16 + PostGIS 3.4 (SRID 4326)│  │   Google Gemini 1.5 Flash     │
    │   • Geodesic Distance (ST_DWithin)       │  │   • Voice Dialect Transcription│
    │   • Hexagonal Risk Binning (ST_Hexagon)  │  │   • Vision Damage Assessment  │
    │   • R-Tree Spatial Indexing (GIST)       │  │   • Automated 3-Bullet SitReps│
    │                                          │  │                               │
    └──────────────────────────────────────────┘  └───────────────────────────────┘
```

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React Icons, Mapbox GL JS ready.
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 (Async), `asyncpg`, GeoAlchemy2, Pydantic v2 Settings.
- **Database:** PostgreSQL 16 + PostGIS 3.4 (`postgis/postgis:16-3.4`) with EPSG:4326 WGS 84 spatial indexing.
- **AI Intelligence:** Google Gemini Multimodal APIs (`google-genai` & `google-generativeai`).
- **Orchestration:** Docker Compose multi-container networking with persistent named volumes.

---

## ⚡ Quickstart Guide (1-Command Startup)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (v24.0+) & [Docker Compose](https://docs.docker.com/compose/) (v2.20+)
- Git

### 1. Clone & Configure Environment
```bash
# Clone the repository
git clone https://github.com/aryan-singh/soteria.git
cd soteria

# Create your environment configuration from the template
cp .env.example .env
```

### 2. Launch the Entire System via Docker Compose
```bash
docker compose up --build
```

That's it! Docker Compose will automatically:
1. Spin up the PostGIS 16 spatial database and wait for healthy initialization.
2. Build and launch the Python 3.11 FastAPI backend and automatically run `CREATE EXTENSION IF NOT EXISTS postgis;`.
3. Build and launch the Next.js 14 Command Center on port `3000`.

### 3. Access the Live Applications:
- 🌐 **Web Command Center & Citizen PWA:** [http://localhost:3000](http://localhost:3000)
- ⚙️ **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **System & PostGIS Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- 📊 **Incidents Triage API:** [http://localhost:8000/api/v1/incidents/](http://localhost:8000/api/v1/incidents/)

---

## 💻 Bare-Metal Local Development (Without Docker)

If you wish to develop without Docker containers:

### 1. Database (PostgreSQL + PostGIS)
Ensure a local PostgreSQL instance is running with PostGIS enabled on port `5432` with database `soteria_db`.

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 REST API Reference

### System & Health Endpoints
- `GET /` : Platform metadata, team info, and API documentation links.
- `GET /api/v1/health` : Live healthcheck returning PostgreSQL connection status and PostGIS extension activation details.

### Disaster Incidents & Multimodal Triage
- `POST /api/v1/incidents/` : Ingest distress signal (voice note transcript, photo, text, coordinates). Computes automated triage score (0-100), assigns P1-P4 priority, and stores PostGIS geometry.
- `GET /api/v1/incidents/` : Query prioritized incident queue with filters (`status`, `category`, `min_score`, `limit`, `offset`).
- `GET /api/v1/incidents/{id}` : Fetch complete incident dossier with structured extracted entities and dynamic volunteer safety SOP.
- `PATCH /api/v1/incidents/{id}` : Update incident status (`DISPATCHED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), assign volunteers, or attach proof-of-action verification data.

---

## 🗺️ Staged Roadmap

- **Milestone 1 (Current):** Project Foundation, Docker Environment, PostGIS Integration, Base FastAPI & Next.js Skeletons, and Core Architecture Documentation (`ChangeLog.md`, `Decisions.md`, `Flow.md`, `README.md`).
- **Milestone 2:** Gemini Multimodal Audio/Vision Ingestion Pipeline, Dialect Translation, 0–100 Triage Scoring Engine, and Dynamic Safety SOP Generator.
- **Milestone 3:** Real-Time Mapbox PostGIS Heatmaps, Proximity Volunteer Auto-Dispatch, Automated 30-Min SitRep Engine, and AI-Verified Photo Closures.

---

## 📄 License & Compliance
Developed for **Automate India 2026 (NIET Chapter)** by Team Soteria.
All code is released under the MIT Open Source License.
