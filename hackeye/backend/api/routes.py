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
from hackeye.backend.services.video_stream import video_processor
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

@router.get("/incidents")
def get_incidents(limit: int = 25, db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.timestamp.desc()).limit(limit).all()
    return [
        {
            "incident_id": inc.incident_id,
            "timestamp": inc.timestamp.isoformat() if inc.timestamp else None,
            "zone": inc.zone,
            "worker_id": inc.worker_id,
            "machine_id": inc.machine_id,
            "machine_type": inc.machine_type,
            "distance_m": inc.distance_m,
            "ttc_seconds": inc.ttc_seconds,
            "risk_level": inc.risk_level,
            "status": inc.status,
            "local_alert_triggered": inc.local_alert_triggered,
            "sync_status": inc.sync_status,
            "ai_summary": inc.ai_analysis.get("reason") if inc.ai_analysis else None
        }
        for inc in incidents
    ]

@router.get("/incidents/{incident_id}")
def get_incident_detail(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "incident_id": inc.incident_id,
        "timestamp": inc.timestamp.isoformat() if inc.timestamp else None,
        "zone": inc.zone,
        "worker_id": inc.worker_id,
        "machine_id": inc.machine_id,
        "machine_type": inc.machine_type,
        "distance_m": inc.distance_m,
        "ttc_seconds": inc.ttc_seconds,
        "risk_level": inc.risk_level,
        "status": inc.status,
        "ai_analysis": inc.ai_analysis,
        "knowledge_cited": inc.knowledge_cited,
        "sync_status": inc.sync_status
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

@router.get("/workflows/latest")
def get_latest_workflow():
    wf = render_workflow_orchestrator.get_latest_workflow()
    return wf or {"status": "idle", "message": "No active workflow execution."}

@router.get("/workflows/{wf_id}")
def get_workflow(wf_id: str):
    wf = render_workflow_orchestrator.get_workflow(wf_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow execution not found")
    return wf

@router.get("/n8n/recent")
def get_recent_n8n():
    return n8n_client.get_recent_executions()

from hackeye.backend.services.video_stream import dual_camera_manager, video_processor

# Demo Controller Endpoints
@router.post("/demo/scenario/{scenario_name}")
def trigger_demo_scenario(scenario_name: str):
    sc_info = dual_camera_manager.set_scenario(scenario_name)
    res = demo_controller.run_scenario(scenario_name)
    return {**res, **sc_info}

@router.post("/demo/cloud-toggle")
def toggle_cloud_connection(payload: Dict[str, bool]):
    connected = payload.get("connected", True)
    return demo_controller.set_cloud_state(connected)

# Real-Time Telemetry & Multi-Camera Video MJPEG Streams
@router.get("/stream/telemetry")
def get_stream_telemetry():
    return {
        **dual_camera_manager.get_telemetry(),
        "cloud_connected": demo_controller.cloud_connected,
        "pending_sync_count": local_queue.get_pending_sync_count()
    }

async def mjpeg_generator(camera_id: str = "cam_a"):
    while True:
        try:
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
    frame_bytes = dual_camera_manager.get_frame(cam)
    if frame_bytes:
        return Response(content=frame_bytes, media_type="image/jpeg")
    return Response(status_code=204)
