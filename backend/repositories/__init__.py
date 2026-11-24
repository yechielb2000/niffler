"""Persistence repositories for application entities."""

from backend.repositories.agent_repository import AgentRepository
from backend.repositories.inventory_repository import InventoryRepository

__all__ = ["AgentRepository", "InventoryRepository"]
