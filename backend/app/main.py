"""
ReliefGrid — FastAPI application entry point.
Wires routers, CORS, WebSocket endpoints, and DB lifespan.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1.router import api_router
from app.websockets.manager import map_manager, alert_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print(f"[OK] {settings.APP_NAME} started - DB tables ensured")

    yield

    await engine.dispose()
    print("[INFO] Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Disaster Relief Resource Allocator — API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# API ROUTES
# =========================

app.include_router(
    api_router,
    prefix=settings.API_V1_PREFIX
)


# =========================
# SYSTEM ROUTES
# =========================

@app.get("/health", tags=["system"])
def health():
    return {
        "status": "ok",
        "service": settings.APP_NAME
    }


@app.get("/", tags=["system"])
def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "api": settings.API_V1_PREFIX,
    }


# =========================
# WEBSOCKET: MAP
# =========================

@app.websocket("/api/v1/ws/map")
async def ws_map(ws: WebSocket):
    await map_manager.connect(ws)

    try:
        while True:
            await ws.receive_text()

    except WebSocketDisconnect:
        map_manager.disconnect(ws)


# =========================
# WEBSOCKET: ALERTS
# =========================

@app.websocket("/api/v1/ws/alerts")
async def ws_alerts(ws: WebSocket):
    await alert_manager.connect(ws)

    try:
        while True:
            await ws.receive_text()

    except WebSocketDisconnect:
        alert_manager.disconnect(ws)