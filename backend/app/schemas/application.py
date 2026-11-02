from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class ApplicationCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    category: str = "NEW_PROGRAM"  # NEW_PROGRAM, INTAKE_MODIFICATION, INSTITUTION_UPDATE
    academic_year: str = "2026-2027"
    details_json: Dict[str, Any] = Field(default_factory=dict)


class ApplicationUpdate(BaseModel):
    title: Optional[str] = None
    details_json: Optional[Dict[str, Any]] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_number: str
    institution_id: str
    institution_name: Optional[str] = None
    category: str
    academic_year: str
    status: str
    title: str
    current_revision: int
    compliance_score: float
    submission_date: Optional[datetime] = None
    deadline_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class DocumentSimpleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    title: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    sha256_checksum: str
    is_verified: bool
    created_at: datetime


class TransitionHistorySimpleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    from_state: str
    to_state: str
    actor_role: str
    reason: Optional[str] = None
    created_at: datetime


class ApplicationDetailOut(ApplicationOut):
    details_json: Dict[str, Any]
    documents: List[DocumentSimpleOut] = []
    transition_history: List[TransitionHistorySimpleOut] = []
    has_unresolved_deficiencies: bool = False
    assigned_reviewer_name: Optional[str] = None
