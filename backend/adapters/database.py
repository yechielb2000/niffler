"""Database adapter boundary for SQL and other persistence implementations."""

from typing import Protocol

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session


class DatabaseAdapter(Protocol):
    engine: Engine

    def session(self) -> Session: ...
