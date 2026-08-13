from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    # Test our async connection pool by executing a lightweight query
    result = await db.execute(text("SELECT 1"))
    return {
        "status": "healthy",
        "database": "connected" if result.scalar() == 1 else "disconnected"
    }