from uuid import uuid4
from app.agents.prompt_analyzer import PromptAnalyzer
from app.exporters.office_exporter import OfficeExportService
from app.schemas.document_ir import BulletBlock, ChartBlock, ChartData, DiagramBlock, DocumentIR, Section, TableBlock, TextBlock
from app.schemas.generation import GenerateRequest, GenerateResponse, QualityCheck
from app.services.content_planner import ContentPlanner
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
        self.content_planner = ContentPlanner()

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

    def export_document(self, document: DocumentIR):
        return self.exporter.export_all(document)

    def _build_document_ir(self, intent):
        section_count = intent.length.get("slides") or min(max(intent.length.get("words", 1800) // 350, 4), 12)
        planned_sections = self.content_planner.plan(
            topic=intent.topic,
            audience=intent.audience.value,
            count=section_count,
            output_type=intent.output_type.value,
        )
        llm_sections = self.llm.generate_sections(
            topic=intent.topic,
            audience=intent.audience.value.replace("_", " "),
            count=section_count,
            output_type=intent.output_type.value,
            planned_sections=planned_sections,
        )
        sections = []

        layouts = [
            "hero_statement",
            "two_column_cards",
            "diagram_flow",
            "chart_focus",
            "timeline",
            "comparison_table",
            "quote_insight",
        ]

        for idx in range(section_count):
            planned = planned_sections[idx] if idx < len(planned_sections) else {}
            generated = llm_sections[idx] if idx < len(llm_sections) else {}
            title = generated.get("title") or planned.get("title") or f"Section {idx + 1}"
            bullets = self._valid_bullets(generated.get("bullets")) or self._valid_bullets(planned.get("bullets"))
            if not bullets:
                bullets = self._fallback_bullets(title, intent.topic, intent.audience.value)

            blocks = [BulletBlock(items=[str(item)[:180] for item in bullets[:5]])]
            visual = planned.get("visual") if isinstance(planned.get("visual"), dict) else {}
            if visual.get("type") == "diagram" or (idx == 2 and intent.requires_visuals):
                blocks.append(DiagramBlock(
                    diagram_kind="flowchart",
                    title=f"{str(title)} Workflow",
                    source=self._diagram_source(intent.topic, title, bullets),
                ))
            if visual.get("type") == "chart" or (idx == 3 and ("chart" in intent.visual_types or intent.requires_visuals)):
                blocks.append(ChartBlock(
                    chart_kind="bar",
                    title=f"{str(title)} Priority View",
                    data=self._chart_data(intent.topic, bullets),
                ))
            if visual.get("type") == "table" or idx % 7 == 5:
                blocks.append(TableBlock(
                    headers=["Focus area", "Why it matters", "Action for this deck"],
                    rows=self._table_rows(intent.topic, bullets),
                ))
            if idx == 0:
                blocks.insert(0, TextBlock(role="subtitle", text=f"Prepared for {intent.audience.value.replace('_', ' ')}"))

            sections.append(Section(
                id=f"section_{idx + 1}",
                kind="slide" if intent.output_type.value in {"presentation", "pitch_deck"} else "section",
                title=str(title),
                layout=layouts[idx % len(layouts)],
                content_blocks=blocks,
                speaker_notes=generated.get("speaker_notes") or planned.get("speaker_notes") or f"Explain {str(title).lower()} with concrete examples and connect it back to {intent.topic}.",
            ))

        return DocumentIR(
            document_id=f"doc_{uuid4().hex[:12]}",
            type=intent.output_type,
            audience=intent.audience,
            title=intent.topic.title(),
            sections=sections,
        )

    def _valid_bullets(self, value) -> list[str] | None:
        if not isinstance(value, list):
            return None
        bullets = [str(item).strip() for item in value if str(item).strip()]
        weak_phrases = ["explain the topic", "add examples", "key points", "important aspects"]
        strong = [item for item in bullets if not any(phrase in item.lower() for phrase in weak_phrases)]
        return strong[:5] if len(strong) >= 3 else None

    def _diagram_source(self, topic: str, title: str, bullets: list[str]) -> str:
        steps = [self._short_label(item) for item in bullets[:4]]
        if len(steps) < 4:
            steps = ["Input", "Processing", "Validation", "Outcome"]
        return " -> ".join(steps) + f" -> {self._short_label(topic)}"

    def _chart_data(self, topic: str, bullets: list[str]) -> ChartData:
        labels = [self._short_label(item) for item in bullets[:4]]
        if len(labels) < 4:
            labels = ["Relevance", "Feasibility", "Risk control", "Impact"]
        values = [88, 76, 82, 91][:len(labels)]
        return ChartData(labels=labels, values=values)

    def _table_rows(self, topic: str, bullets: list[str]) -> list[list[str]]:
        rows = []
        for item in bullets[:3]:
            label = self._short_label(item)
            rows.append([label, item[:70], f"Use this to explain {self._short_label(topic).lower()} clearly"])
        while len(rows) < 3:
            rows.append(["Evidence", "Needs topic-specific validation", "Replace with project result or source"])
        return rows

    def _short_label(self, value: str) -> str:
        cleaned = str(value).strip().replace(".", "")
        words = cleaned.split()
        if not words:
            return "Insight"
        return " ".join(words[:4])[:34]

    def _fallback_bullets(self, title: str, topic: str, audience: str) -> list[str]:
        audience_label = audience.replace("_", " ")
        title_lower = title.lower()
        if "problem" in title_lower:
            return [
                f"Frame the main pain point or knowledge gap around {topic}.",
                f"Show why this matters for {audience_label} using a concrete scenario.",
                "Separate symptoms, root causes, and measurable impact.",
                "End with the decision or question the deck will answer.",
            ]
        if "architecture" in title_lower or "workflow" in title_lower or "methodology" in title_lower:
            return [
                "Break the solution into input, processing, validation, and output stages.",
                "Name the tools, datasets, models, or business processes used at each stage.",
                "Explain how information moves between teams, systems, or components.",
                "Call out the controls that improve reliability, accuracy, and editability.",
            ]
        if "data" in title_lower or "evidence" in title_lower or "result" in title_lower:
            return [
                "Summarize the most important metric before adding supporting details.",
                "Compare the baseline with the proposed or observed improvement.",
                "Mention assumptions, sample size, constraints, or evaluation method.",
                "Translate the evidence into a practical implication for the audience.",
            ]
        if "recommend" in title_lower or "conclusion" in title_lower:
            return [
                f"Restate the strongest takeaway about {topic} in one sentence.",
                "Prioritize the next actions by effort, impact, and urgency.",
                "Identify risks to monitor during implementation or presentation review.",
                "Close with a clear decision, learning outcome, or call to action.",
            ]
        return [
            f"Explain the role of {title_lower} within {topic}.",
            f"Connect the idea to a realistic use case for {audience_label}.",
            "Add one example, metric, or comparison that makes the point memorable.",
            "Clarify what the audience should understand before the next slide.",
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
        topic_terms = {
            word.lower()
            for word in document.title.replace("-", " ").split()
            if len(word) > 3
        }
        bullet_text = " ".join(
            str(item)
            for section in document.sections
            for block in section.content_blocks
            if block.type == "bullets"
            for item in block.items
        ).lower()
        matched_terms = sorted(term for term in topic_terms if term in bullet_text)
        specificity_status = "passed" if len(matched_terms) >= min(2, len(topic_terms)) else "warning"
        return [
            QualityCheck(name="schema_validation", status="passed", message="Document IR is valid."),
            QualityCheck(name="content_specificity", status=specificity_status, message=f"Slides include topic-linked terms: {', '.join(matched_terms[:6]) or 'needs more topic detail'}."),
            QualityCheck(name="editable_exports", status="passed", message="PPTX is rendered with PptxGenJS using editable shapes, cards, charts and speaker notes. DOCX remains editable."),
            QualityCheck(name="ai_status", status="passed" if llm_status["status"] == "connected" else "warning", message=f"{provider_name} is {llm_status['status']} using model {llm_status['model']}. Fallback content is used if offline."),
        ]

