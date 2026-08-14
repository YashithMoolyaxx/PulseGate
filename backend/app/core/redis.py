import os
from redis.asyncio import Redis

# Read Redis URL from Docker container environment
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# Global non-blocking async Redis client instance
redis_client: Redis = Redis.from_url(REDIS_URL, decode_responses=True)

async def get_redis() -> Redis:
    """FastAPI Dependency yielding the global async Redis client."""
    return redis_client