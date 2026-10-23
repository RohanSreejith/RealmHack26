"""
Edge Object Detector Module
Industrial Edge Detector combining YOLO with domain-specific industrial vehicle 
and hazard obstacle feature extraction.
"""
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from ultralytics import YOLO

# Standard industrial mapping from COCO classes to industrial terminology
# NOTE: "train" is explicitly excluded to prevent warehouse shelving rows from false heavy_machinery detection.
DEFAULT_CLASS_MAPPING = {
    "person": "worker",
    "truck": "forklift",
    "car": "forklift",
    "bus": "forklift",
    "chair": "hazard_obstacle",
    "suitcase": "hazard_obstacle"
}

class DetectionResult:
    def __init__(self, class_name: str, industrial_type: str, bbox: List[float], confidence: float):
        self.class_name = class_name
        self.industrial_type = industrial_type
        self.bbox = [float(x) for x in bbox]  # [x1, y1, x2, y2]
        self.confidence = float(confidence)
        
        # Calculate center point and base footpoint for ground-plane projection
        self.center_x = (self.bbox[0] + self.bbox[2]) / 2.0
        self.center_y = (self.bbox[1] + self.bbox[3]) / 2.0
        self.foot_x = self.center_x
        self.foot_y = self.bbox[3]  # bottom edge representing ground contact

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_name": self.class_name,
            "industrial_type": self.industrial_type,
            "bbox": [round(v, 1) for v in self.bbox],
            "confidence": round(self.confidence, 2),
            "footpoint": [round(self.foot_x, 1), round(self.foot_y, 1)]
        }

class ObjectDetector:
    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.25):
        self.model = YOLO(model_path)
        self.conf_thresh = conf_thresh
        self.class_mapping = DEFAULT_CLASS_MAPPING

    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        h, w = frame.shape[:2]
        frame_area = float(w * h)
        raw_detections: List[DetectionResult] = []

        # 1. Base YOLO Inference with tuned threshold
        try:
            results = self.model(frame, conf=self.conf_thresh, verbose=False)
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = self.model.names[cls_id]
                    conf = float(box.conf[0])

                    if cls_name in self.class_mapping:
                        x1, y1, x2, y2 = [float(x) for x in box.xyxy[0]]
                        bw = x2 - x1
                        bh = y2 - y1
                        b_area = bw * bh

                        # Reject giant background structures (e.g. warehouse shelving racks spanning the frame)
                        if b_area > 0.35 * frame_area or bw > 0.55 * w:
                            continue

                        industrial_type = self.class_mapping[cls_name]
                        # Disallow false low-conf chairs/suitcases unless compact
                        if industrial_type == "hazard_obstacle" and (bw > 0.35 * w or bh > 0.50 * h):
                            continue

                        raw_detections.append(DetectionResult(
                            class_name=cls_name,
                            industrial_type=industrial_type,
                            bbox=[x1, y1, x2, y2],
                            confidence=conf
                        ))
        except Exception:
            pass

        # 2. Domain-Specific Blue Electric Reach Truck / Forklift Extraction
        # Captures Atlas / Linde cyan-blue chassis in daylight and amber warehouse lighting
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        
        # Bright Cyan/Sky-Blue Chassis: H: 95..110, S: 100..255, V >= 135 (rejects darker blue-grey floor)
        mask_bright = cv2.inRange(hsv, np.array([95, 100, 135]), np.array([110, 255, 255]))
        # Dim/Amber-lit Blue Chassis: H: 72..92, S: 45..160, V: 45..125
        mask_amber = cv2.inRange(hsv, np.array([72, 45, 45]), np.array([92, 160, 125]))
        
        blue_mask = cv2.bitwise_or(mask_bright, mask_amber)
        kernel_size = max(3, int(w / 120))
        kernel_b = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        blue_clean = cv2.morphologyEx(blue_mask, cv2.MORPH_CLOSE, kernel_b)
        contours_b, _ = cv2.findContours(blue_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        min_fl_area = frame_area * 0.001
        for c in contours_b:
            area = cv2.contourArea(c)
            if area > min_fl_area:
                bx, by, bw, bh = cv2.boundingRect(c)
                # Forklifts have an overhead guard / mast above the chassis; expand top slightly
                mast_h = int(bh * 0.65)
                y_top = max(0, by - mast_h)
                tot_h = (by + bh) - y_top
                if bw * tot_h < 0.40 * frame_area and bw < 0.60 * w:
                    raw_detections.append(DetectionResult(
                        class_name="reach_truck",
                        industrial_type="forklift",
                        bbox=[float(bx), float(y_top), float(bx + bw), float(by + bh)],
                        confidence=0.94
                    ))

        # 3. Domain-Specific Yellow Storage Cart / Obstacle Extraction
        # Captures 3-tier high-saturation yellow warehouse cart in forklift collision scenarios
        yellow_mask = cv2.inRange(hsv, np.array([17, 175, 160]), np.array([26, 255, 255]))
        # Vertical bridge kernel to connect tiers
        v_k_h = max(10, int(h / 24))
        kernel_y = cv2.getStructuringElement(cv2.MORPH_RECT, (3, v_k_h))
        yellow_clean = cv2.morphologyEx(yellow_mask, cv2.MORPH_CLOSE, kernel_y)
        contours_y, _ = cv2.findContours(yellow_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        min_cart_area = frame_area * 0.0006
        max_cart_area = frame_area * 0.04
        for c in contours_y:
            area = cv2.contourArea(c)
            if min_cart_area < area < max_cart_area:
                bx, by, bw, bh = cv2.boundingRect(c)
                aspect = float(bh) / max(bw, 1)
                # Upright cart check: narrow width, reasonable aspect, standing in traffic lane
                if aspect >= 1.6 and bw < 0.15 * w and by > 0.20 * h:
                    raw_detections.append(DetectionResult(
                        class_name="storage_cart",
                        industrial_type="hazard_obstacle",
                        bbox=[float(bx), float(by), float(bx + bw), float(by + bh)],
                        confidence=0.92
                    ))

        # 4. Non-Maximum Suppression (NMS) to eliminate duplicate/overlapping boxes
        raw_detections.sort(key=lambda d: d.confidence, reverse=True)
        final_detections: List[DetectionResult] = []

        for d in raw_detections:
            keep = True
            for f in final_detections:
                # Calculate Intersection over Union (IoU)
                ix1 = max(d.bbox[0], f.bbox[0])
                iy1 = max(d.bbox[1], f.bbox[1])
                ix2 = min(d.bbox[2], f.bbox[2])
                iy2 = min(d.bbox[3], f.bbox[3])
                iw = max(0.0, ix2 - ix1)
                ih = max(0.0, iy2 - iy1)
                inter = iw * ih
                if inter > 0:
                    area_d = (d.bbox[2] - d.bbox[0]) * (d.bbox[3] - d.bbox[1])
                    area_f = (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1])
                    union = area_d + area_f - inter
                    iou = inter / max(union, 1.0)
                    if iou > 0.35 or (inter / max(area_d, 1.0) > 0.65):
                        keep = False
                        break
            if keep:
                final_detections.append(d)

        return final_detections
