from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import select
import pytest
import asyncio
import os

from main import app
from database import get_db, init_db
from sql_models import Base

# Setup Test DB
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL, 
    connect_args={"check_same_thread": False}, 
    poolclass=StaticPool
)

TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# We need a fixture to init the DB before tests
@pytest.fixture(autouse=True)
def init_test_db():
    # Sync hack for async db init in sync tests
    # Ideally use pytest-asyncio, but keeping it simple for now by manually running event loop
    async def run_migrations():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
    asyncio.run(run_migrations())
    yield
    async def drop_tables():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    asyncio.run(drop_tables())

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Snake Arena API"}

def test_signup_flow():
    # 1. Signup
    response = client.post("/auth/signup", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    })
    
    if response.status_code != 201:
        print(response.json())
        
    assert response.status_code == 201
    data = response.json()
    assert "user" in data
    assert "token" in data
    assert data["user"]["username"] == "testuser"
    token = data["token"]

    # 2. Get Me
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"

    # 3. Logout
    response = client.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200

def test_login_flow():
    # Signup first
    client.post("/auth/signup", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "password123"
    })

    # Login
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "token" in response.json()

    # Invalid password
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_leaderboard():
    # Submit score
    # First get a valid user token
    auth_resp = client.post("/auth/signup", json={
        "username": "scoreuser",
        "email": "score@example.com",
        "password": "pass"
    })
    token = auth_resp.json()["token"]

    response = client.post("/leaderboard/", 
        json={"score": 500, "mode": "walls"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["score"] == 500

    # Verify score is in leaderboard
    response = client.get("/leaderboard")
    entries = response.json()
    assert any(e["username"] == "scoreuser" and e["score"] == 500 for e in entries)

def test_active_games():
    response = client.get("/games/active")
    assert response.status_code == 200
    assert len(response.json()) > 0
