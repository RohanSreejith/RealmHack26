"""
Hack-Eye Configuration Module
Centralized settings with environment variable support.
"""
import os
from dotenv import load_dotenv
load_dotenv()
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App Information
    APP_NAME: str = "Hack-Eye"
    APP_TAGLINE: str = "Distributed AI for Predictive Industrial Safety"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Edge Safety Engine Thresholds (Configurable)
    WARNING_DISTANCE_METERS: float = 6.0
    CRITICAL_DISTANCE_METERS: float = 3.0
    WARNING_TTC_SECONDS: float = 4.0
    CRITICAL_TTC_SECONDS: float = 2.0
    PERSISTENCE_FRAMES_THRESHOLD: int = 3
    
    # Hardware & Scene Calibration Defaults
    CAMERA_HEIGHT_METERS: float = 3.5
    PIXELS_PER_METER_DEFAULT: float = 35.0
    
    # AI & Cloud Integrations (Defaults with graceful fallbacks)
    ADAPTION_API_KEY: str = os.getenv("ADAPTION_API_KEY", "")
    ADAPTION_API_URL: str = os.getenv("ADAPTION_API_URL", "https://api.adaption.ai/v1/chat/completions")
    
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY", "")
    FIRECRAWL_API_URL: str = os.getenv("FIRECRAWL_API_URL", "https://api.firecrawl.dev/v1")
    
    N8N_WEBHOOK_URL: str = os.getenv("N8N_WEBHOOK_URL", "https://rohansreejith.app.n8n.cloud/webhook-test/hackeye-critical-incident")
    N8N_API_KEY: str = os.getenv("N8N_API_KEY", "")
    
    RENDER_API_KEY: str = os.getenv("RENDER_API_KEY", "")
    RENDER_SERVICE_ID: str = os.getenv("RENDER_SERVICE_ID", "")
    
    # Database Settings (Local SQLite by default, Postgres on Render)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///hackeye_edge.db")
    
    # Swarm Configuration
    ZONES: List[str] = ["ZONE_01", "ZONE_02", "ZONE_03"]
    DEFAULT_ZONE: str = "ZONE_01"

settings = Settings()
