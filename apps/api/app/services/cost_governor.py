from app.schemas.generation import CostEstimate, Intent


class CostGovernor:
    def estimate(self, intent: Intent, models: list[str]) -> CostEstimate:
        units = intent.length.get("slides") or max(intent.length.get("words", 1200) // 250, 1)
        input_tokens = 500 + units * 120
        output_tokens = 500 + units * 260
        return CostEstimate(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost_usd=0.0,
            selected_models=models,
            cache_strategy=[
                "local_ollama_generation",
                "prompt_hash",
                "section_hash",
                "export_hash",
                "no_paid_model_call",
            ],
        )
