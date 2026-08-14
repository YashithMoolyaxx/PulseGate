import time
import uuid
from fastapi import HTTPException, status, Depends
from redis.asyncio import Redis
from app.core.redis import get_redis
from app.models.api_key import APIKey
from app.middleware.auth import verify_api_key

async def check_rate_limit(
    current_key: APIKey = Depends(verify_api_key),
    redis: Redis = Depends(get_redis)
) -> APIKey:
    """
    Sliding-Window Rate Limiting Dependency using Redis Sorted Sets (ZSET).
    Executes in sub-milliseconds in RAM.
    """
    api_key_id = str(current_key.id)
    limit = current_key.rate_limit_rpm
    window_seconds = 60

    # Redis ZSET key for this specific API key
    zset_key = f"rate_limit:{api_key_id}"

    # Current timestamp in milliseconds
    now_ms = int(time.time() * 1000)
    cutoff_ms = now_ms - (window_seconds * 1000)

    # 1. Execute cleanup and count inside an atomic Redis pipeline
    async with redis.pipeline(transaction=True) as pipe:
        # Delete timestamps older than 60 seconds ago
        pipe.zremrangebyscore(zset_key, 0, cutoff_ms)
        # Count remaining requests in rolling window
        pipe.zcard(zset_key)
        
        _, current_request_count = await pipe.execute()

    # 2. Decision Check: Is client exceeding their RPM?
    if current_request_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit_rpm": limit,
                "current_usage": current_request_count,
                "retry_after_seconds": 10
            }
        )

    # 3. Request allowed! Add current millisecond timestamp to ZSET
    request_id = str(uuid.uuid4())
    async with redis.pipeline(transaction=True) as pipe:
        pipe.zadd(zset_key, {request_id: now_ms})
        pipe.expire(zset_key, window_seconds + 5)  # Auto-expire key after inactivity
        await pipe.execute()

    return current_key