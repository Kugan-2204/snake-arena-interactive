from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from datetime import datetime
import uuid

from models import LoginRequest, UserCreate, AuthResponse, ErrorResponse, User
from database import db

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()

def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]):
    token = credentials.credentials
    # Simple mock token validation: "mock-token-{user_id}"
    if not token.startswith("mock-token-"):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = token.replace("mock-token-", "")
    user = db.users.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@router.post("/signup", response_model=AuthResponse, status_code=201, responses={400: {"model": ErrorResponse}})
async def signup(user_data: UserCreate):
    if db.get_user_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if db.get_user_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user_id = str(uuid.uuid4())
    new_user = User(
        id=new_user_id,
        username=user_data.username,
        email=user_data.email,
        highScore=0,
        createdAt=datetime.now()
    )
    
    db.create_user(new_user, user_data.password)
    
    return AuthResponse(user=new_user, token=f"mock-token-{new_user_id}")

@router.post("/login", response_model=AuthResponse, responses={401: {"model": ErrorResponse}})
async def login(credentials: LoginRequest):
    user = db.get_user_by_email(credentials.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    if not db.check_password(user.id, credentials.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    return AuthResponse(user=user, token=f"mock-token-{user.id}")

@router.post("/logout")
async def logout(current_user: Annotated[User, Depends(get_current_user)]):
    return {"message": "Logout successful"}

@router.get("/me", response_model=User)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
