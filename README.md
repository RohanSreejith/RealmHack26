# Hack-Eye: AI-Powered Distributed Industrial Safety Intelligence Platform
> *"Distributed AI for Predictive Industrial Safety"*

Hack-Eye is an edge-first, distributed safety intelligence platform engineered for construction sites, warehouses, loading bays, and factories. It monitors video/RTSP streams, identifies workers and heavy machinery, and performs real-time trajectory and Time-to-Collision (TTC) calculations.

---

## 1. Core Architectural Principle

> **"The system does not wait for an LLM to decide whether an emergency is dangerous."**

Hack-Eye enforces a dual-path pipeline:
1. **Fast Safety Path (<50ms, 100% Local & Offline-Resilient)**:
   $$\text{Camera} \rightarrow \text{YOLO} \rightarrow \text{Multi-Object Tracker} \rightarrow \text{TTC Engine} \rightarrow \text{Deterministic Safety Rules} \rightarrow \text{Local Siren / HUD Alert}$$
   Operates entirely at the edge without cloud or internet dependencies.
2. **AI Intelligence Path (Asynchronous Orchestration)**:
   $$\text{Structured Event} \rightarrow \text{AI Safety Agent (Adaption)} \rightarrow \text{OSHA Guidance (Firecrawl)} \rightarrow \text{Swarm Gossip} \rightarrow \text{n8n Workflows} \rightarrow \text{Render}$$
   Provides root-cause analysis, escalation prediction, regulatory grounding, and long-term facility safety analytics.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                 EDGE CAMERA / VIDEO FEED               │
                    └───────────────────────────┬────────────────────────────┘
                                                │ 30 FPS Stream
                                                ▼
                                   ┌─────────────────────────┐
                                   │   YOLO OBJECT DETECTOR  │
                                   │  (Worker / Forklift /   │
                                   │   Truck / Excavator)    │
                                   └────────────┬────────────┘
                                                │ Detected BBoxes + Classes
                                                ▼
                                   ┌─────────────────────────┐
                                   │   MULTI-OBJECT TRACKER  │
                                   │  (Persistent IDs: W-01, │
                                   │   F-04, Velocities)     │
                                   └────────────┬────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
           [FAST SAFETY PATH: <50ms]                       [AI INTELLIGENCE PATH: ASYNC]
       (100% Local, Offline-Resilient)                     (Deep Reasoning & Orchestration)
                        │                                               │
                        ▼                                               │
     ┌─────────────────────────────────────┐                            │
     │    GEOMETRY, DISTANCE & TTC ENGINE  │                            │
     │  - Estimated Ground-Plane Distance  │                            │
     │  - Closing Velocity Vector          │                            │
     │  - Time-To-Collision (TTC) Calc     │                            │
     └──────────────────┬──────────────────┘                            │
                        ▼                                               │
     ┌─────────────────────────────────────┐                            │
     │     DETERMINISTIC SAFETY ENGINE     │                            │
     │  - Warning Radius (<6m) / TTC <4s   │                            │
     │  - Critical Radius (<3m) / TTC <2s  │                            │
     │  - Persistence Filter (3+ frames)   │                            │
     └──────────────────┬──────────────────┘                            │
                        ▼                                               │
     ┌─────────────────────────────────────┐                            │
     │    IMMEDIATE LOCAL ALERTS & LOG     │                            │
     │  - Local Siren / Audio Alarm (<10ms)│                            │
     │  - Red HUD Flashing UI Overlay      │                            │
     │  - Local SQLite Event Queue         │                            │
     └──────────────────┬──────────────────┘                            │
                        │                                               │
                        │ Confirmed Safety Incident Event               │
                        └───────────────────────┬───────────────────────┘
                                                ▼
                               ┌───────────────────────────────────┐
                               │    SAFETY EVENT BUILDER & QUEUE   │
                               │ (Structured JSON Metadata Buffer) │
                               └────────────────┬──────────────────┘
                                                │
           ┌────────────────────────────────────┼────────────────────────────────────┐
           ▼                                    ▼                                    ▼
  ┌───────────────────┐               ┌───────────────────┐               ┌───────────────────────┐
  │ SWARM COORDINATOR │               │   AI SAFETY AGENT │               │ RENDER & n8n CLOUD    │
  │ (Inter-Zone Alert)│               │  (Adaption LLM)   │               │ (Operational Workflow)│
  ├───────────────────┤               ├───────────────────┤               ├───────────────────────┤
  │ - Zone 01 -> 02   │               │ - Causal Analysis │               │ - Render Workflow     │
  │ - Approaching ETA │               │ - Escalation Risk │               │ - Postgres Sync       │
  │ - Peer Zone Alert │               │ - Action Recs     │               │ - Webhook Alert       │
  └───────────────────┘               │ - Firecrawl OSHA  │               │ - Daily Briefing      │
                                      │   Knowledge Base  │               └───────────────────────┘
                                      └───────────────────┘
