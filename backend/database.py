import os
from pathlib import Path
from typing import Optional

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.models import Base


class C2Database:
    def __init__(self, db_file: str = "data/linux_c2_core.db", database_url: Optional[str] = None):
        data_dir = Path(os.getenv("DATA_DIR", "data")).resolve()
        data_dir.mkdir(exist_ok=True)

        resolved_db_file = (
            Path(db_file).expanduser().resolve()
            if Path(db_file).is_absolute()
            else (data_dir / Path(db_file).name if Path(db_file).name else data_dir / "linux_c2_core.db")
        )

        self.database_url = database_url or os.getenv("DATABASE_URL") or f"sqlite:///{resolved_db_file.as_posix()}"
        if self.database_url.startswith("postgres"):
            self.engine = create_engine(self.database_url, future=True)
        else:
            self.engine = create_engine(self.database_url, future=True, connect_args={"check_same_thread": False})

        Base.metadata.create_all(self.engine)

    def session(self) -> Session:
        return Session(self.engine)
