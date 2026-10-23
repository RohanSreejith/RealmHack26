"""
Edge Object Detector Module
Uses YOLO with industrial class aliases and configurable confidence.
"""
import cv2
import numpy as np
from typing import List, Dict, Any, Optional
from ultralytics import YOLO

# Standard industrial mapping from COCO classes to industrial terminology
DEFAULT_CLASS_MAPPING = {
    "person": "worker",
    "truck": "truck",
    "car": "forklift",       # Forklifts in indoor factory datasets often map closest to car/truck in base COCO
    "bus": "excavator",      # Heavy machinery mapping
    "train": "heavy_machinery"
}

class DetectionResult:
    def __init__(self, class_name: str, industrial_type: str, bbox: List[float], confidence: float):
        self.class_name = class_name
        self.industrial_type = industrial_type
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.confidence = confidence
        
        # Calculate center point and base footpoint for ground-plane projection
        self.center_x = (bbox[0] + bbox[2]) / 2.0
        self.center_y = (bbox[1] + bbox[3]) / 2.0
        self.foot_x = self.center_x
        self.foot_y = bbox[3] # bottom edge of bounding box representing contact with ground

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_name": self.class_name,
            "industrial_type": self.industrial_type,
            "bbox": [round(v, 1) for v in self.bbox],
            "confidence": round(self.confidence, 2),
            "footpoint": [round(self.foot_x, 1), round(self.foot_y, 1)]
        }

class ObjectDetector:
    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.35):
        self.model = YOLO(model_path)
        self.conf_thresh = conf_thresh
        self.class_mapping = DEFAULT_CLASS_MAPPING

    def detect(self, frame: np.ndarray) -> List[DetectionResult]:
        results = self.model(frame, conf=self.conf_thresh, verbose=False)
        detections = []
        
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                cls_name = self.model.names[cls_id]
                conf = float(box.conf[0])
                
                # Check if this class is relevant to industrial safety monitoring
                if cls_name in self.class_mapping:
                    industrial_type = self.class_mapping[cls_name]
                    bbox = [float(x) for x in box.xyxy[0]]
                    detections.append(DetectionResult(
                        class_name=cls_name,
                        industrial_type=industrial_type,
                        bbox=bbox,
                        confidence=conf
                    ))
                    
        return detections
