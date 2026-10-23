"""
Configurable Industrial Safety Constraint Engine
Supports dynamic, facility-specific safety rules:
- Rule 1: Machine Proximity (Forklift-Worker distance & closing trajectory)
- Rule 2: Restricted Zone Entry
- Rule 3: Storage Stack Height Compliance
- Rule 4: Emergency Aisle Obstruction Clearance
- Rule 5: PPE Compliance (Hard Hat / High-Vis)
- Rule 6: Maximum Zone Occupancy
"""
import os
import json
import math
from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel, Field

CONFIG_FILE_PATH = os.path.join(os.path.dirname(__file__), "safety_rules_config.json")

class FacilitySafetyRulesConfig(BaseModel):
    # Rule 1: Machine Proximity
    min_forklift_worker_distance_m: float = Field(default=3.0, description="Minimum safe distance between worker and moving machinery in meters")
    warning_distance_m: float = Field(default=5.0, description="Warning distance threshold in meters")
    critical_ttc_seconds: float = Field(default=2.0, description="Time-To-Collision threshold for critical emergency stop in seconds")
    warning_ttc_seconds: float = Field(default=4.0, description="Time-To-Collision threshold for warning in seconds")
    
    # Rule 2: Restricted Zone
    restricted_zone_enabled: bool = Field(default=True, description="Enforce restricted zone entry prohibitions")
    restricted_zone_name: str = Field(default="ZONE_CRANE_BAY", description="Name of the restricted access zone")
    restricted_zone_polygon_norm: List[List[float]] = Field(
        default=[[0.0, 0.45], [0.35, 0.45], [0.35, 1.0], [0.0, 1.0]],
        description="Normalized [x, y] coordinates defining the restricted zone footprint"
    )

    # Rule 3: Storage Stack Height
    max_stack_height_m: float = Field(default=2.2, description="Maximum permitted vertical cargo/pallet stack height in meters")
    
    # Rule 4: Emergency Aisle Clearance
    min_aisle_clearance_m: float = Field(default=1.5, description="Minimum clear unobstructed width required for emergency transit aisles")
    aisle_zone_name: str = Field(default="MAIN_TRANSIT_AISLE", description="Zone identifier for main egress aisle")

    # Rule 5: PPE Compliance
    ppe_helmet_required: bool = Field(default=True, description="OSHA 1926.100 hard hat requirement enforced")
    ppe_vest_required: bool = Field(default=False, description="High-visibility safety vest required")

    # Rule 6: Zone Occupancy
    max_zone_occupancy: int = Field(default=6, description="Maximum number of simultaneous workers permitted in zone")

