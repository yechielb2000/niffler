"""Connection request and status models."""

from pydantic import BaseModel, ConfigDict, Field, SecretStr

from backend.schemas.remote_inventory import HostInfo


class ConnectRequest(BaseModel):
    host: str = Field(min_length=1, max_length=255)
    port: int = Field(default=22, ge=1, le=65535)
    username: str = Field(min_length=1, max_length=128)
    credential: SecretStr | None = Field(default=None, max_length=4096, exclude=True)


class ConnectionStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    connected: bool
    saved: bool
    host: str | None = None
    port: int | None = None
    username: str | None = None
    connected_at: str | None = None
    system: HostInfo | None = None


class ConnectionAttemptRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    attempted_at: str
    succeeded: bool
    reason: str | None = None


class ConnectionAttemptList(BaseModel):
    attempts: list[ConnectionAttemptRecord]


class ConnectionResult(BaseModel):
    connected: bool
    system: HostInfo
