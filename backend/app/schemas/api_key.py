from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
import uuid

class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "Mobile App Client"})
    rate_limit_rpm: int = Field(default=60, ge=1, le=10000, json_schema_extra={"example": 60})

class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    raw_api_key: str
    rate_limit_rpm: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class APIKeyOut(BaseModel):
    id: uuid.UUID
    name: str
    rate_limit_rpm: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True