from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

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
    # Get leaderboard
    response = client.get("/leaderboard")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

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
    
    player_id = response.json()[0]["id"]
    response = client.get(f"/games/active/{player_id}")
    assert response.status_code == 200
    assert response.json()["id"] == player_id

    response = client.get("/games/active/invalid-id")
    assert response.status_code == 404
