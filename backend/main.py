"""
SOTERIA Backend — Main FastAPI Application Entrypoint.
Offline-First Multimodal AI Disaster Triage Platform.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.core.websockets import ws_manager
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
)
logger = logging.getLogger("soteria.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes PostGIS extensions, creates database tables, ensures upload directory exists, and prepares AI pipelines.
    """
    logger.info(f"Starting {settings.APP_NAME} Backend in [{settings.ENV}] mode...")
    # Ensure static uploads directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Mounted static upload directory at: {settings.UPLOAD_DIR}")

    # Initialize PostGIS extension and database tables asynchronously
    await init_db()
    yield
    logger.info(f"Shutting down {settings.APP_NAME} Backend gracefully...")


# Instantiate FastAPI Application
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "SOTERIA: A Unified Multimodal AI Intelligence Layer for Real-Time Disaster Triage. "
        "Transforms chaotic distress voice notes, photos, and text into prioritized, "
        "geospatially clustered rescue missions with dynamic volunteer safety briefings."
    ),
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Explicitly ensure both localhost:3000 and 127.0.0.1:3000 are in CORS allowed origins
allowed_origins = list(
    set(
        settings.CORS_ORIGINS
        + [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists before mounting StaticFiles
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    tags=["Root"],
    summary="SOTERIA API Service Information",
)
async def root_info():
    """
    Returns high-level metadata about the SOTERIA platform and API documentation links.
    """
    return {
        "name": settings.APP_NAME,
        "tagline": "From Chaos to Clarity — Disaster Response at the Speed of AI",
        "team": "Team Soteria: Aryan Singh, Ayush Kumar Singh, Ayush Bhatt, Abhijeet Mukherjee",
        "competition": "Automate India 2026 — NIET Chapter",
        "version": "0.3.0",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
        "health": f"{settings.API_V1_STR}/health",
        "incidents": f"{settings.API_V1_STR}/incidents",
        "triage": f"{settings.API_V1_STR}/triage/multimodal",
        "websockets": "/ws/incidents",
    }


# --- Real-Time Disaster Dispatch WebSocket Endpoints ---
@app.websocket("/ws/incidents")
@app.websocket(f"{settings.API_V1_STR}/ws/incidents")
async def websocket_incident_feed(websocket: WebSocket):
    """
    WebSocket endpoint streaming live incident updates, GenAI triage scores, and responder dispatches.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Receive client ping or heartbeat messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"event": "PONG", "status": "active"})
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client connection error: {e}")
        await ws_manager.disconnect(websocket)


# Mount API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
