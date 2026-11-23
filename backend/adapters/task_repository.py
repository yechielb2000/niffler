from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import delete, insert, select
from sqlalchemy.orm import Session

from backend.models import CollectedData, Task, Workflow


def _model_dict(row) -> dict[str, Any]:
    return {column.name: getattr(row, column.name) for column in row.__table__.columns}


class TaskRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_tasks(self, agent_id: str) -> list[dict[str, Any]]:
        rows = (
            self.session.execute(
                select(Task).where(Task.agent_id == agent_id).order_by(Task.task_id)
            )
            .scalars()
            .all()
        )
        return [_model_dict(row) for row in rows]

    def create_workflow(
        self, workflow_id: str, agent_id: str, name: str, definition: dict[str, Any]
    ) -> dict[str, Any]:
        self.session.execute(
            insert(Workflow).values(
                workflow_id=workflow_id,
                agent_id=agent_id,
                name=name,
                definition=definition,
                version=1,
            )
        )
        self.session.commit()
        return {"workflow_id": workflow_id, "name": name, "definition": definition, "version": 1}

    def list_workflows(self, agent_id: str) -> list[dict[str, Any]]:
        rows = (
            self.session.execute(
                select(Workflow).where(Workflow.agent_id == agent_id).order_by(Workflow.workflow_id)
            )
            .scalars()
            .all()
        )
        return [_model_dict(row) for row in rows]

    def store_collected_data(
        self,
        agent_id: str,
        task_id: str | None,
        workflow_id: str | None,
        data_type: str,
        schema_version: int,
        payload: dict[str, Any],
        collected_at: str | None = None,
    ) -> dict[str, Any]:
        collected_at = collected_at or datetime.now(UTC).isoformat()
        record = CollectedData(
            agent_id=agent_id,
            task_id=task_id,
            workflow_id=workflow_id,
            data_type=data_type,
            schema_version=schema_version,
            payload=payload,
            collected_at=collected_at,
        )
        self.session.add(record)
        self.session.commit()
        return {
            "id": record.id,
            "agent_id": agent_id,
            "task_id": task_id,
            "workflow_id": workflow_id,
            "data_type": data_type,
            "schema_version": schema_version,
            "payload": payload,
            "collected_at": collected_at,
        }

    def list_collected_data(self, agent_id: str) -> list[dict[str, Any]]:
        cutoff = (datetime.now(UTC) - timedelta(days=180)).isoformat()
        rows = (
            self.session.execute(
                select(CollectedData)
                .where(CollectedData.agent_id == agent_id, CollectedData.collected_at >= cutoff)
                .order_by(CollectedData.id.desc())
            )
            .scalars()
            .all()
        )
        return [_model_dict(row) for row in rows]

    def prune_collected_data(self) -> int:
        cutoff = (datetime.now(UTC) - timedelta(days=180)).isoformat()
        result = self.session.execute(
            delete(CollectedData).where(CollectedData.collected_at < cutoff)
        )
        self.session.commit()
        return getattr(result, "rowcount", 0) or 0
