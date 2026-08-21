from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
import uuid

from app.core.database import get_db
from app.models.user import User
from app.core.security import get_password_hash, verify_password, create_access_token
from app.middleware.auth_jwt import get_current_user

router = APIRouter()

class UserAuthSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    access_token: str
    token_type: str = "bearer"

class UserProfile(BaseModel):
    id: uuid.UUID
    email: str

# POST /v1/auth/signup
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(credentials: UserAuthSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=credentials.email.lower(),
        hashed_password=get_password_hash(credentials.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return UserResponse(id=user.id, email=user.email, access_token=token)

# POST /v1/auth/login
@router.post("/login", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def login(credentials: UserAuthSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalars().first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return UserResponse(id=user.id, email=user.email, access_token=token)

# GET /v1/auth/me
@router.get("/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserProfile(id=current_user.id, email=current_user.email)