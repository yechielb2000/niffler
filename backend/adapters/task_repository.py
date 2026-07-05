import uuid
from typing import Any

from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from backend.models import Agent, CollectedData, Task, Workflow


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

    def list_tasks(self, agent_id: str) -> list[dict[str, Any]]:
        rows = self.session.execute(select(Task).where(Task.agent_id == agent_id).order_by(Task.task_id)).scalars().all()
        return [dict(row.__dict__) for row in rows]

    def create_workflow(self, workflow_id: str, agent_id: str, name: str, definition: dict[str, Any]) -> dict[str, Any]:
        self.session.execute(insert(Workflow).values(workflow_id=workflow_id, agent_id=agent_id, name=name, definition=definition, version=1))
        self.session.commit()
        return {'workflow_id': workflow_id, 'name': name, 'definition': definition, 'version': 1}

    def list_workflows(self, agent_id: str) -> list[dict[str, Any]]:
        rows = self.session.execute(select(Workflow).where(Workflow.agent_id == agent_id).order_by(Workflow.workflow_id)).scalars().all()
        return [dict(row.__dict__) for row in rows]

    def store_collected_data(self, agent_id: str, task_id: str | None, workflow_id: str | None, data_type: str, schema_version: int, payload: dict[str, Any], collected_at: str | None = None) -> dict[str, Any]:
        record_id = str(uuid.uuid4())
        self.session.execute(
            insert(CollectedData).values(
                agent_id=agent_id,
                task_id=task_id,
                workflow_id=workflow_id,
                data_type=data_type,
                schema_version=schema_version,
                payload=payload,
                collected_at=collected_at or str(uuid.uuid4()),
            )
        )
        self.session.commit()
        return {'id': record_id, 'agent_id': agent_id, 'task_id': task_id, 'workflow_id': workflow_id, 'data_type': data_type, 'schema_version': schema_version, 'payload': payload, 'collected_at': collected_at or str(uuid.uuid4())}

    def list_collected_data(self, agent_id: str) -> list[dict[str, Any]]:
        rows = self.session.execute(select(CollectedData).where(CollectedData.agent_id == agent_id).order_by(CollectedData.id.desc())).scalars().all()
        return [dict(row.__dict__) for row in rows]
