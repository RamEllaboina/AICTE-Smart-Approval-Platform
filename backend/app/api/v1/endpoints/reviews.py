from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application, ApplicationStatusEnum
from app.models.review import (
    ReviewerAssignment,
    ReviewComment,
    Deficiency,
    DeficiencyResponse,
    DeficiencyStatusEnum,
    AssignmentStatusEnum,
    RecommendationEnum
)
from app.models.user import User, UserRoleEnum
from app.models.notification import Deadline, NotificationChannelEnum, NotificationPriorityEnum
from app.schemas.review import (
    DeficiencyCreate,
    DeficiencyOut,
    DeficiencyResponseCreate,
    ReviewCommentCreate,
    ReviewCommentOut,
    AssignmentCreate,
    FinalDecisionRequest
)
from app.schemas.application import ApplicationOut
from app.api.deps import get_current_user, require_role, check_application_access
from app.services.audit import record_audit_event
from app.services.workflow.engine import WorkflowEngine
from app.services.notifications.service import send_notification

router = APIRouter()


@router.get("/assigned", response_model=List[ApplicationOut])
def get_assigned_reviews(
    current_user: User = Depends(require_role([UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Retrieve list of applications actively assigned to current reviewer."""
    apps = (
        db.query(Application)
        .join(ReviewerAssignment, ReviewerAssignment.application_id == Application.id)
        .filter(
            ReviewerAssignment.reviewer_id == current_user.id,
            ReviewerAssignment.status == AssignmentStatusEnum.ACTIVE.value
        )
        .all()
    )

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


@router.post("/{application_id}/assign", status_code=status.HTTP_201_CREATED)
def assign_reviewer(
    application_id: str,
    assign_in: AssignmentCreate,
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Admin assigns an authorized reviewer to an application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    reviewer = db.query(User).filter(User.id == assign_in.reviewer_id).first()
    if not reviewer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reviewer user not found.")

    assignment = ReviewerAssignment(
        application_id=application.id,
        reviewer_id=reviewer.id,
        assigned_by_id=current_user.id,
        status=AssignmentStatusEnum.ACTIVE.value,
        priority=assign_in.priority
    )
    db.add(assignment)

    # Automatically set a review scrutiny deadline (7 days from assignment)
    due_dt = datetime.now(timezone.utc) + timedelta(days=7)
    application.deadline_date = due_dt

    deadline = Deadline(
        application_id=application.id,
        task_type="REVIEWER_SCRUTINY",
        target_entity_id=reviewer.id,
        due_date=due_dt
    )
    db.add(deadline)

    # Notify Reviewer
    send_notification(
        db=db,
        recipient_id=reviewer.id,
        title="New Application Assigned for Review",
        message=f"Application '{application.application_number}' has been assigned to you for scrutiny.",
        notification_type="REVIEW_ASSIGNED",
        priority=NotificationPriorityEnum.HIGH.value,
        link_url=f"/reviewer/applications/{application.id}"
    )

    record_audit_event(
        db=db,
        action="REVIEWER_ASSIGNED",
        entity_type="Application",
        entity_id=application.id,
        actor=current_user,
        notes=f"Reviewer {reviewer.full_name} assigned by {current_user.email}."
    )

    db.commit()
    return {"message": f"Reviewer {reviewer.full_name} assigned successfully."}


@router.post("/{application_id}/comments", response_model=ReviewCommentOut, status_code=status.HTTP_201_CREATED)
def add_review_comment(
    application_id: str,
    comment_in: ReviewCommentCreate,
    current_user: User = Depends(require_role([UserRoleEnum.REVIEWER.value, UserRoleEnum.APPROVING_AUTHORITY.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Record reviewer observation or formal recommendation."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    comment = ReviewComment(
        application_id=application.id,
        reviewer_id=current_user.id,
        stage=comment_in.stage,
        comment_type=comment_in.comment_type,
        content=comment_in.content,
        recommendation=comment_in.recommendation,
        created_at=datetime.now(timezone.utc)
    )
    db.add(comment)

    record_audit_event(
        db=db,
        action="REVIEW_COMMENT_RECORDED",
        entity_type="ReviewComment",
        entity_id=application.id,
        actor=current_user,
        notes=f"{comment_in.comment_type} recorded with recommendation: {comment_in.recommendation}."
    )

    db.commit()
    db.refresh(comment)
    return comment


@router.get("/{application_id}/comments", response_model=List[ReviewCommentOut])
def list_review_comments(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve observations and recommendations recorded on the application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)
    return application.comments


@router.post("/{application_id}/deficiencies", response_model=DeficiencyOut, status_code=status.HTTP_201_CREATED)
def issue_deficiency(
    application_id: str,
    def_in: DeficiencyCreate,
    current_user: User = Depends(require_role([UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Issue a deficiency notice to the applicant institution."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    due_dt = datetime.now(timezone.utc) + timedelta(days=def_in.due_days)

    deficiency = Deficiency(
        application_id=application.id,
        rule_id=def_in.rule_id,
        reviewer_id=current_user.id,
        title=def_in.title,
        description=def_in.description,
        requested_correction=def_in.requested_correction,
        severity=def_in.severity,
        due_date=due_dt,
        status=DeficiencyStatusEnum.OPEN.value
    )
    db.add(deficiency)
    db.flush()

    # Track deadline
    deadline = Deadline(
        application_id=application.id,
        task_type="INSTITUTION_DEFICIENCY_RESPONSE",
        target_entity_id=deficiency.id,
        due_date=due_dt
    )
    db.add(deadline)

    # Transition application state to RETURNED_FOR_CORRECTION if not already
    wf = WorkflowEngine(db)
    if application.status != ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value:
        try:
            wf.execute_transition(
                application=application,
                to_state=ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value,
                actor=current_user,
                reason=f"Deficiency issued: {def_in.title}"
            )
        except Exception:
            pass  # If state transition not strictly permissible, deficiency is still issued

    # Notify institution administrators
    if application.institution:
        for member in application.institution.members:
            send_notification(
                db=db,
                recipient_id=member.user_id,
                title="Deficiency Notice Issued",
                message=f"Application '{application.application_number}' has a new deficiency: {def_in.title}. Due date: {due_dt.strftime('%Y-%m-%d')}.",
                notification_type="DEFICIENCY_ISSUED",
                priority=NotificationPriorityEnum.HIGH.value,
                link_url=f"/applications/{application.id}/deficiencies"
            )

    record_audit_event(
        db=db,
        action="DEFICIENCY_ISSUED",
        entity_type="Deficiency",
        entity_id=deficiency.id,
        actor=current_user,
        notes=f"Deficiency '{def_in.title}' issued to institution."
    )

    db.commit()
    db.refresh(deficiency)
    return deficiency


@router.get("/{application_id}/deficiencies", response_model=List[DeficiencyOut])
def list_deficiencies(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all deficiencies recorded for an application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)
    return application.deficiencies


@router.post("/deficiencies/{deficiency_id}/respond", status_code=status.HTTP_200_OK)
def respond_to_deficiency(
    deficiency_id: str,
    resp_in: DeficiencyResponseCreate,
    current_user: User = Depends(require_role([UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Institution responds to an open deficiency notice."""
    deficiency = db.query(Deficiency).filter(Deficiency.id == deficiency_id).first()
    if not deficiency:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deficiency not found.")

    check_application_access(deficiency.application, current_user)

    response = DeficiencyResponse(
        deficiency_id=deficiency.id,
        institution_user_id=current_user.id,
        response_notes=resp_in.response_notes,
        supporting_document_id=resp_in.supporting_document_id,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(response)

    deficiency.status = DeficiencyStatusEnum.SUBMITTED.value

    # Mark associated deadline completed
    dl = db.query(Deadline).filter(Deadline.target_entity_id == deficiency.id).first()
    if dl:
        dl.is_completed = True

    # Notify reviewer if assigned
    if deficiency.reviewer_id:
        send_notification(
            db=db,
            recipient_id=deficiency.reviewer_id,
            title="Deficiency Rectification Submitted",
            message=f"Institution responded to deficiency '{deficiency.title}' on application '{deficiency.application.application_number}'.",
            notification_type="DEFICIENCY_RESPONDED",
            priority=NotificationPriorityEnum.HIGH.value,
            link_url=f"/reviewer/applications/{deficiency.application_id}"
        )

    record_audit_event(
        db=db,
        action="DEFICIENCY_RESPONSE_SUBMITTED",
        entity_type="Deficiency",
        entity_id=deficiency.id,
        actor=current_user,
        notes="Institution submitted response and rectification notes."
    )

    db.commit()
    return {"message": "Deficiency response submitted successfully."}


@router.post("/{application_id}/final-decision")
def record_final_decision(
    application_id: str,
    decision_in: FinalDecisionRequest,
    current_user: User = Depends(require_role([UserRoleEnum.APPROVING_AUTHORITY.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Approving Authority records authorized final decision (APPROVED / REJECTED / RETURNED_FOR_CORRECTION)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    target_state = decision_in.decision
    if target_state not in [
        ApplicationStatusEnum.APPROVED.value,
        ApplicationStatusEnum.REJECTED.value,
        ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be one of: APPROVED, REJECTED, RETURNED_FOR_CORRECTION."
        )

    # Record decision comment
    comment = ReviewComment(
        application_id=application.id,
        reviewer_id=current_user.id,
        stage="FINAL_DECISION",
        comment_type="FINAL_DECISION_NOTE",
        content=decision_in.reason,
        recommendation=target_state,
        created_at=datetime.now(timezone.utc)
    )
    db.add(comment)

    # Execute state machine transition
    wf = WorkflowEngine(db)
    wf.execute_transition(
        application=application,
        to_state=target_state,
        actor=current_user,
        reason=f"Approving Authority Decision: {target_state}. Rationale: {decision_in.reason}"
    )

    db.commit()
    return {"message": f"Final decision '{target_state}' recorded successfully."}
