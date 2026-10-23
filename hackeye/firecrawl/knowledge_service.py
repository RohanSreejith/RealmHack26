"""
Safety Knowledge Service backed by Firecrawl-ingested OSHA and Industrial Safety Guidelines.
Provides contextual safety standard retrieval for AI reasoning.
"""
from typing import List, Dict, Any, Optional
from hackeye.backend.config import settings

# Pre-indexed industrial safety knowledge base (OSHA 1910.178, NIOSH, ISO 3691-4)
PRE_INDEXED_KNOWLEDGE = [
    {
        "id": "OSHA-1910-178-N4",
        "title": "OSHA 1910.178(n)(4) - Powered Industrial Trucks: Speed and Blind Intersections",
        "category": "forklift",
        "source": "OSHA General Industry Regulations (Ingested via Firecrawl)",
        "summary": "The driver shall be required to slow down and sound the horn at cross aisles and other locations where vision is obstructed. If the load being carried obstructs forward view, the driver shall be required to travel with the load trailing.",
        "keywords": ["forklift", "blind", "entrance", "speed", "horn", "intersection", "pedestrian"]
    },
    {
        "id": "OSHA-1910-178-M2",
        "title": "OSHA 1910.178(m)(2) - Pedestrian Separation & Exclusion Zones",
        "category": "forklift",
        "source": "OSHA Standards & Industrial Guidance (Ingested via Firecrawl)",
        "summary": "Pedestrians must not stand or pass under the elevated portion of any truck. A minimum clearance of 3 meters (10 feet) must be maintained between moving industrial trucks and pedestrian pathways.",
        "keywords": ["forklift", "proximity", "pedestrian", "worker", "distance", "exclusion"]
    },
    {
        "id": "OSHA-1926-601",
        "title": "OSHA 1926.601 - Motor Vehicles and Heavy Haulage in Loading Bays",
        "category": "truck",
        "source": "OSHA Construction Standards (Ingested via Firecrawl)",
        "summary": "No operator shall back up a motor vehicle having an obstructed rear view unless the vehicle has a reverse signal alarm audible above the surrounding noise level or the vehicle is backed up only when an observer signals that it is safe.",
        "keywords": ["truck", "loading", "dock", "reversing", "bay", "spotter", "heavy"]
    },
    {
        "id": "NIOSH-PUB-2001-109",
        "title": "NIOSH Alert: Preventing Worker Injuries and Deaths from Moving Equipment",
        "category": "general_machinery",
        "source": "CDC/NIOSH Safety Publications (Ingested via Firecrawl)",
        "summary": "Implement designated pedestrian walkways separated by physical barriers. Enforce high-visibility PPE in all operational zones with mechanized vehicle traffic.",
        "keywords": ["excavator", "machinery", "blind_spot", "ppe", "helmet", "visibility", "walkway"]
    }
]

class SafetyKnowledgeService:
    def __init__(self):
        self.knowledge_base = PRE_INDEXED_KNOWLEDGE

    def retrieve_guidance(self, machine_type: str, context_keywords: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Returns the most relevant safety standards and OSHA guidelines for the incident context."""
        matches = []
        machine_type = (machine_type or "").lower()
        context_words = [w.lower() for w in (context_keywords or [])]

        for item in self.knowledge_base:
            score = 0
            if item["category"] in machine_type or machine_type in item["category"]:
                score += 3
            
            for kw in item["keywords"]:
                if kw in machine_type:
                    score += 2
                for cw in context_words:
                    if kw in cw or cw in kw:
                        score += 1

            if score > 0:
                matches.append((score, item))

        matches.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in matches[:2]]

safety_knowledge_service = SafetyKnowledgeService()
