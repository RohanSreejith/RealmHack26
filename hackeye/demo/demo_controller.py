"""
Hack-Eye Demo Controller
Powers the 6 dual-camera Swarm demonstration scenarios:
1. Forklift entrance & worker evasion (forklift_approaching_entrance + worker_at_entrance_inside)
2. Box pickup dual-view with No Helmet PPE violation (cam_00 + cam_01)
3. Fire hazard dual ceiling cameras (ceiling_00 + ceiling_01)
4. Forklift item/racking collision (cam_00 + cam_01)
5. Pedestrian critical collision / near-miss (ceiling_00 + ceiling_01)
6. Multi-angle severe collision (ceiling_01 + eye_00 + eye_03)
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
from hackeye.ai.agent_graph import PENDING_AI_RULES

class DemoController:
    def __init__(self):
        self.active_scenario = "scenario_1_entrance"
        self.cloud_connected = True

    def run_scenario(self, scenario_key: str) -> Dict[str, Any]:
        """Activates a specific multi-camera demonstration scenario."""
        self.active_scenario = scenario_key
        now_str = datetime.now(timezone.utc).isoformat()

        # SCENARIO 1: Forklift approaching entrance & person inside moving out of way
        if scenario_key == "scenario_1_entrance":
            inc_dict = {
                "incident_id": f"INC-SWARM-ENTRANCE-{int(time.time())}",
                "worker_id": "W-017 (Interior)",
                "machine_id": "F-004 (Exterior)",
                "machine_type": "forklift",
                "distance_m": 2.4,
                "ttc_seconds": 1.7,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01 ➔ ZONE_02",
                "timestamp": now_str,
                "confidence": 0.95,
                "is_converging": True,
                "closing_velocity_m_s": 1.45,
                "local_alert_triggered": True
            }
            ai_res = {
                "risk_assessment": "CRITICAL",
                "reason": "Swarm Node 01 detected Forklift F-004 approaching blind entrance at 1.45m/s. Swarm Node 02 confirmed Worker W-017 stationed directly in the door threshold.",
                "predicted_outcome": "Immediate blind-corner crush hazard within 1.7 seconds if pedestrian does not evacuate door radius.",
                "contributing_factors": [
                    "Blind corner partition obstructing operator and worker mutual sightlines",
                    "Forklift velocity exceeds 5 km/h threshold for interior threshold crossings",
                    "Pedestrian pathway lack of physical swing-gate barrier"
                ],
                "recommended_actions": [
                    "Swarm Node 02 audible warning activated: 'Clear Entrance Immediately'",
                    "Automated electric speed governor engaged on Forklift F-004",
                    "Dispatch acoustic chime and floor-projected blue warning halo"
                ],
                "confidence": 0.96,
                "knowledge_used": [
                    {
                        "id": "OSHA-1910-178-N4",
                        "title": "OSHA 1910.178(n)(4) - Powered Industrial Trucks: Blind Intersections",
                        "source": "OSHA General Industry Regulations"
                    }
                ]
            }

            inc_dict["ai_analysis"] = ai_res
            inc_dict["knowledge_cited"] = "OSHA 1910.178(n)(4) - Powered Industrial Trucks: Blind Intersections"
            inc_dict["worker_name"] = "Worker (W-017)"
            local_queue.persist_incident(inc_dict)

            # Swarm cross-zone alert: Node 01 warns Node 02
            sw_event = swarm_coordinator.broadcast_interzone_event(
                source_zone="ZONE_01 (Exterior Cam)",
                destination_zone="ZONE_02 (Interior Door)",
                event_type="VEHICLE_APPROACHING_CLEAR_DOOR",
                worker_id="W-017",
                machine_id="F-004",
                risk="CRITICAL",
                eta_seconds=2
            )

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)
            n8n_client.dispatch_critical_incident(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "1. Forklift Entrance & Swarm Pedestrian Evasion",
                "risk_level": "CRITICAL",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "swarm_event": sw_event,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Forklift entering exterior bay triggers Swarm inter-zone alert to interior camera node, commanding worker to move out of collision path."
            }

        # SCENARIO 2: Box pickup dual view + No Helmet PPE violation
        elif scenario_key == "scenario_2_box_no_helmet":
            ai_res = {
                "risk_assessment": "WARNING",
                "reason": "Swarm multi-camera tracking (Cam 00 + Cam 01) identified Worker David Kim (W-042) lifting heavy inventory crates without mandatory Type I Hard Hat / Helmet.",
                "predicted_outcome": "Elevated vulnerability to falling overhead objects and racking head-strike during pallet de-stacking.",
                "contributing_factors": [
                    "Failure to don PPE hard hat in designated active storage overhead zone",
                    "Dual-camera angle verified bare head from front and profile perspectives",
                    "Active overhead crane / pallet stacking in adjacent bay"
                ],
                "recommended_actions": [
                    "Broadcast audio reminder at Bay Station: 'Mandatory Hard Hat Required'",
                    "Log safety infraction in EHS compliance database",
                    "Deduct 10 points from Facility Risk Index"
                ],
                "confidence": 0.93,
                "knowledge_used": [
                    {
                        "id": "OSHA-1926-100",
                        "title": "OSHA 1926.100 - Head Protection and PPE Compliance in Industrial Operations",
                        "source": "OSHA Safety Standards"
                    }
                ]
            }

            inc_dict = {
                "incident_id": f"INC-PPE-HELMET-{int(time.time())}",
                "worker_id": "W-042",
                "worker_name": "David Kim",
                "machine_id": "STATIONARY_STORAGE",
                "machine_type": "material_handling",
                "distance_m": 4.5,
                "ttc_seconds": None,
                "risk_level": "WARNING",
                "zone": "ZONE_01 (Bay A)",
                "timestamp": now_str,
                "confidence": 0.92,
                "is_converging": False,
                "closing_velocity_m_s": 0.0,
                "local_alert_triggered": True,
                "ai_analysis": ai_res,
                "knowledge_cited": "OSHA 1926.100(a) — Mandatory Head Protection & Personal Safety"
            }
            local_queue.persist_incident(inc_dict)

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "2. Box Pickup & Swarm PPE No Helmet Violation",
                "risk_level": "WARNING",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Dual synchronized cameras detect worker handling heavy cargo without safety helmet. PPE non-compliance flagged."
            }

        # SCENARIO 3: Fire warning from dual ceiling cameras
        elif scenario_key == "scenario_3_fire":
            ai_res = {
                "risk_assessment": "CRITICAL",
                "reason": "Overhead Ceiling Swarm Cameras (Ceiling 00 & Ceiling 01) detect active optical thermal flare and particulate smoke plume in primary logistics aisle.",
                "predicted_outcome": "Rapid combustion spread to combustible cardboard pallets within 45 seconds; hazardous smoke inhalation.",
                "contributing_factors": [
                    "Combustible packing material staging adjacent to thermal source",
                    "Airflow currents spreading smoke along high-bay ceiling corridors",
                    "High density of personnel in neighboring warehouse quadrants"
                ],
                "recommended_actions": [
                    "Trigger general facility acoustic fire alarm and emergency strobe beacons",
                    "Automatically open emergency smoke dampers and trigger pre-action dry-pipe sprinklers",
                    "Initiate automated 911 / Fire Department emergency dispatch with zone coordinates",
                    "Direct all personnel to designated muster assembly points A and B"
                ],
                "confidence": 0.98,
                "knowledge_used": [
                    {
                        "id": "NFPA-13-101",
                        "title": "NFPA 101 / OSHA 1910.38 - Emergency Action Plans and Fire Suppression",
                        "source": "National Fire Protection Association"
                    }
                ]
            }

            inc_dict = {
                "incident_id": f"INC-FIRE-EMERGENCY-{int(time.time())}",
                "worker_id": "ALL_PERSONNEL",
                "worker_name": "All Facility Personnel",
                "machine_id": "CEILING_ZONE",
                "machine_type": "thermal_hazard",
                "distance_m": 0.0,
                "ttc_seconds": 0.0,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01 ➔ ALL",
                "timestamp": now_str,
                "confidence": 0.98,
                "is_converging": True,
                "closing_velocity_m_s": 0.0,
                "local_alert_triggered": True,
                "ai_analysis": ai_res,
                "knowledge_cited": "NFPA 101 / OSHA 1910.38 - Emergency Action Plans and Thermal Suppression"
            }
            local_queue.persist_incident(inc_dict)

            sw_event = swarm_coordinator.broadcast_interzone_event(
                source_zone="ZONE_01 (Ceiling 00)",
                destination_zone="ALL_ZONES",
                event_type="FIRE_HAZARD_FACILITY_EVACUATION",
                risk="CRITICAL",
                eta_seconds=0
            )

            ai_res = {
                "risk_assessment": "CRITICAL",
                "reason": "Overhead Ceiling Swarm Cameras (Ceiling 00 & Ceiling 01) detect active optical thermal flare and particulate smoke plume in primary logistics aisle.",
                "predicted_outcome": "Rapid combustion spread to combustible cardboard pallets within 45 seconds; hazardous smoke inhalation.",
                "contributing_factors": [
                    "Combustible packing material staging adjacent to thermal source",
                    "Airflow currents spreading smoke along high-bay ceiling corridors",
                    "High density of personnel in neighboring warehouse quadrants"
                ],
                "recommended_actions": [
                    "Trigger general facility acoustic fire alarm and emergency strobe beacons",
                    "Automatically open emergency smoke dampers and trigger pre-action dry-pipe sprinklers",
                    "Initiate automated 911 / Fire Department emergency dispatch with zone coordinates",
                    "Direct all personnel to designated muster assembly points A and B"
                ],
                "confidence": 0.98,
                "knowledge_used": [
                    {
                        "id": "NFPA-13-101",
                        "title": "NFPA 101 / OSHA 1910.38 - Emergency Action Plans and Fire Suppression",
                        "source": "National Fire Protection Association"
                    }
                ]
            }

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)
            n8n_client.dispatch_critical_incident(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "3. Thermal Emergency: Fire Warning & Facility Evacuation",
                "risk_level": "CRITICAL",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "swarm_event": sw_event,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Dual ceiling swarm nodes detect active optical fire plume. Facility-wide emergency evacuation & suppression dispatched."
            }

        # SCENARIO 4: Forklift collision with item/racking
        elif scenario_key == "scenario_4_item_collision":
            ai_res = {
                "risk_assessment": "CRITICAL",
                "reason": "Forklift F-004 collided with warehouse storage rack and loaded cargo pallet. High deceleration impact registered across Cam 00 and Cam 01.",
                "predicted_outcome": "Potential secondary rack progressive collapse and falling inventory hazards across neighboring aisles.",
                "contributing_factors": [
                    "Vehicle turning radius miscalculation while navigating narrow aisle",
                    "Excessive payload height obstructing driver forward visibility",
                    "Absence of steel floor-bolted structural rack upright protectors"
                ],
                "recommended_actions": [
                    "Immediately de-energize Forklift F-004 and cordon off Aisle 4",
                    "Structural engineer integrity inspection of upright upright upright beams",
                    "Verify stability of elevated tier-3 pallet stacks"
                ],
                "confidence": 0.95,
                "knowledge_used": [
                    {
                        "id": "OSHA-1910-176",
                        "title": "OSHA 1910.176(b) - Secure Storage and Racking Integrity Standards",
                        "source": "OSHA Materials Handling Guidance"
                    }
                ]
            }

            inc_dict = {
                "incident_id": f"INC-COLLISION-ITEM-{int(time.time())}",
                "worker_id": "OPERATOR_F04",
                "worker_name": "Marcus Vance",
                "machine_id": "F-004 (Forklift)",
                "machine_type": "forklift",
                "distance_m": 0.4,
                "ttc_seconds": 0.2,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01 (Storage Bay)",
                "timestamp": now_str,
                "confidence": 0.97,
                "is_converging": True,
                "closing_velocity_m_s": 2.1,
                "local_alert_triggered": True,
                "ai_analysis": ai_res,
                "knowledge_cited": "OSHA 1910.176(b) - Secure Storage and Racking Integrity Standards"
            }
            local_queue.persist_incident(inc_dict)

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)
            n8n_client.dispatch_critical_incident(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "4. Equipment Hazard: Forklift Collision with Item / Racking",
                "risk_level": "CRITICAL",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Dual synchronized cameras detect forklift impact with storage item/rack structure. Mechanical stoppage and aisle shutdown triggered."
            }

        # SCENARIO 4 (ALTERNATIVE): Unknown / Novel Safety Behavior (Worker on Storage Boxes)
        elif scenario_key == "scenario_4_unknown_hazard":
            inc_dict = {
                "incident_id": f"INC-UNKNOWN-CLIMB-{int(time.time())}",
                "worker_id": "W-059",
                "worker_name": "Tanya Ward",
                "machine_id": "CARGO_PALLET_STACK_04",
                "machine_type": "elevated_storage",
                "distance_m": 0.0,
                "ttc_seconds": None,
                "risk_level": "WARNING",
                "zone": "ZONE_04 (High-Bay Storage)",
                "timestamp": now_str,
                "confidence": 0.94,
                "is_converging": False,
                "closing_velocity_m_s": 0.0,
                "local_alert_triggered": True
            }

            # Trigger AI Multi-Agent reasoning
            ai_res = ai_safety_agent.process_incident(inc_dict)
            inc_dict["ai_analysis"] = ai_res
            inc_dict["knowledge_cited"] = "OSHA 1910.28 — Duty to Have Fall Protection Systems"
            local_queue.persist_incident(inc_dict)

            # Ensure pending rule is surfaced
            suggested_rule = {
                "rule_id": f"SUGG-RULE-BOXES-{int(time.time())}",
                "title": "Prohibit Worker Climbing on Stacked Material",
                "category": "ELEVATION_FALL_HAZARD",
                "description": "Workers should not climb or stand on stacked storage boxes without certified fall arrest.",
                "suggested_threshold": "Elevation > 1.2m on unrated surface",
                "status": "PENDING_SUPERVISOR_APPROVAL",
                "proposed_by": "Rule Recommendation Agent (Adaption AI)",
                "created_at": now_str
            }
            # Append if not already present
            if not any("Climbing" in r.get("title", "") for r in PENDING_AI_RULES):
                PENDING_AI_RULES.append(suggested_rule)

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "4. Unknown Hazard: Worker Climbing on Stacked Material",
                "risk_level": "WARNING",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "ai_suggested_rule": suggested_rule,
                "details": "Unrepresented safety situation: worker climbed stacked cargo boxes. AI Multi-Agent graph analyzed context & proposed new safety rule awaiting supervisor approval."
            }

        # SCENARIO 5: Near-miss / collision with person
        elif scenario_key == "scenario_5_person_nearmiss":
            inc_dict = {
                "incident_id": f"INC-COLLISION-PERSON-{int(time.time())}",
                "worker_id": "W-017 (Pedestrian)",
                "machine_id": "F-012 (Forklift)",
                "machine_type": "forklift",
                "distance_m": 1.1,
                "ttc_seconds": 0.6,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01 (Ceiling View)",
                "timestamp": now_str,
                "confidence": 0.99,
                "is_converging": True,
                "closing_velocity_m_s": 1.8,
                "local_alert_triggered": True
            }
            local_queue.persist_incident(inc_dict)

            ai_res = {
                "risk_assessment": "CRITICAL",
                "reason": "Severe near-miss / impact: Forklift F-012 encroached to within 1.1m of pedestrian worker W-017 with Time-To-Collision under 0.6 seconds.",
                "predicted_outcome": "Immediate struck-by or run-over trauma; high-risk acute personnel injury.",
                "contributing_factors": [
                    "Worker walking in designated mobile equipment lane rather than protected pedestrian walkway",
                    "Vehicle traveling in reverse with obstructed rear mirror line-of-sight",
                    "Lack of audible backup beeper warning signal"
                ],
                "recommended_actions": [
                    "Trigger automated emergency electronic braking override on Forklift F-012",
                    "Sound local directional high-decibel acoustic siren (<5ms latency)",
                    "Mandatory safety review and incident report filing for driver and supervisor"
                ],
                "confidence": 0.98,
                "knowledge_used": [
                    {
                        "id": "OSHA-1910-178-M2",
                        "title": "OSHA 1910.178(m)(2) - Pedestrian Separation & Exclusion Zones",
                        "source": "OSHA General Industry Standards"
                    }
                ]
            }

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)
            n8n_client.dispatch_critical_incident(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "5. Critical Incident: Near-Miss / Collision with Person",
                "risk_level": "CRITICAL",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Overhead ceiling nodes capture critical proximity breach (1.1m, TTC 0.6s) with pedestrian worker. Emergency siren fired immediately."
            }

        # SCENARIO 6: Multi-angle collision (Ceiling + Eye 00 + Eye 03)
        elif scenario_key == "scenario_6_multiangle":
            inc_dict = {
                "incident_id": f"INC-MULTI-ANGLE-{int(time.time())}",
                "worker_id": "W-001 (Ground Worker)",
                "machine_id": "HEAVY_FORKLIFT_01",
                "machine_type": "forklift",
                "distance_m": 0.8,
                "ttc_seconds": 0.4,
                "risk_level": "CRITICAL",
                "zone": "ZONE_01 (Tri-Swarm Corroboration)",
                "timestamp": now_str,
                "confidence": 0.99,
                "is_converging": True,
                "closing_velocity_m_s": 2.2,
                "local_alert_triggered": True
            }
            local_queue.persist_incident(inc_dict)

            sw_event = swarm_coordinator.broadcast_interzone_event(
                source_zone="CEILING_01",
                destination_zone="EYE_00 & EYE_03",
                event_type="TRI_CAMERA_COLLISION_VERIFIED",
                risk="CRITICAL",
                eta_seconds=0
            )

            ai_res = {
                "risk_assessment": "CRITICAL",
                "reason": "Corroborated by 3 Swarm Camera Nodes (Ceiling 01 + Operator Eye 00 + Lateral Eye 03): high-energy collision confirmed across 3 simultaneous perspectives.",
                "predicted_outcome": "Severe equipment rollover risk and personnel crush trauma at intersection.",
                "contributing_factors": [
                    "Simultaneous multi-axis convergence of equipment and ground personnel",
                    "Blind-corner traversal verified from both bird's eye overhead and cab-level view",
                    "High vehicle velocity during intersection crossing"
                ],
                "recommended_actions": [
                    "Instant emergency shutdown of all mechanized equipment in Zone 01 & Zone 02",
                    "Deploy on-site industrial medical first responders",
                    "Lock down digital blackbox telemetry and multi-angle camera recordings for EHS investigation"
                ],
                "confidence": 0.99,
                "knowledge_used": [
                    {
                        "id": "NIOSH-PUB-2001-109",
                        "title": "NIOSH Alert: Preventing Worker Injuries and Deaths from Moving Equipment",
                        "source": "CDC / NIOSH Industrial Guidance"
                    }
                ]
            }

            wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict, ai_res)
            n8n_client.dispatch_critical_incident(inc_dict, ai_res)

            return {
                "scenario": scenario_key,
                "title": "6. Multi-Angle Swarm Collision Corroboration",
                "risk_level": "CRITICAL",
                "incident": inc_dict,
                "ai_analysis": ai_res,
                "swarm_event": sw_event,
                "workflow_id": wf.workflow_id,
                "local_alert": True,
                "details": "Severe collision corroborated in real-time across ceiling and operator eye-level swarm cameras simultaneously."
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
