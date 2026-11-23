from typing import Any, Protocol


class AgentRepositoryProtocol(Protocol):
    def list_agents(self) -> list[dict[str, Any]]: ...

    def get_agent(self, agent_id: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]: ...
