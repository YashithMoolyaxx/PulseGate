import time
from fastapi import HTTPException, status, Depends
from app.models.api_key import APIKey
from app.middleware.auth import get_current_api_key
from app.core.redis import get_redis
from app.core.metrics import RATE_LIMIT_EXCEEDED
import redis.asyncio as aioredis

# Atomic sliding window script evaluated directly in Redis
SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window_start = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])
local member = ARGV[5]

-- 1. Evict entries outside the active rolling window
redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

-- 2. Count requests remaining in the window
local current_count = redis.call('ZCARD', key)

-- 3. Only record the timestamp if under quota
if current_count < limit then
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, ttl)
    return {1, current_count}  -- Allowed: [status, count]
else
    return {0, current_count}  -- Throttled: [status, count]
end
"""

async def check_rate_limit(
    current_key: APIKey = Depends(get_current_api_key),
    redis: aioredis.Redis = Depends(get_redis)
) -> APIKey:
    """Sliding-Window Rate Limiter using atomic Redis Lua scripting."""
    now = time.time()
    window_start = now - 60.0
    rate_limit_key = f"rate_limit:{current_key.hashed_key}"
    # Unique member prevents timestamp collisions under sub-millisecond concurrency
    member = f"{now}:{id(current_key)}"

    try:
        # Evaluated atomically in Redis engine
        result = await redis.eval(
            SLIDING_WINDOW_LUA,
            1,                             # Number of keys in KEYS
            rate_limit_key,                # KEYS[1]
            now,                           # ARGV[1]
            window_start,                  # ARGV[2]
            current_key.rate_limit_rpm,    # ARGV[3]
            65,                            # ARGV[4]
            member                         # ARGV[5]
        )
        is_allowed, current_count = result[0], result[1]
    except Exception:
        # Fail-Open policy: if Redis is unreachable, avoid dropping valid gateway traffic
        return current_key

    # Check if request was throttled by the Lua script
    if is_allowed == 0:
        RATE_LIMIT_EXCEEDED.labels(api_key_name=current_key.name).inc()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Quota: {current_key.rate_limit_rpm} req/min. Please retry later."
        )

    return current_key