from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    correlation_id: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    actor_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    ip_address: Optional[str] = None
    before_state_json: Optional[Dict[str, Any]] = None
    after_state_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime
