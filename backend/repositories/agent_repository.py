"""Agent persistence queries."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models import Agent
from backend.schemas.api import AgentResponse


class AgentRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list(self) -> list[AgentResponse]:
        agents = self._session.scalars(select(Agent).order_by(Agent.agent_id)).all()
        return [AgentResponse.model_validate(agent) for agent in agents]

    def get(self, agent_id: str) -> AgentResponse | None:
        agent = self._session.get(Agent, agent_id)
        return AgentResponse.model_validate(agent) if agent is not None else None

    def exists(self, agent_id: str) -> bool:
        return self._session.get(Agent, agent_id) is not None
