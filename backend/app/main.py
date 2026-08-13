from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import engine, Base
from app.api.v1.router import api_router


import app.models.api_key
import app.models.log

@asynccontextmanager
async def lifespan(app: FastAPI):
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
   
    await engine.dispose()

app = FastAPI(title="PulseGate API Gateway", lifespan=lifespan)


app.include_router(api_router, prefix="/v1")

@app.get("/")
def read_root():
    return {"message": "PulseGate Gateway is live!"}