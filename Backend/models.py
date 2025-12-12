from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime
from enum import Enum

class GameMode(str, Enum):
    PASS_THROUGH = "pass-through"
    WALLS = "walls"

class Direction(str, Enum):
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str
    highScore: int
    createdAt: datetime

class AuthResponse(BaseModel):
    user: User
    token: str

class ErrorResponse(BaseModel):
    error: str

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    score: int
    mode: GameMode
    date: date

class SubmitScoreRequest(BaseModel):
    score: int
    mode: GameMode

class Point(BaseModel):
    x: int
    y: int

class ActivePlayer(BaseModel):
    id: str
    username: str
    score: int
    mode: GameMode
    snake: List[Point]
    food: Point
    direction: Direction
