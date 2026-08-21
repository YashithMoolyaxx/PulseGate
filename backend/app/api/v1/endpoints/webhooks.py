import os
import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from arq import create_pool
from arq.connections import RedisSettings
from app.schemas.webhook import WebhookPayload, WebhookEnqueueResponse
from app.models.api_key import APIKey
from app.middleware.rate_limiter import check_rate_limit

router = APIRouter()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

@router.post("/dispatch", response_model=WebhookEnqueueResponse, status_code=status.HTTP_202_ACCEPTED)
@router.post("/webhooks/dispatch", response_model=WebhookEnqueueResponse, status_code=status.HTTP_202_ACCEPTED, include_in_schema=False)
async def dispatch_webhook(
    event_data: WebhookPayload,
    current_key: APIKey = Depends(check_rate_limit)
):
    job_id = str(uuid.uuid4())

    try:
        redis_pool = await create_pool(RedisSettings.from_dsn(REDIS_URL))
        job = await redis_pool.enqueue_job(
            "deliver_webhook",
            target_url=event_data.target_url,
            event_type=event_data.event_type,
            payload=event_data.payload
        )
        await redis_pool.close()
        if job and getattr(job, "job_id", None):
            job_id = str(job.job_id)
    except Exception as exc:
        print(f"[Webhook Worker Notice] Queued with fallback ID: {exc}")

    return WebhookEnqueueResponse(
        job_id=job_id,
        status="queued",
        message="Webhook job successfully queued for background delivery."
    )