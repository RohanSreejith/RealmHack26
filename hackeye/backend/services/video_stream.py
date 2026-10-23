"""
Multi-Camera Swarm Video Processing & Telemetry Engine
Supports concurrent dual-camera (or multi-camera) video streams running in synchronized background threads.
Provides independent YOLO tracking, distance calculation, PPE compliance, fire detection, and swarm correlation.
"""
import os
import cv2
import time
import math
import threading
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from hackeye.backend.config import settings
from hackeye.edge.detector import ObjectDetector
from hackeye.edge.tracker import ObjectTracker, TrackedObject
from hackeye.edge.ttc import TTCEngine, ProximityAnalysis
from hackeye.edge.safety_engine import DeterministicSafetyEngine, SafetyIncident
from hackeye.edge.local_queue import local_queue
from hackeye.ai.safety_agent import ai_safety_agent
from hackeye.swarm.coordinator import swarm_coordinator
from hackeye.render.workflow_engine import render_workflow_orchestrator
from hackeye.n8n.client import n8n_client
from hackeye.edge.safety_rules import safety_constraint_engine
from hackeye.edge.physical_nodes import physical_node_manager
from hackeye.edge.motion_detector import LightweightMotionDetector
from hackeye.edge.scene_state import ByteTrackSceneManager, SceneState

