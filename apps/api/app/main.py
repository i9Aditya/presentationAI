from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, generation, health

app = FastAPI(title="PresentationAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def debug_middleware(request: Request, call_next):
    print(f"DEBUG: Request to {request.url.path}")
    return await call_next(request)

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
