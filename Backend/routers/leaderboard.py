from fastapi import APIRouter, Depends, HTTPException
from typing import List, Annotated, Optional
from datetime import date
import uuid

from models import LeaderboardEntry, SubmitScoreRequest, GameMode, User
from database import db
from .auth import get_current_user

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/", response_model=List[LeaderboardEntry])
async def get_leaderboard(mode: Optional[GameMode] = None, limit: int = 10):
    entries = db.leaderboard
    if mode:
        entries = [e for e in entries if e.mode == mode]
    
    # Sort by score descending (already sorted on insert, but ensuring here)
    entries.sort(key=lambda x: x.score, reverse=True)
    
    return entries[:limit]

@router.post("/", response_model=LeaderboardEntry, status_code=201)
async def submit_score(
    score_data: SubmitScoreRequest, 
    current_user: Annotated[User, Depends(get_current_user)]
):
    entry = LeaderboardEntry(
        id=str(uuid.uuid4()),
        username=current_user.username,
        score=score_data.score,
        mode=score_data.mode,
        date=date.today()
    )
    
    db.add_score(entry)
    
    # Update user high score if this is higher
    if score_data.score > current_user.highScore:
        current_user.highScore = score_data.score
        
    return entry
