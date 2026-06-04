from pydantic import BaseModel, Field


class DeployPackageRequest(BaseModel):
    agent_id: str = Field(..., min_length=1)
    package_name: str = Field(..., min_length=1)


class ScheduledTaskRequest(BaseModel):
    agent_id: str = Field(..., min_length=1)
    module_name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    sched_type: str = Field(default="Immediate")
    sched_val: str = Field(default="0")
    duration_sec: int = Field(default=0, ge=0)


class ReconfigureRequest(BaseModel):
    agent_id: str = Field(..., min_length=1)
    jitter: int = Field(default=3, ge=0)
    beacon_interval: int = Field(default=15, ge=0)


class QueueAgentTaskRequest(BaseModel):
    module_name: str = Field(..., min_length=1)
    code: str = Field(..., min_length=1)
    sched_type: str = Field(default="Immediate")
    sched_val: str = Field(default="0")
    duration_sec: int = Field(default=0, ge=0)


class AgentResultRequest(BaseModel):
    task_id: str = Field(..., min_length=1)
    status: str = Field(..., min_length=1)
    output: str = Field(default="")


class AgentCheckInRequest(BaseModel):
    agent_id: str | None = None
    hostname: str = Field(..., min_length=1)
    username: str = Field(..., min_length=1)
    distribution: str = Field(..., min_length=1)
