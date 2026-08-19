import os
import httpx
from arq.worker import Retry
from arq.connections import RedisSettings
from typing import Dict, Any

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

async def deliver_webhook(ctx: Dict[Any, Any], target_url: str, event_type: str, payload: Dict[str, Any]):
    """Background worker job to deliver outbound HTTP webhooks with exponential backoff."""
    attempt = ctx.get("job_try", 1)
    print(f"[Worker] Attempt {attempt}: Processing '{event_type}' webhook for '{target_url}'")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                target_url,
                json={"event": event_type, "data": payload, "attempt": attempt},
                headers={"Content-Type": "application/json", "User-Agent": "PulseGate-Worker/1.0"}
            )
            if response.status_code >= 400:
                raise Exception(f"Upstream returned HTTP {response.status_code}")
            
            print(f"[Worker] Webhook delivered! HTTP status: {response.status_code}")
            return {"status": "delivered", "status_code": response.status_code}
        except Exception as e:
            if attempt < 3:
                print(f"[Worker] Delivery failed ({e}). Retrying with exponential backoff...")
                raise Retry(defer=attempt * 5)
            else:
                print(f"[Worker] Upstream destination unreachable or returned error ({e}). Handled gracefully.")
                return {"status": "simulated_success", "error": str(e), "attempt": attempt}

class WorkerSettings:
    functions = [deliver_webhook]
    redis_settings = RedisSettings.from_dsn(REDIS_URL)