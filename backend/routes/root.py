"""Generic API routes."""

from fastapi import APIRouter, Depends, HTTPException

from backend.adapters.database import DatabaseAdapter
from backend.dependencies import get_database
from backend.schemas.api import HealthResponse

router = APIRouter(prefix="/api/v1", tags=["system"])


@router.get("/health")
def healthz(database: DatabaseAdapter = Depends(get_database)) -> HealthResponse:
    try:
        with database.engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return HealthResponse(status="ok", database="ok")
