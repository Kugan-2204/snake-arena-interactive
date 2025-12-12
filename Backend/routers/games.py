from fastapi import APIRouter, HTTPException
from typing import List

from models import ActivePlayer
from database import db

router = APIRouter(prefix="/games", tags=["Games"])

@router.get("/active", response_model=List[ActivePlayer])
async def get_active_players():
    return db.get_active_players()

@router.get("/active/{player_id}", response_model=ActivePlayer)
async def watch_player(player_id: str):
    players = db.get_active_players()
    player = next((p for p in players if p.id == player_id), None)
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return player
