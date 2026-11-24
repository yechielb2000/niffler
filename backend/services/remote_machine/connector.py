"""Session factory and registry-driven remote collection service."""

from __future__ import annotations

import io
from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel

from backend.domain.remote_connection import RemoteConnection
from backend.schemas.connections import ConnectionResult
from backend.services.remote_machine.collectors import (
    CollectionClient,
    InventoryCollector,
    default_collectors,
    host_info_from_remote,
)
from backend.services.remote_machine.presets import Preset


class RemoteMachineFactory:
    """Build short-lived library clients without retaining credential material."""

    def create(self, connection: RemoteConnection) -> Any:
        try:
            from remote_machine import RemoteMachine
        except ImportError as exc:
            raise RuntimeError(
                "Install remote-machine and paramiko to enable SSH collection"
            ) from exc

        kwargs: dict[str, Any] = {"port": connection.port}
        if connection.credential:
            kwargs.update(_authentication(connection.credential))
        return RemoteMachine(connection.host, connection.username, **kwargs)


class CollectorRegistry:
    """Resolve preset identifiers to reusable, category-focused collectors."""

    def __init__(self, collectors: Sequence[InventoryCollector] | None = None) -> None:
        definitions = collectors if collectors is not None else default_collectors()
        self._collectors = {collector.preset_id: collector for collector in definitions}
        if len(self._collectors) != len(definitions):
            raise ValueError("Collector preset identifiers must be unique")

    def collect(self, preset: Preset, client: CollectionClient) -> BaseModel:
        collector = self._collectors.get(preset.id)
        if collector is None:
            raise ValueError(f"No inventory collector is registered for preset '{preset.id}'")
        return collector.collect(client)


class RemoteMachineConnector:
    """Coordinates an SSH session and a registered typed inventory collector."""

    def __init__(
        self,
        factory: RemoteMachineFactory | None = None,
        collectors: CollectorRegistry | None = None,
    ) -> None:
        self._factory = factory if factory is not None else RemoteMachineFactory()
        self._collectors = collectors if collectors is not None else CollectorRegistry()

    def connect(self, connection: RemoteConnection) -> ConnectionResult:
        with self._factory.create(connection) as client:
            system_info = client.sys.info()
            return ConnectionResult(
                connected=True,
                system=host_info_from_remote(system_info),
            )

    def collect(self, connection: RemoteConnection, preset: Preset) -> BaseModel:
        with self._factory.create(connection) as client:
            return self._collectors.collect(preset, client)


def _authentication(credential: str) -> dict[str, Any]:
    try:
        import paramiko
    except ImportError as exc:
        raise RuntimeError("Install paramiko to use SSH credentials") from exc

    for key_type in (paramiko.Ed25519Key, paramiko.RSAKey, paramiko.ECDSAKey):
        try:
            return {"pkey": key_type.from_private_key(io.StringIO(credential))}
        except (paramiko.SSHException, ValueError):
            continue
    return {"password": credential}
