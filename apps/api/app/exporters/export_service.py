from app.schemas.document_ir import DocumentIR


class ExportService:
    def plan_exports(self, document: DocumentIR) -> list[dict[str, str]]:
        formats = ["pdf"]
        if document.type.value in {"presentation", "pitch_deck"}:
            formats.insert(0, "pptx")
        else:
            formats.insert(0, "docx")

        return [{"format": item, "status": "queued"} for item in formats]

