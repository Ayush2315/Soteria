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

## 🌪️ Executive Summary & Problem Statement

In the initial golden hours of a catastrophic disaster (floods, earthquakes, structural collapses), emergency command centers are inundated with thousands of chaotic, unstructured distress signals: frantic voice recordings in localized regional dialects (Hindi, Awadhi, Bhojpuri), blurry smartphone photos, and fragmented messages.

### The Real-World Bottlenecks:
1. **Unstructured Data Floods:** Victims under life-threatening duress send panicked voice clips and photos rather than filling out complex tabular web forms.
2. **Cognitive Overload & Manual Sifting:** Incident commanders manually listen to audio recordings and review social media under extreme operational pressure.
3. **Reactive vs. Triage-Driven Dispatch:** Prioritization becomes reactive—the loudest request gets attention instead of the most critical life-safety emergency.
4. **Cellular Dead-Zones & Offline Blindness:** Communication infrastructure collapses during disasters, leaving citizens unable to transmit distress tickets and ground teams without situational awareness.
5. **Lack of Verified Resolution:** Traditional systems rely on unverified verbal reports to close tickets, risking abandoned victims and duplicate dispatches.

### The Soteria Solution:
> **"The missing layer is automated understanding, not just data collection."**  
> SOTERIA transforms unstructured human communication into prioritized, mathematically triaged, geospatially indexed operations with automated volunteer dispatch, real-time 3D GIS visualization, and AI-audited closed-loop photo verification.

---

## 🏛️ System Architecture

```
                                  SOTERIA PLATFORM ARCHITECTURE
                                  
    ┌─────────────────────────── CLIENT & INTERACTION LAYER ──────────────────────────┐
    │                                                                                 │
    │   [ 🖥️ COMMANDER HQ ]         [ 📱 CITIZEN PORTAL ]      [ 🚑 VOLUNTEER HUB ]   │
    │   • 3-Pane Tactical SaaS       • Zero-Barrier Guest SOS   • Level 1-4 Risk Tiers │
    │   • Deck.gl 3D WebGL Radar     • 1-Tap Native Voice SOS   • Quota Load Balancing │
    │   • Live P1 Alert Ticker       • Safe Havens vs Hazards   • Ground Recon Tasks   │
    │   • 30-Min GenAI SitRep        • Nominate Drop Spots      • Gemini Photo Closure │
    │                                                                                 │
    └──────────────────────────────────────┬──────────────────────────────────────────┘
                                           │ HTTP/REST & WebSockets (ws://)
                                           ▼
    ┌───────────────────────────── API & BACKEND LAYER ───────────────────────────────┐
    │                                                                                 │
    │   FastAPI (Python 3.11+) Asynchronous REST & WebSocket Gateway                  │
    │   • JWT Authentication & Role-Based Access Control (HS256)                      │
    │   • ConnectionManager WebSocket Stream (/ws/incidents)                          │
    │   • Multimodal GenAI Pipeline (Google Gemini 1.5 Flash)                         │
    │   • Deterministic 0-100 Urgency Math Engine                                     │
    │   • PostGIS Geodesic Nearest Responder Matcher (ST_DWithin / ST_Distance)       │
    │   • Relief Operations Engine (Safe Havens, Drop Spot Verification, Tasks)       │
    │   • Gemini Vision Photo Proof Verification & 30-Min SitRep Engine               │
    │                                                                                 │
    └──────────────────────┬───────────────────────────────────┬──────────────────────┘
                           │                                   │
                           ▼                                   ▼
    ┌──────────────── SPATIAL DATABASE ────────────┐  ┌──────── MULTIMODAL AI ────────┐
    │                                              │  │                               │
    │   PostgreSQL 16 + PostGIS 3.4 (SRID 4326)    │  │   Google Gemini 1.5 Flash     │
    │   • Geodesic Distance (ST_Distance)          │  │   • Regional Dialect Parser   │
    │   • Hexagonal Risk Binning (ST_Hexagon)      │  │   • Vision Hazard Audit       │
    │   • R-Tree Spatial Indexing (GIST)           │  │   • Structured Pydantic JSON  │
    │   • Safe Havens, Tasks, Users, Incidents     │  │   • 3-Bullet Tactical SitReps │
    │                                              │  │                               │
    └──────────────────────────────────────────────┘  └───────────────────────────────┘
```

