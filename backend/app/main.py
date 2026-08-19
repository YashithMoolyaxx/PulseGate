from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_client import make_asgi_app

from app.api.v1.router import api_router
from app.core.database import engine, Base
from app.middleware.metrics_middleware import PrometheusMetricsMiddleware

import app.models.user
import app.models.api_key
import app.models.log

@asynccontextmanager
async def lifespan(app: FastAPI):
  
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(
    title="PulseGate API Gateway",
    version="1.0.0",
    description="High-Throughput Asynchronous API Gateway & Task Engine",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(PrometheusMetricsMiddleware)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

app.include_router(api_router, prefix="/v1")