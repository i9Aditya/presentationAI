from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import auth, generation, health


app = FastAPI(
    title="PresentationAI Local API",
    version="0.3.0",
    description="Local-first prompt-to-PPT/document generation backend with auth, subscriptions, Ollama, and PptxGenJS exports.",
)

@app.get("/")
def root():
    return {"status": "online", "message": "PresentationAI API is running"}

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
