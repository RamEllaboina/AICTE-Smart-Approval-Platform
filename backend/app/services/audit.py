import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent
from app.models.user import User


def record_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    actor: Optional[User] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    actor_email: Optional[str] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    notes: Optional[str] = None,
    ip_address: Optional[str] = None,
    correlation_id: Optional[str] = None
) -> AuditEvent:
    """Record an immutable append-only audit event."""
    c_id = correlation_id or str(uuid.uuid4())
    a_id = actor.id if actor else actor_id
    a_role = actor.primary_role if actor else actor_role
    a_email = actor.email if actor else actor_email

    event = AuditEvent(
        correlation_id=c_id,
        actor_id=a_id,
        actor_role=a_role,
        actor_email=a_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        before_state_json=before_state,
        after_state_json=after_state,
        notes=notes
    )
    db.add(event)
    db.flush()
    return event
