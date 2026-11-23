from collections.abc import Generator

from sqlalchemy.orm import Session

from backend.database import C2Database

_database: C2Database | None = None


def get_database() -> C2Database:
    global _database
    if _database is None:
        _database = C2Database()
    return _database


def get_db_session() -> Generator[Session, None, None]:
    with get_database().session() as session:
        yield session
