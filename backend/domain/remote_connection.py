"""Short-lived SSH connection material used only while a session is active."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RemoteConnection:
    host: str
    port: int
    username: str
    credential: str | None = None
