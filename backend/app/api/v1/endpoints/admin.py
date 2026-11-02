import io
import csv
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.user import User, UserRoleEnum
from app.models.application import Application
from app.schemas.audit import AuditEventOut
from app.api.deps import require_role
from app.services.notifications.service import evaluate_deadlines
from app.services.audit import record_audit_event

router = APIRouter()


@router.get("/audit-events", response_model=List[AuditEventOut])
def list_audit_events(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Inspect immutable append-only audit log entries with filter controls."""
    query = db.query(AuditEvent)

    if action:
        query = query.filter(AuditEvent.action.ilike(f"%{action}%"))
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditEvent.entity_id == entity_id)

    events = query.order_by(AuditEvent.created_at.desc()).offset(skip).limit(limit).all()
    return events


@router.get("/users")
def list_system_users(
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """List system users and their active role assignments."""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.primary_role,
            "roles": [r.name for r in u.roles],
            "is_active": u.is_active,
            "created_at": u.created_at
        }
        for u in users
    ]


@router.post("/trigger-deadline-check")
def trigger_deadline_monitoring(
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Manually trigger deadline monitoring sweep (also run periodically via scheduler)."""
    alerts_fired = evaluate_deadlines(db)
    db.commit()
    return {
        "status": "SUCCESS",
        "alerts_triggered": alerts_fired,
        "message": f"Deadline sweep executed. {alerts_fired} reminder/escalation notifications created."
    }


def sanitize_csv_field(val: Any) -> str:
    """Protect against CSV formula injection (prevent leading =, +, -, @)."""
    s = str(val or "")
    if s.startswith(("=", "+", "-", "@")):
        return f"'{s}"
    return s


@router.get("/export/applications.csv")
def export_applications_csv(
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.APPROVING_AUTHORITY.value])),
    db: Session = Depends(get_db)
):
    """Export applications as a CSV with formula injection protection and audit logging."""
    apps = db.query(Application).order_by(Application.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Application Number",
        "Institution Name",
        "Category",
        "Academic Year",
        "Status",
        "Title",
        "Compliance Score",
        "Created Date",
        "Submission Date"
    ])

    for a in apps:
        writer.writerow([
            sanitize_csv_field(a.application_number),
            sanitize_csv_field(a.institution.name if a.institution else "N/A"),
            sanitize_csv_field(a.category),
            sanitize_csv_field(a.academic_year),
            sanitize_csv_field(a.status),
            sanitize_csv_field(a.title),
            sanitize_csv_field(a.compliance_score),
            sanitize_csv_field(a.created_at.strftime("%Y-%m-%d %H:%M")),
            sanitize_csv_field(a.submission_date.strftime("%Y-%m-%d %H:%M") if a.submission_date else "Not Submitted")
        ])

    record_audit_event(
        db=db,
        action="APPLICATIONS_EXPORTED_CSV",
        entity_type="Report",
        entity_id="ALL_APPLICATIONS",
        actor=current_user,
        notes=f"Exported {len(apps)} applications to CSV."
    )
    db.commit()

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aicte_applications_export.csv"}
    )
