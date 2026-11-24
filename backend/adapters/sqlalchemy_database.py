"""SQLAlchemy-backed PostgreSQL/SQLite database adapter."""

import os
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from backend.models import Base


class SQLAlchemyDatabaseAdapter:
    def __init__(
        self,
        database_url: str | None = None,
        db_file: str = "data/linux_c2_core.db",
    ) -> None:
        data_dir = Path(os.getenv("DATA_DIR", "data")).resolve()
        data_dir.mkdir(parents=True, exist_ok=True)
        db_path = Path(db_file).expanduser()
        if not db_path.is_absolute():
            db_path = data_dir / db_path.name

        self.database_url = (
            database_url or os.getenv("DATABASE_URL") or (f"sqlite:///{db_path.as_posix()}")
        )
        engine_options: dict[str, Any] = {"future": True}
        if self.database_url.startswith("sqlite:"):
            engine_options["connect_args"] = {"check_same_thread": False}
        self.engine: Engine = create_engine(self.database_url, **engine_options)
        Base.metadata.create_all(self.engine)

    def session(self) -> Session:
        return Session(self.engine)
