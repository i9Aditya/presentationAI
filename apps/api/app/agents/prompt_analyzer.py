import re
from app.schemas.document_ir import Audience, OutputType
from app.schemas.generation import GenerateRequest, Intent


class PromptAnalyzer:
    def analyze(self, request: GenerateRequest) -> Intent:
        prompt = request.prompt.strip()
        lowered = prompt.lower()

        output_type = request.output_type or self._detect_output_type(lowered)
        audience = request.audience or self._detect_audience(lowered)
        length = self._detect_length(lowered, output_type, request.preferred_length)

        return Intent(
            output_type=output_type,
            topic=self._extract_topic(prompt),
            audience=audience,
            length=length,
            requires_research=request.require_research if request.require_research is not None else self._needs_research(lowered),
            requires_citations=request.require_citations if request.require_citations is not None else self._needs_citations(lowered),
            requires_visuals=any(word in lowered for word in ["chart", "diagram", "visual", "architecture", "flow"]),
            visual_types=[word for word in ["chart", "diagram", "table"] if word in lowered] or ["diagram"],
            tone="academic" if audience in {Audience.engineering_students, Audience.researchers} else "business",
        )

    def _detect_output_type(self, text: str) -> OutputType:
        if "ppt" in text or "slide" in text or "presentation" in text:
            return OutputType.presentation
        if "pitch" in text:
            return OutputType.pitch_deck
        if "resume" in text or "cv" in text:
            return OutputType.resume
        if "research paper" in text:
            return OutputType.research_paper
        if "assignment" in text:
            return OutputType.assignment
        if "viva" in text:
            return OutputType.viva_material
        if "summary" in text:
            return OutputType.summary
        if "project report" in text:
            return OutputType.project_report
        return OutputType.academic_report

    def _detect_audience(self, text: str) -> Audience:
        if "mba" in text:
            return Audience.mba_students
        if "startup" in text or "founder" in text:
            return Audience.startup_founders
        if "business" in text:
            return Audience.business_professionals
        if "research" in text or "paper" in text:
            return Audience.researchers
        if "engineering" in text or "dataset" in text or "lab" in text:
            return Audience.engineering_students
        return Audience.general

    def _detect_length(self, text: str, output_type: OutputType, preferred_length: int | None) -> dict[str, int]:
        if output_type in {OutputType.presentation, OutputType.pitch_deck}:
            match = re.search(r"(\d+)\s*[- ]?(slide|slides|ppt)", text)
            return {"slides": preferred_length or int(match.group(1)) if match else preferred_length or 10}
        match = re.search(r"(\d+)\s*[- ]?(word|words)", text)
        return {"words": preferred_length or int(match.group(1)) if match else preferred_length or 1800}

    def _extract_topic(self, prompt: str) -> str:
        cleaned = re.sub(
            r"\b(create|generate|make|write|a|an|the|ppt|presentation)\b|\b\d+[- ]?slides?\b",
            "",
            prompt,
            flags=re.I,
        )
        cleaned = re.sub(r"\s+", " ", cleaned)
        return cleaned.strip(" .")[:140] or prompt[:140]

    def _needs_research(self, text: str) -> bool:
        return any(word in text for word in ["research", "paper", "dataset", "citation", "references", "statistics", "literature"])

    def _needs_citations(self, text: str) -> bool:
        return any(word in text for word in ["citation", "references", "apa", "ieee", "research paper", "literature"])
