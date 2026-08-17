from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from app.core.database import engine, Base
from app.api.v1.router import api_router
from app.core.metrics import get_latest_metrics
from app.middleware.metrics_middleware import PrometheusMetricsMiddleware
import app.models.api_key
import app.models.log

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

app = FastAPI(title="PulseGate API Gateway", lifespan=lifespan)


app.add_middleware(PrometheusMetricsMiddleware)

app.include_router(api_router, prefix="/v1")

@app.get("/metrics", tags=["Observability"])
def metrics():
    """Endpoint scraped by Prometheus server."""
    data, content_type = get_latest_metrics()
    return Response(content=data, media_type=content_type)

@app.get("/")
def read_root():
    return {"message": "PulseGate Gateway is live!"}