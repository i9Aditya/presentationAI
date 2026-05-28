from fastapi import APIRouter, Depends
from app.schemas.generation import GenerateRequest, GenerateResponse
from app.services.auth_service import auth_service, get_current_user
from app.services.orchestrator import GenerationOrchestrator

router = APIRouter(prefix="/generate", tags=["generation"])
orchestrator = GenerationOrchestrator()


@router.post("", response_model=GenerateResponse)
def generate_document(request: GenerateRequest, user: dict = Depends(get_current_user)) -> GenerateResponse:
    auth_service.consume_generation(user)
    return orchestrator.generate(request)
