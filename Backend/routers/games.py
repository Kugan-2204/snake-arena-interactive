from fastapi import APIRouter, HTTPException
from typing import List

from models import ActivePlayer, GameMode, Point, Direction
# Note: Active players are transient and high-frequency, usually better in memory/Redis
# We'll keep them in memory for now as per plan, since DB for game loop state is slow 
# unless strictly required by user. User said "fake data" earlier, implies ephemeral.
# If user insists on SQL for snake position, we can do it, but for "spectator" 
# a global list is actually more "real-time" than SQL polling.

# Reusing the singleton logic for active games only
from database import get_db

router = APIRouter(prefix="/games", tags=["Games"])

# Mock active players (staying in memory for simplicity/performance)
active_players_memory = [
     ActivePlayer(
        id="player-1",
        username="SnakeMaster",
        score=340,
        mode=GameMode.WALLS,
        snake=[Point(x=10, y=10), Point(x=9, y=10), Point(x=8, y=10)],
        food=Point(x=15, y=12),
        direction=Direction.RIGHT,
    ),
        ActivePlayer(
        id="player-2",
        username="NeonNinja",
        score=180,
        mode=GameMode.PASS_THROUGH,
        snake=[Point(x=5, y=5), Point(x=5, y=4), Point(x=5, y=3)],
        food=Point(x=12, y=8),
        direction=Direction.DOWN,
    ),
]

@router.get("/active", response_model=List[ActivePlayer])
async def get_active_players():
    return active_players_memory

@router.get("/active/{player_id}", response_model=ActivePlayer)
async def watch_player(player_id: str):
    player = next((p for p in active_players_memory if p.id == player_id), None)
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    return player
