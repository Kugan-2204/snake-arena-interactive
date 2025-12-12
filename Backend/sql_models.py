from sqlalchemy import Column, Integer, String, Date, Float, Enum as SQLEnum, DateTime
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, date
import uuid
import enum

from models import GameMode

class Base(DeclarativeBase):
    pass

from datetime import datetime, timezone

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)  # In a real app, strict hashing should be applied
    high_score = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, index=True)
    score = Column(Integer)
    mode = Column(SQLEnum(GameMode))
    date = Column(Date, default=date.today)
