from pydantic import BaseModel, Field
from app.schemas.document_ir import Audience, DocumentIR, OutputType


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=5)
    output_type: OutputType | None = None
    audience: Audience | None = None
    preferred_length: int | None = Field(default=None, ge=1, le=100)
    require_research: bool | None = None
    require_citations: bool | None = None


class Intent(BaseModel):
    output_type: OutputType
    topic: str
    audience: Audience
    length: dict[str, int]
    requires_research: bool
    requires_citations: bool
    requires_visuals: bool
    visual_types: list[str]
    tone: str
    language: str = "en-IN"


class CostEstimate(BaseModel):
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float
    selected_models: list[str]
    cache_strategy: list[str]


class QualityCheck(BaseModel):
    name: str
    status: str
    message: str


class ExportOption(BaseModel):
    format: str
    status: str
    url: str | None = None


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    intent: Intent
    document: DocumentIR
    cost: CostEstimate
    quality_checks: list[QualityCheck]
    exports: list[ExportOption]

