from collections.abc import Generator

from sqlalchemy.orm import Session

from backend.adapters.connection_store import ConnectionStore, InMemoryConnectionStore
from backend.adapters.database import DatabaseAdapter
from backend.adapters.sqlalchemy_database import SQLAlchemyDatabaseAdapter
from backend.services.remote_machine import RemoteMachineConnector

_database: DatabaseAdapter | None = None
_connection_store: ConnectionStore | None = None
_remote_machine_connector: RemoteMachineConnector | None = None


def get_database() -> DatabaseAdapter:
    global _database
    if _database is None:
        _database = SQLAlchemyDatabaseAdapter()
    return _database


def get_connection_store() -> ConnectionStore:
    global _connection_store
    if _connection_store is None:
        _connection_store = InMemoryConnectionStore()
    return _connection_store


def get_remote_machine_connector() -> RemoteMachineConnector:
    global _remote_machine_connector
    if _remote_machine_connector is None:
        _remote_machine_connector = RemoteMachineConnector()
    return _remote_machine_connector


def get_db_session() -> Generator[Session, None, None]:
    with get_database().session() as session:
        yield session
