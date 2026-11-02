import random
import string
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.application import Application, ApplicationStatusEnum, ApplicationRevision
from app.models.user import User, UserRoleEnum
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationOut,
    ApplicationDetailOut,
    DocumentSimpleOut,
    TransitionHistorySimpleOut
)
from app.api.deps import get_current_user, check_application_access, require_role
from app.services.audit import record_audit_event
from app.services.workflow.engine import WorkflowEngine
from app.services.compliance.engine import ComplianceEngine

router = APIRouter()


def generate_application_number() -> str:
    """Generate professional synthetic AICTE application reference number."""
    rand_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"AICTE-2026-{rand_chars}"


@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(require_role([UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Create a new draft approval application for the current institution."""
    if not current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create application: User is not linked to any institution."
        )

    app_number = generate_application_number()

    application = Application(
        application_number=app_number,
        institution_id=current_user.institution_id,
        category=app_in.category,
        academic_year=app_in.academic_year,
        status=ApplicationStatusEnum.DRAFT.value,
        title=app_in.title,
        details_json=app_in.details_json,
        current_revision=1,
        created_by_id=current_user.id
    )
    db.add(application)
    db.flush()

    # Initial revision snapshot
    revision = ApplicationRevision(
        application_id=application.id,
        revision_number=1,
        snapshot_json={
            "title": application.title,
            "category": application.category,
            "details_json": application.details_json
        },
        created_at=datetime.now(timezone.utc),
        created_by_id=current_user.id
    )
    db.add(revision)

    record_audit_event(
        db=db,
        action="APPLICATION_DRAFT_CREATED",
        entity_type="Application",
        entity_id=application.id,
        actor=current_user,
        notes=f"Draft application {app_number} initiated by {current_user.email}."
    )
    db.commit()
    db.refresh(application)

    return ApplicationOut(
        id=application.id,
        application_number=application.application_number,
        institution_id=application.institution_id,
        institution_name=application.institution.name if application.institution else None,
        category=application.category,
        academic_year=application.academic_year,
        status=application.status,
        title=application.title,
        current_revision=application.current_revision,
        compliance_score=application.compliance_score,
        submission_date=application.submission_date,
        deadline_date=application.deadline_date,
        created_at=application.created_at,
        updated_at=application.updated_at
    )


@router.get("/", response_model=List[ApplicationOut])
def list_applications(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_filter: Optional[str] = Query(None, alias="category"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List applications filtered by user's role and search criteria.
    - Institution Admin: Only own institution's applications.
    - Reviewer: Assigned applications only.
    - Approving Authority / System Admin: All applications.
    """
    query = db.query(Application)

    role = current_user.primary_role
    if role == UserRoleEnum.INSTITUTION_ADMIN.value:
        query = query.filter(Application.institution_id == current_user.institution_id)
    elif role == UserRoleEnum.REVIEWER.value:
        query = query.filter(Application.assignments.any(reviewer_id=current_user.id))

    if status_filter:
        query = query.filter(Application.status == status_filter)
    if category_filter:
        query = query.filter(Application.category == category_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Application.application_number.ilike(search_pattern),
                Application.title.ilike(search_pattern)
            )
        )

    apps = query.order_by(Application.created_at.desc()).offset(skip).limit(limit).all()

    return [
        ApplicationOut(
            id=a.id,
            application_number=a.application_number,
            institution_id=a.institution_id,
            institution_name=a.institution.name if a.institution else None,
            category=a.category,
            academic_year=a.academic_year,
            status=a.status,
            title=a.title,
            current_revision=a.current_revision,
            compliance_score=a.compliance_score,
            submission_date=a.submission_date,
            deadline_date=a.deadline_date,
            created_at=a.created_at,
            updated_at=a.updated_at
        )
        for a in apps
    ]


@router.get("/{application_id}", response_model=ApplicationDetailOut)
def get_application_detail(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full details of an application, verifying resource-level authorization."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    assigned_rev = next((a.reviewer.full_name for a in application.assignments if a.status == "ACTIVE" and a.reviewer), None)
    has_deficiencies = any(d.status == "OPEN" for d in application.deficiencies)

    return ApplicationDetailOut(
        id=application.id,
        application_number=application.application_number,
        institution_id=application.institution_id,
        institution_name=application.institution.name if application.institution else None,
        category=application.category,
        academic_year=application.academic_year,
        status=application.status,
        title=application.title,
        current_revision=application.current_revision,
        compliance_score=application.compliance_score,
        submission_date=application.submission_date,
        deadline_date=application.deadline_date,
        created_at=application.created_at,
        updated_at=application.updated_at,
        details_json=application.details_json or {},
        documents=[
            DocumentSimpleOut(
                id=d.id,
                category=d.category,
                title=d.title,
                file_name=d.file_name,
                file_size_bytes=d.file_size_bytes,
                mime_type=d.mime_type,
                sha256_checksum=d.sha256_checksum,
                is_verified=d.is_verified,
                created_at=d.created_at
            )
            for d in application.documents
        ],
        transition_history=[
            TransitionHistorySimpleOut(
                id=h.id,
                from_state=h.from_state,
                to_state=h.to_state,
                actor_role=h.actor_role,
                reason=h.reason,
                created_at=h.created_at
            )
            for h in application.transition_history
        ],
        has_unresolved_deficiencies=has_deficiencies,
        assigned_reviewer_name=assigned_rev
    )


@router.patch("/{application_id}", response_model=ApplicationDetailOut)
def update_application(
    application_id: str,
    update_in: ApplicationUpdate,
    current_user: User = Depends(require_role([UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Update draft application fields. Only allowed in DRAFT or RETURNED_FOR_CORRECTION states."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    if application.status not in [ApplicationStatusEnum.DRAFT.value, ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application in status '{application.status}' cannot be modified. Only DRAFT or RETURNED_FOR_CORRECTION can be edited."
        )

    if update_in.title is not None:
        application.title = update_in.title
    if update_in.details_json is not None:
        # Merge or replace details
        merged = dict(application.details_json or {})
        merged.update(update_in.details_json)
        application.details_json = merged

    # Automatically re-run compliance to update readiness score
    engine = ComplianceEngine(db)
    engine.evaluate_application(application, current_user)

    db.commit()
    db.refresh(application)
    return get_application_detail(application_id, current_user, db)


@router.post("/{application_id}/submit", response_model=ApplicationDetailOut)
def submit_application(
    application_id: str,
    current_user: User = Depends(require_role([UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """
    Submits draft application. Evaluates compliance rules and transitions status to SUBMITTED.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    # Run compliance engine
    engine = ComplianceEngine(db)
    evaluation = engine.evaluate_application(application, current_user)

    # Execute workflow transition
    wf = WorkflowEngine(db)
    target_state = ApplicationStatusEnum.RESUBMITTED.value if application.status == ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value else ApplicationStatusEnum.SUBMITTED.value

    wf.execute_transition(
        application=application,
        to_state=target_state,
        actor=current_user,
        reason="Institutional submission following compliance validation."
    )

    db.commit()
    db.refresh(application)
    return get_application_detail(application_id, current_user, db)
