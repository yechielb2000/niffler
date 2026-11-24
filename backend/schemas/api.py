"""models for stable application API responses."""

from typing import Any

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AgentResponse(ORMModel):
    agent_id: str
    hostname: str | None = None
    username: str | None = None
    distribution: str | None = None
    status: str | None = None
    jitter: int | None = None
    beacon_interval: int | None = None


class HealthResponse(BaseModel):
    status: str
    database: str


class TaskResponse(ORMModel):
    task_id: str
    agent_id: str | None = None
    module_name: str | None = None
    status: str | None = None
    schedule_type: str | None = None
    schedule_value: str | None = None
    duration: int | None = None


class WorkflowResponse(ORMModel):
    workflow_id: str
    agent_id: str | None = None
    name: str | None = None
    definition: dict[str, Any] | None = None
    version: int | None = None


class CollectedDataResponse(ORMModel):
    id: int
    agent_id: str | None = None
    task_id: str | None = None
    workflow_id: str | None = None
    data_type: str | None = None
    schema_version: int | None = None
    payload: Any = None
    collected_at: str | None = None


class AgentListResponse(BaseModel):
    agents: list[AgentResponse]


class AgentDetailResponse(BaseModel):
    agent: AgentResponse
    tasks: list[TaskResponse]
    workflows: list[WorkflowResponse]
    data: list[CollectedDataResponse]


class Command(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    label: str
    category: str
    description: str


class CommandListResponse(BaseModel):
    commands: list[Command]


class CommandResult(BaseModel):
    preset_id: str
    result: Any


class RunPresetRequest(BaseModel):
    preset_id: str
