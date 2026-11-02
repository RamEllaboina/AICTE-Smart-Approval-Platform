from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()


@router.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint verifying database connectivity and configuration status."""
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        db_healthy = False

    return {
        "status": "HEALTHY" if db_healthy else "DEGRADED",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_connected": db_healthy,
        "storage_backend": settings.STORAGE_BACKEND
    }
