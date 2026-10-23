"""
Hack-Eye Demo Controller
Powers the 3-minute hackathon presentation with 1-click execution for all 6 scenarios,
offline toggles, swarm notifications, and timeline simulation.
"""
import os
import time
from typing import Dict, Any, List
from datetime import datetime, timezone
from hackeye.edge.local_queue import local_queue
from hackeye.swarm.coordinator import swarm_coordinator
from hackeye.ai.safety_agent import ai_safety_agent
from hackeye.render.workflow_engine import render_workflow_orchestrator
from hackeye.n8n.client import n8n_client
from hackeye.backend.database.db import SessionLocal
from hackeye.backend.database.models import Incident, SafetyInsight

# Video assets mapped to scenarios
SCENARIO_VIDEO_MAP = {
    "scenario_1_safe": "videos/worker_no_helmet.mp4",
    "scenario_2_warning": "videos/loading_zone_truck.mp4",
    "scenario_3_critical": "videos/forklift_approaching_entrance.mp4",
    "scenario_4_converging": "videos/forklift_approaching_entrance.mp4",
    "scenario_5_repeat": "videos/loading_zone_truck.mp4",
    "scenario_6_swarm": "videos/worker_at_entrance_inside.mp4"
}

class DemoController:
    def __init__(self):
        self.active_scenario = "scenario_3_critical"
        self.cloud_connected = True

    def run_scenario(self, scenario_key: str, video_processor_instance=None) -> Dict[str, Any]:
        """Activates a specific demonstration scenario and switches the live camera feed if available."""
        self.active_scenario = scenario_key
        video_file = SCENARIO_VIDEO_MAP.get(scenario_key, "videos/forklift_approaching_entrance.mp4")

        if video_processor_instance and os.path.exists(video_file):
            video_processor_instance.start_stream(video_file)

        now_str = datetime.now(timezone.utc).isoformat()

        if scenario_key == "scenario_1_safe":
            return {
                "scenario": scenario_key,
                "title": "Scenario 1: Safe Pedestrian Transit",
                "risk_level": "SAFE",
                "details": "Worker W-001 maintaining safe 7.2m separation from machinery. Zero collision risk.",
                "local_alert": False
            }

        elif scenario_key == "scenario_2_warning":
            inc_dict = {
                "incident_id": f"INC-WARN-{int(time.time())}",
                "worker_id": "W-042",
                "machine_id": "T-088",
                "machine_type": "truck",
                "distance_m": 4.8,
                "ttc_seconds": 3.6,
                "risk_level": "WARNING",
                "zone": "ZONE_03",
                "timestamp": now_str,
                "confidence": 0.88,
                "is_converging": True,
                "closing_velocity_m_s": 1.33,
                "local_alert_triggered": False
            }
            local_queue.persist_incident(inc_dict)
            return {
                "scenario": scenario_key,
                "title": "Scenario 2: Warning Perimeter Incursion",
                "risk_level": "WARNING",
                "incident": inc_dict,
                "details": "Truck T-088 backing into Loading Bay; advisory amber warning activated.",
                "local_alert": False
            }

        elif scenario_key in ["scenario_3_critical", "scenario_4_converging"]:
            inc_dict = {
                "incident_id": f"INC-CRIT-{int(time.time())}",
                "worker_id": "W-017",
                "machine_id": "F-004",
                "machine_type": "forklift",
                "distance_m": 2.4,
                "ttc_seconds": 1.6,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01",
                "timestamp": now_str,
                "confidence": 0.96,
                "is_converging": True,
                "closing_velocity_m_s": 1.5,
                "local_alert_triggered": True
            }
            local_queue.persist_incident(inc_dict)
            
            # Swarm Notification
            swarm_coordinator.broadcast_interzone_event(
                source_zone="ZONE_01",
                destination_zone="ZONE_02",
                event_type="HAZARD_ALERT",
                worker_id="W-017",
                machine_id="F-004",
                risk="CRITICAL",
                eta_seconds=2
            )

            # AI Analysis & Cloud Pipeline
            ai_res = ai_safety_agent.process_incident(inc_dict)
            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict)
            n8n_client.dispatch_critical_incident(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "Scenario 3: Critical Proximity & TTC Breach",
                "risk_level": "CRITICAL",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Immediate local siren triggered in <10ms. AI reasoning completed asynchronously."
            }

        elif scenario_key == "scenario_5_repeat":
            # Seed repeated incidents to demonstrate pattern learning
            db = SessionLocal()
            try:
                for i in range(3):
                    inc_mock = Incident(
                        incident_id=f"INC-HIST-{i}-{int(time.time())}",
                        timestamp=datetime.now(timezone.utc),
                        zone="ZONE_01",
                        worker_id=f"W-0{i+1}",
                        machine_id="F-004",
                        machine_type="forklift",
                        distance_m=2.9,
                        ttc_seconds=1.8,
                        risk_level="CRITICAL",
                        status="RESOLVED",
                        local_alert_triggered=True,
                        sync_status="SYNCED"
                    )
                    db.merge(inc_mock)
                db.commit()
            finally:
                db.close()

            # Trigger AI Safety Agent for repeated pattern
            inc_trigger = {
                "incident_id": f"INC-REPEAT-{int(time.time())}",
                "worker_id": "W-017",
                "machine_id": "F-004",
                "machine_type": "forklift",
                "distance_m": 2.6,
                "ttc_seconds": 1.7,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01",
                "timestamp": now_str,
                "confidence": 0.95
            }
            ai_res = ai_safety_agent.process_incident(inc_trigger)
            n8n_client.dispatch_repeated_near_miss("ZONE_01", 4, "Blind-corner forklift near-misses during shift change")

            return {
                "scenario": scenario_key,
                "title": "Scenario 5: Repeated Near-Miss Pattern Recognition",
                "risk_level": "CRITICAL",
                "ai_analysis": ai_res,
                "details": "AI identified recurring zone-level blind-spot pattern and dispatched corrective work-order."
            }

        elif scenario_key == "scenario_6_swarm":
            sw_event = swarm_coordinator.broadcast_interzone_event(
                source_zone="ZONE_01",
                destination_zone="ZONE_02",
                event_type="WORKER_APPROACHING",
                worker_id="W-001",
                risk="HIGH",
                eta_seconds=4
            )
            return {
                "scenario": scenario_key,
                "title": "Scenario 6: Swarm Inter-Zone Context Sharing",
                "swarm_event": sw_event,
                "details": "Zone 01 Agent detected worker transit; Zone 02 Agent elevated vigilance to HEIGHTENED."
            }

        return {"status": "unknown_scenario"}

    def set_cloud_state(self, connected: bool) -> Dict[str, Any]:
        self.cloud_connected = connected
        local_queue.set_cloud_connectivity(connected)
        if connected:
            synced_count = local_queue.sync_to_cloud()
            return {
                "cloud_connected": True,
                "status_text": "CLOUD: ONLINE",
                "synced_events": synced_count,
                "message": f"Cloud reconnected. Successfully synchronized {synced_count} queued edge events."
            }
        else:
            return {
                "cloud_connected": False,
                "status_text": "EDGE: OFFLINE — LOCAL SAFETY ACTIVE",
                "pending_queue": local_queue.get_pending_sync_count(),
                "message": "Cloud connection severed. Local deterministic safety engine & siren remain 100% operational."
            }

demo_controller = DemoController()
