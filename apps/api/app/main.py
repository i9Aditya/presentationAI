from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, generation, health

app = FastAPI(title="PresentationAI API")

@app.middleware("http")
async def clean_path_middleware(request: Request, call_next):
    # Fix double slashes in path
    path = request.scope.get("path", "")
    if "//" in path:
        request.scope["path"] = path.replace("//", "/")
    return await call_next(request)

@app.get("/")
async def health_root():
    return {"status": "online", "service": "PresentationAI"}

@app.get("/healthz")
async def health_check_simple():
    return {"status": "ok"}

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
