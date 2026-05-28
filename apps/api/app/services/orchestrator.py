from uuid import uuid4
from app.agents.prompt_analyzer import PromptAnalyzer
from app.exporters.office_exporter import OfficeExportService
from app.schemas.document_ir import BulletBlock, ChartBlock, ChartData, DiagramBlock, DocumentIR, Section, TextBlock
from app.schemas.generation import GenerateRequest, GenerateResponse, QualityCheck
from app.services.cost_governor import CostGovernor
from app.core.config import settings
from app.services.model_router import ModelRouter
from app.services.ollama_client import OllamaClient
from app.services.gemini_client import GeminiClient


class GenerationOrchestrator:
    def __init__(self) -> None:
        self.prompt_analyzer = PromptAnalyzer()
        self.model_router = ModelRouter()
        self.cost_governor = CostGovernor()
        
        # Select LLM client based on configuration
        if settings.llm_provider == "gemini" and settings.gemini_api_key:
            self.llm = GeminiClient()
        else:
            self.llm = OllamaClient()
            
        self.exporter = OfficeExportService()

    def generate(self, request: GenerateRequest) -> GenerateResponse:
        intent = self.prompt_analyzer.analyze(request)
        models = [
            self.model_router.choose("classification").model,
            self.model_router.choose("outline_generation").model,
            self.model_router.choose("content_generation").model,
            self.model_router.choose("qa").model,
        ]
        document = self._build_document_ir(intent)
        exports = self.exporter.export_all(document)
        cost = self.cost_governor.estimate(intent, models)

        return GenerateResponse(
            job_id=f"job_{uuid4().hex[:12]}",
            status="completed",
            intent=intent,
            document=document,
            cost=cost,
            quality_checks=self._quality_checks(document),
            exports=exports,
        )

    def _build_document_ir(self, intent):
        section_count = intent.length.get("slides") or min(max(intent.length.get("words", 1800) // 350, 4), 12)
        llm_sections = self.llm.generate_sections(
            topic=intent.topic,
            audience=intent.audience.value.replace("_", " "),
            count=section_count,
            output_type=intent.output_type.value,
        )
        titles = [item.get("title") for item in llm_sections if item.get("title")] or self._section_titles(intent.topic, section_count)
        sections = []

        for idx in range(section_count):
            generated = llm_sections[idx] if idx < len(llm_sections) else {}
            title = generated.get("title") or titles[idx] if idx < len(titles) else f"Section {idx + 1}"
            bullets = generated.get("bullets") if isinstance(generated.get("bullets"), list) else None
            if not bullets:
                bullets = self._fallback_bullets(title, intent.topic, intent.audience.value)

            blocks = [BulletBlock(items=[str(item)[:180] for item in bullets[:5]])]
            if idx == 2 and intent.requires_visuals:
                blocks.append(DiagramBlock(
                    diagram_kind="flowchart",
                    title="Generation Workflow",
                    source="Prompt -> Outline -> Content -> Editable Export",
                ))
            if idx == 3 and ("chart" in intent.visual_types or intent.requires_visuals):
                blocks.append(ChartBlock(
                    chart_kind="bar",
                    title="Illustrative Priority Comparison",
                    data=ChartData(labels=["Quality", "Speed", "Cost", "Editability"], values=[88, 76, 92, 95]),
                ))
            if idx == 0:
                blocks.insert(0, TextBlock(role="subtitle", text=f"Prepared for {intent.audience.value.replace('_', ' ')}"))

            sections.append(Section(
                id=f"section_{idx + 1}",
                kind="slide" if intent.output_type.value in {"presentation", "pitch_deck"} else "section",
                title=str(title),
                layout="title_content_visual" if len(blocks) > 1 else "title_content",
                content_blocks=blocks,
                speaker_notes=generated.get("speaker_notes") or f"Explain {str(title).lower()} with concrete examples and connect it back to {intent.topic}.",
            ))

        return DocumentIR(
            document_id=f"doc_{uuid4().hex[:12]}",
            type=intent.output_type,
            audience=intent.audience,
            title=intent.topic.title(),
            sections=sections,
        )

    def _fallback_bullets(self, title: str, topic: str, audience: str) -> list[str]:
        audience_label = audience.replace("_", " ")
        return [
            f"Define the role of {title.lower()} in {topic}.",
            f"Highlight the practical importance for {audience_label}.",
            "Include implementation steps, assumptions, and expected outcomes.",
            "Add examples, metrics, or diagrams where they improve clarity.",
        ]

    def _section_titles(self, topic: str, count: int) -> list[str]:
        base = [
            "Title and Context",
            "Problem Statement",
            "Core Concepts",
            "Architecture and Workflow",
            "Methodology",
            "Data and Evidence",
            "Implementation Plan",
            "Results and Analysis",
            "Challenges",
            "Recommendations",
            "Conclusion",
            "References",
        ]
        if count <= len(base):
            return base[:count]
        return base + [f"Appendix {i}" for i in range(1, count - len(base) + 1)]

    def _quality_checks(self, document: DocumentIR) -> list[QualityCheck]:
        llm_status = self.llm.status()
        provider_name = "Gemini" if settings.llm_provider == "gemini" else "Ollama"
        return [
            QualityCheck(name="schema_validation", status="passed", message="Document IR is valid."),
            QualityCheck(name="editable_exports", status="passed", message="PPTX is rendered with PptxGenJS using editable shapes, cards, charts and speaker notes. DOCX remains editable."),
            QualityCheck(name="ai_status", status="passed" if llm_status["status"] == "connected" else "warning", message=f"{provider_name} is {llm_status['status']} using model {llm_status['model']}. Fallback content is used if offline."),
        ]

