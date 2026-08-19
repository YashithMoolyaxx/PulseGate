from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.api_key import APIKey
from app.core.security import hash_api_key

async def get_current_api_key(
    x_api_key: str = Header(..., description="API Key for PulseGate Gateway authentication"),
    db: AsyncSession = Depends(get_db)
) -> APIKey:
    """Validates the x-api-key header against stored SHA-256 hashes in PostgreSQL."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing 'x-api-key' header."
        )

    hashed_key = hash_api_key(x_api_key)

    query = select(APIKey).where(APIKey.hashed_key == hashed_key, APIKey.is_active == True)
    result = await db.execute(query)
    api_key_record = result.scalars().first()

    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API Key."
        )

    return api_key_record