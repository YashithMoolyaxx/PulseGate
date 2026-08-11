from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import engine, Base, get_db
import app.models  # Ensures models are registered with Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown: Close DB engine connections
    await engine.dispose()

app = FastAPI(title="PulseGate API Gateway", lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "PulseGate Gateway is live!"}

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    # Test DB connection with an async query
    result = await db.execute(text("SELECT 1"))
    return {
        "status": "healthy",
        "database": "connected" if result.scalar() == 1 else "disconnected"
    }