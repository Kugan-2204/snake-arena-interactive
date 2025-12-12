from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from datetime import datetime, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from models import LoginRequest, UserCreate, AuthResponse, ErrorResponse
from models import User as UserSchema
from sql_models import User as UserModel
from database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db)
) -> UserSchema:
    token = credentials.credentials
    # Simple mock token: "mock-token-{user_id}"
    if not token.startswith("mock-token-"):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = token.replace("mock-token-", "")
    
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Map to Pydantic schema
    return UserSchema(
        id=user.id,
        username=user.username,
        email=user.email,
        highScore=user.high_score,
        createdAt=user.created_at
    )

@router.post("/signup", response_model=AuthResponse, status_code=201, responses={400: {"model": ErrorResponse}})
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check email
    result = await db.execute(select(UserModel).where(UserModel.email == user_data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check username
    result = await db.execute(select(UserModel).where(UserModel.username == user_data.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = get_password_hash(user_data.password)
    
    new_user_id = str(uuid.uuid4())
    new_user = UserModel(
        id=new_user_id,
        username=user_data.username,
        email=user_data.email,
        password=hashed_password,
        high_score=0,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    user_schema = UserSchema(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        highScore=new_user.high_score,
        createdAt=new_user.created_at
    )
    
    return AuthResponse(user=user_schema, token=f"mock-token-{new_user_id}")

@router.post("/login", response_model=AuthResponse, responses={401: {"model": ErrorResponse}})
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).where(UserModel.email == credentials.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not verify_password(credentials.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    user_schema = UserSchema(
        id=user.id,
        username=user.username,
        email=user.email,
        highScore=user.high_score,
        createdAt=user.created_at
    )
    
    return AuthResponse(user=user_schema, token=f"mock-token-{user.id}")

@router.post("/logout")
async def logout(current_user: Annotated[UserSchema, Depends(get_current_user)]):
    return {"message": "Logout successful"}

@router.get("/me", response_model=UserSchema)
async def get_me(current_user: Annotated[UserSchema, Depends(get_current_user)]):
    return current_user
