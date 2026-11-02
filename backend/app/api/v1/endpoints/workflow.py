from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.application import Application
from app.models.user import User
from app.schemas.workflow import TransitionRequest, TransitionHistoryOut
from app.api.deps import get_current_user, check_application_access
from app.services.workflow.engine import WorkflowEngine

router = APIRouter()


@router.post("/{application_id}/transition", response_model=TransitionHistoryOut)
def transition_application_state(
    application_id: str,
    request: TransitionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes a formal workflow transition. Enforces strict state graph and RBAC rules.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")

    check_application_access(application, current_user)

    engine = WorkflowEngine(db)
    history = engine.execute_transition(
        application=application,
        to_state=request.to_state,
        actor=current_user,
        reason=request.reason,
        metadata_json=request.metadata_json
    )

    db.commit()
    db.refresh(history)

    return TransitionHistoryOut(
        id=history.id,
        application_id=history.application_id,
        from_state=history.from_state,
        to_state=history.to_state,
        actor_id=history.actor_id,
        actor_role=history.actor_role,
        reason=history.reason,
        metadata_json=history.metadata_json,
        created_at=history.created_at
    )
