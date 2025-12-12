from fastapi import APIRouter, Depends, HTTPException
from typing import List, Annotated, Optional
from datetime import date
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from models import LeaderboardEntry
from models import SubmitScoreRequest, GameMode
from models import User as UserSchema
from sql_models import Leaderboard as LeaderboardModel
from sql_models import User as UserModel
from database import get_db
from .auth import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    mode: Optional[GameMode] = None, 
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    query = select(LeaderboardModel).order_by(desc(LeaderboardModel.score)).limit(limit)
    if mode:
        query = query.where(LeaderboardModel.mode == mode)
        
    result = await db.execute(query)
    entries = result.scalars().all()
    
    # Map to Pydantic models
    return [
        LeaderboardEntry(
            id=e.id,
            username=e.username,
            score=e.score,
            mode=e.mode,
            date=e.date
        ) for e in entries
    ]

@router.post("/", response_model=LeaderboardEntry, status_code=201)
async def submit_score(
    score_data: SubmitScoreRequest, 
    current_user: Annotated[UserSchema, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    entry = LeaderboardModel(
        id=str(uuid.uuid4()),
        username=current_user.username,
        score=score_data.score,
        mode=score_data.mode,
        date=date.today()
    )
    
    db.add(entry)
    
    # Update high score if greater
    if score_data.score > current_user.highScore:
        # Fetch actual user model to update
        result = await db.execute(select(UserModel).where(UserModel.id == current_user.id))
        user_model = result.scalars().first()
        if user_model:
            user_model.high_score = score_data.score
            db.add(user_model)
            
    await db.commit()
    await db.refresh(entry)
        
    return LeaderboardEntry(
        id=entry.id,
        username=entry.username,
        score=entry.score,
        mode=entry.mode,
        date=entry.date
    )
