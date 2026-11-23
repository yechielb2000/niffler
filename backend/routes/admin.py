from datetime import UTC, datetime
from time import monotonic

from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.adapters.agent_repository import AgentRepository
from backend.adapters.task_repository import TaskRepository
from backend.dependencies import get_db_session
from backend.models import SSHConnection
from backend.services.remote_machine import PRESETS, RemoteMachineConnector


class ConnectRequest(BaseModel):
    host: str = Field(min_length=1, max_length=255)
    port: int = Field(default=22, ge=1, le=65535)
    username: str = Field(min_length=1, max_length=128)
    credential: str | None = Field(default=None, max_length=4096)


class PresetRequest(BaseModel):
    preset_id: str


connector = RemoteMachineConnector()
_live_connections: dict[str, dict] = {}
_CONNECTION_TTL_SECONDS = 1800


def register_admin_routes(app, _base_dir=None):
    """Inventory, SSH connection and fixed preset collection endpoints."""

    @app.get("/api/v1/agents")
    def list_agents(session: Session = Depends(get_db_session)):
        return {"agents": AgentRepository(session).list_agents()}

    @app.get("/api/v1/agents/{agent_id}")
    def get_agent(agent_id: str, session: Session = Depends(get_db_session)):
        agent, _ = AgentRepository(session).get_agent(agent_id)
        if agent is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        repository = TaskRepository(session)
        tasks = repository.list_tasks(agent_id)
        for task in tasks:
            task.pop("source_code", None)
            task.pop("output", None)
        return {
            "agent": agent,
            "tasks": tasks,
            "workflows": repository.list_workflows(agent_id),
            "data": repository.list_collected_data(agent_id),
        }

    @app.get("/api/v1/commands")
    def list_commands():
        return {
            "commands": [
                {"id": p.id, "label": p.label, "category": p.category, "description": p.description}
                for p in PRESETS.values()
            ]
        }

    @app.get("/api/v1/agents/{agent_id}/connection")
    def get_connection(agent_id: str, session: Session = Depends(get_db_session)):
        record = session.query(SSHConnection).filter_by(agent_id=agent_id).one_or_none()
        live = _live_connections.get(agent_id)
        connected = bool(live and monotonic() - live["created"] < _CONNECTION_TTL_SECONDS)
        if live and not connected:
            _live_connections.pop(agent_id, None)
        return {
            "connected": connected,
            "saved": bool(record),
            "host": record.host if record else None,
            "port": record.port if record else None,
            "username": record.username if record else None,
        }

    @app.post("/api/v1/agents/{agent_id}/connect")
    def connect_agent(
        agent_id: str, payload: ConnectRequest, session: Session = Depends(get_db_session)
    ):
        if AgentRepository(session).get_agent(agent_id)[0] is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        try:
            state = connector.connect(
                payload.host, payload.port, payload.username, payload.credential
            )
        except Exception as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        record = session.query(SSHConnection).filter_by(agent_id=agent_id).one_or_none()
        if record is None:
            record = SSHConnection(agent_id=agent_id)
            session.add(record)
        record.host, record.port, record.username = payload.host, payload.port, payload.username
        record.credential_ref = None
        record.connected_at = datetime.now(UTC).isoformat()
        session.commit()
        _live_connections[agent_id] = {
            "host": payload.host,
            "port": payload.port,
            "username": payload.username,
            "credential": payload.credential,
            "created": monotonic(),
        }
        return {
            "connected": True,
            "host": payload.host,
            "port": payload.port,
            "username": payload.username,
            "system": state.get("system"),
        }

    @app.delete("/api/v1/agents/{agent_id}/connection")
    def disconnect_agent(agent_id: str):
        _live_connections.pop(agent_id, None)
        return {"connected": False}

    @app.post("/api/v1/agents/{agent_id}/commands")
    def run_preset(
        agent_id: str, payload: PresetRequest, session: Session = Depends(get_db_session)
    ):
        if AgentRepository(session).get_agent(agent_id)[0] is None:
            raise HTTPException(status_code=404, detail="Agent not found")
        preset = PRESETS.get(payload.preset_id)
        if preset is None:
            raise HTTPException(status_code=400, detail="Unknown preset command")
        record = session.query(SSHConnection).filter_by(agent_id=agent_id).one_or_none()
        if record is None:
            raise HTTPException(status_code=409, detail="Connect to the system first")
        # Credentials are never stored in the database. A configured credential
        # provider must resolve a short-lived secret from credential_ref.
        connection = _live_connections.get(agent_id)
        if not connection or monotonic() - connection["created"] >= _CONNECTION_TTL_SECONDS:
            _live_connections.pop(agent_id, None)
            raise HTTPException(
                status_code=409, detail="SSH session expired. Connect again to continue."
            )
        try:
            result = connector.collect(connection, preset)
        except Exception as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        repo = TaskRepository(session)
        repo.store_collected_data(
            agent_id,
            None,
            None,
            preset.category,
            1,
            {"preset_id": preset.id, "label": preset.label, "result": result},
        )
        return {"preset_id": preset.id, "result": result}
