import logging
import os
import sys
import uuid
from pathlib import Path

import yaml
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("niffler.backend")

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

sys.path.append(str(BASE_DIR))

from backend.database import C2Database
from backend.routes import register_admin_routes, register_gateway_routes
from common.crypto_utils import CryptoEngine

SERVER_DIR = BASE_DIR / "backend"
with (SERVER_DIR / "config.yaml").open("r", encoding="utf-8") as f:
    server_config = yaml.safe_load(f) or {}

server_config.update({
    "c2_endpoint": os.getenv("C2_ENDPOINT", server_config.get("c2_endpoint", "http://localhost:8000/v2/gateway")),
    "shared_key": os.getenv("SHARED_KEY", server_config.get("shared_key", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")),
    "beacon_interval": int(os.getenv("BEACON_INTERVAL", server_config.get("beacon_interval", 20))),
    "jitter": int(os.getenv("JITTER", server_config.get("jitter", 5))),
})

crypto = CryptoEngine(server_config.get("shared_key"))
db = C2Database(database_url=os.getenv("DATABASE_URL", f"sqlite:///{(DATA_DIR / 'linux_c2_core.db').as_posix()}"))
app = FastAPI(title="Niffler Command & Control Node", docs_url="/docs", redoc_url=None)

if FRONTEND_DIST.exists():
    app.mount("/ui", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="ui")

register_gateway_routes(app, crypto)
register_admin_routes(app, BASE_DIR)

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/ui", status_code=307)

@app.get("/healthz")
def healthz():
    return {"status": "ok"}


