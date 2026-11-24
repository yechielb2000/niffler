"""Ephemeral connection-state store, replaceable with a Redis implementation."""

from dataclasses import dataclass
from time import monotonic
from typing import Protocol

from backend.domain.remote_connection import RemoteConnection


@dataclass(frozen=True, slots=True)
class ActiveConnection:
    connection: RemoteConnection
    created_at: float


class ConnectionStore(Protocol):
    def get(self, agent_id: str) -> ActiveConnection | None: ...

    def put(self, agent_id: str, connection: RemoteConnection) -> None: ...

    def delete(self, agent_id: str) -> None: ...


class InMemoryConnectionStore:
    """Process-local session store. A TTL-backed Redis store can implement the same API."""

    def __init__(self, ttl_seconds: int = 1800) -> None:
        self._ttl_seconds = ttl_seconds
        self._connections: dict[str, ActiveConnection] = {}

    def get(self, agent_id: str) -> ActiveConnection | None:
        active = self._connections.get(agent_id)
        if active is None:
            return None
        if monotonic() - active.created_at >= self._ttl_seconds:
            self.delete(agent_id)
            return None
        return active

    def put(self, agent_id: str, connection: RemoteConnection) -> None:
        self._connections[agent_id] = ActiveConnection(connection, monotonic())

    def delete(self, agent_id: str) -> None:
        self._connections.pop(agent_id, None)
