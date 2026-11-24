"""Agent inventory and remote collection endpoints."""

from fastapi import APIRouter

from backend.routes.agents.collection import router as collection_router
from backend.routes.agents.connections import router as connections_router
from backend.routes.agents.inventory import router as inventory_router

router = APIRouter()
router.include_router(inventory_router)
router.include_router(connections_router)
router.include_router(collection_router)
