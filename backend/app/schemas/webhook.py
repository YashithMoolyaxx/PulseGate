from pydantic import BaseModel, Field
from typing import Dict, Any

class WebhookPayload(BaseModel):
    target_url: str = Field(..., json_schema_extra={"example": "https://httpbin.org/post"})
    event_type: str = Field(..., json_schema_extra={"example": "rate_limit.warning"})
    payload: Dict[str, Any] = Field(
        default_factory=dict, 
        json_schema_extra={"example": {"alert": "High traffic spike detected", "rpm": 120}}
    )

class WebhookEnqueueResponse(BaseModel):
    job_id: str
    status: str
    message: str