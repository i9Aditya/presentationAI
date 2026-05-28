# System Architecture

## Product boundary

The platform generates export-safe structured documents from natural-language prompts. The core design choice is to never treat generated prose as the source of truth. Every generation becomes a typed intermediate representation, then deterministic exporters render PPTX, DOCX, PDF, and preview formats.

## High-level services

```text
Next.js Web App
  -> FastAPI API Gateway
  -> Generation Orchestrator
  -> Model Router
  -> Research/RAG Service
  -> Template + Design Engine
  -> Export Engine
  -> Quality Verifier
  -> Billing + Usage Meter
```

## Request flow

```text
Prompt
  -> intent analysis
  -> outline generation
  -> research retrieval when required
  -> content block generation
  -> visual planning
  -> design/template application
  -> deterministic export
  -> QA checks
```

## Key architecture rule

LLMs produce plans, blocks, citations, diagram specs, and revision patches. Code handles layout, coordinates, export rendering, billing, validation, permissions, and storage.

