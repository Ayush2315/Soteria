# SOTERIA — Platform Change Log

All notable changes, architectural decisions, and package configurations across development milestones are recorded in this document.

---

## [Milestone 2] - Multimodal GenAI Extraction & Urgency Triage Engine
**Date:** 2026-08-18  
**Status:** Completed  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter

### Added & Modified Components

#### 1. Backend Service (`/backend`)
- `app/services/gemini_service.py` [NEW]:
  - Multimodal AI ingestion service using `google-genai` SDK (`from google import genai`).
  - Strict Pydantic JSON extraction via `response_mime_type="application/json"` and `response_schema=MultimodalGeminiExtraction`.
  - Regional dialect recognition (Hindi, Bhojpuri, Bengali, Tamil, Telugu, etc.) with verbatim transcript and English translation.
  - Extraction of hazard type, severity (1-10), trapped status/count, vulnerable demographics, reported medical injuries, and 3-bullet dynamic responder SOP.
  - Zero-key / offline heuristic mock fallback guaranteeing 100% testability and uptime.
- `app/services/triage_engine.py` [NEW]:
  - Pure, deterministic, explainable mathematical calculation of composite 0-100 Urgency Triage Score.
  - Weighted factor model: Hazard Severity ($H_{\text{sev}} \le 35$), Trapped Victims ($T_{\text{rap}} \le 25$), Vulnerability Demographics ($V_{\text{uln}} \le 25$), Medical Trauma ($M_{\text{ed}} \le 10$), and Recency Freshness ($R_{\text{ec}} \le 5$).
  - Maps score to standard triage tiers: `CRITICAL_P1` (80-100), `URGENT_P2` (60-79), `MODERATE_P3` (40-59), `LOW_P4` (0-39).
- `app/api/v1/endpoints/triage.py` [NEW]:
  - `POST /api/v1/triage/multimodal` accepting `multipart/form-data` (audio file/recording, photo upload, distress text, GPS latitude & longitude).
  - Automatically saves uploaded audio/photo assets to static `uploads/` directory for playback and audit trail.
  - Persists spatial point in PostGIS (`SRID=4326;POINT(lng lat)`) and returns complete `MultimodalTriageResponse`.
- `app/api/v1/router.py` [MODIFIED]: Mounted `/api/v1/triage` router.
- `app/schemas/incident.py` [MODIFIED]: Added schemas for `VulnerableGroupBreakdown`, `SafetySOP`, `MultimodalGeminiExtraction`, `TriageBreakdown`, and `MultimodalTriageResponse`.
- `app/core/config.py` [MODIFIED]: Added static upload directory configuration (`UPLOAD_DIR`, `MAX_UPLOAD_SIZE_MB`).
- `main.py` [MODIFIED]: Mounted static file handler for `/uploads` and updated version metadata to `0.2.0`.

#### 2. Frontend Application (`/frontend`)
- `src/lib/api.ts` [MODIFIED]:
  - Added TypeScript interfaces matching backend models (`MultimodalGeminiExtraction`, `TriageBreakdown`, `MultimodalTriageResponse`, `VulnerableGroupBreakdown`, `SafetySOP`).
  - Added `submitMultimodalIncident(formData: FormData)` API function.
- `src/components/CitizenSOSForm.tsx` [NEW]:
  - Emergency distress intake supporting live in-browser audio recording via `MediaRecorder` API with timer and playback.
  - Audio file attachment, disaster scene photo capture/upload with thumbnail preview.
  - HTML5 Geolocation API auto-detection with manual coordinate override.
  - Cellular dead-zone offline mode toggle.
- `src/components/LiveTriageResultCard.tsx` [NEW]:
  - Real-time 0-100 urgency score gauge with color-coded severity tiers.
  - Expandable explainable AI scoring math breakdown.
  - Dialect translation card showing verbatim transcript and English translation.
  - Entity badges for trapped count, vulnerable demographics, hazard ratings, and trauma injuries.
  - Dynamic 3-bullet Responder Safety SOP card with action protocol steps.
  - Audio playback and photo evidence preview.
- `src/app/page.tsx` [MODIFIED]: Integrated `CitizenSOSForm` and `LiveTriageResultCard` across Commander, Citizen, and Volunteer tabs.

#### 3. Architecture Documentation
- `Decisions.md`: Added ADR 005 (Multimodal GenAI Extraction & Deterministic Urgency Scoring).
- `Flow.md`: Updated sequence diagrams for `POST /api/v1/triage/multimodal` lifecycle and explainable triage scoring formula.
- `README.md`: Updated with Milestone 2 feature overview, API schemas, and cURL testing guide.

---

## [Milestone 1] - Initial Foundation, Docker Environment, Base Skeletons, and Core Architecture
**Date:** 2026-08-17  
**Status:** Completed  
**Team:** Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee  
**Event:** Automate India 2026 — NIET Chapter
