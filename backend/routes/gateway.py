import logging

from fastapi import Depends, HTTPException, Request

from backend.controllers.agent_controller import AgentController
from backend.dependencies import get_agent_controller
from backend.schemas.requests import AgentCheckInRequest, AgentResultRequest

logger = logging.getLogger("niffler.backend.routes")


def register_gateway_routes(app, crypto):
    @app.post("/v2/gateway")
    async def unified_gateway(request: Request, controller: AgentController = Depends(get_agent_controller)):
        encrypted_body = await request.body()
        try:
            payload = crypto.decrypt_json(encrypted_body.decode())
            msg_type = payload.get("type")

            if msg_type == "checkin":
                checkin = AgentCheckInRequest(**payload)
                return {"payload": crypto.encrypt_json(handle_checkin(checkin.model_dump(), controller))}
            if msg_type == "results":
                results = AgentResultRequest(**payload)
                return {"payload": crypto.encrypt_json(handle_results(results.model_dump(), controller))}
            raise HTTPException(status_code=400, detail="Invalid transmission descriptor.")
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Inbound routing verification failure: {exc}") from exc

    def handle_checkin(data: dict, controller: AgentController) -> dict:
        return controller.handle_checkin(data)

    def handle_results(data: dict, controller: AgentController) -> dict:
        result = controller.handle_results(data)
        logger.info("Operational data received from agent %s for task %s", data.get("agent_id"), data.get("task_id"))
        return result
