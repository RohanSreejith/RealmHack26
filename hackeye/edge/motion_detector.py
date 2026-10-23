"""
Lightweight Motion & Activity Detection Layer
Answers the core question: 'Is there enough activity here that we should spend expensive AI compute on this camera?'
Avoids running expensive YOLO inference on every frame by maintaining cameras in low-compute monitoring mode
until meaningful motion or spatial changes are detected.
"""
import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional

class ActivityDetectionResult:
    def __init__(self, has_activity: bool, activity_score: float, compute_mode: str, motion_bbox: Optional[Tuple[int, int, int, int]] = None):
        self.has_activity = has_activity
        self.activity_score = round(activity_score, 3)  # 0.0 to 1.0 (percentage of active pixels)
        self.compute_mode = compute_mode                 # "LOW_COMPUTE" or "VISION_ANALYSIS"
        self.motion_bbox = motion_bbox                   # (x, y, w, h) of primary activity region

    def to_dict(self) -> Dict[str, Any]:
        return {
            "has_activity": self.has_activity,
            "activity_score": self.activity_score,
            "compute_mode": self.compute_mode,
            "motion_bbox": list(self.motion_bbox) if self.motion_bbox else None
        }

class LightweightMotionDetector:
    """Ultra-fast, CPU-efficient activity detector using frame differencing and MOG background modeling."""
    def __init__(self, sensitivity_threshold_pct: float = 0.25, min_contour_area: int = 150):
        self.sensitivity_threshold_pct = sensitivity_threshold_pct
        self.min_contour_area = min_contour_area
        self.prev_gray: Optional[np.ndarray] = None
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(history=120, varThreshold=25, detectShadows=False)
        self.cooldown_frames = 15  # Keep in VISION_ANALYSIS for at least 15 frames after motion stops
        self.frames_since_last_activity = self.cooldown_frames  # Start in LOW_COMPUTE mode until motion detected

    def process_frame(self, frame: np.ndarray) -> ActivityDetectionResult:
        h, w = frame.shape[:2]
        total_pixels = float(w * h)

        # 1. Downscale to small thumbnail (160x90) for lightning-fast (<1ms) activity calculation
        thumb_w = 160
        thumb_h = int(h * (160.0 / w))
        small = cv2.resize(frame, (thumb_w, thumb_h), interpolation=cv2.INTER_NEAREST)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        # 2. Frame Differencing & MOG Mask
        fg_mask = self.bg_subtractor.apply(gray, learningRate=0.01)
        _, thresh = cv2.threshold(fg_mask, 180, 255, cv2.THRESH_BINARY)
        
        # Morphological opening to clean noise
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

        active_pixels = cv2.countNonZero(thresh)
        activity_pct = (active_pixels / float(thumb_w * thumb_h)) * 100.0

        is_first_frame = (self.prev_gray is None)
        has_motion = (activity_pct >= self.sensitivity_threshold_pct) and not is_first_frame

        motion_bbox = None
        if has_motion:
            self.frames_since_last_activity = 0
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                # Find bounding box of largest motion region and upscale back to original frame size
                largest_c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(largest_c) >= 15:
                    bx, by, bw, bh = cv2.boundingRect(largest_c)
                    scale_x = w / float(thumb_w)
                    scale_y = h / float(thumb_h)
                    motion_bbox = (int(bx * scale_x), int(by * scale_y), int(bw * scale_x), int(bh * scale_y))
        else:
            self.frames_since_last_activity += 1

        # Promote to VISION_ANALYSIS if active, or within cooldown window
        if has_motion or self.frames_since_last_activity < self.cooldown_frames:
            compute_mode = "VISION_ANALYSIS"
            active_flag = True
        else:
            compute_mode = "LOW_COMPUTE"
            active_flag = False

        self.prev_gray = gray
        return ActivityDetectionResult(
            has_activity=active_flag,
            activity_score=min(activity_pct / 5.0, 1.0),
            compute_mode=compute_mode,
            motion_bbox=motion_bbox
        )

    def reset(self):
        self.prev_gray = None
        self.frames_since_last_activity = 0
