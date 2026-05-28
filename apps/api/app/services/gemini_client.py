import json
import re
import httpx
from app.core.config import settings

class GeminiClient:
    def __init__(self):
        self.api_key = settings.gemini_api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def generate_sections(self, topic: str, audience: str, count: int, output_type: str) -> list[dict]:
        if not self.api_key:
            return []

        prompt = f"""
Create {count} high-quality sections for a {output_type} on: {topic}.
Audience: {audience}.
Return JSON only as an array. Each item must have:
title: string
bullets: array of 3 to 5 short strings
speaker_notes: string
Use practical context where relevant.
""".strip()

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "response_mime_type": "application/json",
            }
        }

        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(
                    f"{self.base_url}?key={self.api_key}",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                
                # Gemini response parsing
                text_content = data['candidates'][0]['content']['parts'][0]['text']
                return self._parse_json_array(text_content, count)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return []

    def status(self) -> dict[str, str]:
        if not self.api_key:
            return {"status": "unconfigured", "model": "gemini-1.5-flash"}
        return {"status": "connected", "model": "gemini-1.5-flash"}

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
