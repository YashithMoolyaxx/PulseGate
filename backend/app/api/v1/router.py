from fastapi import APIRouter
from app.api.v1.endpoints import health, api_keys

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(api_keys.router, tags=["API Keys"])