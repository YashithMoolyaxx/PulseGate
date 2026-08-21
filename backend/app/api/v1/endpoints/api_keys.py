from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, cast, String
from typing import List
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.core.database import get_db
from app.models.api_key import APIKey
from app.models.user import User
from app.schemas.api_key import APIKeyCreate, APIKeyResponse
from app.core.security import generate_api_key, hash_api_key
from app.middleware.auth_jwt import get_current_user

router = APIRouter()

class APIKeyListItem(BaseModel):
    id: uuid.UUID
    name: str
    rate_limit_rpm: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ------------------------------------------------------------------
# 1. CREATE API KEY (POST /v1/api-keys)
# ------------------------------------------------------------------
@router.post("/api-keys", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_in: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a new secure API key assigned to the logged-in user."""
    raw_key = generate_api_key()
    hashed_key = hash_api_key(raw_key)

    api_key_entry = APIKey(
        user_id=current_user.id,
        name=key_in.name.strip(),
        hashed_key=hashed_key,
        rate_limit_rpm=key_in.rate_limit_rpm,
        is_active=True
    )
    db.add(api_key_entry)
    await db.commit()
    await db.refresh(api_key_entry)

    return APIKeyResponse(
        id=api_key_entry.id,
        name=api_key_entry.name,
        raw_api_key=raw_key,
        rate_limit_rpm=api_key_entry.rate_limit_rpm,
        is_active=api_key_entry.is_active,
        created_at=api_key_entry.created_at
    )

# ------------------------------------------------------------------
# 2. LIST API KEYS (GET /v1/api-keys)
# ------------------------------------------------------------------
@router.get("/api-keys", response_model=List[APIKeyListItem])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch only active keys owned by the current logged-in user."""
    result = await db.execute(
        select(APIKey)
        .where(
            APIKey.is_active == True,
            or_(
                APIKey.user_id == current_user.id,
                APIKey.user_id == None  # Includes unassigned legacy keys
            )
        )
        .order_by(APIKey.created_at.desc())
    )
    return result.scalars().all()

# ------------------------------------------------------------------
# 3. DELETE API KEY (DELETE /v1/api-keys/{key_id})
# ------------------------------------------------------------------
@router.delete("/api-keys/{key_id}", status_code=status.HTTP_200_OK)
async def delete_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently revoke and delete an API key."""
    # Convert string key_id to match both String or UUID column types in Postgres
    try:
        parsed_uuid = uuid.UUID(str(key_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format for key_id"
        )

    # Match by either UUID or String representation + verify ownership or legacy orphan
    query = select(APIKey).where(
        or_(
            APIKey.id == parsed_uuid,
            cast(APIKey.id, String) == str(key_id)
        ),
        or_(
            APIKey.user_id == current_user.id,
            APIKey.user_id == None
        )
    )
    result = await db.execute(query)
    api_key_entry = result.scalar_one_or_none()

    if not api_key_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found or you do not have permission to delete it."
        )

    # Hard delete from PostgreSQL
    await db.delete(api_key_entry)
    await db.commit()

    return {"message": "API key deleted permanently from PostgreSQL", "id": str(key_id)}