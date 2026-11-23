import uuid
from typing import Any

from backend.protocols import AgentRepositoryProtocol, TaskRepositoryProtocol


class AgentController:
    def __init__(self, agents: AgentRepositoryProtocol, tasks: TaskRepositoryProtocol):
        self.agents = agents
        self.tasks = tasks

    def list_agents(self) -> list[dict[str, Any]]:
        return self.agents.list_agents()

    def get_agent(
        self, agent_id: str
    ) -> tuple[
        dict[str, Any] | None, list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]
    ]:
        agent, _ = self.agents.get_agent(agent_id)
        tasks = self.tasks.list_tasks(agent_id)
        workflows = self.tasks.list_workflows(agent_id)
        data = self.tasks.list_collected_data(agent_id)
        return agent, tasks, workflows, data

    def create_workflow(
        self, agent_id: str, name: str, definition: dict[str, Any]
    ) -> dict[str, Any]:
        workflow_id = str(uuid.uuid4())
        return self.tasks.create_workflow(workflow_id, agent_id, name, definition)

    def list_workflows(self, agent_id: str) -> list[dict[str, Any]]:
        return self.tasks.list_workflows(agent_id)

    def store_collected_data(
        self,
        agent_id: str,
        task_id: str | None,
        workflow_id: str | None,
        data_type: str,
        schema_version: int,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        return self.tasks.store_collected_data(
            agent_id, task_id, workflow_id, data_type, schema_version, payload
        )

    def list_collected_data(self, agent_id: str) -> list[dict[str, Any]]:
        return self.tasks.list_collected_data(agent_id)