```

---

## 2. Project Structure

```
hackeye/
├── backend/
│   ├── main.py                  # FastAPI server & static mount
│   ├── config.py                # Environment configuration & safety thresholds
│   ├── api/
│   │   └── routes.py            # REST, MJPEG stream, and telemetry endpoints
│   ├── services/
│   │   └── video_stream.py      # Video decoding, YOLO loop, tracking & HUD rendering
│   └── database/
│       ├── models.py            # SQLite/PostgreSQL models (workers, incidents, swarm)
│       └── db.py                # Database session manager & initial seed data
├── edge/
│   ├── detector.py              # YOLOv8 object detector with industrial mapping
│   ├── tracker.py               # Persistent ID tracking & velocity estimation
│   ├── ttc.py                   # Estimated distance & Time-to-Collision (TTC) engine
│   ├── safety_engine.py         # Authoritative deterministic safety decision evaluator
│   └── local_queue.py           # Offline SQLite store-and-forward queue
├── ai/
│   ├── adaption_client.py       # Adaption API client with structured fallback reasoning
│   └── safety_agent.py          # Enriched AI officer (OSHA context + historical patterns)
├── swarm/
│   └── coordinator.py           # Swarm coordinator & inter-zone gossip agents (Zone 01-03)
├── firecrawl/
│   ├── ingest.py                # Firecrawl regulatory web scraper
│   └── knowledge_service.py     # OSHA 1910.178 / 1926.601 guidance retriever
├── n8n/
│   ├── client.py                # Operational webhook dispatcher & simulation logger
│   └── workflows/
│       ├── critical_incident.json    # Instant Slack/SMS escalation & audit log
│       ├── repeated_near_miss.json   # EHS work-order generator for blind intersections
│       └── daily_safety_brief.json   # 24h risk summary & email briefing
├── render/
│   ├── workflow_engine.py       # Observable Render Workflow multi-step state machine
│   └── render.yaml              # Render cloud infrastructure blueprint
├── demo/
│   └── demo_controller.py       # 6 hackathon demonstration scenarios & offline toggles
├── dashboard/
│   ├── index.html               # Industrial mission-control operations UI
│   ├── css/style.css            # Dark theme, high-contrast HUD styles
│   └── js/
│       ├── app.js               # Telemetry loop, swarm feed, timeline generator
│       └── audio_siren.js       # Client-side Web Audio API dual-tone siren
├── videos/                      # Uploaded demo video clips
├── tests/
│   └── test_hackeye_core.py   # Automated unit & integration tests
├── Dockerfile                   # Container definition
├── docker-compose.yml           # Multi-container orchestration
├── requirements.txt             # Python dependencies
└── .env.example                 # Environment variable templates
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Webcam, RTSP stream, or the pre-loaded clips in `videos/`

### 1. Clone & Install
```bash
git clone <repo-url>
cd RealmHack26

# Create virtualenv (optional)
python -m venv venv
source venv/bin/activate  # Or on Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your optional keys (ADAPTION_API_KEY, FIRECRAWL_API_KEY, etc.)
# If no keys are provided, Hack-Eye runs with built-in high-fidelity local models.
```

### 3. Launch Hack-Eye
```bash
python -m uvicorn hackeye.backend.main:app --host 0.0.0.0 --port 8000
```
Open **`http://localhost:8000`** in any modern web browser.

---

## 4. Demonstrating Hack-Eye to Judges (3–5 Minute Walkthrough)

Using the **Demo Control Panel** at the top of the dashboard:

1. **Scenario 1: Safe Pedestrian Transit** (`videos/worker_no_helmet.mp4`)
   - Click `1. SAFE TRANSIT`.
   - Result: Worker maintains 7.2m clearance. Safety status is **`SAFE`** (Emerald green).
