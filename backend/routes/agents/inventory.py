"""Agent and collected-data read routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.dependencies import get_db_session
from backend.repositories.agent_repository import AgentRepository
from backend.repositories.inventory_repository import InventoryRepository
from backend.schemas.api import AgentDetailResponse, AgentListResponse

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


@router.get("", response_model=AgentListResponse)
def list_agents(session: Session = Depends(get_db_session)) -> AgentListResponse:
    return AgentListResponse(agents=AgentRepository(session).list())


@router.get("/{agent_id}", response_model=AgentDetailResponse)
def get_agent(agent_id: str, session: Session = Depends(get_db_session)) -> AgentDetailResponse:
    agent = AgentRepository(session).get(agent_id)
    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    inventory = InventoryRepository(session)
    return AgentDetailResponse(
        agent=agent,
        tasks=inventory.list_tasks(agent_id),
        workflows=inventory.list_workflows(agent_id),
        data=inventory.list_collected_data(agent_id),
    )
