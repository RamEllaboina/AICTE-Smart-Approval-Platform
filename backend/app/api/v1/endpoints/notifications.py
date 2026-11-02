from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification, Deadline
from app.models.application import Application
from app.models.user import User, UserRoleEnum
from app.schemas.notification import NotificationOut, DeadlineOut
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/", response_model=List[NotificationOut])
def list_notifications(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve notifications addressed to the authenticated user."""
    notifications = (
        db.query(Notification)
        .filter(Notification.recipient_id == current_user.id)
        .order_by(Notification.read_at.asc(), Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return notifications


@router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an individual notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Notification marked as read."}


@router.post("/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications for current user as read."""
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.read_at.is_(None)
    ).update({"read_at": datetime.now(timezone.utc)})

    db.commit()
    return {"message": "All notifications marked as read."}


@router.get("/deadlines", response_model=List[DeadlineOut])
def get_deadlines(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve upcoming deadlines relevant to the user."""
    now = datetime.now(timezone.utc)
    query = db.query(Deadline).join(Application)

    role = current_user.primary_role
    if role == UserRoleEnum.INSTITUTION_ADMIN.value:
        query = query.filter(Application.institution_id == current_user.institution_id)
    elif role == UserRoleEnum.REVIEWER.value:
        query = query.filter(Deadline.target_entity_id == current_user.id)

    deadlines = query.filter(Deadline.is_completed.is_(False)).all()

    result = []
    for d in deadlines:
        dt = d.due_date.replace(tzinfo=timezone.utc) if d.due_date.tzinfo is None else d.due_date
        rem_hours = (dt - now).total_seconds() / 3600.0
        result.append(
            DeadlineOut(
                id=d.id,
                application_id=d.application_id,
                task_type=d.task_type,
                due_date=d.due_date,
                is_completed=d.is_completed,
                is_overdue=rem_hours < 0,
                hours_remaining=round(rem_hours, 1)
            )
        )
    return result
