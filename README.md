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

## 🚀 Key Platform Capabilities (Milestone 2 Active)

| Capability | Legacy Approach | Soteria Platform |
| :--- | :--- | :--- |
| **Mass Distress Intake** | Manual call centers, language limited | **Multimodal Voice (Dialects), Photo, Text Intake** |
| **Triage Prioritization** | First-come, first-served or loudest caller | **Deterministic 0–100 AI Urgency Triage with Explainable Math** |
| **Connectivity Failure** | Complete failure in cellular dead-zones | **Offline-First PWA with Edge Queuing & Auto-Sync** |
| **Spatial Mapping** | Static GIS points with historical lag | **PostGIS Real-Time Hexagonal Risk Heatmaps (SRID 4326)** |
| **Volunteer Coordination** | Uncoordinated WhatsApp groups | **Dynamic Hazard SOPs & AI-Verified Photo Closure** |
| **Command Reporting** | Manual hours-long reporting delays | **Automated 30-Minute 3-Bullet GenAI SitReps** |

---

## 🛠️ Architecture & Tech Stack

```
                                  SOTERIA PLATFORM ARCHITECTURE
                                  
    ┌─────────────────────────── CLIENT & MOBILE LAYER ───────────────────────────┐
    │                                                                             │
    │   [ Citizen SOS Portal (PWA) ]   [ Commander GIS ]   [ Volunteer SOP Hub ]  │
    │   • Live Voice Note Recording    • Live Urgency Feed • Safety SOP Briefings │
    │   • Photo Capture & Upload       • Explainable Math  • AI Photo Verification│
    │   • HTML5 GPS Auto-Detection     • PostGIS Heatmap   • Task Action Logs     │
    │                                                                             │
    └──────────────────────────────────────┬──────────────────────────────────────┘
                                           │ HTTP/REST (JSON & Multipart Form-Data)
                                           ▼
    ┌───────────────────────────── API & BACKEND LAYER ───────────────────────────┐
    │                                                                             │
    │   FastAPI (Python 3.11+) Asynchronous REST Gateway                          │
    │   • Async Session Management (asyncpg)                                      │
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

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide React Icons, HTML5 MediaRecorder & Geolocation API.
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy 2.0 (Async), `asyncpg`, GeoAlchemy2, Pydantic v2 Settings.
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
- 🌐 **Web Command Center & Citizen SOS PWA:** [http://localhost:3000](http://localhost:3000)
- ⚙️ **FastAPI Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **System & PostGIS Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- 🚨 **Multimodal Triage Endpoint:** `POST http://localhost:8000/api/v1/triage/multimodal`
- 📊 **Incidents Triage Feed:** [http://localhost:8000/api/v1/incidents/](http://localhost:8000/api/v1/incidents/)

---

## 🧪 Testing the Multimodal GenAI Triage Engine (cURL)

### Test 1: Multipart Text SOS Ingestion
```bash
curl -X POST "http://localhost:8000/api/v1/triage/multimodal" \
  -F "text=Flood water has risen 4 feet near North Bridge! 3 people trapped on roof including elderly grandmother and infant." \
  -F "latitude=25.4358" \
  -F "longitude=81.8463" \
  -F "location_name=Sector 3 North Bridge, Prayagraj"
```

### Test 2: Multipart Audio SOS Ingestion
```bash
curl -X POST "http://localhost:8000/api/v1/triage/multimodal" \
  -F "audio=@/path/to/voice_sos.wav;type=audio/wav" \
  -F "latitude=25.4412" \
  -F "longitude=81.8329" \
  -F "location_name=Old City Market"
```

---

## 📡 REST API Reference

### System & Health Endpoints
- `GET /` : Platform metadata, version `0.2.0`, and API documentation links.
- `GET /api/v1/health` : Live healthcheck returning PostgreSQL connection status and PostGIS extension activation details.

### Multimodal AI Triage & Disaster Incidents
- `POST /api/v1/triage/multimodal` : **[Milestone 2]** Accepts `multipart/form-data` with audio note, scene photo, text message, and coordinates. Executes Google Gemini structured extraction, computes 0-100 deterministic urgency score, and logs spatial point in PostGIS.
- `POST /api/v1/incidents/` : Ingest JSON distress signal and stores PostGIS geometry.
- `GET /api/v1/incidents/` : Query prioritized incident queue with filters (`status`, `category`, `min_score`, `limit`, `offset`).
- `GET /api/v1/incidents/{id}` : Fetch complete incident dossier with structured extracted entities and dynamic volunteer safety SOP.
- `PATCH /api/v1/incidents/{id}` : Update incident status (`DISPATCHED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), assign volunteers, or attach proof-of-action verification data.

---

## 🗺️ Staged Roadmap

- **Milestone 1 (Completed):** Project Foundation, Docker Environment, PostGIS Integration, Base FastAPI & Next.js Skeletons, and Core Architecture Documentation (`ChangeLog.md`, `Decisions.md`, `Flow.md`, `README.md`).
- **Milestone 2 (Completed):** Gemini Multimodal Audio/Vision Ingestion Pipeline, Regional Dialect Translation, Deterministic 0–100 Triage Scoring Engine, Dynamic Responder Safety SOPs, and Citizen SOS + Live Triage Result Card UI components.
- **Milestone 3 (Next):** Real-Time Mapbox PostGIS Heatmaps, Proximity Volunteer Auto-Dispatch (`ST_DWithin`), Automated 30-Min SitRep Engine, and AI-Verified Photo Closures.

---

## 📄 License & Compliance
Developed for **Automate India 2026 (NIET Chapter)** by Team Soteria.
All code is released under the MIT Open Source License.
