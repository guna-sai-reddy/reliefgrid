from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.alert import Alert, AlertSeverity
from app.schemas.alert import AlertCreate, AlertOut
from app.websockets.manager import alert_manager

router = APIRouter()


@router.post("/", response_model=AlertOut, status_code=201)
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("admin", "commander", "coordinator")),
):
    a = Alert(
        title=payload.title,
        message=payload.message,
        severity=AlertSeverity(payload.severity),
        region=payload.region,
    )
    db.add(a)
    await db.commit()
    await db.refresh(a)

    # Broadcast to all WS clients
    await alert_manager.broadcast({
        "type": "new_alert",
        "id": a.id,
        "title": a.title,
        "message": a.message,
        "severity": a.severity.value,
        "region": a.region,
    })
    return a


@router.get("/", response_model=list[AlertOut])
async def list_alerts(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return (await db.execute(
        select(Alert).order_by(desc(Alert.created_at)).limit(limit)
    )).scalars().all()


@router.websocket("/ws")
async def ws_alerts(websocket: WebSocket):
    await alert_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        alert_manager.disconnect(websocket)