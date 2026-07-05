import json
import os
import time
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from backend.models import Agent, CollectedData, Task, Workflow, Base


def resolve_fixture_path(fixture_path: str | Path | None = None) -> Path:
    candidates = []
    if fixture_path:
        candidates.append(Path(fixture_path))
    candidates.extend([
        Path(__file__).resolve().parents[1] / "data" / "mock_agents.json",
        Path.cwd() / "data" / "mock_agents.json",
        Path.cwd() / "mock_agents.json",
    ])

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0] if candidates else Path("data/mock_agents.json")


def load_fixture(fixture_path: str | Path | None = None) -> list[dict[str, Any]]:
    fixture_file = resolve_fixture_path(fixture_path)
    with fixture_file.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if isinstance(payload, dict):
        return payload.get("agents", [])
    return payload


def seed_mock_data(database_url: str | None = None, fixture_path: str | Path | None = None, reset: bool = False) -> dict[str, int]:
    database_url = database_url or os.getenv("DATABASE_URL") or "sqlite:///data/linux_c2_core.db"
    fixture_file = resolve_fixture_path(fixture_path)

    engine = create_engine(database_url, future=True)
    for attempt in range(1, 11):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            break
        except Exception:
            if attempt == 10:
                raise
            time.sleep(2)

    Base.metadata.create_all(engine)

    if reset:
        with engine.begin() as connection:
            for table in [CollectedData.__tablename__, Task.__tablename__, Workflow.__tablename__, Agent.__tablename__]:
                connection.execute(text(f'DELETE FROM "{table}"'))

    agents_payload = load_fixture(fixture_file)
    with Session(engine) as session:
        created_agents = 0
        created_tasks = 0
        created_workflows = 0
        created_data = 0

        for agent_payload in agents_payload:
            agent_id = str(agent_payload["agent_id"])
            agent = session.get(Agent, agent_id)
            if agent is None:
                agent = Agent(
                    agent_id=agent_id,
                    hostname=agent_payload.get("hostname"),
                    username=agent_payload.get("username"),
                    distribution=agent_payload.get("distribution"),
                    status=agent_payload.get("status"),
                    jitter=agent_payload.get("jitter"),
                    beacon_interval=agent_payload.get("beacon_interval"),
                )
                session.add(agent)
                created_agents += 1
            else:
                agent.hostname = agent_payload.get("hostname")
                agent.username = agent_payload.get("username")
                agent.distribution = agent_payload.get("distribution")
                agent.status = agent_payload.get("status")
                agent.jitter = agent_payload.get("jitter")
                agent.beacon_interval = agent_payload.get("beacon_interval")

            task_payloads = agent_payload.get("tasks") or [
                {
                    "task_id": f"task-{agent_id}",
                    "module_name": "default-task",
                    "source_code": "print('seeded task')",
                    "status": "Completed",
                    "output": "seeded from fixture",
                    "schedule_type": "one-shot",
                    "schedule_value": "manual",
                    "duration": 60,
                }
            ]
            for task_payload in task_payloads:
                task_id = str(task_payload["task_id"])
                task = session.get(Task, task_id)
                if task is None:
                    task = Task(
                        task_id=task_id,
                        agent_id=agent_id,
                        module_name=task_payload.get("module_name"),
                        source_code=task_payload.get("source_code"),
                        status=task_payload.get("status"),
                        output=task_payload.get("output"),
                        schedule_type=task_payload.get("schedule_type"),
                        schedule_value=task_payload.get("schedule_value"),
                        duration=task_payload.get("duration"),
                    )
                    session.add(task)
                    created_tasks += 1
                else:
                    task.agent_id = agent_id
                    task.module_name = task_payload.get("module_name")
                    task.source_code = task_payload.get("source_code")
                    task.status = task_payload.get("status")
                    task.output = task_payload.get("output")
                    task.schedule_type = task_payload.get("schedule_type")
                    task.schedule_value = task_payload.get("schedule_value")
                    task.duration = task_payload.get("duration")

            workflow_payloads = agent_payload.get("workflows") or [
                {
                    "workflow_id": f"workflow-{agent_id}",
                    "name": f"Seeded workflow for {agent_id}",
                    "definition": {"nodes": [{"id": "n1", "type": "seed"}]},
                    "version": 1,
                }
            ]
            for workflow_payload in workflow_payloads:
                workflow_id = str(workflow_payload["workflow_id"])
                workflow = session.get(Workflow, workflow_id)
                if workflow is None:
                    workflow = Workflow(
                        workflow_id=workflow_id,
                        agent_id=agent_id,
                        name=workflow_payload.get("name"),
                        definition=workflow_payload.get("definition"),
                        version=workflow_payload.get("version", 1),
                    )
                    session.add(workflow)
                    created_workflows += 1
                else:
                    workflow.agent_id = agent_id
                    workflow.name = workflow_payload.get("name")
                    workflow.definition = workflow_payload.get("definition")
                    workflow.version = workflow_payload.get("version", 1)

            data_payloads = agent_payload.get("collected_data") or [
                {
                    "task_id": task_payloads[0]["task_id"],
                    "workflow_id": workflow_payloads[0]["workflow_id"],
                    "data_type": "system-info",
                    "schema_version": 1,
                    "payload": {"hostname": agent_payload.get("hostname")},
                    "collected_at": "2026-07-05T10:00:00Z",
                }
            ]
            for data_payload in data_payloads:
                data = CollectedData(
                    agent_id=agent_id,
                    task_id=data_payload.get("task_id"),
                    workflow_id=data_payload.get("workflow_id"),
                    data_type=data_payload.get("data_type"),
                    schema_version=data_payload.get("schema_version"),
                    payload=data_payload.get("payload"),
                    collected_at=data_payload.get("collected_at"),
                )
                session.add(data)
                created_data += 1

        session.commit()

    return {
        "agents": created_agents,
        "tasks": created_tasks,
        "workflows": created_workflows,
        "collected_data": created_data,
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed mock data into the configured database")
    parser.add_argument("--database-url", default=None)
    parser.add_argument("--fixture", default=None)
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    summary = seed_mock_data(database_url=args.database_url, fixture_path=args.fixture, reset=args.reset)
    print(json.dumps(summary, indent=2))
