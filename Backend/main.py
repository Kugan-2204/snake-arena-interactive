from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, leaderboard, games

app = FastAPI(
    title="Snake Arena API",
    description="API for Snake Arena game backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(leaderboard.router)
app.include_router(games.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Snake Arena API"}
