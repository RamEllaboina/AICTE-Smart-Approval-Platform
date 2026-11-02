import pytest
from app.models.application import Application, ApplicationStatusEnum
from app.models.user import User
from app.services.workflow.engine import WorkflowEngine
from app.core.exceptions import WorkflowTransitionException, ForbiddenException


def test_invalid_workflow_jump_rejected(db_session):
    """An institution or reviewer must NOT be able to jump directly from DRAFT to APPROVED."""
    draft_app = db_session.query(Application).filter(Application.status == ApplicationStatusEnum.DRAFT.value).first()
    inst_user = db_session.query(User).filter(User.email == "principal@delhitechnical.edu.in").first()

    engine = WorkflowEngine(db_session)
    with pytest.raises(WorkflowTransitionException):
        engine.execute_transition(
            application=draft_app,
            to_state=ApplicationStatusEnum.APPROVED.value,
            actor=inst_user
        )


def test_institution_cannot_approve_application(db_session):
    """Only Approving Authority can approve applications."""
    inst_user = db_session.query(User).filter(User.email == "principal@delhitechnical.edu.in").first()
    pending_app = db_session.query(Application).filter(Application.status == ApplicationStatusEnum.PENDING_FINAL_DECISION.value).first()

    if not pending_app:
        pending_app = Application(
            application_number="TEST-PENDING-01",
            institution_id=inst_user.institution_id,
            status=ApplicationStatusEnum.PENDING_FINAL_DECISION.value,
            title="Pending App"
        )
        db_session.add(pending_app)
        db_session.flush()

    engine = WorkflowEngine(db_session)
    with pytest.raises(ForbiddenException):
        engine.execute_transition(
            application=pending_app,
            to_state=ApplicationStatusEnum.APPROVED.value,
            actor=inst_user
        )


def test_approving_authority_can_approve(db_session):
    approver = db_session.query(User).filter(User.email == "approver@aicte.gov.in").first()
    pending_app = db_session.query(Application).filter(Application.status == ApplicationStatusEnum.PENDING_FINAL_DECISION.value).first()

    engine = WorkflowEngine(db_session)
    history = engine.execute_transition(
        application=pending_app,
        to_state=ApplicationStatusEnum.APPROVED.value,
        actor=approver,
        reason="Approved after meeting all statutory requirements."
    )

    assert pending_app.status == ApplicationStatusEnum.APPROVED.value
    assert history.to_state == ApplicationStatusEnum.APPROVED.value
