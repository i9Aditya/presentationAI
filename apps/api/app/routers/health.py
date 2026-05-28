from fastapi import APIRouter
from app.services.ollama_client import OllamaClient
from app.services.gemini_client import GeminiClient

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ollama")
def ollama_health() -> dict[str, str]:
    return OllamaClient().status()


@router.get("/gemini")
def gemini_health() -> dict[str, str]:
    return GeminiClient().status()
