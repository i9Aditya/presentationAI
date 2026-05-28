from dataclasses import dataclass
from app.core.config import settings


@dataclass(frozen=True)
class ModelChoice:
    provider: str
    model: str
    tier: str
    reason: str


class ModelRouter:
    def choose(self, task: str, complexity: str = "normal") -> ModelChoice:
        if settings.llm_provider == "gemini" and settings.gemini_api_key:
            return ModelChoice("gemini", "gemini-1.5-flash", "cloud", "Google Gemini API (Free Tier)")
            
        tier = "local"
        reason = "local Ollama model avoids paid API calls and keeps document planning private"
        return ModelChoice("ollama", settings.ollama_model, tier, reason)
