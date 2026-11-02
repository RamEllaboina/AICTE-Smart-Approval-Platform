from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationStatusEnum
from app.models.workflow import ApplicationTransitionHistory
from app.models.user import User, UserRoleEnum
from app.core.exceptions import WorkflowTransitionException, ForbiddenException
from app.services.audit import record_audit_event
from app.models.notification import Notification, NotificationChannelEnum, NotificationPriorityEnum


# Explicit transition map: from_state -> {to_state: [allowed_roles]}
ALLOWED_TRANSITIONS: Dict[str, Dict[str, List[str]]] = {
    ApplicationStatusEnum.DRAFT.value: {
        ApplicationStatusEnum.SUBMITTED.value: [UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.SUBMITTED.value: {
        ApplicationStatusEnum.COMPLETENESS_CHECK.value: [UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.REVIEWER.value],
        ApplicationStatusEnum.PENDING_REVIEW.value: [UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.COMPLETENESS_CHECK.value: {
        ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value: [UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.REVIEWER.value],
        ApplicationStatusEnum.PENDING_REVIEW.value: [UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.REVIEWER.value]
    },
    ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value: {
        ApplicationStatusEnum.RESUBMITTED.value: [UserRoleEnum.INSTITUTION_ADMIN.value, UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.RESUBMITTED.value: {
        ApplicationStatusEnum.PENDING_REVIEW.value: [UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.REVIEWER.value],
        ApplicationStatusEnum.UNDER_REVIEW.value: [UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.PENDING_REVIEW.value: {
        ApplicationStatusEnum.UNDER_REVIEW.value: [UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.UNDER_REVIEW.value: {
        ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value: [UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value],
        ApplicationStatusEnum.REVIEW_COMPLETED.value: [UserRoleEnum.REVIEWER.value, UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.REVIEW_COMPLETED.value: {
        ApplicationStatusEnum.PENDING_FINAL_DECISION.value: [UserRoleEnum.SYSTEM_ADMIN.value, UserRoleEnum.APPROVING_AUTHORITY.value],
        ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value: [UserRoleEnum.APPROVING_AUTHORITY.value, UserRoleEnum.SYSTEM_ADMIN.value]
    },
    ApplicationStatusEnum.PENDING_FINAL_DECISION.value: {
        ApplicationStatusEnum.APPROVED.value: [UserRoleEnum.APPROVING_AUTHORITY.value, UserRoleEnum.SYSTEM_ADMIN.value],
        ApplicationStatusEnum.REJECTED.value: [UserRoleEnum.APPROVING_AUTHORITY.value, UserRoleEnum.SYSTEM_ADMIN.value],
        ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value: [UserRoleEnum.APPROVING_AUTHORITY.value, UserRoleEnum.SYSTEM_ADMIN.value]
    }
}


class WorkflowEngine:
    def __init__(self, db: Session):
        self.db = db

    def execute_transition(
        self,
        application: Application,
        to_state: str,
        actor: User,
        reason: Optional[str] = None,
        metadata_json: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> ApplicationTransitionHistory:
        """
        Executes a validated, role-enforced state transition inside an active database transaction.
        """
        from_state = application.status
        user_role = actor.primary_role

        # Check if from_state has any defined transitions
        valid_next_states = ALLOWED_TRANSITIONS.get(from_state, {})
        if to_state not in valid_next_states:
            raise WorkflowTransitionException(
                current_state=from_state,
                attempted_state=to_state,
                reason=f"Transition from '{from_state}' to '{to_state}' is not permitted by workflow state rules."
            )

        # Check role permission
        allowed_roles = valid_next_states[to_state]
        if user_role not in allowed_roles:
            raise ForbiddenException(
                f"Role '{user_role}' is not authorized to transition application from '{from_state}' to '{to_state}'."
            )

        # Additional domain checks:
        if to_state == ApplicationStatusEnum.SUBMITTED.value:
            application.submission_date = datetime.now(timezone.utc)

        before_state = {
            "status": from_state,
            "current_revision": application.current_revision,
            "compliance_score": application.compliance_score
        }

        # Apply state change
        application.status = to_state
        application.current_revision += 1

        after_state = {
            "status": to_state,
            "current_revision": application.current_revision,
            "compliance_score": application.compliance_score
        }

        # Record immutable transition history
        history = ApplicationTransitionHistory(
            application_id=application.id,
            from_state=from_state,
            to_state=to_state,
            actor_id=actor.id,
            actor_role=user_role,
            reason=reason or f"Transitioned from {from_state} to {to_state}",
            metadata_json=metadata_json or {}
        )
        self.db.add(history)

        # Record audit event
        record_audit_event(
            db=self.db,
            action=f"APPLICATION_STATE_CHANGE_{to_state}",
            entity_type="Application",
            entity_id=application.id,
            actor=actor,
            before_state=before_state,
            after_state=after_state,
            notes=reason,
            ip_address=ip_address
        )

        # Generate notifications for key transition events
        self._notify_on_transition(application, from_state, to_state, actor)

        self.db.flush()
        return history

    def _notify_on_transition(self, application: Application, from_state: str, to_state: str, actor: User):
        """Create relevant notifications for institution or reviewers on status changes."""
        institution_admin_members = [
            m.user_id for m in application.institution.members if m.user_id != actor.id
        ] if application.institution else []

        if to_state == ApplicationStatusEnum.RETURNED_FOR_CORRECTION.value:
            for uid in institution_admin_members:
                self.db.add(Notification(
                    recipient_id=uid,
                    title="Application Returned for Correction",
                    message=f"Application '{application.application_number}' has been returned for correction. Please review the deficiency notice.",
                    notification_type="APPLICATION_RETURNED",
                    channel=NotificationChannelEnum.IN_APP.value,
                    priority=NotificationPriorityEnum.HIGH.value,
                    link_url=f"/applications/{application.id}/deficiencies"
                ))

        elif to_state == ApplicationStatusEnum.APPROVED.value:
            for uid in institution_admin_members:
                self.db.add(Notification(
                    recipient_id=uid,
                    title="Application Approved!",
                    message=f"Congratulations! Application '{application.application_number}' has been formally APPROVED by the Approving Authority.",
                    notification_type="APPLICATION_APPROVED",
                    channel=NotificationChannelEnum.IN_APP.value,
                    priority=NotificationPriorityEnum.HIGH.value,
                    link_url=f"/applications/{application.id}"
                ))

        elif to_state == ApplicationStatusEnum.REJECTED.value:
            for uid in institution_admin_members:
                self.db.add(Notification(
                    recipient_id=uid,
                    title="Application Decision: Rejected",
                    message=f"Application '{application.application_number}' was not approved. Please consult the decision rationale.",
                    notification_type="APPLICATION_REJECTED",
                    channel=NotificationChannelEnum.IN_APP.value,
                    priority=NotificationPriorityEnum.HIGH.value,
                    link_url=f"/applications/{application.id}"
                ))

        elif to_state == ApplicationStatusEnum.SUBMITTED.value:
            for uid in institution_admin_members:
                self.db.add(Notification(
                    recipient_id=uid,
                    title="Application Successfully Submitted",
                    message=f"Your application '{application.application_number}' has been successfully submitted for processing.",
                    notification_type="SUBMISSION_CONFIRMATION",
                    channel=NotificationChannelEnum.IN_APP.value,
                    priority=NotificationPriorityEnum.NORMAL.value,
                    link_url=f"/applications/{application.id}"
                ))
