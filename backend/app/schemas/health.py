"""
Health check schema models.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str = Field(..., description="Database connection state: connected | disconnected")
    postgis_enabled: bool = Field(..., description="Flag indicating if PostGIS spatial extension is active")
    postgis_version: Optional[str] = Field(None, description="Full PostGIS version information")
    error: Optional[str] = Field(None, description="Error message if database is unreachable")


class HealthCheckResponse(BaseModel):
    app: str = Field("SOTERIA", description="Platform name")
    version: str = Field("0.1.0", description="Backend service version")
    status: str = Field("healthy", description="Overall health state")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Server timestamp (UTC)")
    environment: str = Field("development", description="Current execution environment")
    database: DatabaseHealth = Field(..., description="PostgreSQL and PostGIS health report")
