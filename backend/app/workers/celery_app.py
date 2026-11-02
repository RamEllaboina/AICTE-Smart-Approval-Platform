import os
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "aicte_approval_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "evaluate-deadlines-every-hour": {
            "task": "app.workers.celery_app.scheduled_deadline_evaluation",
            "schedule": 3600.0,  # every hour
        },
    }
)


@celery_app.task
def scheduled_deadline_evaluation():
    """Celery beat periodic task for evaluating approaching and overdue deadlines."""
    from app.db.session import SessionLocal
    from app.services.notifications.service import evaluate_deadlines

    db = SessionLocal()
    try:
        count = evaluate_deadlines(db)
        db.commit()
        return f"Evaluated deadlines. {count} notifications triggered."
    finally:
        db.close()


@celery_app.task
def send_email_async(to_email: str, subject: str, body: str):
    """Asynchronous background email sender."""
    # In local development, logs dispatch; in production, connects to SMTP
    print(f"[CELERY EMAIL WORKER] To: {to_email} | Subject: {subject} | Body: {body}")
    return True
