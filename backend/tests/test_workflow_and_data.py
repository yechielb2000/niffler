from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.models import Base
from backend.repositories.inventory_repository import InventoryRepository


def test_workflow_and_data_are_stored():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        repository = InventoryRepository(session)

        workflow = repository.create_workflow("agent-1", "Periodic Screenshots", {"nodes": []})
        assert workflow.workflow_id
        assert repository.list_workflows("agent-1")[0].name == "Periodic Screenshots"

        data_record = repository.store_collected_data(
            agent_id="agent-1",
            task_id="task-1",
            workflow_id=workflow.workflow_id,
            data_type="screenshot",
            schema_version=1,
            payload={"path": "/tmp/screen.png"},
        )

        assert data_record.data_type == "screenshot"
        assert repository.list_collected_data("agent-1")[0].payload["path"] == "/tmp/screen.png"
