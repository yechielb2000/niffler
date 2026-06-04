from typing import Any

from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from backend.models import Agent


class AgentRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_agents(self) -> list[dict[str, Any]]:
        return [dict(row._mapping) for row in self.session.execute(select(Agent).order_by(Agent.agent_id)).all()]

    def get_agent(self, agent_id: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
        agent = self.session.execute(select(Agent).where(Agent.agent_id == agent_id)).scalar_one_or_none()
        return (dict(agent.__dict__) if agent else None, [])

    def upsert_agent(self, agent_id: str | None, hostname: str, username: str, distribution: str) -> str:
        import uuid

        if not agent_id:
            agent_id = str(uuid.uuid4())[:8]
            self.session.execute(
                insert(Agent).values(
                    agent_id=agent_id,
                    hostname=hostname,
                    username=username,
                    distribution=distribution,
                    status='Active',
                    jitter=3,
                    beacon_interval=15,
                )
            )
        else:
            self.session.execute(update(Agent).where(Agent.agent_id == agent_id).values(status='Active'))
        self.session.commit()
        return agent_id

    def update_config(self, agent_id: str, jitter: int, beacon_interval: int) -> None:
        self.session.execute(update(Agent).where(Agent.agent_id == agent_id).values(jitter=jitter, beacon_interval=beacon_interval))
        self.session.commit()

    def set_status(self, agent_id: str, status: str) -> None:
        self.session.execute(update(Agent).where(Agent.agent_id == agent_id).values(status=status))
        self.session.commit()
