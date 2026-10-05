# SOTERIA — Responsible AI, Ethics, Privacy & Trust Framework

> **Target Rubric:** Responsible design and trust (10 points)  
> *Privacy, security, bias, transparency, accessibility and human oversight, where they are relevant. Do users keep control of the decisions that matter?*

---

## 1. Core Principles of Responsible Disaster Tech

Disaster response software handles vulnerable human beings at their most perilous moments. SOTERIA is built around **six non-negotiable ethical pillars**:

1. **Human Oversight & Commander Veto (Human-in-the-Loop)**
2. **Transparent, Explainable Triage (No Black-Box AI Decisions)**
3. **Data Minimization & Automatic Sunset Policies**
4. **Dialect Equity & Bias Mitigation**
5. **Tamper-Proof Offline Cryptographic Integrity**
6. **Zero-Barrier Accessibility (WCAG AA & Dialect Inclusivity)**

---

## 2. Human Oversight & Decision Agency

### The AI Never Pulls the Trigger Alone:
- In SOTERIA, Google Gemini and the Urgency Engine **only generate recommendations and rank candidates**; they never automatically deploy physical resources without human authorization.
- The Incident Commander retains 100% unilateral authority:
  - Can **override** the calculated triage category (e.g. adjust P2 to P1).
  - Selects and confirms volunteer responders before WebSocket dispatch signals are emitted.
  - Can reject automated SitRep drafts or modify SOP protocol steps.
- Every human override is logged in the incident event journal with a timestamp and user ID for post-incident disaster review.

---

## 3. Explainability vs. Black-Box Scoring

### Deterministic 0–100 Mathematical Engine:
Unlike systems that pass raw text into an LLM and ask "rate this emergency from 1 to 10" (which produces non-deterministic hallucinations and unpredictable variance), SOTERIA uses a **two-tier architecture**:

1. **Gemini Multimodal Layer (Extraction Only):**
   - Transcribes regional dialect audio.
   - Extracts objective counts: `trapped_count`, `vulnerable_groups` (elderly, children, pregnant, disabled), reported medical injuries, and primary hazard type.
2. **Deterministic Triage Formula (Auditable Math):**
   $$\text{Final Score} = \min(100, \text{Hazard} (35) + \text{Trapped} (25) + \text{Vulnerability} (25) + \text{Medical} (10) + \text{Recency} (5))$$

### In-App Transparency:
Every ticket displayed in Command HQ includes an **"Explain Urgency Math"** disclosure showing the exact mathematical breakdown of points. Evaluators, auditors, and commanders can verify *why* an incident scored 75/100 down to the exact arithmetic factor.

---

## 4. Privacy, Security & Data Minimization

### 1. Zero Personal Data Required for SOS (Zero-Barrier Guest Mode)
- Citizens are **never forced to create an account, enter email addresses, or provide passwords** to transmit an emergency SOS.
- The platform ingests only:
  - Coarse/precise GPS coordinates necessary for rescue extraction.
  - Voice recording / image proof.
  - Headcount and immediate physical needs.

### 2. Relay Mesh Privacy & Anonymity
- The 160-character SOT1 packet carried phone-to-phone contains **no victim names, no phone numbers, and no biometric IDs**.
- A relay carrier device (e.g. neighbor or volunteer) sees only:
  `SOT1|ID|Lat|Lng|People|Trapped|Flags|Hazard|Timestamp|Message|CRC`
  The carrier cannot intercept or harvest personally identifiable information from packets they physically transport.

### 3. Masked PII for Field Volunteers
- Responders deployed in the field receive victim counts, hazard checklists, and navigation coordinates. Direct telephone numbers are masked or routed through control room dispatchers to protect citizens from post-disaster harassment or data leakage.

### 4. Post-Disaster Data Sunset & Blur
- Once an incident reaches `RESOLVED` status and is audited, GPS precision is automatically truncated to 2 decimal places (~1.1 km) for aggregate GIS reporting, preventing permanent geospatial tracking of individual residences.

---

## 5. Dialect Equity & Bias Prevention

- **Dialect Inclusivity:** Traditional NLP models fail on rural dialects (Awadhi, Bhojpuri). SOTERIA prompts Gemini 1.5/2.0 with few-shot regional dialect examples to translate spoken vernacular into standardized medical terminology without degrading triage priority.
- **Equal Priority Guarantee:** The triage engine evaluates physiological vulnerability and physical danger, completely agnostic to language origin, name, or phone model. An SOS submitted in rural Bhojpuri is scored with identical mathematical rigor to one submitted in fluent English.

---

## 6. Cryptographic Packet Integrity (SOT1 CRC)

- In extreme disaster scenarios, malicious tampering (e.g. artificially altering a 2-person distress call to 500 people to redirect scarce boats) could cost lives.
- SOTERIA computes a SHA-256 6-hex-character checksum over the core fields of every SOT1 packet. If any byte (coordinates, headcount, hazard) is tampered with in transit across relay nodes, the server automatically flags the packet as `REJECTED: Checksum mismatch`.
