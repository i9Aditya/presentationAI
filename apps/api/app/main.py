from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, generation, health

app = FastAPI(
    title="PresentationAI API",
    version="0.3.1",
)

@app.on_event("startup")
async def startup_event():
    print("🚀 PresentationAI API is starting up...")
    print(f"Environment: {settings.app_env}")

@app.middleware("http")
async def fix_double_slashes(request: Request, call_next):
    path = request.url.path
    if "//" in path:
        new_path = path.replace("//", "/")
        # Internal redirect/rewrite or just continue? 
        # For simplicity, let's just rewrite the scope path
        request.scope["path"] = new_path
    return await call_next(request)

@app.get("/")
async def root():
    return {"status": "online", "message": "PresentationAI API is live"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/files", StaticFiles(directory=settings.generated_files_dir), name="files")
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(generation.router)
