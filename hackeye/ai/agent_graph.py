"""
Multi-Agent Safety Intelligence Graph
Implements an agentic graph architecture with structured shared state:
1. Safety Knowledge Agent: Retrieves grounded OSHA & industrial safety guidelines (via Firecrawl).
2. Pattern & Trend Agent: Inspects historical incident database to identify repeated problem areas.
3. Safety Analysis Agent: Executes causal reasoning, risk evaluation, and contributing factor analysis (via Adaption AI).
4. Incident Agent: Produces structured, OSHA-compliant incident reports and action items.
"""
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from hackeye.backend.database.db import SessionLocal
from hackeye.backend.database.models import Incident, SafetyInsight
from hackeye.firecrawl.knowledge_service import safety_knowledge_service
from hackeye.ai.adaption_client import adaption_client

class IncidentSharedState(BaseModel):
    """Shared structured incident state passed across all graph agents."""
    incident_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    camera_id: str = "CAM_01"
    zone: str = "ZONE_01"
    detected_objects: List[str] = Field(default_factory=list)
    track_ids: List[str] = Field(default_factory=list)
    machine_type: str = "forklift"
    distance_m: float = 2.4
    ttc_seconds: Optional[float] = 1.7
    trajectory_closing_velocity_m_s: float = 1.2
    rule_violations: List[str] = Field(default_factory=list)
    severity: str = "CRITICAL"
    
    # State enriched by agents along the graph
    retrieved_safety_guidance: List[Dict[str, Any]] = Field(default_factory=list)
    historical_incidents_in_zone: int = 0
    recurring_pattern_summary: Optional[str] = None
    agent_analysis: Dict[str, Any] = Field(default_factory=dict)
    recommendations: List[str] = Field(default_factory=list)
    final_incident_report: Dict[str, Any] = Field(default_factory=dict)

# --- Agent 1: Safety Knowledge Agent ---
class SafetyKnowledgeAgent:
    """Retrieves authoritative safety guidance from the knowledge base populated via Firecrawl."""
    def run(self, state: IncidentSharedState) -> IncidentSharedState:
        keywords = ["proximity", "pedestrian", "forklift", "blind_corner"]
        if "FIRE" in state.severity or any("FIRE" in v for v in state.rule_violations):
            keywords = ["fire", "evacuation", "emergency"]
        elif any("HELMET" in v for v in state.rule_violations):
            keywords = ["ppe", "helmet", "hard_hat", "1926.100"]

        guidelines = safety_knowledge_service.retrieve_guidance(
            machine_type=state.machine_type,
            context_keywords=keywords
        )
        state.retrieved_safety_guidance = [
            {
                "id": g.get("id"),
                "title": g.get("title"),
                "summary": g.get("summary"),
                "source": g.get("source")
            }
            for g in guidelines
        ]
        return state

# --- Agent 2: Pattern & Trend Agent ---
class PatternTrendAgent:
    """Analyzes historical database records to spot repeated safety bottlenecks."""
    def run(self, state: IncidentSharedState) -> IncidentSharedState:
        db: Session = SessionLocal()
        try:
            count = db.query(Incident).filter(
                Incident.zone.like(f"%{state.zone[:7]}%"),
                Incident.risk_level.in_(["WARNING", "HIGH", "CRITICAL"])
            ).count()
            state.historical_incidents_in_zone = count
            
            if count >= 3:
                state.recurring_pattern_summary = (
                    f"Zone '{state.zone}' exhibits recurring hazard frequency: "
                    f"{count} elevated incidents logged in recent shifts. Infrastructure redesign recommended."
                )
            else:
                state.recurring_pattern_summary = f"Isolated occurrence in {state.zone} (prior incidents: {count})."
        finally:
            db.close()
        return state

