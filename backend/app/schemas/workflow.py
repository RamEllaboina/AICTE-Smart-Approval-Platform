from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class TransitionRequest(BaseModel):
    to_state: str
    reason: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class TransitionHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    from_state: str
    to_state: str
    actor_id: Optional[str] = None
    actor_role: str
    reason: Optional[str] = None
    metadata_json: Dict[str, Any]
    created_at: datetime
