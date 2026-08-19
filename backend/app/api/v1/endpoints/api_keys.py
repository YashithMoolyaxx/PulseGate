from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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
        name=key_in.name,
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

@router.get("/api-keys", response_model=List[APIKeyListItem])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch only keys owned by the current logged-in user."""
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc())
    )
    return result.scalars().all()