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

class AISafetyAgent:
    def __init__(self):
        pass

    def process_incident(self, incident_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Runs deep AI reasoning without delaying the local edge alert."""
        zone = incident_dict.get("zone", "ZONE_01")
        machine_type = incident_dict.get("machine_type", "forklift")

        # 1. Fetch relevant OSHA & Industrial safety guidelines via Firecrawl service
        knowledge_matches = safety_knowledge_service.retrieve_guidance(
            machine_type=machine_type,
            context_keywords=["blind", "entrance", "proximity", "pedestrian"]
        )
        context_str = "\n".join([f"- {k['title']}: {k['summary']}" for k in knowledge_matches])

        # 2. Check for historical near-miss count in this zone
        db: Session = SessionLocal()
        near_misses_count = 0
        try:
            near_misses_count = db.query(Incident).filter(
                Incident.zone == zone,
                Incident.risk_level.in_(["WARNING", "HIGH", "CRITICAL"])
            ).count()
        finally:
            db.close()

        # Augment payload for the AI agent
        enriched_payload = dict(incident_dict)
        enriched_payload["previous_near_misses_in_zone"] = near_misses_count
        enriched_payload["active_hazards_nearby"] = 1 if near_misses_count > 2 else 0

        # 3. Call Adaption AI Reasoning
        ai_result = adaption_client.analyze_incident(enriched_payload, context_str)
        
        # 4. Attach knowledge citations
        ai_result["knowledge_used"] = [
            {"id": k["id"], "title": k["title"], "source": k["source"]}
            for k in knowledge_matches
        ]

        # 5. Persist AI analysis and create Safety Insight if pattern repeats
        db = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.incident_id == incident_dict["incident_id"]).first()
            if inc:
                inc.ai_analysis = ai_result
                inc.knowledge_cited = ai_result["knowledge_used"]
                inc.status = "AI_ANALYZED"
                db.commit()

            # Record zone pattern insight if repeated occurrences
            if near_misses_count >= 2:
                insight = SafetyInsight(
                    insight_id=f"INS-{zone}-{int(datetime.now(timezone.utc).timestamp())}",
                    zone=zone,
                    pattern=f"High frequency of {machine_type} blind-corner interactions in {zone} ({near_misses_count}+ recorded)",
                    recommendation=ai_result.get("recommended_actions", ["Enforce physical pedestrian barrier"])[0],
                    incident_count=near_misses_count + 1
                )
                db.merge(insight)
                db.commit()
        finally:
            db.close()

        return ai_result

ai_safety_agent = AISafetyAgent()
