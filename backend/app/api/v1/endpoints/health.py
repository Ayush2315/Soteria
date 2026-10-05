"""
Health Check and PostGIS Engine Verification Endpoint.
"""
from datetime import datetime
from fastapi import APIRouter, status
from app.core.config import settings
from app.core.database import check_db_health
from app.schemas.health import HealthCheckResponse, DatabaseHealth

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Platform Health & PostGIS Spatial Engine Status",
    description="Returns backend service readiness, PostgreSQL database connection, and PostGIS spatial extension status.",
)
async def get_health_status() -> HealthCheckResponse:
    db_report = await check_db_health()
    db_health = DatabaseHealth(
        status=db_report.get("status", "disconnected"),
        postgis_enabled=db_report.get("postgis_enabled", False),
        postgis_version=db_report.get("postgis_version"),
        error=db_report.get("error"),
    )

    overall_status = "healthy" if db_health.status == "connected" else "degraded"

    return HealthCheckResponse(
        app=settings.APP_NAME,
        version="0.1.0",
        status=overall_status,
        timestamp=datetime.utcnow(),
        environment=settings.ENV,
        database=db_health,
    )
