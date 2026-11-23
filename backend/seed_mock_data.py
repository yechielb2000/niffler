import json
import os
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from backend.models import Agent, Base, CollectedData, Task, Workflow


def resolve_fixture_path(fixture_path: str | Path | None = None) -> Path:
    candidates = []
    if fixture_path:
        candidates.append(Path(fixture_path))
    candidates.extend(
        [
            Path(__file__).resolve().parents[1] / "data" / "mock_agents.json",
            Path.cwd() / "data" / "mock_agents.json",
            Path.cwd() / "mock_agents.json",
        ]
    )

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


def seed_mock_data(
    database_url: str | None = None, fixture_path: str | Path | None = None, reset: bool = False
) -> dict[str, int]:
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
            for table in [
                CollectedData.__tablename__,
                Task.__tablename__,
                Workflow.__tablename__,
                Agent.__tablename__,
            ]:
                connection.execute(text(f'DELETE FROM "{table}"'))

    agents_payload = load_fixture(fixture_file)
    with Session(engine) as session:
        created_agents = 0
        created_tasks = 0
        created_workflows = 0
        created_data = 0

        for agent_payload in agents_payload:
            agent_id = str(agent_payload["agent_id"])
            if agent_id.startswith("demo-"):
                agent_payload["demo_visualizations"] = True
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
                    "source_code": None,
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
            if agent_payload.get("demo_visualizations"):
                collected_time = datetime.now(UTC)
                host = agent_payload.get("hostname", "demo-host")
                offset = (
                    int(agent_id.rsplit("-", 1)[-1]) if agent_id.rsplit("-", 1)[-1].isdigit() else 1
                )
                generated = [
                    (
                        "system",
                        "System overview",
                        {
                            "info": {
                                "hostname": host,
                                "distribution": "Ubuntu 24.04 LTS",
                                "kernel": "6.8.0-generic",
                                "architecture": "x86_64",
                            },
                            "cpu": {
                                "model": "Intel Xeon Platinum 8370C",
                                "cores": 8 + offset % 9,
                                "threads": 16 + offset % 17,
                                "usage_percent": 18 + (offset * 7) % 68,
                            },
                            "memory": {
                                "total_gb": 32,
                                "used_gb": 8 + offset % 19,
                                "available_gb": 24 - offset % 19,
                                "usage_percent": 25 + offset % 61,
                            },
                            "uptime": {
                                "seconds": 86400 * (3 + offset * 3),
                                "human": f"{3 + offset} days",
                            },
                            "load": {
                                "one_minute": round(0.2 + offset * 0.17, 2),
                                "five_minutes": round(0.3 + offset * 0.13, 2),
                                "fifteen_minutes": round(0.4 + offset * 0.09, 2),
                            },
                        },
                    ),
                    (
                        "network",
                        "Network interfaces",
                        {
                            "interfaces": ["lo", "eth0", "docker0"],
                            "details": {
                                "lo": {
                                    "name": "lo",
                                    "mac_address": "00:00:00:00:00:00",
                                    "addresses": ["127.0.0.1/8", "::1/128"],
                                    "state": "UP",
                                },
                                "eth0": {
                                    "name": "eth0",
                                    "mac_address": f"02:42:ac:11:00:{offset:02x}",
                                    "addresses": [f"10.0.{offset}.12/24", "2001:db8::12/64"],
                                    "state": "UP",
                                    "mtu": 1500,
                                },
                                "docker0": {
                                    "name": "docker0",
                                    "mac_address": "02:42:8a:2c:11:01",
                                    "addresses": ["172.17.0.1/16"],
                                    "state": "UP",
                                },
                            },
                            "ip_list": [f"10.0.{offset}.12", "2001:db8::12"],
                        },
                    ),
                    (
                        "processes",
                        "Processes and memory",
                        {
                            "memory": {
                                "total_mb": 32768,
                                "used_mb": 9200 + offset * 220,
                                "free_mb": 23568 - offset * 220,
                            },
                            "processes": [
                                {
                                    "pid": 1,
                                    "name": "systemd",
                                    "user": "root",
                                    "cpu_percent": 0.2,
                                    "memory_percent": 0.4,
                                    "status": "sleeping",
                                },
                                {
                                    "pid": 821,
                                    "name": "postgres",
                                    "user": "postgres",
                                    "cpu_percent": round(4.2 + offset * 0.6, 1),
                                    "memory_percent": 12.5 + offset % 8,
                                    "status": "sleeping",
                                },
                                {
                                    "pid": 1132,
                                    "name": "python",
                                    "user": "app",
                                    "cpu_percent": round(8.1 + offset * 0.7, 1),
                                    "memory_percent": 8.4 + offset % 6,
                                    "status": "running",
                                },
                                {
                                    "pid": 1490,
                                    "name": "nginx",
                                    "user": "www-data",
                                    "cpu_percent": 1.3,
                                    "memory_percent": 2.1,
                                    "status": "sleeping",
                                },
                            ],
                        },
                    ),
                    (
                        "services",
                        "Services",
                        {
                            "services": [
                                {
                                    "name": "ssh.service",
                                    "active": True,
                                    "state": "running",
                                    "enabled": True,
                                },
                                {
                                    "name": "nginx.service",
                                    "active": True,
                                    "state": "running",
                                    "enabled": True,
                                },
                                {
                                    "name": "postgresql.service",
                                    "active": True,
                                    "state": "running",
                                    "enabled": True,
                                },
                                {
                                    "name": "docker.service",
                                    "active": offset % 4 != 0,
                                    "state": "running" if offset % 4 else "stopped",
                                    "enabled": True,
                                },
                                {
                                    "name": "cron.service",
                                    "active": True,
                                    "state": "running",
                                    "enabled": True,
                                },
                                {
                                    "name": "unattended-upgrades.service",
                                    "active": False,
                                    "state": "inactive",
                                    "enabled": True,
                                },
                            ]
                        },
                    ),
                    (
                        "devices",
                        "Devices and mounts",
                        {
                            "block_devices": [
                                {
                                    "name": "vda",
                                    "size": 107374182400,
                                    "type": "disk",
                                    "mountpoint": None,
                                },
                                {
                                    "name": "vda1",
                                    "size": 107300000000,
                                    "type": "part",
                                    "mountpoint": "/",
                                },
                                {
                                    "name": "vdb",
                                    "size": 536870912000,
                                    "type": "disk",
                                    "mountpoint": "/srv/data",
                                },
                            ],
                            "mounted": {
                                "mount_points": [
                                    {
                                        "device": "/dev/vda1",
                                        "mount_point": "/",
                                        "filesystem": "ext4",
                                        "total_gb": 100,
                                        "used_gb": 61 + offset % 30,
                                        "percent": 61 + offset % 30,
                                    },
                                    {
                                        "device": "/dev/vdb",
                                        "mount_point": "/srv/data",
                                        "filesystem": "xfs",
                                        "total_gb": 500,
                                        "used_gb": 180 + offset * 4,
                                        "percent": 36 + offset % 48,
                                    },
                                    {
                                        "device": "tmpfs",
                                        "mount_point": "/run",
                                        "filesystem": "tmpfs",
                                        "total_gb": 4,
                                        "used_gb": 1,
                                        "percent": 25,
                                    },
                                ]
                            },
                        },
                    ),
                    (
                        "filesystem",
                        "Root filesystem",
                        {
                            "root": {
                                "path": "/",
                                "owner": "root",
                                "mode": "0755",
                                "type": "directory",
                            },
                            "entries": {
                                "path": "/",
                                "entries": [
                                    {"name": "etc", "type": "directory", "size": 4096},
                                    {"name": "home", "type": "directory", "size": 4096},
                                    {"name": "opt", "type": "directory", "size": 4096},
                                    {"name": "srv", "type": "directory", "size": 4096},
                                    {"name": "var", "type": "directory", "size": 4096},
                                ],
                            },
                        },
                    ),
                    (
                        "environment",
                        "Environment",
                        {
                            "variables": {
                                "LANG": "C.UTF-8",
                                "HOME": "/home/app",
                                "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin",
                                "SHELL": "/bin/bash",
                                "APP_ENV": "production",
                                "DEPLOY_REGION": ["eu-west-1", "us-east-1", "ap-southeast-1"][
                                    offset % 3
                                ],
                            }
                        },
                    ),
                    (
                        "users",
                        "Users and groups",
                        {
                            "users": [
                                {
                                    "name": "root",
                                    "uid": 0,
                                    "gid": 0,
                                    "shell": "/bin/bash",
                                    "system": True,
                                },
                                {
                                    "name": "app",
                                    "uid": 1001,
                                    "gid": 1001,
                                    "shell": "/bin/bash",
                                    "system": False,
                                },
                                {
                                    "name": "deploy",
                                    "uid": 1002,
                                    "gid": 1002,
                                    "shell": "/usr/sbin/nologin",
                                    "system": False,
                                },
                            ],
                            "groups": [
                                {"name": "root", "gid": 0, "members": ["root"]},
                                {"name": "sudo", "gid": 27, "members": ["deploy"]},
                                {"name": "docker", "gid": 999, "members": ["app", "deploy"]},
                            ],
                        },
                    ),
                ]
                generated_payloads = [
                    {
                        "task_id": task_payloads[0]["task_id"],
                        "workflow_id": workflow_payloads[0]["workflow_id"],
                        "data_type": kind,
                        "schema_version": 1,
                        "payload": payload,
                        "collected_at": (collected_time - timedelta(days=days)).isoformat(),
                    }
                    for days in (0, 2, 7, 15, 30, 60, 90, 120, 179)
                    for kind, label, payload in generated
                ]
                data_payloads = generated_payloads
            for data_payload in data_payloads:
                collected_at = data_payload.get("collected_at")
                existing_data = (
                    session.query(CollectedData)
                    .filter_by(
                        agent_id=agent_id,
                        task_id=data_payload.get("task_id"),
                        workflow_id=data_payload.get("workflow_id"),
                        data_type=data_payload.get("data_type"),
                        schema_version=data_payload.get("schema_version"),
                        collected_at=collected_at,
                    )
                    .first()
                )
                if existing_data is not None and existing_data.payload == data_payload.get(
                    "payload"
                ):
                    continue
                data = CollectedData(
                    agent_id=agent_id,
                    task_id=data_payload.get("task_id"),
                    workflow_id=data_payload.get("workflow_id"),
                    data_type=data_payload.get("data_type"),
                    schema_version=data_payload.get("schema_version"),
                    payload=data_payload.get("payload"),
                    collected_at=collected_at,
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

    summary = seed_mock_data(
        database_url=args.database_url, fixture_path=args.fixture, reset=args.reset
    )
    print(json.dumps(summary, indent=2))
