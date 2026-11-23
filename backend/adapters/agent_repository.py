from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import Agent


def _agent_dict(agent: Agent) -> dict[str, Any]:
    return {column.name: getattr(agent, column.name) for column in Agent.__table__.columns}


class AgentRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_agents(self) -> list[dict[str, Any]]:
        return [
            _agent_dict(agent)
            for agent in self.session.execute(select(Agent).order_by(Agent.agent_id))
            .scalars()
            .all()
        ]

    def get_agent(self, agent_id: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
        agent = self.session.execute(
            select(Agent).where(Agent.agent_id == agent_id)
        ).scalar_one_or_none()
        return (_agent_dict(agent) if agent else None, [])
