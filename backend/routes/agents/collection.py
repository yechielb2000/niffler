"""Preset catalog and remote inventory collection routes."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.adapters.connection_store import ConnectionStore
from backend.dependencies import get_connection_store, get_db_session, get_remote_machine_connector
from backend.repositories.agent_repository import AgentRepository
from backend.repositories.inventory_repository import InventoryRepository
from backend.schemas.api import CommandResult, RunPresetRequest
from backend.services.remote_machine import PRESETS_BY_ID
from backend.services.remote_machine.connector import RemoteMachineConnector

router = APIRouter(prefix="/api/v1/agents", tags=["collection"])


@router.post("/{agent_id}/commands", response_model=CommandResult)
def run_preset(
    agent_id: str,
    payload: RunPresetRequest,
    session: Session = Depends(get_db_session),
    connections: ConnectionStore = Depends(get_connection_store),
    connector: RemoteMachineConnector = Depends(get_remote_machine_connector),
) -> CommandResult:
    if not AgentRepository(session).exists(agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")
    preset = PRESETS_BY_ID.get(payload.preset_id)
    if preset is None:
        raise HTTPException(status_code=400, detail="Unknown preset command")
    active = connections.get(agent_id)
    if active is None:
        raise HTTPException(status_code=409, detail="Connect to the system first")

    try:
        result = connector.collect(active.connection, preset)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    result_payload: dict[str, Any] = result.model_dump(mode="json")
    InventoryRepository(session).store_collected_data(
        agent_id=agent_id,
        task_id=None,
        workflow_id=None,
        data_type=preset.category,
        schema_version=1,
        payload={"preset_id": preset.id, "label": preset.label, "result": result_payload},
    )
    return CommandResult(preset_id=preset.id, result=result_payload)
