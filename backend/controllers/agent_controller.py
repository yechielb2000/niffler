import uuid
from typing import Any

from backend.protocols import AgentRepositoryProtocol, TaskRepositoryProtocol


class AgentController:
    def __init__(self, agents: AgentRepositoryProtocol, tasks: TaskRepositoryProtocol):
        self.agents = agents
        self.tasks = tasks

    def handle_checkin(self, data: dict[str, Any]) -> dict[str, Any]:
        agent_id = self.agents.upsert_agent(data.get('agent_id'), data['hostname'], data['username'], data['distribution'])
        agent_row, task_row = self.tasks.pending_task_for(agent_id)
        config = agent_row or {}
        task = task_row or None

        return {
            'agent_id': agent_id,
            'config': {'jitter': config.get('jitter', 3), 'beacon_interval': config.get('beacon_interval', 15)},
            'task': {
                'task_id': task['task_id'],
                'name': task['module_name'],
                'source': task['source_code'],
                'schedule_type': task['schedule_type'],
                'schedule_value': task['schedule_value'],
                'duration': task['duration'],
            } if task else None,
        }

    def handle_results(self, data: dict[str, Any]) -> dict[str, Any]:
        self.tasks.update_result(data['task_id'], data['status'], data['output'])
        return {'status': 'success'}

    def queue_task(self, agent_id: str, module_name: str, code: str, sched_type: str = 'Immediate', sched_val: str = '0', duration_sec: int = 0) -> dict[str, str]:
        task_id = str(uuid.uuid4())
        self.tasks.enqueue(task_id, agent_id, module_name, code, sched_type, sched_val, duration_sec)
        return {'status': 'Task queued', 'task_id': task_id}

    def list_agents(self) -> list[dict[str, Any]]:
        return self.agents.list_agents()

    def get_agent(self, agent_id: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
        agent, _ = self.agents.get_agent(agent_id)
        tasks = self.tasks.list_tasks(agent_id)
        workflows = self.tasks.list_workflows(agent_id)
        data = self.tasks.list_collected_data(agent_id)
        return agent, tasks, workflows, data

    def update_config(self, agent_id: str, jitter: int, beacon_interval: int) -> dict[str, str]:
        self.agents.update_config(agent_id, jitter, beacon_interval)
        return {'status': 'Configuration updated'}

    def kill_agent(self, agent_id: str) -> dict[str, str]:
        self.agents.set_status(agent_id, 'Inactive')
        return {'status': 'Agent marked inactive'}

    def create_workflow(self, agent_id: str, name: str, definition: dict[str, Any]) -> dict[str, Any]:
        workflow_id = str(uuid.uuid4())
        return self.tasks.create_workflow(workflow_id, agent_id, name, definition)

    def list_workflows(self, agent_id: str) -> list[dict[str, Any]]:
        return self.tasks.list_workflows(agent_id)

    def store_collected_data(self, agent_id: str, task_id: str | None, workflow_id: str | None, data_type: str, schema_version: int, payload: dict[str, Any]) -> dict[str, Any]:
        return self.tasks.store_collected_data(agent_id, task_id, workflow_id, data_type, schema_version, payload)

    def list_collected_data(self, agent_id: str) -> list[dict[str, Any]]:
        return self.tasks.list_collected_data(agent_id)
