import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Grab connection string from Docker environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://pulsegate_user:pulsegate_pass@postgres:5432/pulsegate_db"
)

# 1. Create the non-blocking Async Engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,       # Logs raw SQL queries to terminal (super useful for learning!)
    pool_size=20,    # Pre-opens 20 warm connections
    max_overflow=10  # Allows 10 extra temporary connections under emergency bursts
)

# 2. Factory for generating async sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 3. Base class that our ORM models will inherit from
class Base(DeclarativeBase):
    pass

# 4. FastAPI Dependency to yield DB sessions per request
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close() # Always returns connection to pool!