2. **Scenario 2: Warning Zone Incursion** (`videos/loading_zone_truck.mp4`)
   - Click `2. WARNING ZONE`.
   - Result: Truck backing up in loading bay within 4.8m. Status transitions to **`WARNING`** (Amber).
3. **Scenario 3: Critical Collision Breach** (`videos/forklift_approaching_entrance.mp4`)
   - Click `3. CRITICAL BREACH (TTC < 2s)`.
   - Result:
     - Forklift converges toward pedestrian entrance.
     - TTC drops to **1.6s** ($< 2.0\text{s}$ threshold).
     - **LOCAL ALERT ACTIVE (<10ms)**: Red flashing border, HUD warning, and client-side acoustic siren fire immediately.
     - Point out the **Incident Timeline**: the local siren fired at $t = -75\text{ms}$, while the AI reasoning completed at $t \approx +1420\text{ms}$.
4. **Scenario 4: Swarm Inter-Zone Coordination**
   - Click `6. SWARM ZONE HANDOFF`.
   - Result: Zone 01 Agent detects worker transit and broadcasts `WORKER_APPROACHING` with 4s ETA to Zone 02 Agent. Zone 02 vigilance automatically increases to **`HEIGHTENED`**.
5. **Scenario 5: Repeated Near-Miss Pattern Recognition**
   - Click `5. REPEATED NEAR-MISS`.
   - Result: AI Safety Agent aggregates 4 recurring near-misses in Zone 01 entrance and generates an EHS corrective work-order via n8n.
6. **Scenario 6: Cloud Disconnect & Offline-First Resilience**
   - Click `DISCONNECT CLOUD`.
   - Badge updates to **`EDGE: OFFLINE — LOCAL SAFETY ACTIVE`**.
   - Trigger a critical breach: local siren and deterministic engine operate with **zero degradation**.
   - Click `RECONNECT CLOUD`: queued edge events automatically flush and synchronize to the cloud database.

---

## 5. Technology Integrations

### Adaption AI Reasoning
Configured in `hackeye/ai/adaption_client.py`.
- Consumes `ADAPTION_API_KEY` via environment variable.
- Receives structured incident telemetry: Worker ID, Machine ID, Distance, TTC, and OSHA regulatory context.
- Returns structured JSON: `risk_assessment`, `reason`, `predicted_outcome`, `contributing_factors`, and `recommended_actions`.
- Automatically falls back to deterministic local reasoning if the API is offline.

### Firecrawl OSHA Ingestion
Configured in `hackeye/firecrawl/knowledge_service.py` and `hackeye/firecrawl/ingest.py`.
- Ingests public OSHA regulations (OSHA 1910.178 for Powered Industrial Trucks, OSHA 1926.601 for Motor Vehicles, NIOSH Alert 2001-109).
- `SafetyKnowledgeService` performs semantic retrieval based on incident attributes and injects standard citations into the AI prompt and UI ("Knowledge Used").

### n8n Operational Workflows
Configured in `hackeye/n8n/client.py` with workflows in `hackeye/n8n/workflows/`:
1. `critical_incident.json`: Webhook-triggered incident escalation to Slack/SMS and database logging.
2. `repeated_near_miss.json`: Aggregates recurring zone incidents and dispatches Jira/EHS work-orders.
3. `daily_safety_brief.json`: 24h cron calculating facility Risk Index and distributing executive briefings.

### Render Cloud & Render Workflows
Configured in `hackeye/render/workflow_engine.py` and `hackeye/render/render.yaml`.
- Deploys FastAPI web service, background workflow worker, and Managed PostgreSQL database.
- Implements an observable cloud workflow state machine:
  $$\text{RECEIVED} \rightarrow \text{PROCESSING} \rightarrow \text{AI\_ANALYSIS} \rightarrow \text{KNOWLEDGE\_LOOKUP} \rightarrow \text{COMPLETED}$$
- Observable in real-time on the operations dashboard.

---

## 6. Running Tests

Run the complete test suite verifying YOLO tracking, TTC math, deterministic rules, offline queues, and swarm coordination:

```bash
python -m pytest tests/test_hackeye_core.py -v
```

All 7 test suites will execute and validate core safety engine invariants.
