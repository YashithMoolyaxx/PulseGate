from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.api_key import APIKey
from app.core.security import hash_api_key

async def verify_api_key(
    x_api_key: str = Header(..., description="Your secret PulseGate API Key"),
    db: AsyncSession = Depends(get_db)
) -> APIKey:
    """
    Dependency that intercepts the 'X-API-Key' header,
    hashes it with SHA-256, and validates it against PostgreSQL.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header"
        )

    # 1. Hash the incoming raw key (pg_live_...) using SHA-256
    hashed_incoming = hash_api_key(x_api_key)

    # 2. Query PostgreSQL asynchronously for matching active key
    query = select(APIKey).where(
        APIKey.hashed_key == hashed_incoming,
        APIKey.is_active == True
    )
    result = await db.execute(query)
    api_key_obj = result.scalar_one_or_none()

    # 3. If hash not found or key is deactivated -> Reject with 401
    if not api_key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API Key"
        )

    # 4. Key is valid! Return key object to downstream route
    return api_key_obj