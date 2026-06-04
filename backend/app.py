import logging
import os
import sys
from pathlib import Path

from fastapi import FastAPI
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
from backend.settings import get_settings
from common.crypto_utils import CryptoEngine

settings = get_settings()
crypto = CryptoEngine(settings.shared_key)
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


