from dataclasses import dataclass


@dataclass(frozen=True)
class ResearchNote:
    claim: str
    source_title: str
    source_url: str | None = None
    confidence: float = 0.5


class ResearchService:
    def retrieve_notes(self, topic: str, enabled: bool) -> list[ResearchNote]:
        if not enabled:
            return []

        return [
            ResearchNote(
                claim=f"{topic} requires source-grounded validation before final academic export.",
                source_title="Placeholder research note",
                confidence=0.3,
            )
        ]

