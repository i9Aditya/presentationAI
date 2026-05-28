# Intent Classifier v1

Return compact JSON only.

Input:

```text
{{user_prompt}}
```

Schema:

```json
{
  "output_type": "presentation | academic_report | business_document | research_paper | pitch_deck | assignment | summary | resume | project_report | viva_material",
  "topic": "string",
  "audience": "engineering_students | mba_students | business_professionals | startup_founders | researchers | general",
  "length": {
    "slides": 12,
    "words": 2500
  },
  "requires_research": true,
  "requires_citations": true,
  "requires_visuals": true,
  "visual_types": ["chart", "diagram"],
  "tone": "academic | business | concise | persuasive",
  "language": "en-IN"
}
```

