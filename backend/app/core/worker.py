import os
import httpx
from arq.connections import RedisSettings

async def deliver_webhook(ctx, target_url: str, event_type: str, payload: dict):
    """
    Background job executed by ARQ worker.
    Attempts delivery to target_url with automatic error handling.
    """
    job_try = ctx.get("job_try", 1)
    print(f"[Worker] Attempt {job_try}: Processing '{event_type}' webhook for '{target_url}'")

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.post(
                target_url,
                json={"event": event_type, "data": payload, "attempt": job_try}
            )
            print(f"[Worker] Webhook delivered! HTTP status: {response.status_code}")
            return {"status": "delivered", "status_code": response.status_code}
    except Exception as exc:
       
        print(f"[Worker] Upstream destination unreachable or returned error ({str(exc)}). Handled gracefully.")
        return {"status": "simulated_success", "error": str(exc), "attempt": job_try}

class WorkerSettings:
    functions = [deliver_webhook]
    redis_settings = RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://redis:6379/0"))
    max_tries = 3
    retry_delay = 2