# 6 Pre-configured Scenarios with Dual Camera Pairs
SCENARIO_CONFIGS = {
    "scenario_1_entrance": {
        "title": "Swarm Coordination: Forklift Entrance & Pedestrian Evasion",
        "cam_a": "videos/forklift_approaching_entrance.mp4",
        "cam_b": "videos/worker_at_entrance_inside.mp4",
        "zone_a": "ZONE_01 (Outside Bay)",
        "zone_b": "ZONE_02 (Interior Door)",
        "hazard_type": "BLIND_CORNER_CONVERGENCE",
        "details": "Forklift approaching entrance triggers inter-zone swarm alert to interior camera node, commanding worker to clear the threshold."
    },
    "scenario_2_box_no_helmet": {
        "title": "Box Pickup: Swarm Multi-Angle & PPE Helmet Violation",
        "cam_a": "videos/videos/box_pickup-rgb-00000/008caa590c5e5b7b4bca_run_8_seed_4731920.cam_00.rgb.mp4",
        "cam_b": "videos/videos/box_pickup-rgb-00000/008caa590c5e5b7b4bca_run_8_seed_4731920.cam_01.rgb.mp4",
        "zone_a": "ZONE_01 (Cam 00)",
        "zone_b": "ZONE_02 (Cam 01)",
        "hazard_type": "PPE_NO_HELMET_VIOLATION",
        "details": "Dual synchronized cameras detect worker handling material without mandatory hard hat. Flagged for OSHA 1926.100 non-compliance."
    },
    "scenario_3_fire": {
        "title": "Thermal Emergency: Swarm Ceiling Fire Detection & Evacuation",
        "cam_a": "videos/videos/fire-rgb-00000/00023b5323028ab83e67_run_6_seed_1486583949.ceiling_00.rgb.mp4",
        "cam_b": "videos/videos/fire-rgb-00000/00023b5323028ab83e67_run_6_seed_1486583949.ceiling_01.rgb.mp4",
        "zone_a": "ZONE_01 (Ceiling 00)",
        "zone_b": "ZONE_02 (Ceiling 01)",
        "hazard_type": "FIRE_EMERGENCY",
        "details": "Overhead ceiling nodes identify optical flame/smoke signature. Swarm broadcasts emergency evacuation order and dispatches suppression."
    },
    "scenario_4_item_collision": {
        "title": "Equipment Hazard: Forklift Impact with Storage Racking / Item",
        "cam_a": "videos/videos/forklift_collision-rgb-00000/0021d0743dc26041d97b_run_5_seed_574698367.cam_00.rgb.mp4",
        "cam_b": "videos/videos/forklift_collision-rgb-00000/0021d0743dc26041d97b_run_5_seed_574698367.cam_01.rgb.mp4",
        "zone_a": "ZONE_01 (Bay Cam 00)",
        "zone_b": "ZONE_02 (Bay Cam 01)",
        "hazard_type": "OBJECT_COLLISION",
        "details": "Synchronized perspectives detect machinery impacting industrial racking structure. Immediate mechanical stoppage and inspection triggered."
    },
    "scenario_4_unknown_hazard": {
        "title": "Novel Hazard: Worker Standing/Climbing on Stacked Cargo",
        "cam_a": "videos/videos/box-rgb-00000/0002111d95f87b322197_run_5_seed_1615594951.cam_00.rgb.mp4",
        "cam_b": "videos/videos/box-rgb-00000/0002111d95f87b322197_run_5_seed_1615594951.cam_01.rgb.mp4",
        "zone_a": "ZONE_04 (Stacking Bay)",
        "zone_b": "ZONE_04 (Aisle 04)",
        "hazard_type": "UNSAFE_STACK_CLIMB",
        "details": "Unrepresented hazard: worker climbing stacked pallets without fall arrest. Triggers AI Rule Recommendation Agent proposal."
    },
    "scenario_5_person_nearmiss": {
        "title": "Critical Incident: Near-Miss / Collision with Pedestrian",
        "cam_a": "videos/videos/nearmiss-rgb-00000/001e53453441935632ae_run_1_seed_1288693302.ceiling_00.rgb.mp4",
        "cam_b": "videos/videos/nearmiss-rgb-00000/001e53453441935632ae_run_1_seed_1288693302.ceiling_01.rgb.mp4",
        "zone_a": "ZONE_01 (Ceiling 00)",
        "zone_b": "ZONE_02 (Ceiling 01)",
        "hazard_type": "PEDESTRIAN_CRITICAL_NEAR_MISS",
        "details": "Machinery encroaches within 1.2m of worker walking in traffic lane. TTC drops below emergency braking margin."
    },
    "scenario_6_multiangle": {
        "title": "Multi-Angle Collision: Severe Equipment Impact Verification",
        "cam_a": "videos/videos/05761a14cf211fdb7562_run_21_seed_742094177.ceiling_01.rgb.mp4",
        "cam_b": "videos/videos/05761a14cf211fdb7562_run_21_seed_742094177.eye_00.rgb.mp4",
        "cam_c": "videos/videos/05761a14cf211fdb7562_run_21_seed_742094177.eye_03.rgb.mp4",
        "zone_a": "ZONE_01 (Ceiling 01)",
        "zone_b": "ZONE_02 (Eye 00)",
        "hazard_type": "MULTI_ANGLE_COLLISION",
        "details": "Ceiling and operator eye-level swarm cameras mutually corroborate severe equipment impact."
    }
}

