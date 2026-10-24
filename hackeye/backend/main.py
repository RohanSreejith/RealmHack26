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

def is_running_in_render_cloud() -> bool:
    """True only when executing inside Render Cloud container, not local machine."""
    return os.getenv("RENDER") == "true" or os.getenv("RENDER_INSTANCE_ID") is not None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database schema and seed default nodes
    print("[Hack-Eye] Initializing database schema...")
    try:
        init_db()
    except Exception as e:
        print(f"[Hack-Eye Database] init_db warning: {e}")
    
    # Auto-start swarm dual-camera streams ONLY on local edge (not in Render cloud)
    if not is_running_in_render_cloud():
        try:
            from hackeye.backend.services.video_stream import dual_camera_manager
            dual_camera_manager.start_all()
            print("[Hack-Eye Edge] Dual camera safety streams active on localhost.")
        except Exception as e:
            print(f"[Hack-Eye Edge] Camera stream notice: {e}")
    else:
        print("[Hack-Eye Cloud] Running in Render Cloud environment. Edge video capture handled by local edge nodes.")
    
    yield
    
    # Shutdown
    if not is_running_in_render_cloud():
        try:
            from hackeye.backend.services.video_stream import dual_camera_manager
            dual_camera_manager.stop_all()
        except Exception:
            pass

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

# Mount Recorded Video Clips for Incidents
videos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "videos"))
if os.path.exists(videos_dir):
    app.mount("/videos", StaticFiles(directory=videos_dir), name="videos")

@app.get("/")
async def serve_dashboard():
    # Only Render Cloud serves cloud_dashboard.html on /
    # Localhost serves index.html (the live CCTV camera operations dashboard)
    if is_running_in_render_cloud():
        cloud_index = os.path.join(dashboard_dir, "cloud_dashboard.html")
        if os.path.exists(cloud_index):
            return FileResponse(cloud_index)
    index_path = os.path.join(dashboard_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Hack-Eye Edge API Operational. Dashboard HTML not found."}

@app.get("/cloud")
async def serve_cloud_portal():
    cloud_index = os.path.join(dashboard_dir, "cloud_dashboard.html")
    if os.path.exists(cloud_index):
        return FileResponse(cloud_index)
    return {"message": "Hack-Eye Cloud Portal Operational."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[Hack-Eye] Starting Uvicorn on 0.0.0.0:{port}...")
    uvicorn.run("hackeye.backend.main:app", host="0.0.0.0", port=port)
