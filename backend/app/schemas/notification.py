from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    notification_type: str
    channel: str
    priority: str
    read_at: Optional[datetime] = None
    link_url: Optional[str] = None
    created_at: datetime


class DeadlineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    task_type: str
    due_date: datetime
    is_completed: bool
    is_overdue: bool
    hours_remaining: float
