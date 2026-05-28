from enum import StrEnum
from typing import Literal
from pydantic import BaseModel, Field


class OutputType(StrEnum):
    presentation = "presentation"
    academic_report = "academic_report"
    business_document = "business_document"
    research_paper = "research_paper"
    pitch_deck = "pitch_deck"
    assignment = "assignment"
    summary = "summary"
    resume = "resume"
    project_report = "project_report"
    viva_material = "viva_material"


class Audience(StrEnum):
    engineering_students = "engineering_students"
    mba_students = "mba_students"
    business_professionals = "business_professionals"
    startup_founders = "startup_founders"
    researchers = "researchers"
    general = "general"


class Theme(BaseModel):
    font_heading: str = "Inter"
    font_body: str = "Source Sans 3"
    primary: str = "#2563EB"
    accent: str = "#F97316"
    background: str = "#FFFFFF"
    foreground: str = "#111827"


class TextBlock(BaseModel):
    type: Literal["text"] = "text"
    role: Literal["heading", "subtitle", "paragraph", "callout"]
    text: str


class BulletBlock(BaseModel):
    type: Literal["bullets"] = "bullets"
    items: list[str]


class ChartData(BaseModel):
    labels: list[str]
    values: list[float]


class ChartBlock(BaseModel):
    type: Literal["chart"] = "chart"
    chart_kind: Literal["bar", "line", "pie", "doughnut", "scatter"]
    title: str
    data: ChartData


class DiagramBlock(BaseModel):
    type: Literal["diagram"] = "diagram"
    diagram_kind: Literal["mermaid", "excalidraw", "uml", "architecture", "flowchart"]
    title: str
    source: str


class TableBlock(BaseModel):
    type: Literal["table"] = "table"
    headers: list[str]
    rows: list[list[str]]


ContentBlock = TextBlock | BulletBlock | ChartBlock | DiagramBlock | TableBlock


class Citation(BaseModel):
    id: str
    title: str
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    source_url: str | None = None
    doi: str | None = None
    style: Literal["APA", "IEEE", "MLA"] = "IEEE"
    formatted_text: str
    reliability_score: float = Field(default=0.5, ge=0, le=1)


class Section(BaseModel):
    id: str
    kind: str
    title: str
    layout: str | None = None
    content_blocks: list[ContentBlock]
    speaker_notes: str | None = None
    citation_ids: list[str] = Field(default_factory=list)


class DocumentIR(BaseModel):
    document_id: str
    type: OutputType
    audience: Audience = Audience.general
    language: str = "en-IN"
    style: str = "academic-modern"
    title: str
    sections: list[Section]
    citations: list[Citation] = Field(default_factory=list)
    theme: Theme = Field(default_factory=Theme)

