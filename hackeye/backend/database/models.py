"""
Database Models for Hack-Eye
Supports SQLite for Edge and PostgreSQL for Cloud (Render).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Worker(Base):
    __tablename__ = "workers"
    
    worker_id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=True)
    current_zone = Column(String(50), default="ZONE_01")
    ppe_compliant = Column(Boolean, default=True)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Machine(Base):
    __tablename__ = "machines"
    
    machine_id = Column(String(50), primary_key=True)
    machine_type = Column(String(50), nullable=False) # forklift, truck, excavator
    current_zone = Column(String(50), default="ZONE_01")
    warning_radius = Column(Float, default=6.0)
    critical_radius = Column(Float, default=3.0)
    last_seen = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Incident(Base):
    __tablename__ = "incidents"
    
    incident_id = Column(String(50), primary_key=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    zone = Column(String(50), nullable=False, index=True)
    worker_id = Column(String(50), nullable=False)
    machine_id = Column(String(50), nullable=False)
    machine_type = Column(String(50), nullable=False)
    distance_m = Column(Float, nullable=False)
    ttc_seconds = Column(Float, nullable=True)
    risk_level = Column(String(20), nullable=False, index=True) # SAFE, WARNING, HIGH, CRITICAL
    status = Column(String(50), default="DETECTED") # DETECTED, LOCAL_ALERTED, AI_ANALYZED, RESOLVED
    local_alert_triggered = Column(Boolean, default=True)
    ai_analysis = Column(JSON, nullable=True)
    knowledge_cited = Column(JSON, nullable=True)
    sync_status = Column(String(20), default="PENDING") # PENDING, SYNCED

class SwarmEvent(Base):
    __tablename__ = "swarm_events"
    
    event_id = Column(String(50), primary_key=True)
    source_zone = Column(String(50), nullable=False)
    target_zone = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False) # WORKER_APPROACHING, HAZARD_ALERT, ESCALATION
    payload = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SafetyInsight(Base):
    __tablename__ = "safety_insights"
    
    insight_id = Column(String(50), primary_key=True)
    zone = Column(String(50), nullable=False)
    pattern = Column(String(255), nullable=False)
    recommendation = Column(Text, nullable=False)
    incident_count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class SyncQueue(Base):
    __tablename__ = "sync_queue"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(50), nullable=False) # incident, swarm_event, insight
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    synced = Column(Boolean, default=False)
