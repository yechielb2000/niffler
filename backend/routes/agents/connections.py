"""Remote system connection lifecycle routes."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.adapters.connection_store import ConnectionStore
from backend.dependencies import get_connection_store, get_db_session, get_remote_machine_connector
from backend.domain.remote_connection import RemoteConnection
from backend.models import ConnectionAttempt, SSHConnection
from backend.repositories.agent_repository import AgentRepository
from backend.schemas.connections import (
    ConnectionAttemptList,
    ConnectionAttemptRecord,
    ConnectionStatus,
    ConnectRequest,
)
from backend.services.remote_machine.connector import RemoteMachineConnector

router = APIRouter(prefix="/api/v1/agents/{agent_id}/connection", tags=["agents"])


@router.get("", response_model=ConnectionStatus)
def get_connection(
    agent_id: str,
    session: Session = Depends(get_db_session),
    connections: ConnectionStore = Depends(get_connection_store),
) -> ConnectionStatus:
    record = session.scalars(
        select(SSHConnection).where(SSHConnection.agent_id == agent_id)
    ).one_or_none()
    active = connections.get(agent_id)
    return ConnectionStatus(
        connected=active is not None,
        saved=record is not None,
        host=record.host if record else None,
        port=record.port if record else None,
        username=record.username if record else None,
        connected_at=record.connected_at if record else None,
    )


@router.get("/attempts", response_model=ConnectionAttemptList)
def list_connection_attempts(
    agent_id: str,
    session: Session = Depends(get_db_session),
) -> ConnectionAttemptList:
    records = session.scalars(
        select(ConnectionAttempt)
        .where(ConnectionAttempt.agent_id == agent_id)
        .order_by(ConnectionAttempt.attempted_at.desc())
    ).all()
    return ConnectionAttemptList(
        attempts=[ConnectionAttemptRecord.model_validate(record) for record in records]
    )


@router.post("", response_model=ConnectionStatus)
def connect_agent(
    agent_id: str,
    payload: ConnectRequest,
    session: Session = Depends(get_db_session),
    connections: ConnectionStore = Depends(get_connection_store),
    connector: RemoteMachineConnector = Depends(get_remote_machine_connector),
) -> ConnectionStatus:
    if not AgentRepository(session).exists(agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    credential = payload.credential.get_secret_value() if payload.credential else None
    remote_connection = RemoteConnection(
        host=payload.host,
        port=payload.port,
        username=payload.username,
        credential=credential,
    )
    attempted_at = datetime.now(UTC).isoformat()
    try:
        connection_result = connector.connect(remote_connection)
    except Exception as exc:
        session.add(
            ConnectionAttempt(
                agent_id=agent_id,
                attempted_at=attempted_at,
                succeeded=False,
                reason=str(exc),
            )
        )
        session.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    session.add(
        ConnectionAttempt(agent_id=agent_id, attempted_at=attempted_at, succeeded=True)
    )
    record = session.scalars(
        select(SSHConnection).where(SSHConnection.agent_id == agent_id)
    ).one_or_none()
    if record is None:
        record = SSHConnection(agent_id=agent_id)
        session.add(record)
    record.host = payload.host
    record.port = payload.port
    record.username = payload.username
    record.credential_ref = None
    record.connected_at = datetime.now(UTC).isoformat()
    session.commit()
    connections.put(agent_id, remote_connection)
    return ConnectionStatus(
        connected=True,
        saved=True,
        host=record.host,
        port=record.port,
        username=record.username,
        connected_at=record.connected_at,
        system=connection_result.system,
    )


@router.delete("", response_model=ConnectionStatus)
def disconnect_agent(
    agent_id: str,
    session: Session = Depends(get_db_session),
    connections: ConnectionStore = Depends(get_connection_store),
) -> ConnectionStatus:
    connections.delete(agent_id)
    record = session.scalars(
        select(SSHConnection).where(SSHConnection.agent_id == agent_id)
    ).one_or_none()
    return ConnectionStatus(
        connected=False,
        saved=record is not None,
        connected_at=record.connected_at if record else None,
    )