---

## 🚀 Complete Feature Inventory

### 1. 🖥️ Tactical Commander HQ (`StitchHQCommander.tsx`)
- **3-Pane Workspace:**
  - **Left Strategic Ops Rail:** Real-time role switching, incident queue filters (All, P1 Critical, P2 Urgent), and live telemetry status for WebSockets and PostGIS.
  - **Center Bounded 3D GIS Radar:** Bounded Deck.gl WebGL canvas with extruded hexagonal hazard towers, CartoDB Dark Matter tiles, coordinate overlay badges (`25.4358° N, 81.8463° E`), layer toggles (3D Hexagons, Pins Only), parameter sliders (Radius, Elevation), and a pulsing **P1 Critical Alert Ticker** at the bottom with 1-Click Proximity Dispatch.
  - **Right Multimodal Triage Rail:** 4 Real-time telemetry metric cards (Active Incidents, Critical P1 Tier, Dispatched Active, AI Verified Resolved) and live incident feed with 1-click dispatch buttons.
- **Approved Crowdsourced Relief Spots Dashboard:** Slide-over modal showing verified spots cleared by volunteer ground recon with 1-click **Supply Convoy / Airdrop Dispatch** (custom supply checklist & transport type selection).
- **30-Minute Executive Operational SitRep:** One-click Gemini synthesis generating 3-bullet military-grade actionable briefings from PostGIS data.

### 2. 📱 Zero-Barrier Citizen SOS Portal (`StitchCitizenPortal.tsx`)
- **Friction-Free Guest Mode:** Victims in distress can immediately file SOS reports without login or account creation.
- **1-Tap Voice SOS:** Browser `MediaRecorder` audio recording with animated sound waves, supporting regional dialects (Hindi, Awadhi, Bhojpuri, English).
- **"Where to Go" (Safe Havens & Compass Guide):** Certified safe haven shelters with exact GPS coordinates, elevation, distance to active flood perimeter, and an interactive **🧭 Safe Path & Compass Navigation Guide** modal with heading bearings and walking corridor instructions.
- **Hyperlocal Drop Spot Nomination:** Citizens can nominate elevated rooftops and safe levee spots for helicopter/airdrop supply delivery, receiving an instant tracking receipt code.
- **Offline-First PWA (IndexedDB):** Queues distress signals locally in cellular dead-zones and automatically bursts them to the server upon reconnection.

### 3. 🚑 Volunteer Response & Recon Hub (`StitchVolunteerHub.tsx`)
- **Risk Level Protocols (Levels 1–4):** Transparent risk badges (Level 1 Low to Level 4 Extreme Water PFD) with mandatory PPE checklists.
- **Interactive Quota Claims:** Dynamic self-volunteering buttons `[ ✋ Volunteer for Mission (+1) ]` / `[ Joined (Click to Leave) ]` that atomically balance capacity quotas.
- **Ground Recon Micro-Tasks:** Field volunteers audit citizen-nominated drop spots, submit hazard clearance notes, and approve safe airdrop spots.
- **AI Closed-Loop Verification:** Volunteers upload post-rescue photos that are audited against original distress profiles by Google Gemini Vision.

### 4. 🦺 Multi-Volunteer Proximity Dispatch Drawer (`VolunteerDispatchDrawer.tsx`)
- **PostGIS Multi-Responder Selection:** Multi-select checkboxes for batch team dispatching.
- **Live Availability Badges:** `🟢 AVAILABLE` vs `🟡 ACTIVE ON MISSION` indicators with busy re-allocation warnings.
- **AI Safety SOP Directives:** Dynamic 3-bullet protocol generated per incident urgency.

