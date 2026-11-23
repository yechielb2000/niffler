from typing import Any, Protocol


class TaskRepositoryProtocol(Protocol):
    def list_tasks(self, agent_id: str) -> list[dict[str, Any]]: ...

    def create_workflow(
        self, workflow_id: str, agent_id: str, name: str, definition: dict[str, Any]
    ) -> dict[str, Any]: ...

    def list_workflows(self, agent_id: str) -> list[dict[str, Any]]: ...

    def store_collected_data(
        self,
        agent_id: str,
        task_id: str | None,
        workflow_id: str | None,
        data_type: str,
        schema_version: int,
        payload: dict[str, Any],
        collected_at: str | None = None,
    ) -> dict[str, Any]: ...

    def list_collected_data(self, agent_id: str) -> list[dict[str, Any]]: ...
