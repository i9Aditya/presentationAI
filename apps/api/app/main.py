from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, generation, health

app = FastAPI(title="PresentationAI API")

@app.get("/")
async def health_root():
    return {"status": "online", "service": "PresentationAI", "version": "0.3.2"}

# Mount and Include
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(generation.router)

# Catch-all to diagnose 404s
@app.api_route("/{path_name:path}", methods=["GET", "POST", "OPTIONS"])
async def catch_all(request: Request, path_name: str):
    return {"error": "Not Found", "path": path_name, "message": "Verify your URL structure"}

# Add CORS last
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)
