# Hack-Eye: AI-Powered Distributed Industrial Safety Intelligence Platform
> *"Event-Driven • Distributed • Edge-First • AI-Assisted • Safety-Critical"*

Hack-Eye is a distributed edge safety intelligence platform engineered for construction sites, warehouses, logistics centers, and factories. It monitors facility camera streams (50–100 cameras) using horizontal edge inference nodes, identifies workers and heavy machinery, performs real-time trajectory and Time-to-Collision (TTC) calculations, triggers millisecond-deterministic physical alerts, and asynchronously deploys AI multi-agent reasoning for causal explanations, OSHA compliance grounding, and rule recommendations.

---

## 1. System Design Principles

1. **Do not run expensive AI on every frame**: Cameras stream at 25–30 FPS, but evaluating full YOLO object detection on every frame across 50 cameras is wasteful and computationally infeasible.
2. **Continuously monitor using lightweight processing**: A sub-millisecond motion & activity filter screens frames. Low-activity cameras stay in energy/GPU-efficient LOW_COMPUTE mode (>84% compute savings).
3. **Use YOLO for event-triggered & periodic perception**: Promoted to vision analysis on meaningful motion, tracker confidence degradation, or periodic refresh (every 8 frames).
4. **Use ByteTrack to maintain persistent scene state**: Preserves worker and machine trajectories between detections, tracking velocities, estimated distances, and zone boundaries.
5. **Deterministic rules for immediate safety; AI agents for deep asynchronous reasoning**: The millisecond physical alert path NEVER waits on LLM or cloud roundtrips.

---

## 2. Technical Architecture Diagram

```
[50–100 CCTV CAMERAS IN LARGE INDUSTRIAL FACILITY]
          │
          ├── Cameras 01–10 ──► [EDGE INFERENCE NODE 01 (Orin/RTX Gateway)]
          ├── Cameras 11–20 ──► [EDGE INFERENCE NODE 02 (Orin/RTX Gateway)]
          ├── Cameras 21–30 ──► [EDGE INFERENCE NODE 03 (Orin/RTX Gateway)]
          ├── Cameras 31–40 ──► [EDGE INFERENCE NODE 04 (Orin/RTX Gateway)]
          └── Cameras 41–50 ──► [EDGE INFERENCE NODE 05 (Orin/RTX Gateway)]
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────────┐
       │   STAGE 1: LIGHTWEIGHT MOTION / ACTIVITY DETECTOR (<1ms)   │
       │   - Frame differencing & MOG2 thumbnail background model   │
       │   - Inactive: Stays in LOW_COMPUTE mode (85% GPU saved)    │
       │   - Active: Promotes camera to VISION_ANALYSIS mode        │
       └────────────────────────────┬────────────────────────────────┘
                                    │ Meaningful Activity Detected
                                    ▼
       ┌─────────────────────────────────────────────────────────────┐
       │   STAGE 2: EVENT-TRIGGERED YOLO OBJECT DETECTOR             │
       │   - Detects: worker, forklift, truck, excavator, boxes      │
       │   - Runs on activity onset, confidence drop, or 8-frame loop│
       └────────────────────────────┬────────────────────────────────┘
                                    │ Detections & BBoxes
                                    ▼
       ┌─────────────────────────────────────────────────────────────┐
       │   STAGE 3: BYTETRACK OBJECT TRACKER & PERSISTENT SCENE STATE│
       │   - Persistent track IDs (e.g. Worker #17, Forklift #04)   │
       │   - Smoothed velocity propagation & trajectory vectors      │
       │   - Distance calculation (2.1m) & Time-to-Collision (TTC)   │
       └────────────────────────────┬────────────────────────────────┘
                                    │ Tracked Scene State
                                    ▼
       ┌─────────────────────────────────────────────────────────────┐
       │   STAGE 4: DETERMINISTIC SAFETY ENGINE (<5ms Fast Path)     │
       │   - Worker too close to moving machine (<3m radius, moving) │
       │   - Restricted zone / crane footprint boundary violation    │
       │   - Unsafe storage box stacking & height limits (>2.2m)     │
       │   - Hysteresis & temporal confirmation (anti-false-positive)│
       └───────────────────┬─────────────────────────────────────────┘
                           │
        ┌──────────────────┴────────────────────────────────┐
        ▼                                                   ▼
 [FAST SAFETY PATH (<5ms)]                         [SAFETY INCIDENT EVENT]
 (100% Local & Offline)                            (Structured JSON State)
        │                                                   │
        ▼                                                   ▼
 ┌───────────────────────────────┐                 ┌─────────────────────────────────┐
 │ PHYSICAL ALERT DEVICE         │                 │ ASYNC EVENT ORCHESTRATION       │
 │ (Raspberry Pi / ESP32 Node)   │                 │ (n8n Webhook / Render Workflow) │
 │ - Acoustic Strobe Siren       │                 └────────────────┬────────────────┘
 │ - Directional LED Beacon      │                                  │
 │ - OLED Hazard Display Text    │                                  ▼
 │ - Zone Spatial Audio Warning  │                 ┌─────────────────────────────────┐
 └───────────────────────────────┘                 │ 6-AGENT MULTI-AGENT GRAPH       │
                                                   │ (Unified IncidentSharedState)   │
                                                   └────────────────┬────────────────┘
                                                                    │
           ┌─────────────────────┬───────────────────┬──────────────┴──────┬──────────────────┐
           ▼                     ▼                   ▼                     ▼                  ▼
 ┌───────────────────┐ ┌───────────────────┐ ┌───────────────┐ ┌───────────────────────┐ ┌─────────────────────┐
 │ 1. Safety         │ │ 2. Pattern &      │ │ 3. Safety     │ │ 5. Rule Recommendation│ │ 6. Reporting &      │
 │    Knowledge Agent│ │    Trend Agent    │ │    Analysis   │ │    Agent              │ │    Notification     │
 │ - Firecrawl OSHA  │ │ - Historical Edge │ │    Agent      │ │ - Identifies novel    │ │    Agent            │
 │   Regulations &   │ │   SQLite Pattern  │ │ - Adaption AI │ │   hazards (boxes/climb│ │ - n8n Supervisor   │
 │   Safety Standards│ │   Correlation     │ │   Causal Root-│ │ - Proposes candidate │ │   Escalation        │
 └───────────────────┘ └───────────────────┘ │   Cause Risk  │ │   rules for HUMAN     │ │ - Render Persistence│
                                             └───────────────┘ │   APPROVAL (no silent │ └─────────────────────┘
                                                               │   production changes!)│
                                                               └───────────────────────┘
                                                                            │
                                                                            ▼
                                                               ┌─────────────────────────┐
                                                               │ SUPERVISOR DASHBOARD    │
                                                               │ - Live Feeds & Telemetry│
                                                               │ - Cluster GPU Savings   │
                                                               │ - AI Rule Approval Modal│
                                                               │ - Incident Audit Trails │
                                                               └─────────────────────────┘
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
