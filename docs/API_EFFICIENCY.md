# API Efficiency Strategy

## Cost governor

Every AI step must declare:

- task type
- maximum input tokens
- maximum output tokens
- preferred model tier
- cache key
- retry policy
- maximum cost

## Model routing

Cheap models handle classification, JSON repair, titles, summaries, formatting, and safety checks. Larger models are reserved for complex academic synthesis, research interpretation, and high-value final generation.

## Cache keys

```text
prompt_hash = sha256(prompt + output_type + audience + template_id)
outline_hash = sha256(normalized_intent + template_family)
section_hash = sha256(section_plan + source_chunk_ids + style)
export_hash = sha256(document_ir + export_format + template_version)
```

## Regeneration policy

Regenerate the smallest possible unit:

- one slide
- one section
- one chart
- one citation list
- one theme/export

Never rerun the whole document when an isolated patch is enough.

