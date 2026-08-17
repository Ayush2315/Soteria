"""
Asynchronous Database Connection and PostGIS Spatial Extension Initializer.
"""
import logging
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger("soteria.database")

# Create Async Engine for high-concurrency disaster ingestion
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Create Session Maker factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Declarative Base for all ORM models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides an asynchronous database session per request.
    Yields:
        AsyncSession: Active SQLAlchemy async session.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initializes PostGIS extension and creates all database tables upon startup.
    Executes within an async transaction block.
    """
    logger.info("Initializing database and verifying PostGIS extension...")
    try:
        async with engine.begin() as conn:
            # 1. Enable PostGIS Extension in PostgreSQL
            logger.info("Executing: CREATE EXTENSION IF NOT EXISTS postgis;")
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))

            # 2. Create all defined tables
            logger.info("Creating schema tables...")
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database and PostGIS extension successfully initialized.")
    except Exception as e:
        logger.warning(
            f"Database initialization encountered an alert: {e}. "
            "Continuing startup (will retry on incoming requests)..."
        )


async def check_db_health() -> dict:
    """
    Performs a lightweight query to check database connectivity and PostGIS status.
    Returns:
        dict: Health status and PostGIS version information.
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1;"))
            result.scalar()

            # Attempt to query PostGIS version
            postgis_version = None
            try:
                pg_result = await conn.execute(text("SELECT PostGIS_Full_Version();"))
                postgis_version = pg_result.scalar()
            except Exception:
                postgis_version = "postgis_not_active"

            return {
                "status": "connected",
                "postgis_enabled": postgis_version != "postgis_not_active",
                "postgis_version": postgis_version or "N/A",
            }
    except Exception as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "postgis_enabled": False,
        }
