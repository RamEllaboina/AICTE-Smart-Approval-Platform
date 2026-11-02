from typing import Dict, List, Any
from pydantic import BaseModel


class InstitutionStats(BaseModel):
    total_applications: int
    draft_count: int
    under_review_count: int
    returned_for_correction_count: int
    approved_count: int
    rejected_count: int
    pending_deficiencies_count: int
    unread_notifications_count: int


class ReviewerStats(BaseModel):
    assigned_count: int
    under_scrutiny_count: int
    review_completed_count: int
    overdue_count: int
    open_deficiencies_count: int


class BottleneckIndicator(BaseModel):
    stage: str
    stage_label: str
    active_count: int
    avg_hours_in_stage: float
    target_sla_hours: int
    is_bottleneck: bool
    status_level: str  # NORMAL, WARNING, CRITICAL


class AdminDashboardStats(BaseModel):
    total_applications: int
    status_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    average_processing_days: float
    overdue_count: int
    bottlenecks: List[BottleneckIndicator]
    reviewer_workloads: List[Dict[str, Any]]
