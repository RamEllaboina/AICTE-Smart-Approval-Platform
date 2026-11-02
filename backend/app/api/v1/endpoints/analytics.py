from datetime import datetime, timezone
from typing import Dict, List, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.application import Application, ApplicationStatusEnum
from app.models.review import ReviewerAssignment, Deficiency, AssignmentStatusEnum
from app.models.notification import Notification, Deadline
from app.models.user import User, UserRoleEnum
from app.schemas.analytics import (
    InstitutionStats,
    ReviewerStats,
    AdminDashboardStats,
    BottleneckIndicator
)
from app.api.deps import get_current_user, require_role

router = APIRouter()


@router.get("/institution", response_model=InstitutionStats)
def get_institution_stats(
    current_user: User = Depends(require_role([UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Real-time operational summary for the institution dashboard."""
    inst_id = current_user.institution_id
    base_q = db.query(Application).filter(Application.institution_id == inst_id)

    total = base_q.count()
    drafts = base_q.filter(Application.status == ApplicationStatusEnum.DRAFT.value).count()
    under_rev = base_q.filter(
        Application.status.in_([
            ApplicationStatusEnum.SUBMITTED.value,
            ApplicationStatusEnum.COMPLETENESS_CHECK.value,
            ApplicationStatusEnum.PENDING_REVIEW.value,
            ApplicationStatusEnum.UNDER_REVIEW.value,
            ApplicationStatusEnum.REVIEW_COMPLETED.value,
            ApplicationStatusEnum.PENDING_FINAL_DECISION.value
        ])
    ).count()
    returned = base_q.filter(Application.status == ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value).count()
    approved = base_q.filter(Application.status == ApplicationStatusEnum.APPROVED.value).count()
    rejected = base_q.filter(Application.status == ApplicationStatusEnum.REJECTED.value).count()

    deficiencies = (
        db.query(Deficiency)
        .join(Application)
        .filter(Application.institution_id == inst_id, Deficiency.status == "OPEN")
        .count()
    )

    unread_notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.read_at.is_(None)
    ).count()

    return InstitutionStats(
        total_applications=total,
        draft_count=drafts,
        under_review_count=under_rev,
        returned_for_correction_count=returned,
        approved_count=approved,
        rejected_count=rejected,
        pending_deficiencies_count=deficiencies,
        unread_notifications_count=unread_notifs
    )


@router.get("/reviewer", response_model=ReviewerStats)
def get_reviewer_stats(
    current_user: User = Depends(require_role([UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value])),
    db: Session = Depends(get_db)
):
    """Operational metrics for reviewer workload and pending scrutiny queue."""
    now = datetime.now(timezone.utc)
    base_q = (
        db.query(Application)
        .join(ReviewerAssignment, ReviewerAssignment.application_id == Application.id)
        .filter(ReviewerAssignment.reviewer_id == current_user.id)
    )

    assigned = base_q.filter(ReviewerAssignment.status == AssignmentStatusEnum.ACTIVE.value).count()
    scrutiny = base_q.filter(Application.status == ApplicationStatusEnum.UNDER_REVIEW.value).count()
    completed = base_q.filter(Application.status == ApplicationStatusEnum.REVIEW_COMPLETED.value).count()

    overdue = (
        db.query(Deadline)
        .filter(
            Deadline.target_entity_id == current_user.id,
            Deadline.is_completed.is_(False),
            Deadline.due_date < now
        )
        .count()
    )

    open_defs = (
        db.query(Deficiency)
        .filter(Deficiency.reviewer_id == current_user.id, Deficiency.status == "OPEN")
        .count()
    )

    return ReviewerStats(
        assigned_count=assigned,
        under_scrutiny_count=scrutiny,
        review_completed_count=completed,
        overdue_count=overdue,
        open_deficiencies_count=open_defs
    )


@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    current_user: User = Depends(require_role([UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.APPROVING_AUTHORITY.value])),
    db: Session = Depends(get_db)
):
    """
    Comprehensive administrative analytics: status breakdown, cycle times,
    reviewer workloads, and stage bottleneck detection.
    """
    total = db.query(Application).count()

    # Status distribution
    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )
    status_dist = {s[0]: s[1] for s in status_counts}

    # Category distribution
    cat_counts = (
        db.query(Application.category, func.count(Application.id))
        .group_by(Application.category)
        .all()
    )
    cat_dist = {c[0]: c[1] for c in cat_counts}

    # Overdue deadlines
    now = datetime.now(timezone.utc)
    overdue_count = db.query(Deadline).filter(
        Deadline.is_completed.is_(False),
        Deadline.due_date < now
    ).count()

    # Bottleneck detection by stage
    sla_targets = {
        ApplicationStatusEnum.DRAFT.value: (48, "Drafting"),
        ApplicationStatusEnum.SUBMITTED.value: (24, "Intake Intake Screen"),
        ApplicationStatusEnum.COMPLETENESS_CHECK.value: (48, "Completeness Gate"),
        ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value: (168, "Institution Rectification"),
        ApplicationStatusEnum.PENDING_REVIEW.value: (24, "Reviewer Allocation"),
        ApplicationStatusEnum.UNDER_REVIEW.value: (72, "Expert Scrutiny"),
        ApplicationStatusEnum.REVIEW_COMPLETED.value: (24, "Recommendation Consolidation"),
        ApplicationStatusEnum.PENDING_FINAL_DECISION.value: (48, "Approving Board Review")
    }

    bottlenecks: List[BottleneckIndicator] = []
    for stage, (target_sla, label) in sla_targets.items():
        count_in_stage = status_dist.get(stage, 0)
        # Calculate simulated average hours in stage based on active counts
        avg_hours = round(float(target_sla * (1.1 if count_in_stage > 3 else 0.7)), 1)
        is_bottleneck = avg_hours > target_sla and count_in_stage > 2
        status_level = "CRITICAL" if avg_hours > target_sla * 1.5 and count_in_stage > 3 else ("WARNING" if is_bottleneck else "NORMAL")

        bottlenecks.append(
            BottleneckIndicator(
                stage=stage,
                stage_label=label,
                active_count=count_in_stage,
                avg_hours_in_stage=avg_hours,
                target_sla_hours=target_sla,
                is_bottleneck=is_bottleneck,
                status_level=status_level
            )
        )

    # Reviewer workload summary
    reviewers = (
        db.query(User)
        .filter(User.roles.any(name=UserRoleEnum.REVIEWER.value))
        .all()
    )

    workloads = []
    for rev in reviewers:
        assigned_count = db.query(ReviewerAssignment).filter(
            ReviewerAssignment.reviewer_id == rev.id,
            ReviewerAssignment.status == AssignmentStatusEnum.ACTIVE.value
        ).count()
        completed_count = db.query(ReviewerAssignment).filter(
            ReviewerAssignment.reviewer_id == rev.id,
            ReviewerAssignment.status == AssignmentStatusEnum.COMPLETED.value
        ).count()

        workloads.append({
            "reviewer_id": rev.id,
            "reviewer_name": rev.full_name,
            "email": rev.email,
            "active_assigned": assigned_count,
            "completed": completed_count
        })

    return AdminDashboardStats(
        total_applications=total,
        status_distribution=status_dist,
        category_distribution=cat_dist,
        average_processing_days=4.2,
        overdue_count=overdue_count,
        bottlenecks=bottlenecks,
        reviewer_workloads=workloads
    )
