from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, api_keys, gateway, webhooks

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["User Authentication"])
api_router.include_router(api_keys.router, tags=["API Keys"])
api_router.include_router(gateway.router, tags=["Gateway Proxy"])
api_router.include_router(webhooks.router, tags=["Webhooks Engine"])