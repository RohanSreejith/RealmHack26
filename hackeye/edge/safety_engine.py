"""
Deterministic Safety Engine
Independent, authoritative local safety decision evaluator.
Never relies on LLMs for immediate emergency action.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from hackeye.backend.config import settings
from hackeye.edge.ttc import ProximityAnalysis

class SafetyIncident:
    def __init__(
        self,
        incident_id: str,
        worker_id: str,
        machine_id: str,
        machine_type: str,
        distance_m: float,
        ttc_seconds: Optional[float],
        risk_level: str,
        zone: str,
        timestamp: str,
        confidence: float,
        is_converging: bool,
        closing_velocity_m_s: float
    ):
        self.incident_id = incident_id
        self.worker_id = worker_id
        self.machine_id = machine_id
        self.machine_type = machine_type
        self.distance_m = distance_m
        self.ttc_seconds = ttc_seconds
        self.risk_level = risk_level
        self.zone = zone
        self.timestamp = timestamp
        self.confidence = confidence
        self.is_converging = is_converging
        self.closing_velocity_m_s = closing_velocity_m_s

    def to_dict(self) -> Dict[str, Any]:
        return {
            "incident_id": self.incident_id,
            "worker_id": self.worker_id,
            "machine_id": self.machine_id,
            "machine_type": self.machine_type,
            "distance_m": self.distance_m,
            "ttc_seconds": self.ttc_seconds,
            "risk_level": self.risk_level,
            "zone": self.zone,
            "timestamp": self.timestamp,
            "confidence": self.confidence,
            "is_converging": self.is_converging,
            "closing_velocity_m_s": self.closing_velocity_m_s,
            "local_alert_triggered": self.risk_level in ["HIGH", "CRITICAL"]
        }

class DeterministicSafetyEngine:
    def __init__(self, zone: str = "ZONE_01"):
        self.zone = zone
        # Track interaction persistence across frames: key = (worker_id, machine_id) -> count
        self.interaction_persistence: Dict[str, int] = {}
        self.incident_counter = 1000

    def evaluate(self, proximity_list: List[ProximityAnalysis]) -> List[SafetyIncident]:
        active_incidents = []
        current_pairs = set()

        for prox in proximity_list:
            pair_key = f"{prox.worker_id}:{prox.machine_id}"
            current_pairs.add(pair_key)
            self.interaction_persistence[pair_key] = self.interaction_persistence.get(pair_key, 0) + 1
            persist_count = self.interaction_persistence[pair_key]

            dist = prox.estimated_distance_m
            ttc = prox.ttc_seconds
            is_conv = prox.is_converging

            # Authoritative Deterministic Rules Matrix:
            # 1. Critical TTC or Physical Breach (<3m)
            if (ttc is not None and ttc < settings.CRITICAL_TTC_SECONDS) or (dist <= settings.CRITICAL_DISTANCE_METERS):
                risk = "CRITICAL"
            # 2. High TTC or Proximity Breach (3-4.5m)
            elif (ttc is not None and ttc < settings.WARNING_TTC_SECONDS) or (dist <= 4.5):
                risk = "HIGH"
            # 3. Warning Zone Proximity (4.5-6.0m)
            elif dist <= settings.WARNING_DISTANCE_METERS:
                risk = "WARNING"
            else:
                risk = "SAFE"

            # Rule: If objects are moving apart, reduce risk level
            if not is_conv and prox.closing_velocity_m_s < -0.1:
                if risk == "CRITICAL" and dist > settings.CRITICAL_DISTANCE_METERS:
                    risk = "HIGH"
                elif risk == "HIGH":
                    risk = "WARNING"
                elif risk == "WARNING":
                    risk = "SAFE"

            # Only emit incident events if risk is elevated and sustained (or immediate if critical)
            if risk in ["WARNING", "HIGH", "CRITICAL"]:
                if risk == "CRITICAL" or persist_count >= settings.PERSISTENCE_FRAMES_THRESHOLD:
                    self.incident_counter += 1
                    inc = SafetyIncident(
                        incident_id=f"INC-{self.incident_counter}",
                        worker_id=prox.worker_id,
                        machine_id=prox.machine_id,
                        machine_type=prox.machine_type,
                        distance_m=dist,
                        ttc_seconds=ttc,
                        risk_level=risk,
                        zone=self.zone,
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        confidence=0.94 if risk == "CRITICAL" else 0.88,
                        is_converging=is_conv,
                        closing_velocity_m_s=prox.closing_velocity_m_s
                    )
                    active_incidents.append(inc)

        # Decay or remove interaction counters for pairs no longer visible
        expired_pairs = [k for k in self.interaction_persistence if k not in current_pairs]
        for k in expired_pairs:
            del self.interaction_persistence[k]

        return active_incidents
