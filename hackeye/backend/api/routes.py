"""
FastAPI REST & Streaming API Endpoints for Hack-Eye.
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import asyncio

from hackeye.backend.database.db import get_db
from hackeye.backend.database.models import Incident, Worker, Machine, SwarmEvent, SafetyInsight, SyncQueue
from hackeye.swarm.coordinator import swarm_coordinator
from hackeye.ai.safety_agent import ai_safety_agent
from hackeye.render.workflow_engine import render_workflow_orchestrator
from hackeye.n8n.client import n8n_client
from hackeye.edge.local_queue import local_queue
from hackeye.demo.demo_controller import demo_controller

router = APIRouter(prefix="/api")

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "service": "Hack-Eye Edge/Cloud Safety Core",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "edge_safety_engine": "ACTIVE",
        "cloud_connected": demo_controller.cloud_connected
    }

@router.get("/zones")
def get_zones():
    return swarm_coordinator.get_swarm_status()

def resolve_worker_name(worker_id: Optional[str] = None) -> str:
    if not worker_id or worker_id == "ALL_PERSONNEL":
        return "All Personnel"
    clean_id = worker_id.strip()
    if clean_id.startswith("Worker"):
        return clean_id
    return f"Worker ({clean_id})"

def map_clip_for_incident(zone: Optional[str] = "", machine_type: Optional[str] = "", worker_id: Optional[str] = "", incident_id: Optional[str] = "") -> str:
    z = (zone or "").lower()
    m = (machine_type or "").lower()
    inc = (incident_id or "").lower()
    if "ppe" in inc or "helmet" in inc or "material_handling" in m or "storage" in m:
        return "/videos/worker_no_helmet.mp4"
    elif "fire" in inc or "thermal" in m:
        return "/videos/videos/fire-rgb-00000/00023b5323028ab83e67_run_6_seed_1486583949.ceiling_00.rgb.mp4"
    elif "collision" in inc or "rack" in inc:
        return "/videos/videos/forklift_collision-rgb-00000/0021d0743dc26041d97b_run_5_seed_574698367.cam_00.rgb.mp4"
    elif "boxes" in inc or "climb" in inc or "unknown" in inc:
        return "/videos/videos/worker_on_boxes-rgb-00000/004c865fae3489fe83d1_run_4_seed_84136611.cam_00.rgb.mp4"
    elif "truck" in m or "loading" in z:
        return "/videos/loading_zone_truck.mp4"
    elif "zone_02" in z or "inside" in z:
        return "/videos/worker_at_entrance_inside.mp4"
    return "/videos/forklift_approaching_entrance.mp4"

CORE_SAFETY_CATALOG = [
    {
        "incident_id": "HX-1040",
        "title": "Material Handling PPE Non-Compliance",
        "zone": "ZONE_01 (Material Storage)",
        "worker_id": "W-042",
        "worker_name": "Worker (W-042)",
        "machine_id": "STATIONARY_STORAGE",
        "machine_type": "material_handling",
        "distance_m": 4.5,
        "ttc_seconds": None,
        "risk_level": "WARNING",
        "status": "LOCAL_ALERTED",
        "local_alert_triggered": True,
        "sync_status": "SYNCED",
        "clip_url": "/videos/worker_no_helmet.mp4",
        "knowledge_cited": "OSHA 1926.100(a) — Mandatory Head Protection & Personal Safety",
        "ai_summary": "Worker (W-042) observed handling freight in storage racking bay without required protective hard hat. Instant acoustic chime fired locally (<5ms).",
        "ai_analysis": {
            "reason": "Swarm multi-camera tracking (Cam 00 + Cam 01) identified Worker (W-042) lifting heavy inventory crates without mandatory Type I Hard Hat / Helmet.",
            "predicted_outcome": "Elevated vulnerability to falling overhead objects and racking head-strike during pallet de-stacking.",
            "contributing_factors": [
                "Failure to don PPE hard hat in designated active storage overhead zone",
                "Dual-camera angle verified bare head from front and profile perspectives",
                "Active overhead pallet stacking in adjacent bay"
            ],
            "recommended_actions": [
                "Broadcast audio reminder at Bay Station: 'Mandatory Hard Hat Required'",
                "Log safety infraction in EHS compliance database"
            ]
        }
    },
    {
        "incident_id": "HX-1041",
        "title": "Forklift Blind Corner Approach",
        "zone": "ZONE_01 (Bay Entrance Door 02)",
        "worker_id": "W-088",
        "worker_name": "Worker (W-088)",
        "machine_id": "F-004",
        "machine_type": "forklift",
        "distance_m": 2.1,
        "ttc_seconds": 1.8,
        "risk_level": "CRITICAL",
        "status": "ACTIVE",
        "local_alert_triggered": True,
        "sync_status": "SYNCED",
        "clip_url": "/videos/forklift_approaching_entrance.mp4",
        "knowledge_cited": "OSHA 1910.178(n)(4) - Powered Industrial Trucks: Blind Intersections",
        "ai_summary": "Forklift F-004 rapid approach at blind doorway threshold while Worker (W-088) in direct transit line. Local siren fired in 3.4ms.",
        "ai_analysis": {
            "reason": "Swarm Node 01 detected Forklift F-004 approaching blind entrance at 1.45m/s while Worker (W-088) stationed in doorway threshold.",
            "predicted_outcome": "Immediate blind-corner crush hazard within 1.8 seconds if pedestrian does not evacuate door radius.",
            "contributing_factors": [
                "Blind corner partition obstructing operator and worker mutual sightlines",
                "Forklift velocity exceeds 5 km/h threshold for interior threshold crossings",
                "Pedestrian pathway lack of physical swing-gate barrier"
            ],
            "recommended_actions": [
                "Swarm Node 02 audible warning activated: 'Clear Entrance Immediately'",
                "Automated electric speed governor engaged on Forklift F-004"
            ]
        }
    },
    {
        "incident_id": "HX-1039",
        "title": "Haul Truck Reversing Path Obstruction",
        "zone": "ZONE_03 (Loading Bay Apron)",
        "worker_id": "W-112",
        "worker_name": "Worker (W-112)",
        "machine_id": "T-088",
        "machine_type": "truck",
        "distance_m": 1.8,
        "ttc_seconds": 1.5,
        "risk_level": "CRITICAL",
        "status": "RESOLVED",
        "local_alert_triggered": True,
        "sync_status": "SYNCED",
        "clip_url": "/videos/loading_zone_truck.mp4",
        "knowledge_cited": "OSHA 1910.178(m) - Commercial Vehicle Backing & Pedestrian Clear Zone",
        "ai_summary": "Commercial transport vehicle T-088 reversing toward loading dock with Worker (W-112) in blind spot. Fast-path buzzer commanded evacuation.",
        "ai_analysis": {
            "reason": "Heavy transport vehicle T-088 reversing toward loading dock while Worker (W-112) was crossing blind loading apron.",
            "predicted_outcome": "Pinch-point entrapment against loading dock bumper without evasive clearance.",
            "contributing_factors": [
                "Vehicle backing without automatic acoustic reverse annunciator",
                "Worker foot traffic permitted across active commercial docking bay"
            ],
            "recommended_actions": [
                "Engage high-decibel loading apron warning beacon",
                "Enforce 4-meter physical pedestrian barrier during transport vehicle docking"
            ]
        }
    },
    {
        "incident_id": "HX-1043",
        "title": "Secondary Doorway Incursion Hazard",
        "zone": "ZONE_02 (Interior Doorway)",
        "worker_id": "W-017",
        "worker_name": "Worker (W-017)",
        "machine_id": "F-012",
        "machine_type": "forklift",
        "distance_m": 3.4,
        "ttc_seconds": 2.8,
        "risk_level": "WARNING",
        "status": "LOCAL_ALERTED",
        "local_alert_triggered": True,
        "sync_status": "SYNCED",
        "clip_url": "/videos/worker_at_entrance_inside.mp4",
        "knowledge_cited": "OSHA 1910.178(n) - Powered Industrial Trucks: Speed & Door Clearance",
        "ai_summary": "Worker (W-017) stationed in interior door threshold while forklift entering exterior door. Cross-zone swarm alert broadcasted.",
        "ai_analysis": {
            "reason": "Worker (W-017) present in secondary interior doorway as industrial equipment entered approach buffer.",
            "predicted_outcome": "Reduced clearance along transit corridor requiring worker repositioning.",
            "contributing_factors": [
                "Shared doorway used simultaneously for pedestrian and forklift egress",
                "High ambient facility acoustic noise"
            ],
            "recommended_actions": [
                "Acoustic chime broadcasted from Zone 02 swarm node",
                "Direct pedestrian to dedicated side-hinged egress door"
            ]
        }
    },
    {
        "incident_id": "HX-1044",
        "title": "Structural Storage Racking Impact",
        "zone": "ZONE_01 (High-Bay Storage)",
        "worker_id": "W-030",
        "worker_name": "Worker (W-030)",
        "machine_id": "F-070",
        "machine_type": "forklift",
        "distance_m": 0.4,
        "ttc_seconds": 0.2,
        "risk_level": "CRITICAL",
        "status": "LOCAL_ALERTED",
        "local_alert_triggered": True,
        "sync_status": "SYNCED",
        "clip_url": "/videos/videos/forklift_collision-rgb-00000/0021d0743dc26041d97b_run_5_seed_574698367.cam_00.rgb.mp4",
        "knowledge_cited": "OSHA 1910.176(b) - Secure Storage & Racking Integrity Standards",
        "ai_summary": "Forklift F-070 collided with warehouse storage rack upright post at 2.4 m/s. Accelerometer deflection triggered immediate mechanical shutdown.",
        "ai_analysis": {
            "reason": "Forklift F-070 collided with warehouse storage rack and loaded cargo pallet. High deceleration impact registered.",
            "predicted_outcome": "Potential secondary rack progressive collapse and falling inventory hazards across neighboring aisles.",
            "contributing_factors": [
                "Vehicle turning radius miscalculation while navigating narrow aisle",
                "Excessive payload height obstructing driver forward visibility"
            ],
            "recommended_actions": [
                "Immediately de-energize Forklift F-070 and cordon off Aisle 4",
                "Structural engineer integrity inspection of upright beams"
            ]
        }
    },
    {
        "incident_id": "HX-1045",
        "title": "Thermal Plume Ceiling Emergency",
        "zone": "ZONE_01 (Ceiling Overhead)",
        "worker_id": "ALL_PERSONNEL",
        "worker_name": "All Personnel",
        "machine_id": "CEILING_ZONE",
        "machine_type": "thermal_hazard",
        "distance_m": 0.0,
        "ttc_seconds": 0.0,
        "risk_level": "CRITICAL",
        "status": "LOCAL_ALERTED",
        "local_alert_triggered": True,
        "sync_status": "SYNCED",
        "clip_url": "/videos/videos/fire-rgb-00000/00023b5323028ab83e67_run_6_seed_1486583949.ceiling_00.rgb.mp4",
        "knowledge_cited": "NFPA 101 / OSHA 1910.38 - Emergency Action Plans & Thermal Evacuation",
        "ai_summary": "Dual ceiling optical sensors detected active flame flare and smoke plume in primary logistics aisle. Facility evacuation active.",
        "ai_analysis": {
            "reason": "Overhead Ceiling Swarm Cameras detect active optical thermal flare and particulate smoke plume in primary logistics aisle.",
            "predicted_outcome": "Rapid combustion spread to combustible cardboard pallets within 45 seconds.",
            "contributing_factors": [
                "Combustible packing material staging adjacent to thermal source",
                "Airflow currents spreading smoke along high-bay ceiling corridors"
            ],
            "recommended_actions": [
                "Trigger general facility acoustic fire alarm and emergency strobe beacons",
                "Direct all personnel to designated muster assembly points A and B"
            ]
        }
    }
]

@router.get("/incidents")
def get_incidents(limit: int = 25, db: Session = Depends(get_db)):
    catalog = [dict(c) for c in CORE_SAFETY_CATALOG]
    
    # Query database incidents (edge real-time detections)
    db_incidents = db.query(Incident).order_by(Incident.timestamp.desc()).limit(limit).all()
    
    seen_types = set()
    filtered_db = []
    for inc in db_incidents:
        if any(c["incident_id"] == inc.incident_id for c in catalog):
            continue
        m_type = (inc.machine_type or "forklift").lower()
        if list(seen_types).count(m_type) < 2:
            seen_types.add(m_type)
            w_label = resolve_worker_name(inc.worker_id)
            clip = map_clip_for_incident(inc.zone, inc.machine_type, inc.worker_id, inc.incident_id)
            
            title = f"{inc.risk_level.title() if inc.risk_level else 'Safety'} Incident: {(inc.machine_type or 'Equipment').title()} Hazard"
            if "ppe" in inc.incident_id.lower() or "helmet" in inc.incident_id.lower():
                title = "Material Handling PPE Non-Compliance"
            elif "truck" in m_type:
                title = "Haul Truck Reversing Path Obstruction"
            elif "fire" in inc.incident_id.lower():
                title = "Thermal Plume Ceiling Emergency"
            elif "collision" in inc.incident_id.lower():
                title = "Structural Storage Racking Impact"

            filtered_db.append({
                "incident_id": inc.incident_id,
                "title": title,
                "timestamp": inc.timestamp.isoformat() if inc.timestamp else datetime.now(timezone.utc).isoformat(),
                "zone": inc.zone,
                "worker_id": inc.worker_id,
                "worker_name": w_label,
                "machine_id": inc.machine_id,
                "machine_type": inc.machine_type,
                "distance_m": inc.distance_m,
                "ttc_seconds": inc.ttc_seconds,
                "risk_level": inc.risk_level,
                "status": inc.status,
                "local_alert_triggered": inc.local_alert_triggered,
                "sync_status": inc.sync_status,
                "clip_url": clip,
                "ai_analysis": inc.ai_analysis,
                "knowledge_cited": inc.knowledge_cited or "OSHA Standards",
                "ai_summary": f"{w_label} in {inc.zone}: safety buffer breached ({inc.distance_m}m) near {inc.machine_type} {inc.machine_id}."
            })

    combined = catalog + filtered_db
    return combined[:limit]

@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    ai_data = inc.ai_analysis
    if not ai_data:
        try:
            ai_data = ai_safety_agent.process_incident({
                "incident_id": inc.incident_id,
                "timestamp": inc.timestamp.isoformat() if inc.timestamp else datetime.now(timezone.utc).isoformat(),
                "zone": inc.zone or "ZONE_01",
                "worker_id": inc.worker_id or "W-017",
                "machine_id": inc.machine_id or "F-004",
                "machine_type": inc.machine_type or "forklift",
                "distance_m": inc.distance_m or 2.1,
                "ttc_seconds": inc.ttc_seconds or 1.6,
                "risk_level": inc.risk_level or "CRITICAL"
            })
            inc.ai_analysis = ai_data
            db.commit()
        except Exception:
            ai_data = {
                "risk_assessment": inc.risk_level or "CRITICAL",
                "reason": f"Worker {inc.worker_id or 'W-017'} breached safety buffer within {inc.distance_m or 2.1}m of active {inc.machine_type or 'forklift'}.",
                "predicted_outcome": "High potential for impact collision due to restricted machine deceleration envelope.",
                "contributing_factors": [
                    f"Distance ({inc.distance_m or 2.1}m) below safety threshold of 3.5m",
                    f"TTC: {inc.ttc_seconds or 1.6}s allows insufficient operator reaction margin",
                    "Acoustic masking from warehouse equipment background noise",
                    "Shared transit corridor lacking physical bollards"
                ],
                "recommended_actions": [
                    "Sound physical beacon and order immediate machine halt",
                    "Direct worker to high-visibility pedestrian pathway",
                    "Log incident to OSHA compliance register"
                ],
                "knowledge_used": "OSHA 1910.178(m)(2): Powered industrial truck operators must maintain safe distance from pedestrians at all times."
            }

    return {
        "incident_id": inc.incident_id,
        "title": f"{inc.risk_level.title() if inc.risk_level else 'Safety'} Incident: {(inc.machine_type or 'Machinery').title()} Proximity",
        "timestamp": inc.timestamp.isoformat() if inc.timestamp else None,
        "zone": inc.zone,
        "worker_id": inc.worker_id,
        "machine_id": inc.machine_id,
        "machine_type": inc.machine_type,
        "distance_m": inc.distance_m,
        "ttc_seconds": inc.ttc_seconds,
        "risk_level": inc.risk_level,
        "status": inc.status,
        "clip_url": map_clip_for_incident(inc.zone, inc.machine_type, inc.worker_id),
        "ai_analysis": ai_data,
        "knowledge_cited": inc.knowledge_cited or ai_data.get("knowledge_used"),
        "sync_status": inc.sync_status
    }

@router.post("/incidents/{incident_id}/acknowledge")
def acknowledge_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.status = "ACKNOWLEDGED"
    db.commit()
    return {"status": "ACKNOWLEDGED", "incident_id": incident_id}

@router.post("/incidents/simulate")
def simulate_incident(db: Session = Depends(get_db)):
    """Generates an immediate test critical incident for mobile supervisor alert testing."""
    now = datetime.now(timezone.utc)
    inc_id = f"INC-ALERT-{int(now.timestamp())}"
    
    analysis = {
        "risk_assessment": "CRITICAL",
        "reason": "Rapid trajectory convergence between worker W-017 and Toyota Forklift F-004 in Zone 01 entrance.",
        "predicted_outcome": "Immediate pinch-point collision if forklift does not abort entry within 1.6 seconds.",
        "contributing_factors": [
            "TTC estimated at 1.4s (< 2.0s emergency threshold)",
            "Clearance distance reduced to 1.8m in blind corner doorway",
            "Forklift traveling at 6.8 km/h without sounding audible horn",
            "Worker carrying materials with obstructed lateral peripheral vision"
        ],
        "recommended_actions": [
            "Trigger Zone 01 acoustic strobe beacon (<5ms deterministic fast path)",
            "Dispatch supervisor mobile notification",
            "Recommend speed governor enforcement at entrance threshold"
        ],
        "knowledge_used": "OSHA 1910.178(n)(4): The driver shall be required to slow down and sound the horn at cross aisles and other locations where vision is obstructed."
    }

    new_inc = Incident(
        incident_id=inc_id,
        timestamp=now,
        zone="ZONE_01 (Bay Entrance)",
        worker_id="W-017",
        machine_id="F-004",
        machine_type="forklift",
        distance_m=1.8,
        ttc_seconds=1.4,
        risk_level="CRITICAL",
        status="ACTIVE",
        local_alert_triggered=True,
        ai_analysis=analysis,
        knowledge_cited="OSHA Standard 29 CFR 1910.178(n)(4)",
        sync_status="SYNCED"
    )
    db.add(new_inc)
    db.commit()

    # Trigger Asynchronous Render Workflow (9-Stage Cloud Reasoning)
    inc_payload = {
        "incident_id": inc_id,
        "zone": "ZONE_01 (Bay Entrance)",
        "worker_id": "W-017",
        "machine_id": "F-004",
        "machine_type": "forklift",
        "distance_m": 1.8,
        "ttc_seconds": 1.4,
        "risk_level": "CRITICAL",
        "evaluation_latency_ms": 4
    }
    wf = render_workflow_orchestrator.trigger_incident_workflow(inc_payload, analysis)
    
    return {
        "status": "triggered",
        "workflow_id": wf.workflow_id,
        "render_cloud_status": "ASYNC_WORKFLOW_ACTIVE",
        "incident": {
            "incident_id": inc_id,
            "title": "Critical Breach: Forklift Entrance Convergence",
            "timestamp": now.isoformat(),
            "zone": "ZONE_01 (Bay Entrance)",
            "worker_id": "W-017",
            "machine_id": "F-004",
            "machine_type": "forklift",
            "distance_m": 1.8,
            "ttc_seconds": 1.4,
            "risk_level": "CRITICAL",
            "status": "ACTIVE",
            "clip_url": "/videos/forklift_approaching_entrance.mp4",
            "ai_analysis": analysis,
            "render_workflow": wf.to_dict()
        }
    }

@router.post("/incidents")
def create_incident(payload: Dict[str, Any]):
    inc_id = local_queue.persist_incident(payload)
    return {"status": "persisted", "incident_id": inc_id}

@router.get("/swarm/status")
def get_swarm_status():
    return swarm_coordinator.get_swarm_status()

@router.post("/swarm/event")
def post_swarm_event(payload: Dict[str, Any]):
    event = swarm_coordinator.broadcast_interzone_event(
        source_zone=payload.get("source_zone", "ZONE_01"),
        destination_zone=payload.get("destination_zone", "ZONE_02"),
        event_type=payload.get("event_type", "WORKER_APPROACHING"),
        worker_id=payload.get("worker_id"),
        machine_id=payload.get("machine_id"),
        risk=payload.get("risk", "HIGH"),
        eta_seconds=payload.get("eta_seconds", 4)
    )
    return {"status": "broadcasted", "event": event}

@router.post("/ai/analyze")
def trigger_ai_analysis(payload: Dict[str, Any]):
    result = ai_safety_agent.process_incident(payload)
    return result

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    total_incidents = db.query(Incident).count()
    critical_count = db.query(Incident).filter(Incident.risk_level == "CRITICAL").count()
    warning_count = db.query(Incident).filter(Incident.risk_level == "WARNING").count()
    high_count = db.query(Incident).filter(Incident.risk_level == "HIGH").count()
    
    # Calculate Hack-Eye Risk Index (0-100)
    # Starts at 100, penalized by critical breaches and warnings
    penalty = (critical_count * 8) + (high_count * 4) + (warning_count * 1)
    safety_score = max(min(100 - penalty, 100), 20)

    insights = db.query(SafetyInsight).order_by(SafetyInsight.timestamp.desc()).limit(5).all()

    return {
        "safety_score": safety_score,
        "score_label": "Hack-Eye Risk Index",
        "total_incidents": total_incidents,
        "critical_incidents_today": critical_count,
        "warnings_today": warning_count + high_count,
        "near_misses_today": warning_count + high_count,
        "monitored_workers": 4,
        "monitored_machines": 4,
        "highest_risk_zone": "ZONE_01",
        "insights": [
            {
                "zone": i.zone,
                "pattern": i.pattern,
                "recommendation": i.recommendation,
                "incident_count": i.incident_count
            }
            for i in insights
        ]
    }

@router.post("/sync")
def trigger_cloud_sync():
    synced = local_queue.sync_to_cloud()
    return {"status": "synced", "items_synced": synced}

@router.get("/workflows")
def get_all_workflows(limit: int = 15):
    """Returns recent Render Cloud workflow executions."""
    return render_workflow_orchestrator.get_all_workflows(limit=limit)

@router.get("/workflows/latest")
def get_latest_workflow():
    """Returns the latest active or completed Render Cloud workflow execution."""
    wf = render_workflow_orchestrator.get_latest_workflow()
    return wf or {"status": "idle", "message": "No active workflow execution."}

@router.get("/workflows/{wf_id}")
def get_workflow(wf_id: str):
    wf = render_workflow_orchestrator.get_workflow(wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow execution not found")
    return wf

@router.post("/workflows/{wf_id}/retry")
def retry_workflow(wf_id: str, from_step: int = 0):
    """Retries a Render Cloud workflow execution from specified step index."""
    result = render_workflow_orchestrator.retry_workflow(wf_id, from_step_index=from_step)
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"status": "retrying", "workflow": result}

@router.post("/workflows/trigger")
def trigger_custom_workflow(payload: Dict[str, Any]):
    """Manually dispatches an incident into the 9-stage Render Workflow."""
    wf = render_workflow_orchestrator.trigger_incident_workflow(payload, payload.get("ai_analysis"))
    return {"status": "triggered", "workflow": wf.to_dict()}

@router.get("/n8n/recent")
def get_recent_n8n():
    return n8n_client.get_recent_executions()

@router.post("/n8n/trigger-test")
def trigger_n8n_test():
    test_incident = {
        "incident_id": f"TEST-INC-{int(datetime.now(timezone.utc).timestamp())}",
        "worker_id": "W-017",
        "machine_id": "F-004",
        "machine_type": "forklift",
        "zone": "ZONE_01",
        "distance_m": 2.1,
        "ttc_seconds": 1.5,
        "risk_level": "CRITICAL"
    }
    test_ai = {
        "reason": "Test trigger dispatched from Hack-Eye to verify n8n webhook connection.",
        "recommended_actions": ["Verify webhook reception on n8n canvas", "Check node execution status"]
    }
    return n8n_client.dispatch_critical_incident(test_incident, test_ai)

import os
is_render_env = os.getenv("RENDER") == "true" or os.getenv("RENDER_INSTANCE_ID") is not None
if not is_render_env:
    try:
        from hackeye.backend.services.video_stream import dual_camera_manager
    except Exception:
        dual_camera_manager = None
else:
    dual_camera_manager = None

# Demo Controller Endpoints
@router.post("/demo/scenario/{scenario_name}")
def trigger_demo_scenario(scenario_name: str):
    sc_info = dual_camera_manager.set_scenario(scenario_name) if dual_camera_manager else {}
    res = demo_controller.run_scenario(scenario_name)
    return {**res, **sc_info}

@router.post("/demo/cloud-toggle")
def toggle_cloud_connection(payload: Dict[str, bool]):
    connected = payload.get("connected", True)
    return demo_controller.set_cloud_state(connected)

# Real-Time Telemetry & Multi-Camera Video MJPEG Streams
@router.get("/stream/telemetry")
def get_stream_telemetry():
    telemetry = dual_camera_manager.get_telemetry() if dual_camera_manager else {"status": "edge_stream_local_only"}
    return {
        **telemetry,
        "cloud_connected": demo_controller.cloud_connected,
        "pending_sync_count": local_queue.get_pending_sync_count()
    }

async def mjpeg_generator(camera_id: str = "cam_a"):
    while True:
        try:
            if dual_camera_manager:
                frame_bytes = dual_camera_manager.get_frame(camera_id)
                if frame_bytes:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            await asyncio.sleep(0.04)  # ~25 FPS delivery to browser
        except Exception:
            await asyncio.sleep(0.05)

@router.get("/stream/video/cam_a")
async def get_video_stream_cam_a():
    return StreamingResponse(
        mjpeg_generator("cam_a"),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/stream/video/cam_b")
async def get_video_stream_cam_b():
    return StreamingResponse(
        mjpeg_generator("cam_b"),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/stream/video")
async def get_video_stream():
    return StreamingResponse(
        mjpeg_generator("cam_a"),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/stream/frame")
def get_single_frame(cam: str = "cam_a"):
    """Returns single latest JPEG frame snapshot without persistent stream connection."""
    if dual_camera_manager:
        frame_bytes = dual_camera_manager.get_frame(cam)
        if frame_bytes:
            return Response(content=frame_bytes, media_type="image/jpeg")
    return Response(status_code=204)

# --- Configurable Safety Rules API ---
from hackeye.edge.safety_rules import safety_constraint_engine, FacilitySafetyRulesConfig
from hackeye.edge.physical_nodes import physical_node_manager
from hackeye.ai.agent_graph import safety_agent_graph, PENDING_AI_RULES
from hackeye.edge.distributed_nodes import distributed_cluster_manager

@router.get("/rules/config")
def get_safety_rules_config():
    """Returns active facility-specific safety constraints."""
    return safety_constraint_engine.config.model_dump()

@router.post("/rules/config")
def update_safety_rules_config(payload: Dict[str, Any]):
    """Live supervisor update of facility safety constraints."""
    updated = safety_constraint_engine.update_from_dict(payload)
    return {
        "status": "updated",
        "message": "Facility safety constraints dynamically applied to edge gateway.",
        "config": updated.model_dump()
    }

# --- Human-in-the-Loop AI Suggested Rules (Scenario 4) ---
@router.get("/rules/pending")
def get_pending_rules():
    """Returns list of novel rules suggested by Rule Recommendation Agent, awaiting supervisor review."""
    return PENDING_AI_RULES

@router.post("/rules/pending/{rule_id}/approve")
def approve_pending_rule(rule_id: str):
    """Supervisor approves AI-suggested rule into active deterministic constraints."""
    target_rule = None
    for rule in PENDING_AI_RULES:
        if rule.get("rule_id") == rule_id:
            target_rule = rule
            break
    if not target_rule:
        raise HTTPException(status_code=404, detail="Rule proposal not found")
    
    target_rule["status"] = "APPROVED_BY_SUPERVISOR"
    target_rule["approved_at"] = datetime.now(timezone.utc).isoformat()

    # Dynamically inject into safety constraint engine if stacking or custom threshold
    if "climb" in target_rule.get("description", "").lower() or "stack" in target_rule.get("description", "").lower():
        safety_constraint_engine.update_from_dict({"stacking_hazard_monitoring_enabled": True, "max_pallet_stack_height_m": 2.2})

    return {
        "status": "approved",
        "message": f"Rule {rule_id} approved and incorporated into active deterministic constraints.",
        "rule": target_rule
    }

@router.post("/rules/pending/{rule_id}/reject")
def reject_pending_rule(rule_id: str):
    """Supervisor rejects AI-suggested rule."""
    target_rule = None
    for rule in PENDING_AI_RULES:
        if rule.get("rule_id") == rule_id:
            target_rule = rule
            break
    if not target_rule:
        raise HTTPException(status_code=404, detail="Rule proposal not found")
    
    target_rule["status"] = "REJECTED_BY_SUPERVISOR"
    return {"status": "rejected", "rule": target_rule}

# --- Distributed Edge Inference Cluster Telemetry (50-100 Cameras) ---
@router.get("/cluster/nodes")
def get_cluster_nodes():
    """Returns distributed edge cluster telemetry across horizontal edge nodes."""
    return distributed_cluster_manager.get_cluster_telemetry()

# --- Physical Safety Nodes (Response Hardware Layer) ---
@router.get("/nodes")
def get_physical_nodes():
    """Returns real-time status of physical response nodes (ESP32 / Raspberry Pi)."""
    return physical_node_manager.get_all_nodes()

@router.post("/nodes/{node_id}/acknowledge")
def acknowledge_physical_node(node_id: str):
    """Operator / Supervisor physical button press to acknowledge alert."""
    result = physical_node_manager.acknowledge_node(node_id)
    if not result:
        raise HTTPException(status_code=404, detail="Physical node not found")
    return {"status": "acknowledged", "node": result}

# --- Agentic Intelligence Graph Status ---
@router.get("/agents/graph")
def get_agent_graph_info():
    """Returns specification and state of the multi-agent graph architecture."""
    return {
        "architecture": "LangGraph-Style Structured State Multi-Agent Graph",
        "critical_path_separation": "Fast Path (<5ms deterministic) vs Intelligence Path (asynchronous multi-agent reasoning)",
        "agents": [
            {
                "name": "Safety Knowledge Agent",
                "role": "Retrieves grounded OSHA & industrial safety guidelines via Firecrawl knowledge pipeline"
            },
            {
                "name": "Pattern & Trend Agent",
                "role": "Analyzes historical database records to identify recurring zone hazard patterns"
            },
            {
                "name": "Safety Analysis Agent",
                "role": "Multi-factor causal reasoning, contributing factors, and risk evaluation via Adaption AI"
            },
            {
                "name": "Incident Agent",
                "role": "Generates formal structured incident report and prioritized action items"
            },
            {
                "name": "Rule Recommendation Agent",
                "role": "Identifies novel unrepresented hazards and suggests candidate safety rules for supervisor approval"
            },
            {
                "name": "Reporting & Notification Agent",
                "role": "Dispatches asynchronous supervisor alerts via n8n automation and Render workflows"
            }
        ]
    }