class SafetyConstraintEngine:
    def __init__(self):
        self.config = self._load_config()

    def _load_config(self) -> FacilitySafetyRulesConfig:
        if os.path.exists(CONFIG_FILE_PATH):
            try:
                with open(CONFIG_FILE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return FacilitySafetyRulesConfig(**data)
            except Exception:
                pass
        return FacilitySafetyRulesConfig()

    def save_config(self, new_config: FacilitySafetyRulesConfig):
        self.config = new_config
        try:
            with open(CONFIG_FILE_PATH, "w", encoding="utf-8") as f:
                json.dump(self.config.model_dump(), f, indent=2)
        except Exception:
            pass

    def update_from_dict(self, data: Dict[str, Any]) -> FacilitySafetyRulesConfig:
        current_dict = self.config.model_dump()
        current_dict.update(data)
        self.config = FacilitySafetyRulesConfig(**current_dict)
        self.save_config(self.config)
        return self.config

    # --- Rule Evaluation Methods ---

    def evaluate_machine_proximity(self, distance_m: float, ttc_seconds: Optional[float], is_converging: bool, machine_speed: float) -> Tuple[str, List[str]]:
        """Rule 1: Evaluates worker-machinery proximity and dynamic trajectory convergence."""
        violations = []
        risk = "SAFE"

        # Moving towards each other below critical threshold
        if (ttc_seconds is not None and ttc_seconds < self.config.critical_ttc_seconds) or (distance_m <= self.config.min_forklift_worker_distance_m):
            risk = "CRITICAL"
            violations.append(f"RULE_1_PROXIMITY_BREACH: Distance {distance_m:.1f}m <= threshold {self.config.min_forklift_worker_distance_m}m")
            if ttc_seconds is not None and ttc_seconds < self.config.critical_ttc_seconds:
                violations.append(f"RULE_1_TTC_CRITICAL: Predicted impact within {ttc_seconds:.1f}s")
        elif (ttc_seconds is not None and ttc_seconds < self.config.warning_ttc_seconds) or (distance_m <= self.config.warning_distance_m):
            risk = "HIGH" if is_converging else "WARNING"
            violations.append(f"RULE_1_PROXIMITY_WARNING: Machinery approaching within {distance_m:.1f}m")

        return risk, violations

    def evaluate_restricted_zone(self, footpoint: Tuple[float, float], frame_w: int, frame_h: int) -> Tuple[bool, List[str]]:
        """Rule 2: Evaluates whether a worker footpoint is inside the configured restricted zone polygon."""
        if not self.config.restricted_zone_enabled:
            return False, []

        norm_x = footpoint[0] / max(frame_w, 1)
        norm_y = footpoint[1] / max(frame_h, 1)

        # Point in polygon check
        poly = self.config.restricted_zone_polygon_norm
        inside = False
        n = len(poly)
        p1x, p1y = poly[0]
        for i in range(n + 1):
            p2x, p2y = poly[i % n]
            if norm_y > min(p1y, p2y):
                if norm_y <= max(p1y, p2y):
                    if norm_x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (norm_y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or norm_x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y

        if inside:
            return True, [f"RULE_2_RESTRICTED_ZONE_BREACH: Unauthorized entry into {self.config.restricted_zone_name}"]
        return False, []

    def evaluate_stack_height(self, detected_height_m: float) -> Tuple[bool, List[str]]:
        """Rule 3: Evaluates vertical storage stacking compliance."""
        if detected_height_m > self.config.max_stack_height_m:
            return True, [f"RULE_3_STACK_HEIGHT_VIOLATION: Stack height {detected_height_m:.1f}m exceeds max permitted {self.config.max_stack_height_m}m"]
        return False, []

    def evaluate_aisle_obstruction(self, aisle_clearance_m: float) -> Tuple[bool, List[str]]:
        """Rule 4: Evaluates emergency aisle transit clearance."""
        if aisle_clearance_m < self.config.min_aisle_clearance_m:
            return True, [f"RULE_4_AISLE_OBSTRUCTION: Transit clearance {aisle_clearance_m:.1f}m < min {self.config.min_aisle_clearance_m}m required"]
        return False, []

    def evaluate_ppe(self, has_helmet: bool, has_vest: bool = True) -> Tuple[bool, List[str]]:
        """Rule 5: Evaluates OSHA 1926.100 PPE mandatory compliance."""
        violations = []
        if self.config.ppe_helmet_required and not has_helmet:
            violations.append("RULE_5_PPE_NO_HELMET: Worker operating without mandatory OSHA 1926.100 hard hat")
        if self.config.ppe_vest_required and not has_vest:
            violations.append("RULE_5_PPE_NO_VEST: Worker without required high-visibility reflective vest")
        return len(violations) > 0, violations

    def evaluate_occupancy(self, worker_count: int) -> Tuple[bool, List[str]]:
        """Rule 6: Evaluates zone capacity constraints."""
        if worker_count > self.config.max_zone_occupancy:
            return True, [f"RULE_6_OVER_OCCUPANCY: {worker_count} workers in zone exceeds max limit of {self.config.max_zone_occupancy}"]
        return False, []

safety_constraint_engine = SafetyConstraintEngine()
