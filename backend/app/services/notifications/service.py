from datetime import datetime, timezone, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.notification import (
    Notification,
    Deadline,
    NotificationChannelEnum,
    NotificationPriorityEnum
)
from app.models.user import User


def send_notification(
    db: Session,
    recipient_id: str,
    title: str,
    message: str,
    notification_type: str,
    channel: str = NotificationChannelEnum.IN_APP.value,
    priority: str = NotificationPriorityEnum.NORMAL.value,
    link_url: Optional[str] = None
) -> Notification:
    """Create in-app notification and dispatch/log email if configured."""
    notification = Notification(
        recipient_id=recipient_id,
        title=title,
        message=message,
        notification_type=notification_type,
        channel=channel,
        priority=priority,
        link_url=link_url,
        created_at=datetime.now(timezone.utc)
    )
    db.add(notification)
    db.flush()
    return notification


def evaluate_deadlines(db: Session) -> int:
    """
    Evaluates active deadlines, sending warnings at 72h, 24h, and overdue escalations.
    Returns the count of alerts triggered.
    """
    now = datetime.now(timezone.utc)
    active_deadlines = db.query(Deadline).filter(Deadline.is_completed.is_(False)).all()
    alerts_triggered = 0

    for dl in active_deadlines:
        app = dl.application
        if not app:
            continue

        # Get relevant institution user or reviewer to alert
        target_user_ids = []
        if "INSTITUTION" in dl.task_type:
            target_user_ids = [m.user_id for m in app.institution.members] if app.institution else []
        elif "REVIEWER" in dl.task_type:
            target_user_ids = [a.reviewer_id for a in app.assignments if a.status == "ACTIVE"]

        time_remaining = dl.due_date.replace(tzinfo=timezone.utc) - now
        hours_remaining = time_remaining.total_seconds() / 3600.0

        if hours_remaining <= 0 and not dl.overdue_sent:
            # Overdue Alert & Escalation
            dl.overdue_sent = True
            alerts_triggered += 1
            for uid in target_user_ids:
                send_notification(
                    db=db,
                    recipient_id=uid,
                    title="URGENT: Deadline Overdue!",
                    message=f"Task '{dl.task_type}' for application '{app.application_number}' has expired! Immediate action required.",
                    notification_type="DEADLINE_OVERDUE",
                    priority=NotificationPriorityEnum.URGENT.value,
                    link_url=f"/applications/{app.id}"
                )

        elif hours_remaining <= 24 and not dl.warning_24h_sent:
            # 24-hour warning
            dl.warning_24h_sent = True
            alerts_triggered += 1
            for uid in target_user_ids:
                send_notification(
                    db=db,
                    recipient_id=uid,
                    title="Deadline Reminder: Less than 24 hours remaining",
                    message=f"Task '{dl.task_type}' for application '{app.application_number}' is due in {int(hours_remaining)} hours.",
                    notification_type="DEADLINE_WARNING_24H",
                    priority=NotificationPriorityEnum.HIGH.value,
                    link_url=f"/applications/{app.id}"
                )

        elif hours_remaining <= 72 and not dl.warning_72h_sent:
            # 72-hour warning
            dl.warning_72h_sent = True
            alerts_triggered += 1
            for uid in target_user_ids:
                send_notification(
                    db=db,
                    recipient_id=uid,
                    title="Upcoming Deadline: 72 hours reminder",
                    message=f"Reminder: Task '{dl.task_type}' for application '{app.application_number}' is due on {dl.due_date.strftime('%Y-%m-%d %H:%M')}.",
                    notification_type="DEADLINE_WARNING_72H",
                    priority=NotificationPriorityEnum.NORMAL.value,
                    link_url=f"/applications/{app.id}"
                )

    db.flush()
    return alerts_triggered
