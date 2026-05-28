import json
import re
import httpx
from app.core.config import settings


class OllamaClient:
    def generate_sections(self, topic: str, audience: str, count: int, output_type: str) -> list[dict]:
        prompt = f"""
Create {count} high-quality sections for a {output_type} on: {topic}.
Audience: {audience}.
Return JSON only as an array. Each item must have:
title: string
bullets: array of 3 to 5 short strings
speaker_notes: string
Use practical Indian academic/business context where relevant.
""".strip()
        try:
            with httpx.Client(timeout=45) as client:
                response = client.post(
                    f"{settings.ollama_base_url.rstrip('/')}/api/generate",
                    json={"model": settings.ollama_model, "prompt": prompt, "stream": False},
                )
                response.raise_for_status()
                raw = response.json().get("response", "")
                return self._parse_json_array(raw, count)
        except Exception:
            return []

    def status(self) -> dict[str, str]:
        try:
            with httpx.Client(timeout=3) as client:
                response = client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
                response.raise_for_status()
                return {"status": "connected", "model": settings.ollama_model}
        except Exception:
            return {"status": "offline", "model": settings.ollama_model}

    def _parse_json_array(self, raw: str, count: int) -> list[dict]:
        match = re.search(r"\[.*\]", raw, flags=re.S)
        if not match:
            return []
        try:
            data = json.loads(match.group(0))
            if isinstance(data, list):
                return data[:count]
        except json.JSONDecodeError:
            return []
        return []
