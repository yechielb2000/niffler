"""Generic preset catalog routes."""

from fastapi import APIRouter

from backend.schemas.api import Command, CommandListResponse
from backend.services.remote_machine import PRESETS

router = APIRouter(prefix="/api/v1", tags=["collection"])


@router.get("/commands", response_model=CommandListResponse)
def list_commands() -> CommandListResponse:
    return CommandListResponse(commands=[Command.model_validate(preset) for preset in PRESETS])
