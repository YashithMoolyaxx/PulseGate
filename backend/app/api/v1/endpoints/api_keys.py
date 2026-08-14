from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.api_key import APIKey
from app.schemas.api_key import APIKeyCreate, APIKeyCreateResponse
from app.core.security import generate_raw_api_key, hash_api_key
from app.middleware.rate_limiter import check_rate_limit

router = APIRouter()

@router.post("/api-keys", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_in: APIKeyCreate, 
    db: AsyncSession = Depends(get_db)
):
    raw_key = generate_raw_api_key()
    hashed = hash_api_key(raw_key)

    db_key = APIKey(
        name=key_in.name,
        hashed_key=hashed,
        rate_limit_rpm=key_in.rate_limit_rpm
    )

    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)

    return APIKeyCreateResponse(
        id=db_key.id,
        name=db_key.name,
        raw_api_key=raw_key,
        rate_limit_rpm=db_key.rate_limit_rpm,
        created_at=db_key.created_at
    )

@router.get("/secure-data")
async def get_secure_data(current_key: APIKey = Depends(check_rate_limit)):
    return {
        "message": "Access granted! Passed SHA-256 Auth AND Redis ZSET Rate Limiting.",
        "authenticated_key_name": current_key.name,
        "rate_limit_rpm": current_key.rate_limit_rpm
    }