from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    auth,
    institutions,
    applications,
    documents,
    compliance,
    workflow,
    reviews,
    notifications,
    analytics,
    admin
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(institutions.router, prefix="/institutions", tags=["Institutions"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
api_router.include_router(workflow.router, prefix="/workflow", tags=["Workflow"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews & Deficiencies"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications & Deadlines"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration & Audit"])
