"""Typed remote inventory collection."""

from backend.domain.remote_connection import RemoteConnection
from backend.services.remote_machine.connector import (
    CollectorRegistry,
    RemoteMachineConnector,
    RemoteMachineFactory,
)
from backend.services.remote_machine.presets import PRESETS, PRESETS_BY_ID, Preset

__all__ = [
    "PRESETS",
    "PRESETS_BY_ID",
    "CollectorRegistry",
    "Preset",
    "RemoteConnection",
    "RemoteMachineConnector",
    "RemoteMachineFactory",
]
