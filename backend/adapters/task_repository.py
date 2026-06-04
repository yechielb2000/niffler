from typing import Any

from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from backend.models import Agent, Task


class TaskRepository:
    def __init__(self, session: Session):
        self.session = session

    def pending_task_for(self, agent_id: str) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        task = self.session.execute(select(Task).where(Task.agent_id == agent_id, Task.status == 'Pending').order_by(Task.task_id)).scalar_one_or_none()
        agent = self.session.execute(select(Agent).where(Agent.agent_id == agent_id)).scalar_one_or_none()
        return (dict(agent.__dict__) if agent else None, dict(task.__dict__) if task else None)

    def enqueue(self, task_id: str, agent_id: str, name: str, code: str, sched_type: str, sched_val: str, duration: int, status: str = 'Pending') -> None:
        self.session.execute(
            insert(Task).values(
                task_id=task_id,
                agent_id=agent_id,
                module_name=name,
                source_code=code,
                status=status,
                output='',
                schedule_type=sched_type,
                schedule_value=sched_val,
                duration=duration,
            )
        )
        self.session.commit()

    def update_result(self, task_id: str, status: str, output: str) -> None:
        self.session.execute(update(Task).where(Task.task_id == task_id).values(status=status, output=output))
        self.session.commit()
