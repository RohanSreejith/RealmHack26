"""
Multi-Object Tracker with Persistent Industrial IDs and Velocity Estimation.
Supports worker (W-###) and machinery (F-###, T-###, E-###) prefix formatting.
"""
import math
import numpy as np
from typing import List, Dict, Any, Optional
from hackeye.edge.detector import DetectionResult

class TrackedObject:
    def __init__(self, track_id: str, industrial_type: str, bbox: List[float], footpoint: List[float], timestamp: float):
        self.track_id = track_id
        self.industrial_type = industrial_type
        self.bbox = bbox
        self.footpoint = footpoint
        self.last_timestamp = timestamp
        self.history = [footpoint]  # Recent footpoints for trajectory visualization
        self.max_history = 20
        self.missed_frames = 0
        self.velocity_m_s = 0.0
        self.vx_m_s = 0.0
        self.vy_m_s = 0.0
        self.heading_deg = 0.0
        self.confidence = 0.9

    def update(self, bbox: List[float], footpoint: List[float], timestamp: float, pixels_per_meter: float = 35.0, confidence: float = 0.9):
        dt = timestamp - self.last_timestamp
        if dt > 0.001:
            dx_px = footpoint[0] - self.footpoint[0]
            dy_px = footpoint[1] - self.footpoint[1]
            dist_px = math.sqrt(dx_px**2 + dy_px**2)
            
            # Convert pixel distance to meters
            dist_m = dist_px / max(pixels_per_meter, 1.0)
            instant_speed = dist_m / dt
            
            # Smooth velocity with exponential moving average
            self.velocity_m_s = round(0.7 * self.velocity_m_s + 0.3 * instant_speed, 2)
            self.vx_m_s = round(0.7 * self.vx_m_s + 0.3 * ((dx_px / pixels_per_meter) / dt), 2)
            self.vy_m_s = round(0.7 * self.vy_m_s + 0.3 * ((dy_px / pixels_per_meter) / dt), 2)
            
            # Heading in degrees (0 = right, 90 = down, etc.)
            if dist_px > 2.0:
                self.heading_deg = round(math.degrees(math.atan2(dy_px, dx_px)), 1)

        self.bbox = bbox
        self.footpoint = footpoint
        self.last_timestamp = timestamp
        self.missed_frames = 0
        self.confidence = confidence
        
        self.history.append(footpoint)
        if len(self.history) > self.max_history:
            self.history.pop(0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "track_id": self.track_id,
            "industrial_type": self.industrial_type,
            "bbox": [round(x, 1) for x in self.bbox],
            "footpoint": [round(x, 1) for x in self.footpoint],
            "velocity_m_s": self.velocity_m_s,
            "vx_m_s": self.vx_m_s,
            "vy_m_s": self.vy_m_s,
            "heading_deg": self.heading_deg,
            "confidence": round(self.confidence, 2),
            "history": [[round(x, 1) for x in pt] for pt in self.history[-10:]]
        }

class ObjectTracker:
    def __init__(self, max_missed: int = 15, match_distance_thresh: float = 90.0, pixels_per_meter: float = 35.0):
        self.tracks: Dict[str, TrackedObject] = {}
        self.next_worker_idx = 1
        self.next_forklift_idx = 4
        self.next_truck_idx = 1
        self.next_machinery_idx = 1
        self.max_missed = max_missed
        self.match_distance_thresh = match_distance_thresh
        self.pixels_per_meter = pixels_per_meter

    def _generate_id(self, industrial_type: str) -> str:
        if industrial_type == "worker":
            tid = f"W-{self.next_worker_idx:03d}"
            self.next_worker_idx += 1
            return tid
        elif industrial_type == "forklift":
            tid = f"F-{self.next_forklift_idx:03d}"
            self.next_forklift_idx += 1
            return tid
        elif industrial_type == "truck":
            tid = f"T-{self.next_truck_idx:03d}"
            self.next_truck_idx += 1
            return tid
        else:
            tid = f"M-{self.next_machinery_idx:03d}"
            self.next_machinery_idx += 1
            return tid

    def update(self, detections: List[DetectionResult], timestamp: float) -> List[TrackedObject]:
        # Pair detections with active tracks using Euclidean distance between footpoints
        active_ids = list(self.tracks.keys())
        unmatched_detections = []
        matched_tracks = set()

        for det in detections:
            best_id = None
            min_dist = float("inf")
            det_foot = [det.foot_x, det.foot_y]

            for tid in active_ids:
                if tid in matched_tracks:
                    continue
                track = self.tracks[tid]
                # Prefer matching same industrial category
                if track.industrial_type != det.industrial_type:
                    continue

                dist = math.dist(track.footpoint, det_foot)
                if dist < min_dist and dist < self.match_distance_thresh:
                    min_dist = dist
                    best_id = tid

            if best_id is not None:
                matched_tracks.add(best_id)
                self.tracks[best_id].update(det.bbox, det_foot, timestamp, self.pixels_per_meter, det.confidence)
            else:
                unmatched_detections.append(det)

        # Increment missed frames for unmatched existing tracks
        for tid in active_ids:
            if tid not in matched_tracks:
                self.tracks[tid].missed_frames += 1

        # Delete expired tracks
        dead_ids = [tid for tid, trk in self.tracks.items() if trk.missed_frames > self.max_missed]
        for tid in dead_ids:
            del self.tracks[tid]

        # Initialize new tracks for unmatched detections
        for det in unmatched_detections:
            tid = self._generate_id(det.industrial_type)
            trk = TrackedObject(tid, det.industrial_type, det.bbox, [det.foot_x, det.foot_y], timestamp)
            trk.confidence = det.confidence
            self.tracks[tid] = trk

        return list(self.tracks.values())
