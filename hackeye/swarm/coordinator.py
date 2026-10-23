"""
Swarm Coordinator & Inter-Zone Agent Protocol.
Enables distributed awareness across Zone 01, Zone 02, and Zone 03 nodes.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from hackeye.backend.database.db import SessionLocal
from hackeye.backend.database.models import SwarmEvent

class ZoneAgent:
    def __init__(self, zone_id: str, label: str):
        self.zone_id = zone_id
        self.label = label
        self.status = "SAFE" # SAFE, WARNING, CRITICAL
        self.vigilance_level = "NORMAL" # NORMAL, HEIGHTENED, EMERGENCY
        self.active_workers = 0
        self.active_machines = 0
        self.online = True
        self.last_heartbeat = datetime.now(timezone.utc).isoformat()
        self.inbox: List[Dict[str, Any]] = []

    def receive_message(self, message: Dict[str, Any]):
        self.inbox.append(message)
        if len(self.inbox) > 10:
            self.inbox.pop(0)

        # React to swarm notification
        if message.get("event") == "WORKER_APPROACHING":
            self.vigilance_level = "HEIGHTENED"
        elif message.get("risk") == "CRITICAL":
            self.vigilance_level = "EMERGENCY"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "zone_id": self.zone_id,
            "label": self.label,
            "status": self.status,
            "vigilance_level": self.vigilance_level,
            "active_workers": self.active_workers,
            "active_machines": self.active_machines,
            "online": self.online,
            "last_heartbeat": self.last_heartbeat,
            "recent_messages": self.inbox[-3:]
        }

class SwarmCoordinator:
    def __init__(self):
        self.agents: Dict[str, ZoneAgent] = {
            "ZONE_01": ZoneAgent("ZONE_01", "Main Entrance & Crosswalk"),
            "ZONE_02": ZoneAgent("ZONE_02", "Forklift Staging & Narrow Bay"),
            "ZONE_03": ZoneAgent("ZONE_03", "Heavy Truck Loading Dock")
        }
        self.event_counter = 500

    def broadcast_interzone_event(
        self,
        source_zone: str,
        destination_zone: str,
        event_type: str,
        worker_id: Optional[str] = None,
        machine_id: Optional[str] = None,
        risk: str = "HIGH",
        eta_seconds: int = 4
    ) -> Dict[str, Any]:
        """Dispatches peer-to-peer message from source to destination zone agent."""
        self.event_counter += 1
        event_id = f"SWM-{self.event_counter}"
        
        payload = {
            "event_id": event_id,
            "source_zone": source_zone,
            "destination_zone": destination_zone,
            "event": event_type,
            "worker_id": worker_id,
            "machine_id": machine_id,
            "risk": risk,
            "eta_seconds": eta_seconds,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Deliver to target zone agent directly
        if destination_zone in self.agents:
            self.agents[destination_zone].receive_message(payload)

        # Log event to database
        db: Session = SessionLocal()
        try:
            sw_record = SwarmEvent(
                event_id=event_id,
                source_zone=source_zone,
                target_zone=destination_zone,
                event_type=event_type,
                payload=payload,
                timestamp=datetime.now(timezone.utc)
            )
            db.merge(sw_record)
            db.commit()
        finally:
            db.close()

        return payload

    def get_swarm_status(self) -> Dict[str, Any]:
        """Returns the real-time operational status of all swarm zone nodes."""
        return {
            "total_nodes": len(self.agents),
            "online_nodes": sum(1 for a in self.agents.values() if a.online),
            "zones": {zid: agent.to_dict() for zid, agent in self.agents.items()}
        }

swarm_coordinator = SwarmCoordinator()
