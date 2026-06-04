import os
from collections.abc import Generator
from pathlib import Path

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from backend.adapters.agent_repository import AgentRepository
from backend.adapters.task_repository import TaskRepository
from backend.controllers.agent_controller import AgentController
from backend.database import C2Database
from backend.settings import get_settings

BASE_DIR = Path(__file__).resolve().parent.parent


def get_database() -> C2Database:
    return C2Database(database_url=os.getenv("DATABASE_URL", "sqlite:///" + (BASE_DIR / "data" / "linux_c2_core.db").as_posix()))


def get_db_session() -> Generator[Session, None, None]:
    with get_database().session() as session:
        yield session


def get_agent_controller(session: Session = Depends(get_db_session)) -> AgentController:
    return AgentController(AgentRepository(session), TaskRepository(session))


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = get_settings().shared_key
    if x_api_key != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
