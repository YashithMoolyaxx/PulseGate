import redis.asyncio as aioredis
from typing import AsyncGenerator
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# Global async Redis client connection pool
redis_pool = aioredis.ConnectionPool.from_url(
    REDIS_URL,
    decode_responses=True,
    max_connections=20
)

async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """Dependency yield for FastAPI endpoints & middleware."""
    client = aioredis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.close()