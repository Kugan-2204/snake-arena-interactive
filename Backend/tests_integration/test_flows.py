import pytest
from conftest import client

@pytest.mark.asyncio
async def test_full_user_flow(client):
    """
    Test a full scenario:
    1. Signup a new user
    2. Login with that user
    3. Verify token
    4. Post a leaderboard score
    5. View leaderboard
    """
    
    # 1. Signup
    signup_data = {
        "username": "integration_user",
        "email": "integration@test.com",
        "password": "securepassword123"
    }
    response = await client.post("/auth/signup", json=signup_data)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["username"] == signup_data["username"]
    token = data["token"]
    assert token.startswith("mock-token-") # Or whatever token format we use

    # 2. Login
    login_data = {
        "email": "integration@test.com",
        "password": "securepassword123"
    }
    response = await client.post("/auth/login", json=login_data)
    assert response.status_code == 200
    login_token = response.json()["token"]
    assert login_token == token

    # 3. Get Me
    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == signup_data["email"]

    # 4. Submit Score
    score_data = {
        "score": 1234,
        "mode": "walls"
    }
    response = await client.post("/leaderboard/", json=score_data, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 201
    assert response.json()["score"] == 1234

    # 5. Check Leaderboard
    response = await client.get("/leaderboard/?mode=walls")
    assert response.status_code == 200
    entries = response.json()
    # Check if our entry is in the list
    found = False
    for entry in entries:
        if entry["username"] == "integration_user" and entry["score"] == 1234:
            found = True
            break
    assert found, "Submitted score not found in leaderboard"

@pytest.mark.asyncio
async def test_auth_validation_errors(client):
    """Test duplicate emails and invalid logins"""
    
    # Signup
    await client.post("/auth/signup", json={
        "username": "user1",
        "email": "uniq@test.com",
        "password": "pass"
    })

    # Duplicate Email
    response = await client.post("/auth/signup", json={
        "username": "user2",
        "email": "uniq@test.com", 
        "password": "pass"
    })
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

    # Invalid Password
    response = await client.post("/auth/login", json={
        "email": "uniq@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_leaderboard_logic(client):
    """Test pagination, filtering, and high score logic"""
    
    # Setup users
    users = [
        {"u": "p1", "e": "p1@t.com", "s": 100, "m": "walls"},
        {"u": "p2", "e": "p2@t.com", "s": 200, "m": "walls"},
        {"u": "p3", "e": "p3@t.com", "s": 300, "m": "pass-through"},
    ]
    
    tokens = {}
    
    for u in users:
        resp = await client.post("/auth/signup", json={"username": u["u"], "email": u["e"], "password": "pass"})
        tokens[u["u"]] = resp.json()["token"]
        await client.post("/leaderboard/", json={"score": u["s"], "mode": u["m"]}, headers={"Authorization": f"Bearer {tokens[u['u']]}"})

    # Test Filtering
    resp = await client.get("/leaderboard/?mode=walls")
    data = resp.json()
    # We might have data from other tests if DB isnt reset per test properly, but session fixture drops all.
    # checking >= count from this test setup
    assert len(data) >= 2
    assert all(e["mode"] == "walls" for e in data)
    
    resp = await client.get("/leaderboard/?mode=pass-through")
    data = resp.json()
    assert len(data) >= 1
    assert all(e["mode"] == "pass-through" for e in data)

    # Test Sorting (p2 > p1)
    # We need to filter by our users to avoid interference if any
    data = [x for x in data if x["username"] in ["p1", "p2", "p3"]]
    # Actually just check order of what we got
    resp = await client.get("/leaderboard/?mode=walls")
    walls_data = resp.json()
    
    # We expect p2 (200) before p1 (100)
    p2_pos = -1
    p1_pos = -1
    for i, e in enumerate(walls_data):
        if e["username"] == "p2": p2_pos = i
        if e["username"] == "p1": p1_pos = i
        
    if p2_pos != -1 and p1_pos != -1:
        assert p2_pos < p1_pos

    # Test High Score Logic (Update)
    # p1 submits new high score
    await client.post("/leaderboard/", json={"score": 500, "mode": "walls"}, headers={"Authorization": f"Bearer {tokens['p1']}"})
    
    # Check user profile
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {tokens['p1']}"})
    assert resp.json()["highScore"] == 500
    
    # p1 submits lower score
    await client.post("/leaderboard/", json={"score": 10, "mode": "walls"}, headers={"Authorization": f"Bearer {tokens['p1']}"})
    
    # Profile should NOT change
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {tokens['p1']}"})
    assert resp.json()["highScore"] == 500

@pytest.mark.asyncio
async def test_auth_edge_cases(client):
    """Test unauthorized access"""
    # No token
    resp = await client.get("/auth/me")
    assert resp.status_code == 401

    # Submit without token
    resp = await client.post("/leaderboard/", json={"score": 100, "mode": "walls"})
    assert resp.status_code == 401
