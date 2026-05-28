from app.schemas.document_ir import DocumentIR
from app.schemas.generation import QualityCheck


class QualityVerifier:
    def verify(self, document: DocumentIR) -> list[QualityCheck]:
        checks = [
            QualityCheck(name="schema_validation", status="passed", message="Document IR parsed successfully."),
            QualityCheck(name="section_count", status="passed", message=f"{len(document.sections)} sections generated."),
        ]

        dense_sections = [
            section.id
            for section in document.sections
            if sum(len(str(block.model_dump())) for block in section.content_blocks) > 1800
        ]
        checks.append(
            QualityCheck(
                name="density",
                status="warning" if dense_sections else "passed",
                message="Dense sections need split review." if dense_sections else "No section density issues found.",
            )
        )
        return checks

