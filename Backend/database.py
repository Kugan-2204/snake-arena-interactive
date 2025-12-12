from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sql_models import Base, User, Leaderboard, GameMode
import os
from datetime import datetime, date

# Default to SQLite, can be overridden by DATABASE_URL env var
# For SQLite async, use sqlite+aiosqlite:///
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./snake_arena.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "asyncpg" not in DATABASE_URL:
     DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

async def init_db():
    async with engine.begin() as conn:
        # Create tables
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed data if empty
    async with AsyncSessionLocal() as session:
        # Check if users exist
        from sqlalchemy import select
        result = await session.execute(select(User))
        user = result.scalars().first()
        
        if not user:
            # Seed Users
            from routers.auth import get_password_hash
            
            demo_user = User(id="user-demo", username="demo", email="demo@example.com", password=get_password_hash("password"), high_score=5000)
            master = User(id="user-1", username="SnakeMaster", email="master@snake.com", password=get_password_hash("pass123"), high_score=2450)
            pixel = User(id="user-2", username="PixelPro", email="pixel@game.com", password=get_password_hash("pass123"), high_score=2100)
            
            session.add_all([demo_user, master, pixel])
            
            # Seed Leaderboard
            entries = [
                Leaderboard(id="1", username="SnakeMaster", score=2450, mode=GameMode.WALLS, date=date(2024, 12, 10)),
                Leaderboard(id="2", username="PixelPro", score=2100, mode=GameMode.PASS_THROUGH, date=date(2024, 12, 10)),
                Leaderboard(id="3", username="RetroGamer", score=1890, mode=GameMode.WALLS, date=date(2024, 12, 9)),
                Leaderboard(id="4", username="NeonNinja", score=1650, mode=GameMode.PASS_THROUGH, date=date(2024, 12, 9)),
                Leaderboard(id="5", username="ArcadeKing", score=1420, mode=GameMode.WALLS, date=date(2024, 12, 8)),
            ]
            session.add_all(entries)
            await session.commit()

# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
