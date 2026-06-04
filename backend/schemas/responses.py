from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok")


class TaskPayloadResponse(BaseModel):
    task_id: str | None = None
    name: str | None = None
    source: str | None = None
    schedule_type: str | None = None
    schedule_value: str | None = None
    duration: int | None = None


class CheckInResponse(BaseModel):
    agent_id: str
    config: dict[str, int]
    task: TaskPayloadResponse | None = None


class TaskQueuedResponse(BaseModel):
    status: str
    task_id: str


class ConfigUpdatedResponse(BaseModel):
    status: str


class AgentListResponse(BaseModel):
    agents: list[dict]


class AgentDetailResponse(BaseModel):
    agent: dict | None
    tasks: list[dict]
