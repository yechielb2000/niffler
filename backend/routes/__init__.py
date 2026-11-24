"""Composed versioned API routers."""

from fastapi import APIRouter

from backend.routes.agents import router as agents_router
from backend.routes.commands import router as commands_router
from backend.routes.root import router as root_router

api_router = APIRouter()
api_router.include_router(root_router)
api_router.include_router(commands_router)
api_router.include_router(agents_router)

__all__ = ["api_router"]
