"""
n8n Operational Automation Client
Dispatches webhooks to n8n workflows for critical incidents, near misses, and daily briefs.
"""
import httpx
from typing import Dict, Any, List
from datetime import datetime, timezone
from hackeye.backend.config import settings

class N8nClient:
    def __init__(self):
        self.webhook_url = settings.N8N_WEBHOOK_URL
        self.api_key = settings.N8N_API_KEY
        self.execution_log: List[Dict[str, Any]] = []

    def dispatch_critical_incident(self, incident: Dict[str, Any], ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches Workflow 1: Critical Incident Alert & Supervisor Escalation."""
        payload = {
            "workflow": "CRITICAL_INCIDENT_ESCALATION",
            "incident_id": incident.get("incident_id"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "worker_id": incident.get("worker_id"),
            "machine_id": incident.get("machine_id"),
            "machine_type": incident.get("machine_type"),
            "zone": incident.get("zone"),
            "distance_m": incident.get("distance_m"),
            "ttc_seconds": incident.get("ttc_seconds"),
            "risk_level": incident.get("risk_level"),
            "ai_summary": ai_analysis.get("reason"),
            "recommended_actions": ai_analysis.get("recommended_actions", [])
        }
        return self._send_or_simulate("workflow_critical_incident", payload)

    def dispatch_repeated_near_miss(self, zone: str, incident_count: int, pattern: str) -> Dict[str, Any]:
        """Dispatches Workflow 2: Zone Near-Miss Pattern & Corrective Work-Order."""
        payload = {
            "workflow": "REPEATED_NEAR_MISS_AGGREGATOR",
            "zone": zone,
            "incident_count": incident_count,
            "pattern": pattern,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "Generate EHS Corrective Work-Order"
        }
        return self._send_or_simulate("workflow_repeated_near_miss", payload)

    def dispatch_daily_safety_brief(self, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches Workflow 3: Automated 24h Facility Safety Briefing."""
        payload = {
            "workflow": "DAILY_SAFETY_BRIEF",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stats": stats,
            "status": "Generated & Distributed to Shift Supervisors"
        }
        return self._send_or_simulate("workflow_daily_safety_brief", payload)

    def _send_or_simulate(self, workflow_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        record = {
            "workflow": workflow_name,
            "status": "SIMULATED_SUCCESS",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload
        }

        target_url = self.webhook_url or settings.N8N_WEBHOOK_URL
        if target_url:
            headers = {"Content-Type": "application/json"}
            api_key = self.api_key or settings.N8N_API_KEY
            if api_key:
                headers["X-N8N-API-KEY"] = api_key
            try:
                with httpx.Client(timeout=4.0) as client:
                    resp = client.post(target_url, json=payload, headers=headers)
                    record["http_code"] = resp.status_code
                    if resp.status_code in [200, 201, 202]:
                        record["status"] = "WEBHOOK_DELIVERED"
                    else:
                        record["status"] = f"N8N_HTTP_{resp.status_code}"
                        record["response_message"] = resp.text[:250]
            except Exception as e:
                record["status"] = f"DISPATCH_ERROR_{type(e).__name__}"

        self.execution_log.append(record)
        if len(self.execution_log) > 20:
            self.execution_log.pop(0)

        return record

    def get_recent_executions(self) -> List[Dict[str, Any]]:
        return list(reversed(self.execution_log))

n8n_client = N8nClient()
