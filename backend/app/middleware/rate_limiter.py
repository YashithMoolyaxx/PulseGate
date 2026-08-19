import time
from fastapi import HTTPException, status, Depends
from app.models.api_key import APIKey
from app.middleware.auth import get_current_api_key
from app.core.redis import get_redis
from app.core.metrics import RATE_LIMIT_EXCEEDED
import redis.asyncio as aioredis

async def check_rate_limit(
    current_key: APIKey = Depends(get_current_api_key),
    redis: aioredis.Redis = Depends(get_redis)
) -> APIKey:
    """Sliding-Window Rate Limiter using atomic Redis ZSET pipelines."""
    now = time.time()
    window_start = now - 60.0  # Rolling 60-second window
    rate_limit_key = f"rate_limit:{current_key.hashed_key}"

    # Atomic pipeline execution
    pipe = redis.pipeline(transaction=True)
    pipe.zremrangebyscore(rate_limit_key, 0, window_start)
    pipe.zcard(rate_limit_key)
    pipe.zadd(rate_limit_key, {str(now): now})
    pipe.expire(rate_limit_key, 65)
    
    results = await pipe.execute()
    current_request_count = results[1]

    # Check if request count exceeds the provisioned RPM quota
    if current_request_count >= current_key.rate_limit_rpm:
        RATE_LIMIT_EXCEEDED.labels(api_key_name=current_key.name).inc()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Quota: {current_key.rate_limit_rpm} req/min. Please retry later."
        )

    return current_key