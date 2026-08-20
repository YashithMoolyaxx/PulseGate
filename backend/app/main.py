from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_client import make_asgi_app

from app.api.v1.router import api_router
from app.core.database import engine, Base
from app.middleware.metrics_middleware import PrometheusMetricsMiddleware

# Import models so Base.metadata knows about them on startup
import app.models.user
import app.models.api_key
import app.models.log

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Cleanup DB connection pool on shutdown
    await engine.dispose()

app = FastAPI(
    title="PulseGate API Gateway",
    version="1.0.0",
    description="High-Throughput Asynchronous API Gateway & Task Engine",
    lifespan=lifespan
)

# Custom Prometheus latency & request counting middleware
app.add_middleware(PrometheusMetricsMiddleware)

# Outermost Middleware: CORS (Allows credentials with explicit Vercel and local origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pulse-gate-nine.vercel.app",
        "https://pulse-gate-nu.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",  # Matches all Vercel production & preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Prometheus Scrape Target
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Mount Central V1 API Router
app.include_router(api_router, prefix="/v1")

@app.get("/")
async def root():
    return {"message": "PulseGate Gateway is healthy and running"}