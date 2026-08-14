from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "Payment Microservice"})
    rate_limit_rpm: int = Field(default=60, ge=1, le=10000, json_schema_extra={"example": 120})


class APIKeyCreateResponse(BaseModel):
    id: uuid.UUID
    name: str
    raw_api_key: str  
    rate_limit_rpm: int
    created_at: datetime

    class Config:
        from_attributes = True