### 5. 🔐 JWT Authentication & Role-Based Access Control (RBAC)
- **Zero-Barrier Guest Mode:** Open for Citizen SOS distress intake.
- **Secured Roles:**
  - `HQ_COMMANDER`: Full tactical dispatch, relief supply drops, 30-min SitRep synthesis, and global incident management.
  - `VOLUNTEER`: Field response missions, PPE safety checklists, ground recon audits, and AI photo verification.
- **1-Click Evaluator Logins:** Demo Commander and Demo Volunteer buttons in `AuthModal`.
  - `VOLUNTEER`: Field response mission checklists, SOPs, ground recon audits, and photo proof verification.
  - `CITIZEN`: Profile tracking and history.
- **1-Click Evaluator Demo Accounts:** Instant one-click authentication for judges and evaluators.

---

## 💻 Tech Stack & Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14.1.4 (App Router) | React 18 SSR & Client Architecture |
| **3D Geospatial Engine** | Deck.gl 8.9.36 + MapLibre GL 3.6.2 | WebGL 3D HexagonLayer & CartoDB Dark Matter |
| **Styling & UI** | Tailwind CSS 3.4 + Lucide Icons | Dark/Light Mode Tactical Design System |
| **Client Storage** | IndexedDB (`soteria_offline_db`) | Offline-First PWA Distress Queue |
| **Backend Framework** | FastAPI 0.110+ (Python 3.11+) | Asynchronous REST API & WebSockets |
| **Database & GIS** | PostgreSQL 16 + PostGIS 3.4 | SRID 4326 Geodesic Spatial Queries (`ST_Distance`, `ST_DWithin`) |
| **ORM & Async DB** | SQLAlchemy 2.0 + AsyncPG + GeoAlchemy2 | Asynchronous Database Layer |
| **AI Engine** | Google Gemini 1.5 Flash (`google-genai`) | Dialect Extraction, Vision Hazard Audit, SitRep Digest |
| **Authentication** | `python-jose` + `passlib[bcrypt]` | Signed JWT Bearer Tokens (`HS256`, 24h Expiry) |
| **Containerization** | Docker + Docker Compose | Multi-Container Containerized Network |

---

## ⚡ How to Run on Any System

### Option A: 1-Command Startup via Docker Compose (Recommended)

#### Prerequisites:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24.0+) & Docker Compose (v2.20+)
- Git

```bash
# 1. Clone the repository
git clone https://github.com/Ayush2315/Soteria.git
cd Soteria

# 2. Configure Environment Variables
cp .env.example .env

# 3. Launch all containers (Frontend, Backend, PostGIS DB)
docker-compose up --build -d

# 4. Populate Deterministic Demo Dataset (Incidents, Volunteers, Safe Havens)
docker exec soteria_backend python seed_disaster_data.py
```

---

### Option B: Native Local Development (Without Docker)

#### Prerequisites:
- Node.js 18+ & npm
- Python 3.11+
- PostgreSQL 16 with PostGIS extension enabled

#### 1. Backend Setup:
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed data
python seed_disaster_data.py

# Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

---

