from typing import Any

from sqlalchemy import JSON, Boolean, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Agent(Base):
    __tablename__ = "agents"

    agent_id: Mapped[str] = mapped_column(String, primary_key=True)
    hostname: Mapped[str | None] = mapped_column(String, nullable=True)
    username: Mapped[str | None] = mapped_column(String, nullable=True)
    distribution: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    jitter: Mapped[int | None] = mapped_column(Integer, nullable=True)
    beacon_interval: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Task(Base):
    __tablename__ = "tasks"

    task_id: Mapped[str] = mapped_column(String, primary_key=True)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    module_name: Mapped[str | None] = mapped_column(String, nullable=True)
    source_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    schedule_type: Mapped[str | None] = mapped_column(String, nullable=True)
    schedule_value: Mapped[str | None] = mapped_column(String, nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)


class SSHConnection(Base):
    __tablename__ = "ssh_connections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    agent_id: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    host: Mapped[str] = mapped_column(String, nullable=False)
    port: Mapped[int] = mapped_column(Integer, nullable=False, default=22)
    username: Mapped[str] = mapped_column(String, nullable=False)
    credential_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    connected_at: Mapped[str | None] = mapped_column(String, nullable=True)


class ConnectionAttempt(Base):
    __tablename__ = "connection_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    agent_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    attempted_at: Mapped[str] = mapped_column(String, nullable=False)
    succeeded: Mapped[bool] = mapped_column(Boolean, default=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)


class Workflow(Base):
    __tablename__ = "workflows"

    workflow_id: Mapped[str] = mapped_column(String, primary_key=True)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    name: Mapped[str | None] = mapped_column(String, nullable=True)
    definition: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)


class CollectedData(Base):
    __tablename__ = "collected_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    task_id: Mapped[str | None] = mapped_column(String, nullable=True)
    workflow_id: Mapped[str | None] = mapped_column(String, nullable=True)
    data_type: Mapped[str | None] = mapped_column(String, nullable=True)
    schema_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    collected_at: Mapped[str | None] = mapped_column(String, nullable=True)
