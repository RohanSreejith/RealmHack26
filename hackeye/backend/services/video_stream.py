"""
Video Processing & Telemetry Stream Engine
Processes video feeds, runs YOLO detection, tracking, TTC calculation, and deterministic safety triggers.
"""
import os
import cv2
import time
import math
import asyncio
import numpy as np
from typing import Dict, Any, List, Optional
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

class VideoStreamProcessor:
    def __init__(self, video_path: str = "videos/forklift_approaching_entrance.mp4", zone: str = "ZONE_01"):
        self.video_path = video_path
        self.zone = zone
        self.detector = ObjectDetector(model_path="yolov8n.pt", conf_thresh=0.25)
        self.tracker = ObjectTracker(pixels_per_meter=settings.PIXELS_PER_METER_DEFAULT)
        self.ttc_engine = TTCEngine(pixels_per_meter=settings.PIXELS_PER_METER_DEFAULT)
        self.safety_engine = DeterministicSafetyEngine(zone=zone)
        
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.current_frame_bytes: Optional[bytes] = None
        self.current_telemetry: Dict[str, Any] = {
            "zone": self.zone,
            "status": "SAFE",
            "active_tracks": [],
            "proximities": [],
            "active_incident": None,
            "fps": 0.0,
            "timestamp": time.time()
        }
        self.last_incident_time = 0.0

    def start_stream(self, video_path: Optional[str] = None):
        if video_path:
            self.video_path = video_path
        if self.cap:
            self.cap.release()
        
        self.cap = cv2.VideoCapture(self.video_path)
        self.is_running = True
        print(f"[VideoStream] Started processing stream: {self.video_path} in {self.zone}")

    def stop_stream(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
            self.cap = None

    def process_next_frame(self) -> Optional[bytes]:
        if not self.cap or not self.cap.isOpened():
            if self.is_running and os.path.exists(self.video_path):
                self.cap = cv2.VideoCapture(self.video_path)
            else:
                return None

        ret, frame = self.cap.read()
        if not ret:
            # Loop the video for continuous demonstration
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = self.cap.read()
            if not ret:
                return None

        start_time = time.time()
        h, w = frame.shape[:2]

        # 1. Run YOLO Object Detection
        detections = self.detector.detect(frame)

        # 2. Update Multi-Object Tracker
        tracks = self.tracker.update(detections, start_time)

        # Separate workers and machinery
        workers = [t for t in tracks if t.industrial_type == "worker"]
        machinery = [t for t in tracks if t.industrial_type in ["forklift", "truck", "excavator", "heavy_machinery"]]

        # 3. Compute Proximity, Closing Velocity, and TTC
        proximities: List[ProximityAnalysis] = []
        for worker in workers:
            for machine in machinery:
                prox = self.ttc_engine.compute_proximity(worker, machine)
                proximities.append(prox)

        # 4. Fast Deterministic Safety Engine
        incidents = self.safety_engine.evaluate(proximities)
        active_incident = incidents[0] if incidents else None

        # 5. Handle Alert & Async Hand-off if Incident confirmed
        if active_incident and (time.time() - self.last_incident_time > 3.0):
            self.last_incident_time = time.time()
            inc_dict = active_incident.to_dict()

            # Immediate Local Edge Persistence
            local_queue.persist_incident(inc_dict)

            # Trigger Async Paths (Swarm, AI Agent, Render Workflow, n8n)
            if active_incident.risk_level in ["HIGH", "CRITICAL"]:
                # Swarm Alert to neighboring zone
                target_zone = "ZONE_02" if self.zone == "ZONE_01" else "ZONE_01"
                swarm_coordinator.broadcast_interzone_event(
                    source_zone=self.zone,
                    destination_zone=target_zone,
                    event_type="HAZARD_ALERT" if active_incident.risk_level == "CRITICAL" else "WORKER_APPROACHING",
                    worker_id=active_incident.worker_id,
                    machine_id=active_incident.machine_id,
                    risk=active_incident.risk_level,
                    eta_seconds=int(active_incident.ttc_seconds) if active_incident.ttc_seconds else 4
                )

                # Asynchronous AI Safety Reasoning
                ai_result = ai_safety_agent.process_incident(inc_dict)
                
                # Cloud Render Workflow Trigger
                wf = render_workflow_orchestrator.trigger_incident_workflow(inc_dict)
                asyncio.create_task(render_workflow_orchestrator.run_pipeline_async(wf.workflow_id, inc_dict, ai_result))

                # n8n Automation Webhook
                n8n_client.dispatch_critical_incident(inc_dict, ai_result)

        # 6. Render HUD Overlays directly onto frame for visual inspection
        self._render_hud_overlay(frame, tracks, proximities, active_incident)

        # 7. Update Telemetry State
        overall_status = "CRITICAL" if any(i.risk_level == "CRITICAL" for i in incidents) else \
                         ("WARNING" if any(i.risk_level in ["WARNING", "HIGH"] for i in incidents) else "SAFE")

        duration = time.time() - start_time
        fps = round(1.0 / max(duration, 0.001), 1)

        self.current_telemetry = {
            "zone": self.zone,
            "status": overall_status,
            "active_tracks": [t.to_dict() for t in tracks],
            "proximities": [p.to_dict() for p in proximities],
            "active_incident": active_incident.to_dict() if active_incident else None,
            "fps": fps,
            "timestamp": time.time(),
            "local_alert_active": overall_status in ["HIGH", "CRITICAL"]
        }

        # Encode frame to JPEG
        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
        self.current_frame_bytes = buffer.tobytes()
        return self.current_frame_bytes

    def _render_hud_overlay(
        self,
        frame: np.ndarray,
        tracks: List[TrackedObject],
        proximities: List[ProximityAnalysis],
        active_incident: Optional[SafetyIncident]
    ):
        """Draws bounding boxes, IDs, trajectory trails, and distance vectors."""
        # Visual color palette: Safe = Emerald Green, Warning = Amber, Critical = Bright Coral Red
        COLOR_SAFE = (0, 220, 100)
        COLOR_WARN = (0, 200, 255)
        COLOR_CRIT = (30, 30, 255)

        # 1. Draw proximity line between interacting worker & machine
        for prox in proximities:
            w_pt = (int(prox.worker_pos[0]), int(prox.worker_pos[1]))
            m_pt = (int(prox.machine_pos[0]), int(prox.machine_pos[1]))
            
            line_color = COLOR_CRIT if (prox.ttc_seconds and prox.ttc_seconds < 2.0) or (prox.estimated_distance_m <= 3.0) else \
                         (COLOR_WARN if prox.estimated_distance_m <= 6.0 else COLOR_SAFE)

            cv2.line(frame, w_pt, m_pt, line_color, 2, cv2.LINE_AA)
            
            # Midpoint distance label
            mid_x = int((w_pt[0] + m_pt[0]) / 2)
            mid_y = int((w_pt[1] + m_pt[1]) / 2) - 10
            ttc_str = f" | TTC: {prox.ttc_seconds:.1f}s" if prox.ttc_seconds else ""
            label = f"Dist: {prox.estimated_distance_m:.1f}m{ttc_str}"
            
            cv2.putText(frame, label, (mid_x - 40, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 3)
            cv2.putText(frame, label, (mid_x - 40, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, line_color, 1)

        # 2. Draw bounding boxes and tracks
        for trk in tracks:
            x1, y1, x2, y2 = [int(v) for v in trk.bbox]
            box_color = COLOR_SAFE
            if active_incident and (trk.track_id in [active_incident.worker_id, active_incident.machine_id]):
                box_color = COLOR_CRIT if active_incident.risk_level == "CRITICAL" else COLOR_WARN

            # BBox
            cv2.rectangle(frame, (x1, y1), (x2, y2), box_color, 2)

            # Header tag
            tag = f"{trk.track_id} ({trk.industrial_type.upper()}) {trk.velocity_m_s:.1f}m/s"
            (tw, th), _ = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
            cv2.rectangle(frame, (x1, y1 - th - 6), (x1 + tw + 6, y1), box_color, -1)
            cv2.putText(frame, tag, (x1 + 3, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 0), 1, cv2.LINE_AA)

            # Draw trajectory path history
            if len(trk.history) > 1:
                pts = np.array([[int(p[0]), int(p[1])] for p in trk.history], np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.polylines(frame, [pts], False, box_color, 1, cv2.LINE_AA)

        # 3. If critical incident, render red emergency border
        if active_incident and active_incident.risk_level == "CRITICAL":
            cv2.rectangle(frame, (0, 0), (frame.shape[1]-1, frame.shape[0]-1), COLOR_CRIT, 8)
            cv2.putText(frame, "CRITICAL SAFETY ZONE BREACH", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
            cv2.putText(frame, "CRITICAL SAFETY ZONE BREACH", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

video_processor = VideoStreamProcessor()
