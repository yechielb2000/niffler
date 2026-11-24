"""Persistence operations for tasks, workflows, and collected inventory."""

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.models import CollectedData, Task, Workflow
from backend.schemas.api import CollectedDataResponse, TaskResponse, WorkflowResponse


class InventoryRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_tasks(self, agent_id: str) -> list[TaskResponse]:
        tasks = self._session.scalars(
            select(Task).where(Task.agent_id == agent_id).order_by(Task.task_id)
        ).all()
        return [TaskResponse.model_validate(task) for task in tasks]

    def create_workflow(
        self, agent_id: str, name: str, definition: dict[str, Any]
    ) -> WorkflowResponse:
        workflow = Workflow(
            workflow_id=str(uuid4()),
            agent_id=agent_id,
            name=name,
            definition=definition,
            version=1,
        )
        self._session.add(workflow)
        self._session.commit()
        self._session.refresh(workflow)
        return WorkflowResponse.model_validate(workflow)

    def list_workflows(self, agent_id: str) -> list[WorkflowResponse]:
        workflows = self._session.scalars(
            select(Workflow).where(Workflow.agent_id == agent_id).order_by(Workflow.workflow_id)
        ).all()
        return [WorkflowResponse.model_validate(workflow) for workflow in workflows]

    def store_collected_data(
        self,
        agent_id: str,
        task_id: str | None,
        workflow_id: str | None,
        data_type: str,
        schema_version: int,
        payload: dict[str, Any],
    ) -> CollectedDataResponse:
        record = CollectedData(
            agent_id=agent_id,
            task_id=task_id,
            workflow_id=workflow_id,
            data_type=data_type,
            schema_version=schema_version,
            payload=payload,
            collected_at=datetime.now(UTC).isoformat(),
        )
        self._session.add(record)
        self._session.commit()
        self._session.refresh(record)
        return CollectedDataResponse.model_validate(record)

    def list_collected_data(self, agent_id: str) -> list[CollectedDataResponse]:
        cutoff = (datetime.now(UTC) - timedelta(days=180)).isoformat()
        records = self._session.scalars(
            select(CollectedData)
            .where(CollectedData.agent_id == agent_id, CollectedData.collected_at >= cutoff)
            .order_by(CollectedData.id.desc())
        ).all()
        return [CollectedDataResponse.model_validate(record) for record in records]

    def prune_collected_data(self) -> int:
        cutoff = (datetime.now(UTC) - timedelta(days=180)).isoformat()
        result = self._session.execute(
            delete(CollectedData).where(CollectedData.collected_at < cutoff)
        )
        self._session.commit()
        return getattr(result, "rowcount", 0) or 0