## 🌐 Live Service URLs

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | [http://localhost:3000](http://localhost:3000) | Master Multi-Role Interface (HQ / Citizen / Volunteer) |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI Documentation |
| **Health Check** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | PostGIS & System Status Telemetry |
| **WebSocket Stream** | `ws://localhost:8000/ws/incidents` | Real-time Incident & Dispatch Stream |

---

## 🔑 Pre-Configured Demo Credentials

The login gateway includes **1-Click Evaluator Buttons** for instant login:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **HQ Commander** | `commander@soteria.gov` | `Command@2026` | Full Tactical 3D Map, Proximity Dispatch, 30-Min SitRep |
| **Volunteer Lead** | `aarav.volunteer@soteria.org` | `Rescue@2026` | Field SOPs, Quota balancing, AI Photo Verification |
| **Citizen (Guest)** | *No Account Required* | *N/A* | Friction-free SOS voice/photo intake, Safe Havens |

---

## 🧭 Step-by-Step Evaluator Demo Walkthrough

### Step 1: Zero-Barrier Hindi Voice SOS Intake
1. Go to [http://localhost:3000](http://localhost:3000) and click **"Citizen SOS"** on the left rail.
2. Hold or tap the glowing **1-Tap SOS** button to record an audio message in Hindi (e.g., *"बाढ़ का पानी छत तक पहुँच गया है! 4 लोग फंसे हैं, नाव भेजो!"*).
3. Click **"Transmit Emergency SOS Ticket"**.
4. Observe the instant AI extraction (trapped count: 4, category: `CRITICAL_P1`, confidence: 98%).

### Step 2: Live Tactical Map & Critical Alert Ticker
1. Switch to **"Command HQ"** on the left navigation.
2. Click **"Commander Login"** ➔ **"Demo Commander"** ➔ **"Sign In"**.
3. View the 3D extruded hazard towers on the map over Prayagraj.
4. Observe the pulsing red **P1 Critical Alert Ticker** at the bottom of the map.

### Step 3: PostGIS Geodesic Proximity Dispatch
1. In the right-hand **Live Multimodal Triage Feed**, click **"Dispatch Proximity Lead"** on Incident #101.
2. Observe the nearest responder calculated using PostGIS geodesic distance (`ST_Distance`).
3. Click **"Dispatch Responder with AI SOP"** to broadcast the dispatch over WebSockets.

### Step 4: Volunteer Mobile Flow & Gemini Vision Resolution Audit
1. Switch to **"Volunteer Hub"** and log in as **Demo Volunteer**.
2. Review the active missions categorized by **Level 1–4 Risk Ratings** and required PPE.
3. Select an assigned ticket in the **AI Closed-Loop Photo Verification** panel.
4. Upload a post-rescue photo and click **"Submit AI Photo Audit & Verify Resolution"**.
5. Watch Gemini Vision audit the photo evidence and issue a verified resolution receipt.

### Step 5: 30-Minute Executive Operational SitRep
1. Return to **Command HQ** and click **"30-Min SitRep Briefing"** in the top header.
2. Click **"Synthesize Now"** to generate a 3-bullet military-grade situational digest.

---

## 📡 Key API Endpoints

### 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Authenticate and receive JWT access token.
- `POST /api/v1/auth/register`: Register new user account.
- `GET /api/v1/auth/me`: Inspect current authenticated profile.

### 2. Triage & Incidents (`/api/v1/triage`, `/api/v1/incidents`)
- `POST /api/v1/triage/multimodal`: Ingest voice, photo, text, GPS with AI triage scoring.
- `GET /api/v1/incidents`: Fetch prioritized incidents with category filters.
- `GET /api/v1/incidents/{id}`: Detailed incident dossier with AI safety SOPs.

### 3. Relief Operations (`/api/v1/relief`)
- `GET /api/v1/relief/safe-havens`: Certified safe haven shelters and active flood danger zones.
- `POST /api/v1/relief/nominate`: Citizen supply drop spot nominations.
- `GET /api/v1/relief/volunteer-tasks`: Field missions with risk tiers and capacity quotas.
- `POST /api/v1/relief/verify-spot`: Field volunteer ground reconnaissance spot audit.

### 4. Dispatch & AI Verification (`/api/v1/dispatch`)
- `POST /api/v1/dispatch/nearby`: PostGIS nearest volunteer calculation.
- `POST /api/v1/dispatch/assign`: Assign responder with WebSocket broadcast.
- `POST /api/v1/dispatch/verify`: Gemini Vision photo proof audit.

### 5. Command & SitRep (`/api/v1/command`)
- `GET /api/v1/command/sitrep`: Fetch 30-minute operational SitRep digest.
- `POST /api/v1/command/sitrep`: Force on-demand regeneration of SitRep.

---

## 📄 License & Compliance
Developed for **Automate India 2026 (NIET Chapter)** by Team Soteria.  
Released under the **MIT Open Source License**.