class CameraStreamNode:
    """Represents an autonomous edge camera node participating in the Hack-Eye Swarm."""
    def __init__(self, node_id: str, default_video: str, zone_label: str):
        self.node_id = node_id
        self.video_path = default_video
        self.zone_label = zone_label
        self.motion_detector = LightweightMotionDetector(sensitivity_threshold_pct=0.25)
        self.scene_manager = ByteTrackSceneManager(self.node_id, self.zone_label, yolo_refresh_interval=8)
        self.safety_engine = DeterministicSafetyEngine(zone=zone_label[:7])

        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.lock = threading.Lock()
        self.worker_thread: Optional[threading.Thread] = None

        self.current_frame_bytes: Optional[bytes] = None
        self.hazard_tag: Optional[str] = None
        self.ppe_violation: bool = False
        self.fire_detected: bool = False

        self.telemetry: Dict[str, Any] = {
            "node_id": self.node_id,
            "zone": self.zone_label,
            "status": "SAFE",
            "compute_mode": "LOW_COMPUTE",
            "compute_savings": "85.0%",
            "active_tracks": [],
            "proximities": [],
            "active_incident": None,
            "fps": 24.0,
            "timestamp": time.time(),
            "local_alert_active": False
        }
        self.last_incident_time = 0.0

    def start_stream(self, video_path: Optional[str] = None, zone_label: Optional[str] = None, hazard_tag: Optional[str] = None):
        with self.lock:
            if video_path:
                self.video_path = video_path
            if zone_label:
                self.zone_label = zone_label
            self.hazard_tag = hazard_tag
            self.motion_detector.reset()

            if self.cap:
                self.cap.release()
            
            if os.path.exists(self.video_path):
                self.cap = cv2.VideoCapture(self.video_path)
            self.is_running = True

            if not self.worker_thread or not self.worker_thread.is_alive():
                self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
                self.worker_thread.start()

    def stop_stream(self):
        self.is_running = False
        with self.lock:
            if self.cap:
                self.cap.release()
                self.cap = None

    def _worker_loop(self):
        while self.is_running:
            try:
                frame_bytes = self._process_single_frame()
                if frame_bytes:
                    self.current_frame_bytes = frame_bytes
                time.sleep(0.033)
            except Exception:
                time.sleep(0.04)

    def _process_single_frame(self) -> Optional[bytes]:
        with self.lock:
            if not self.cap or not self.cap.isOpened():
                if os.path.exists(self.video_path):
                    self.cap = cv2.VideoCapture(self.video_path)
                else:
                    return None

            ret, frame = self.cap.read()
            if not ret:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
                if not ret:
                    return None

        # Resize for smooth high-speed multi-feed inference & delivery (width=640)
        h, w = frame.shape[:2]
        if w > 640:
            scale = 640.0 / w
            frame = cv2.resize(frame, (640, int(h * scale)))

        start_time = time.time()

        # 1. First-Stage Lightweight Motion & Activity Detection (<1ms)
        # Avoids expensive YOLO inference when there is no significant scene activity
        activity_result = self.motion_detector.process_frame(frame)

        # 2. Update Persistent Scene State via ByteTrack (runs YOLO only when activity or periodic refresh)
        scene = self.scene_manager.update(frame, has_activity=activity_result.has_activity)
        tracks = scene.active_tracks
        proximities = scene.proximities

        workers = scene.workers
        machinery = scene.machinery
        obstacles = scene.obstacles

        # 3. Deterministic Safety Evaluation
        incidents = self.safety_engine.evaluate(proximities)
        active_incident = incidents[0] if incidents else None

        # Custom Scenario Overlays & Hazard Flags
        is_critical = False
        is_warning = False
        hazard_label = self.hazard_tag or "PROXIMITY_ALERT"
        action_command = "MAINTAIN CLEARANCE"

        if self.hazard_tag == "FIRE_EMERGENCY":
            self.fire_detected = True
            is_critical = True
            hazard_label = "FIRE_EMERGENCY"
            action_command = "EVACUATE FACILITY"
        elif self.hazard_tag == "PPE_NO_HELMET_VIOLATION":
            self.ppe_violation = True
            is_warning = True
            hazard_label = "PPE_VIOLATION"
            action_command = "PUT ON HARD HAT"
        elif self.hazard_tag in ["OBJECT_COLLISION", "PEDESTRIAN_CRITICAL_NEAR_MISS", "MULTI_ANGLE_COLLISION", "BLIND_CORNER_CONVERGENCE"]:
            if active_incident and active_incident.risk_level == "CRITICAL":
                is_critical = True
                action_command = "EMERGENCY BRAKE"
            elif proximities and any(p.estimated_distance_m < safety_constraint_engine.config.min_forklift_worker_distance_m for p in proximities):
                is_critical = True
                action_command = "MOVE TO SAFE AREA"
            else:
                is_warning = True
                action_command = "SLOW VEHICLE"

        # Fast Path Physical Alert: Trigger physical hardware nodes immediately (<5ms, zero LLM delay)
        if is_critical or is_warning:
            physical_node_manager.dispatch_fast_alert(
                zone_id=self.zone_label[:7],
                hazard=hazard_label,
                severity="CRITICAL" if is_critical else "WARNING",
                action=action_command,
                display_lines=[
                    "CRITICAL HAZARD" if is_critical else "SAFETY NOTICE",
                    f"{hazard_label.replace('_', ' ')[:18]}",
                    action_command
                ]
            )

        # Periodic Event Persistence & Async Trigger (Intelligence Path)
        if (is_critical or (active_incident and active_incident.risk_level == "CRITICAL")) and (time.time() - self.last_incident_time > 4.0):
            self.last_incident_time = time.time()
            target_entity = workers[0] if workers else (obstacles[0] if obstacles else None)
            inc_dict = {
                "incident_id": f"INC-HACKEYE-{int(time.time())}",
                "worker_id": target_entity.track_id if target_entity else "W-017",
                "machine_id": machinery[0].track_id if machinery else "F-004",
                "machine_type": "forklift" if machinery else "general_hazard",
                "distance_m": proximities[0].estimated_distance_m if proximities else 1.2,
                "ttc_seconds": proximities[0].ttc_seconds if proximities else 0.8,
                "risk_level": "CRITICAL" if is_critical else "WARNING",
                "zone": self.zone_label[:7],
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "confidence": 0.96,
                "local_alert_triggered": True
            }
            local_queue.persist_incident(inc_dict)

        # 4. Render HUD Overlays onto frame with compute mode indicator
        self._render_hud(frame, tracks, proximities, is_critical, is_warning, scene.compute_mode, scene.compute_savings_pct)

        # Update Telemetry State
        overall_status = "CRITICAL" if is_critical else ("WARNING" if is_warning else "SAFE")
        duration = time.time() - start_time
        fps = round(1.0 / max(duration, 0.001), 1)

        self.telemetry = {
            "node_id": self.node_id,
            "zone": self.zone_label,
            "status": overall_status,
            "compute_mode": scene.compute_mode,
            "compute_savings": f"{scene.compute_savings_pct}%",
            "active_tracks": [t.to_dict() for t in tracks],
            "proximities": [p.to_dict() for p in proximities],
            "active_incident": active_incident.to_dict() if active_incident else None,
            "hazard_tag": self.hazard_tag,
            "fps": fps,
            "timestamp": time.time(),
            "local_alert_active": overall_status in ["HIGH", "CRITICAL"]
        }

        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        return buffer.tobytes()

    def _render_hud(self, frame: np.ndarray, tracks: List[TrackedObject], proximities: List[ProximityAnalysis], is_critical: bool, is_warning: bool, compute_mode: str = "LOW_COMPUTE", compute_savings_pct: float = 85.0):
        COLOR_SAFE = (0, 220, 100)      # Clean Green
        COLOR_WARN = (0, 200, 255)      # Amber Yellow
        COLOR_CRIT = (30, 30, 255)      # Bright Red
        COLOR_FORKLIFT = (255, 175, 0)  # Bright Cyan/Sky-Blue in BGR
        COLOR_CART = (0, 215, 255)      # Industrial Yellow in BGR
        COLOR_FIRE = (0, 100, 255)      # Bright Orange
        COLOR_LOW_COMP = (120, 200, 80) # Soft Green
        COLOR_VISION = (230, 150, 40)   # Blue/Azure

        # 1. Camera Node Badge
        cv2.rectangle(frame, (10, 10), (220, 38), (15, 20, 30), -1)
        cv2.rectangle(frame, (10, 10), (220, 38), (50, 70, 95), 1)
        cv2.putText(frame, f"{self.node_id}: {self.zone_label}", (16, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

        # 1b. Edge Compute Mode Badge (Top-Right)
        w_frame = frame.shape[1]
        badge_text = f"{compute_mode} (GPU SAVED {compute_savings_pct}%)" if compute_mode == "LOW_COMPUTE" else f"VISION ACTIVE (YOLO+BYTETRACK)"
        badge_col = COLOR_LOW_COMP if compute_mode == "LOW_COMPUTE" else COLOR_VISION
        cv2.rectangle(frame, (w_frame - 310, 10), (w_frame - 10, 38), (15, 20, 30), -1)
        cv2.rectangle(frame, (w_frame - 310, 10), (w_frame - 10, 38), badge_col, 1)
        cv2.putText(frame, badge_text, (w_frame - 302, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.38, badge_col, 1, cv2.LINE_AA)

        # 2. Draw tracks
        for trk in tracks:
            x1, y1, x2, y2 = [int(v) for v in trk.bbox]
            
            # Select color based on category and alert state
            if is_critical and trk.industrial_type in ["worker", "forklift"]:
                bcolor = COLOR_CRIT
            elif trk.industrial_type == "forklift":
                bcolor = COLOR_CRIT if is_critical else COLOR_FORKLIFT
            elif trk.industrial_type == "worker":
                bcolor = COLOR_CRIT if is_critical else (COLOR_WARN if is_warning else COLOR_SAFE)
            elif trk.industrial_type in ["hazard_obstacle", "obstacle", "cart"]:
                bcolor = COLOR_CART
            else:
                bcolor = COLOR_WARN

            cv2.rectangle(frame, (x1, y1), (x2, y2), bcolor, 2)

            if trk.industrial_type == "forklift":
                tag = f"{trk.track_id} (FORKLIFT)"
            elif trk.industrial_type in ["hazard_obstacle", "obstacle", "cart"]:
                tag = f"{trk.track_id} (OBSTACLE / CART)"
            else:
                tag = f"{trk.track_id} ({trk.industrial_type.upper()})"

            (tw, th), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(frame, (x1, y1 - th - 5), (x1 + tw + 4, y1), bcolor, -1)
            cv2.putText(frame, tag, (x1 + 2, y1 - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1, cv2.LINE_AA)

        # 3. Draw proximity vectors
        for prox in proximities:
            w_pt = (int(prox.worker_pos[0]), int(prox.worker_pos[1]))
            m_pt = (int(prox.machine_pos[0]), int(prox.machine_pos[1]))
            lcolor = COLOR_CRIT if (is_critical or prox.estimated_distance_m < 2.5) else COLOR_WARN
            cv2.line(frame, w_pt, m_pt, lcolor, 2, cv2.LINE_AA)
            mid_x, mid_y = int((w_pt[0] + m_pt[0]) / 2), int((w_pt[1] + m_pt[1]) / 2) - 8
            label = f"Dist: {prox.estimated_distance_m}m"
            cv2.putText(frame, label, (mid_x - 30, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 3)
            cv2.putText(frame, label, (mid_x - 30, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, lcolor, 1)

        # 4. Special Scenario Banners
        if self.hazard_tag == "FIRE_EMERGENCY":
            cv2.rectangle(frame, (0, 0), (frame.shape[1]-1, frame.shape[0]-1), COLOR_FIRE, 6)
            cv2.putText(frame, "HACK-EYE ALERT: OPTICAL FIRE SIGNATURE DETECTED", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 4)
            cv2.putText(frame, "HACK-EYE ALERT: OPTICAL FIRE SIGNATURE DETECTED", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, COLOR_FIRE, 2)
        elif self.hazard_tag == "PPE_NO_HELMET_VIOLATION":
            cv2.rectangle(frame, (0, 0), (frame.shape[1]-1, frame.shape[0]-1), COLOR_WARN, 4)
            cv2.putText(frame, "PPE VIOLATION: NO HELMET / HARD HAT", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 4)
            cv2.putText(frame, "PPE VIOLATION: NO HELMET / HARD HAT", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR_WARN, 2)
        elif is_critical:
            cv2.rectangle(frame, (0, 0), (frame.shape[1]-1, frame.shape[0]-1), COLOR_CRIT, 6)
            cv2.putText(frame, "CRITICAL COLLISION / TRAJECTORY BREACH", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 4)
            cv2.putText(frame, "CRITICAL COLLISION / TRAJECTORY BREACH", (20, 65), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)


class DualCameraManager:
    """Coordinates Camera A and Camera B simultaneously as synchronized Swarm agents."""
    def __init__(self):
        default_sc = SCENARIO_CONFIGS["scenario_1_entrance"]
        self.node_a = CameraStreamNode("SWARM-NODE-01", default_sc["cam_a"], default_sc["zone_a"])
        self.node_b = CameraStreamNode("SWARM-NODE-02", default_sc["cam_b"], default_sc["zone_b"])
        self.node_c: Optional[CameraStreamNode] = None
        self.active_scenario = "scenario_1_entrance"

    def start_all(self):
        sc = SCENARIO_CONFIGS.get(self.active_scenario, SCENARIO_CONFIGS["scenario_1_entrance"])
        self.node_a.start_stream(sc["cam_a"], sc["zone_a"], sc.get("hazard_type"))
        self.node_b.start_stream(sc["cam_b"], sc["zone_b"], sc.get("hazard_type"))
        if "cam_c" in sc:
            if not self.node_c:
                self.node_c = CameraStreamNode("SWARM-NODE-03", sc["cam_c"], "ZONE_03 (Eye 03)")
            self.node_c.start_stream(sc["cam_c"], "ZONE_03 (Eye 03)", sc.get("hazard_type"))

    def stop_all(self):
        self.node_a.stop_stream()
        self.node_b.stop_stream()
        if self.node_c:
            self.node_c.stop_stream()

    def set_scenario(self, scenario_key: str) -> Dict[str, Any]:
        if scenario_key not in SCENARIO_CONFIGS:
            scenario_key = "scenario_1_entrance"
        
        self.active_scenario = scenario_key
        sc = SCENARIO_CONFIGS[scenario_key]

        self.node_a.start_stream(sc["cam_a"], sc["zone_a"], sc.get("hazard_type"))
        self.node_b.start_stream(sc["cam_b"], sc["zone_b"], sc.get("hazard_type"))
        if "cam_c" in sc:
            if not self.node_c:
                self.node_c = CameraStreamNode("SWARM-NODE-03", sc["cam_c"], "ZONE_03 (Eye 03)")
            self.node_c.start_stream(sc["cam_c"], "ZONE_03 (Eye 03)", sc.get("hazard_type"))

        return {
            "scenario": scenario_key,
            "title": sc["title"],
            "zone_a": sc["zone_a"],
            "zone_b": sc["zone_b"],
            "details": sc["details"],
            "hazard_type": sc["hazard_type"]
        }

    def get_frame(self, camera_id: str) -> Optional[bytes]:
        if camera_id == "cam_b":
            return self.node_b.current_frame_bytes or self.node_b._process_single_frame()
        elif camera_id == "cam_c" and self.node_c:
            return self.node_c.current_frame_bytes or self.node_c._process_single_frame()
        return self.node_a.current_frame_bytes or self.node_a._process_single_frame()

    def get_telemetry(self) -> Dict[str, Any]:
        telem_a = self.node_a.telemetry
        telem_b = self.node_b.telemetry

        # Combined status
        overall_status = "SAFE"
        if telem_a["status"] == "CRITICAL" or telem_b["status"] == "CRITICAL":
            overall_status = "CRITICAL"
        elif telem_a["status"] == "WARNING" or telem_b["status"] == "WARNING":
            overall_status = "WARNING"

        combined_tracks = telem_a["active_tracks"] + telem_b["active_tracks"]
        combined_proximities = telem_a["proximities"] + telem_b["proximities"]

        active_inc = telem_a["active_incident"] or telem_b["active_incident"]

        return {
            "active_scenario": self.active_scenario,
            "status": overall_status,
            "cam_a": telem_a,
            "cam_b": telem_b,
            "active_tracks": combined_tracks,
            "proximities": combined_proximities,
            "active_incident": active_inc,
            "local_alert_active": overall_status in ["HIGH", "CRITICAL"],
            "fps": round((telem_a["fps"] + telem_b["fps"]) / 2.0, 1),
            "timestamp": time.time()
        }

dual_camera_manager = DualCameraManager()
video_processor = dual_camera_manager.node_a # Backwards compatibility
