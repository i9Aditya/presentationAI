import hashlib
import json
from typing import Any


def stable_hash(payload: Any) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def prompt_hash(prompt: str, output_type: str | None, audience: str | None) -> str:
    return stable_hash({"prompt": prompt.strip().lower(), "output_type": output_type, "audience": audience})