# --- Agent 3: Safety Analysis Agent ---
class SafetyAnalysisAgent:
    """Executes multi-factor reasoning and causal explanation using Adaption AI."""
    def run(self, state: IncidentSharedState) -> IncidentSharedState:
        context_guidelines = "\n".join([
            f"- {g['title']}: {g['summary']}" for g in state.retrieved_safety_guidance
        ])

        payload = {
            "incident_id": state.incident_id,
            "zone": state.zone,
            "machine_type": state.machine_type,
            "distance_m": state.distance_m,
            "ttc_seconds": state.ttc_seconds,
            "rule_violations": state.rule_violations,
            "previous_near_misses_in_zone": state.historical_incidents_in_zone,
            "pattern_insight": state.recurring_pattern_summary
        }

        # Query Adaption AI with rich grounding
        ai_res = adaption_client.analyze_incident(payload, context_guidelines)
        state.agent_analysis = ai_res
        state.recommendations = ai_res.get("recommended_actions", [
            "Enforce speed governor in pedestrian zone",
            "Broadcast acoustic warning on local safety node"
        ])
        return state

# --- Agent 4: Incident Agent ---
class IncidentAgent:
    """Generates the official, structured incident report for supervisors and compliance audit."""
    def run(self, state: IncidentSharedState) -> IncidentSharedState:
        report = {
            "report_id": f"REP-{state.incident_id}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "incident_summary": {
                "incident_id": state.incident_id,
                "location": state.zone,
                "severity": state.severity,
                "machine_involved": state.machine_type,
                "distance_recorded": f"{state.distance_m:.1f}m",
                "ttc_estimated": f"{state.ttc_seconds:.1f}s" if state.ttc_seconds else "N/A",
                "rules_violated": state.rule_violations
            },
            "root_cause_analysis": {
                "reason": state.agent_analysis.get("reason", "Proximity constraint breach between worker and vehicle."),
                "predicted_outcome": state.agent_analysis.get("predicted_outcome", "Collision risk if trajectory persists."),
                "contributing_factors": state.agent_analysis.get("contributing_factors", [])
            },
            "pattern_intelligence": state.recurring_pattern_summary,
            "regulatory_compliance": [
                f"{g['id']}: {g['title']}" for g in state.retrieved_safety_guidance
            ],
            "corrective_actions": state.recommendations
        }
        state.final_incident_report = report

        # Persist report and update DB
        db: Session = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.incident_id == state.incident_id).first()
            if inc:
                inc.ai_analysis = state.agent_analysis
                inc.knowledge_cited = state.retrieved_safety_guidance
                inc.status = "RESOLVED_ANALYSIS"
                db.commit()

            # Record Safety Insight if pattern repeated
            if state.historical_incidents_in_zone >= 2:
                insight = SafetyInsight(
                    insight_id=f"INS-{state.zone[:7]}-{int(time.time())}",
                    zone=state.zone[:7],
                    pattern=state.recurring_pattern_summary or "Repeated proximity incidents",
                    recommendation=state.recommendations[0] if state.recommendations else "Review traffic management plan",
                    incident_count=state.historical_incidents_in_zone + 1
                )
                db.merge(insight)
                db.commit()
        finally:
            db.close()

        return state

# --- Orchestrating Safety Agent Graph ---
class SafetyAgentGraph:
    """Sequential agent execution pipeline passing unified IncidentSharedState."""
    def __init__(self):
        self.knowledge_agent = SafetyKnowledgeAgent()
        self.pattern_agent = PatternTrendAgent()
        self.analysis_agent = SafetyAnalysisAgent()
        self.incident_agent = IncidentAgent()

    def execute_graph(self, initial_state: IncidentSharedState) -> IncidentSharedState:
        # Step 1: Knowledge Agent retrieves relevant OSHA standards
        state = self.knowledge_agent.run(initial_state)
        # Step 2: Pattern Agent checks historical zone records
        state = self.pattern_agent.run(state)
        # Step 3: Analysis Agent reasons via Adaption AI
        state = self.analysis_agent.run(state)
        # Step 4: Incident Agent produces structured report
        state = self.incident_agent.run(state)
        return state

safety_agent_graph = SafetyAgentGraph()
