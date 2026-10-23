"""
Physical Safety Node Hardware & Swarm Response Layer
Models the lightweight ESP32 / Raspberry Pi physical response nodes.
These nodes DO NOT run heavy YOLO inference; they act as the physical response layer:
- RGB Beacon / LED Strobe (GREEN, YELLOW_PULSE, RED_STROBE)
- Acoustic Speaker / Siren (SILENT, WARN_CHIME, CRITICAL_SIREN)
- OLED / Graphic LCD Display (Real-time hazard warning and evacuation commands)
- Operator Physical Acknowledge Button
"""
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class PhysicalSafetyNode:
    def __init__(self, node_id: str, zone_id: str, hardware_type: str = "ESP32-S3 Physical Beacon"):
        self.node_id = node_id
        self.zone_id = zone_id
        self.hardware_type = hardware_type
        self.is_online = True
        
        # Physical Hardware Actuator States
        self.led_state = "GREEN"               # GREEN, YELLOW_PULSE, RED_STROBE
        self.speaker_state = "SILENT"          # SILENT, WARN_CHIME, CRITICAL_SIREN
        self.oled_display_lines = [
            "ZONE NORMAL",
            "ALL CLEAR",
            "SAFETY ACTIVE"
        ]
        self.active_hazard: Optional[str] = None
        self.active_severity: str = "SAFE"     # SAFE, WARNING, CRITICAL
        self.is_acknowledged: bool = False
        self.last_alert_time: float = 0.0
        self.alert_history: List[Dict[str, Any]] = []

    def dispatch_alert(self, hazard: str, severity: str, action: str, display_lines: Optional[List[str]] = None):
        """Immediate Fast-Path Trigger: Executes in <5ms without waiting for cloud or LLM reasoning."""
        self.active_hazard = hazard
        self.active_severity = severity
        self.is_acknowledged = False
        self.last_alert_time = time.time()

        if severity == "CRITICAL":
            self.led_state = "RED_STROBE"
            self.speaker_state = "CRITICAL_SIREN"
            self.oled_display_lines = display_lines or [
                "CRITICAL HAZARD",
                f"{hazard.replace('_', ' ')[:18]}",
                action[:20] if action else "MOVE TO SAFE AREA"
            ]
        elif severity in ["WARNING", "HIGH"]:
            self.led_state = "YELLOW_PULSE"
            self.speaker_state = "WARN_CHIME"
            self.oled_display_lines = display_lines or [
                "WARNING NOTICE",
                f"{hazard.replace('_', ' ')[:18]}",
                action[:20] if action else "PROCEED WITH CAUTION"
            ]
        else:
            self.reset_to_safe()
            return

        self.alert_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "hazard": hazard,
            "severity": severity,
            "action": action
        })
        if len(self.alert_history) > 10:
            self.alert_history.pop(0)

    def acknowledge(self) -> Dict[str, Any]:
        """Operator or Supervisor physical button press to acknowledge & silence strobe/siren."""
        self.is_acknowledged = True
        if self.speaker_state == "CRITICAL_SIREN":
            self.speaker_state = "WARN_CHIME"
        elif self.speaker_state == "WARN_CHIME":
            self.speaker_state = "SILENT"
            
        self.oled_display_lines[2] = "ALERT ACKNOWLEDGED"
        return self.to_dict()

    def reset_to_safe(self):
        self.led_state = "GREEN"
        self.speaker_state = "SILENT"
        self.active_hazard = None
        self.active_severity = "SAFE"
        self.is_acknowledged = True
        self.oled_display_lines = [
            "ZONE NORMAL",
            "ALL CLEAR",
            "SAFETY ACTIVE"
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "node_id": self.node_id,
            "zone_id": self.zone_id,
            "hardware_type": self.hardware_type,
            "is_online": self.is_online,
            "led_state": self.led_state,
            "speaker_state": self.speaker_state,
            "oled_display_lines": self.oled_display_lines,
            "active_hazard": self.active_hazard,
            "active_severity": self.active_severity,
            "is_acknowledged": self.is_acknowledged,
            "last_alert_time": self.last_alert_time,
            "alert_count": len(self.alert_history)
        }

class PhysicalSafetyNodeManager:
    """Coordinates the facility-wide network of lightweight physical response nodes."""
    def __init__(self):
        self.nodes: Dict[str, PhysicalSafetyNode] = {
            "NODE_ZONE_01": PhysicalSafetyNode("NODE_ZONE_01", "ZONE_01", "ESP32-S3 Physical Beacon + RGB Strobe"),
            "NODE_ZONE_02": PhysicalSafetyNode("NODE_ZONE_02", "ZONE_02", "Raspberry Pi Zero W + High-Decibel Buzzer"),
            "NODE_ZONE_03": PhysicalSafetyNode("NODE_ZONE_03", "ZONE_03", "ESP32 Industrial Egress Gate Beacon")
        }

    def dispatch_fast_alert(self, zone_id: str, hazard: str, severity: str, action: str, display_lines: Optional[List[str]] = None):
        """Dispatches an immediate physical response to the target zone's physical node."""
        target_key = f"NODE_{zone_id[:7]}" if not zone_id.startswith("NODE_") else zone_id
        node = self.nodes.get(target_key) or self.nodes.get("NODE_ZONE_01")
        if node:
            node.dispatch_alert(hazard, severity, action, display_lines)
            
        # If critical collision or fire emergency, trigger adjacent swarm nodes
        if severity == "CRITICAL" and hazard in ["FIRE_EMERGENCY", "BLIND_CORNER_CONVERGENCE", "MULTI_ANGLE_COLLISION"]:
            for nid, n in self.nodes.items():
                if n != node:
                    n.dispatch_alert(hazard, "WARNING", "SECONDARY CLEARANCE", [
                        "SWARM ALERT",
                        f"EVACUATE {zone_id[:7]}",
                        "PREPARE SAFE EXIT"
                    ])

    def acknowledge_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        node = self.nodes.get(node_id)
        if node:
            return node.acknowledge()
        return None

    def get_all_nodes(self) -> List[Dict[str, Any]]:
        return [node.to_dict() for node in self.nodes.values()]

physical_node_manager = PhysicalSafetyNodeManager()
