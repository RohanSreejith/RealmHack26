"""
AI Safety Agent
Asynchronous intelligence layer delivering root-cause analysis, OSHA grounding, and predictive recommendations.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from hackeye.backend.database.db import SessionLocal
from hackeye.backend.database.models import Incident, SafetyInsight
from hackeye.firecrawl.knowledge_service import safety_knowledge_service
from hackeye.ai.adaption_client import adaption_client

from hackeye.ai.agent_graph import safety_agent_graph, IncidentSharedState

class AISafetyAgent:
    def __init__(self):
        pass

    def process_incident(self, incident_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Runs multi-agent reasoning graph asynchronously without delaying edge physical alerts."""
        shared_state = IncidentSharedState(
            incident_id=incident_dict.get("incident_id", f"INC-{int(datetime.now(timezone.utc).timestamp())}"),
            timestamp=incident_dict.get("timestamp", datetime.now(timezone.utc).isoformat()),
            zone=incident_dict.get("zone", "ZONE_01"),
            camera_id=incident_dict.get("camera_id", "CAM_01"),
            detected_objects=[incident_dict.get("worker_id", "W-017"), incident_dict.get("machine_id", "F-004")],
            track_ids=[incident_dict.get("worker_id", "W-017"), incident_dict.get("machine_id", "F-004")],
            machine_type=incident_dict.get("machine_type", "forklift"),
            distance_m=incident_dict.get("distance_m", 2.4),
            ttc_seconds=incident_dict.get("ttc_seconds", 1.7),
            severity=incident_dict.get("risk_level", "CRITICAL"),
            rule_violations=incident_dict.get("rule_violations", ["RULE_1_PROXIMITY_BREACH"])
        )

        final_state = safety_agent_graph.execute_graph(shared_state)
        result = dict(final_state.agent_analysis)
        result["knowledge_used"] = final_state.retrieved_safety_guidance
        result["pattern_insight"] = final_state.recurring_pattern_summary
        result["report"] = final_state.final_incident_report
        return result

ai_safety_agent = AISafetyAgent()
