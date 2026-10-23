"""
Automated Unit and Integration Tests for Hack-Eye Core Engine.
"""
import os
import pytest
from datetime import datetime, timezone
from hackeye.backend.config import settings
from hackeye.backend.database.db import init_db, SessionLocal
from hackeye.backend.database.models import Incident, Worker, Machine
from hackeye.edge.detector import ObjectDetector
from hackeye.edge.tracker import ObjectTracker, TrackedObject
from hackeye.edge.ttc import TTCEngine
from hackeye.edge.safety_engine import DeterministicSafetyEngine
from hackeye.edge.local_queue import local_queue
from hackeye.ai.safety_agent import ai_safety_agent
from hackeye.swarm.coordinator import swarm_coordinator
from hackeye.firecrawl.knowledge_service import safety_knowledge_service
from hackeye.render.workflow_engine import render_workflow_orchestrator
from hackeye.n8n.client import n8n_client

def test_database_initialization():
    init_db()
    db = SessionLocal()
    try:
        workers = db.query(Worker).all()
        machines = db.query(Machine).all()
        assert len(workers) >= 4
        assert len(machines) >= 4
    finally:
        db.close()

def test_ttc_converging_and_diverging():
    ttc_engine = TTCEngine(pixels_per_meter=35.0)
    
    # Worker at (100, 100), moving right at 1 m/s (vx = +1.0)
    w = TrackedObject("W-001", "worker", [90, 80, 110, 120], [100.0, 100.0], 100.0)
    w.vx_m_s = 1.0
    w.vy_m_s = 0.0

    # Forklift at (200, 100), moving left at 2 m/s (vx = -2.0)
    f = TrackedObject("F-004", "forklift", [180, 70, 220, 130], [200.0, 100.0], 100.0)
    f.vx_m_s = -2.0
    f.vy_m_s = 0.0

    # Converging case
    prox_conv = ttc_engine.compute_proximity(w, f)
    assert prox_conv.is_converging is True
    assert prox_conv.closing_velocity_m_s > 0
    assert prox_conv.ttc_seconds is not None
    assert prox_conv.ttc_seconds < 2.0

    # Diverging case: Forklift moves away to right (vx = +2.0)
    f.vx_m_s = 3.0
    prox_div = ttc_engine.compute_proximity(w, f)
    assert prox_div.is_converging is False
    assert prox_div.ttc_seconds is None

def test_deterministic_safety_engine():
    engine = DeterministicSafetyEngine(zone="ZONE_01")
    ttc_engine = TTCEngine(pixels_per_meter=35.0)

    # Critical breach: distance < 3m, TTC < 2s
    w = TrackedObject("W-017", "worker", [90, 80, 110, 120], [100.0, 100.0], 100.0)
    w.vx_m_s = 0.5
    f = TrackedObject("F-004", "forklift", [120, 70, 160, 130], [140.0, 100.0], 100.0) # ~1.14m distance
    f.vx_m_s = -1.5

    prox = ttc_engine.compute_proximity(w, f)
    incidents = engine.evaluate([prox])
    assert len(incidents) > 0
    assert incidents[0].risk_level == "CRITICAL"
    assert incidents[0].worker_id == "W-017"
    assert incidents[0].machine_id == "F-004"

def test_local_queue_and_offline_sync():
    local_queue.set_cloud_connectivity(False)
    inc_payload = {
        "incident_id": "TEST-OFFLINE-001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "zone": "ZONE_01",
        "worker_id": "W-001",
        "machine_id": "F-004",
        "machine_type": "forklift",
        "distance_m": 2.1,
        "ttc_seconds": 1.4,
        "risk_level": "CRITICAL",
        "local_alert_triggered": True
    }
    local_queue.persist_incident(inc_payload)
    assert local_queue.get_pending_sync_count() >= 1

    # Reconnect and sync
    local_queue.set_cloud_connectivity(True)
    synced = local_queue.sync_to_cloud()
    assert synced >= 1
    assert local_queue.get_pending_sync_count() == 0

def test_firecrawl_osha_retrieval():
    matches = safety_knowledge_service.retrieve_guidance("forklift", ["blind", "intersection"])
    assert len(matches) > 0
    assert "1910-178" in matches[0]["id"] or "1910.178" in matches[0]["title"]

def test_swarm_coordination():
    event = swarm_coordinator.broadcast_interzone_event(
        source_zone="ZONE_01",
        destination_zone="ZONE_02",
        event_type="WORKER_APPROACHING",
        worker_id="W-017",
        risk="HIGH",
        eta_seconds=4
    )
    assert event["event"] == "WORKER_APPROACHING"
    assert swarm_coordinator.agents["ZONE_02"].vigilance_level == "HEIGHTENED"

def test_render_workflow_state_machine():
    wf = render_workflow_orchestrator.trigger_incident_workflow({
        "incident_id": "INC-TEST-99",
        "zone": "ZONE_01"
    })
    assert wf.current_step == "RECEIVED"
    assert wf.progress_pct == 15

if __name__ == "__main__":
    pytest.main(["-v", __file__])
