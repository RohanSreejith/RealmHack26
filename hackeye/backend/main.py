"""
Hack-Eye Application Entrypoint
FastAPI server serving Edge/Cloud APIs, WebSockets/MJPEG stream, and Operations Dashboard.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from hackeye.backend.config import settings
from hackeye.backend.database.db import init_db
from hackeye.backend.api.routes import router as api_router
from hackeye.backend.services.video_stream import video_processor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database schema and seed default nodes
    print("[Hack-Eye] Initializing edge database schema...")
    init_db()
    
    # Auto-start default video processing on uploaded clip if available
    default_video = "videos/forklift_approaching_entrance.mp4"
    if os.path.exists(default_video):
        video_processor.start_stream(default_video)
    
    yield
    
    # Shutdown
    print("[Hack-Eye] Stopping edge video processor...")
    video_processor.stop_stream()

app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_TAGLINE,
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for browser frontends and integration webhooks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST & Streaming routes
app.include_router(api_router)

# Mount Dashboard Static Assets
dashboard_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dashboard"))
if os.path.exists(dashboard_dir):
    app.mount("/static", StaticFiles(directory=dashboard_dir), name="static")

@app.get("/")
def serve_dashboard():
    index_path = os.path.join(dashboard_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Hack-Eye Edge API Operational. Dashboard HTML not found."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("hackeye.backend.main:app", host="0.0.0.0", port=8000, reload=True)
