"""
Offline-First Edge Storage and Store-and-Forward Sync Queue.
Maintains continuous local operation during network outages.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from hackeye.backend.database.db import SessionLocal
from hackeye.backend.database.models import Incident, SyncQueue, SwarmEvent, SafetyInsight

class LocalEdgeQueue:
    def __init__(self):
        self.is_cloud_connected = True

    def set_cloud_connectivity(self, online: bool):
        self.is_cloud_connected = online

    def persist_incident(self, incident_dict: Dict[str, Any]) -> str:
        """Stores incident locally immediately in SQLite, then queues for sync."""
        db: Session = SessionLocal()
        try:
            inc = Incident(
                incident_id=incident_dict["incident_id"],
                timestamp=datetime.fromisoformat(incident_dict["timestamp"]),
                zone=incident_dict["zone"],
                worker_id=incident_dict["worker_id"],
                machine_id=incident_dict["machine_id"],
                machine_type=incident_dict["machine_type"],
                distance_m=incident_dict["distance_m"],
                ttc_seconds=incident_dict.get("ttc_seconds"),
                risk_level=incident_dict["risk_level"],
                status="LOCAL_ALERTED" if incident_dict.get("local_alert_triggered") else "DETECTED",
                local_alert_triggered=incident_dict.get("local_alert_triggered", False),
                ai_analysis=incident_dict.get("ai_analysis"),
                knowledge_cited=incident_dict.get("knowledge_cited"),
                sync_status="SYNCED" if self.is_cloud_connected else "PENDING"
            )
            db.merge(inc)

            # If offline or pending, add to SyncQueue table
            if not self.is_cloud_connected:
                queue_entry = SyncQueue(
                    entity_type="incident",
                    payload=incident_dict,
                    synced=False
                )
                db.add(queue_entry)

            db.commit()
            return inc.incident_id
        finally:
            db.close()

    def get_pending_sync_count(self) -> int:
        db: Session = SessionLocal()
        try:
            return db.query(SyncQueue).filter(SyncQueue.synced == False).count()
        finally:
            db.close()

    def sync_to_cloud(self) -> int:
        """Simulates or performs flush of pending edge items when connection restores."""
        db: Session = SessionLocal()
        try:
            pending = db.query(SyncQueue).filter(SyncQueue.synced == False).all()
            count = len(pending)
            for item in pending:
                item.synced = True
                # Update incident record sync_status as well
                if item.entity_type == "incident":
                    inc_id = item.payload.get("incident_id")
                    if inc_id:
                        inc = db.query(Incident).filter(Incident.incident_id == inc_id).first()
                        if inc:
                            inc.sync_status = "SYNCED"
            db.commit()
            return count
        finally:
            db.close()

local_queue = LocalEdgeQueue()
