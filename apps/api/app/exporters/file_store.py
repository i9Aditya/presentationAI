import re
from pathlib import Path
from app.core.config import settings


class FileStore:
    def __init__(self) -> None:
        self.base_dir = Path(settings.generated_files_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def slug(self, value: str) -> str:
        cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")
        return cleaned[:70] or "document"

    def path_for(self, document_id: str, title: str, extension: str) -> Path:
        name = f"{self.slug(title)}-{document_id}.{extension}"
        return self.base_dir / name

    def url_for(self, path: Path) -> str:
        return f"/files/{path.name}"
