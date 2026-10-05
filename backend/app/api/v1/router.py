from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    predictions,
    incidents,
    depots,
    resources,
    zones,
    optimizer,
    routing,
    map,
    missions,
    alerts,
    analytics,
    dashboard,
    volunteers,
    translations,
    admin,
)

api_router = APIRouter()

api_router.include_router(auth.router,         prefix="/auth",         tags=["auth"])
api_router.include_router(users.router,        prefix="/users",        tags=["users"])
api_router.include_router(predictions.router,  prefix="/predictions",  tags=["predictions"])
api_router.include_router(incidents.router,    prefix="/incidents",    tags=["incidents"])
api_router.include_router(depots.router,       prefix="/depots",       tags=["depots"])
api_router.include_router(resources.router,    prefix="/resources",    tags=["resources"])
api_router.include_router(zones.router,        prefix="/zones",        tags=["zones"])
api_router.include_router(optimizer.router,    prefix="/optimizer",    tags=["optimizer"])
api_router.include_router(routing.router,      prefix="/routing",      tags=["routing"])
api_router.include_router(map.router,          prefix="/map",          tags=["relief-map"])
api_router.include_router(missions.router,     prefix="/missions",     tags=["missions"])
api_router.include_router(alerts.router,       prefix="/alerts",       tags=["alerts"])
api_router.include_router(analytics.router,    prefix="/analytics",    tags=["analytics"])
api_router.include_router(dashboard.router,    prefix="/dashboard",    tags=["dashboard"])
api_router.include_router(volunteers.router,   prefix="/volunteers",   tags=["volunteers"])
api_router.include_router(translations.router, prefix="/translations", tags=["translations"])
api_router.include_router(admin.router,        prefix="/admin",        tags=["admin"])