from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, leaderboard, games

from contextlib import asynccontextmanager
from database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Snake Arena API",
    description="API for Snake Arena game backend",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Include Routers
app.include_router(auth.router)
app.include_router(leaderboard.router)
app.include_router(games.router)

# Mount static files (JS, CSS, images)
# We check if directory exists to avoid errors in dev mode without build
if os.path.exists("static"):
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If API path not matched by routers above, serve index.html
    # but only if not an API call (double check)
    if full_path.startswith("api/"):
        return {"error": "API endpoint not found"}
        
    if os.path.exists("static/index.html"):
        return FileResponse("static/index.html")
    return {"message": "Welcome to Snake Arena API (Frontend not built)"}
