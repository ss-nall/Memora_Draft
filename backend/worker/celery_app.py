import os
from celery import Celery

# Use Redis running in Docker as the broker and backend
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")

# Initialize Celery app
celery_app = Celery(
    "memora_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["worker.tasks"]
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Acknowledge tasks only after they complete to prevent lost tasks on crash
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1,
    broker_connection_timeout=1.0,
)
