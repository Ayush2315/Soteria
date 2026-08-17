"""
Application Configuration and Settings Management using Pydantic Settings.
"""
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json
import os


class Settings(BaseSettings):
    # App Settings
    ENV: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "SOTERIA"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "soteria_super_secret_development_key_32chars_minimum"

    # Uploads & Media Storage
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    MAX_UPLOAD_SIZE_MB: int = 25

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # PostgreSQL + PostGIS Database Settings
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "soteria_db"
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@db:5432/soteria_db"
    )
    DATABASE_URL_SYNC: str = (
        "postgresql://postgres:postgres@db:5432/soteria_db"
    )

    # Google Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Triage Thresholds
    TRIAGE_SCORE_THRESHOLD_CRITICAL: int = 80
    TRIAGE_SCORE_THRESHOLD_URGENT: int = 60
    TRIAGE_SCORE_THRESHOLD_MODERATE: int = 40
    SITREP_INTERVAL_MINUTES: int = 30
    DEFAULT_SEARCH_RADIUS_METERS: int = 5000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


settings = Settings()
