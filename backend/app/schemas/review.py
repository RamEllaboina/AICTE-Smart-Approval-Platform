from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class DeficiencyCreate(BaseModel):
    rule_id: Optional[str] = None
    title: str = Field(..., min_length=3, max_length=255)
    description: str
    requested_correction: str
    severity: str = "HIGH"
    due_days: int = Field(default=7, ge=1, le=30)


class DeficiencyResponseCreate(BaseModel):
    response_notes: str
    supporting_document_id: Optional[str] = None


class DeficiencyResponseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    response_notes: str
    supporting_document_id: Optional[str] = None
    submitted_at: datetime


class DeficiencyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    rule_id: Optional[str] = None
    reviewer_id: Optional[str] = None
    title: str
    description: str
    requested_correction: str
    severity: str
    due_date: datetime
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    responses: List[DeficiencyResponseOut] = []


class ReviewCommentCreate(BaseModel):
    stage: str
    comment_type: str = "INTERNAL_OBSERVATION"  # INTERNAL_OBSERVATION, FORMAL_RECOMMENDATION
    content: str
    recommendation: Optional[str] = None  # RECOMMENDED, NOT_RECOMMENDED, DEFICIENCY_FOUND


class ReviewCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    reviewer_id: Optional[str] = None
    stage: str
    comment_type: str
    content: str
    recommendation: Optional[str] = None
    created_at: datetime


class AssignmentCreate(BaseModel):
    reviewer_id: str
    priority: str = "NORMAL"


class FinalDecisionRequest(BaseModel):
    decision: str  # APPROVED, REJECTED, RETURNED_FOR_CORRECTION
    reason: str
