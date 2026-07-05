from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.models import Base, Agent, CollectedData, Task, Workflow
from backend.seed_mock_data import seed_mock_data


def test_seed_mock_data_populates_agents_and_related_records(tmp_path):
    fixture_path = Path(__file__).resolve().parents[1] / ".." / "data" / "mock_agents.json"
    database_url = f"sqlite:///{tmp_path / 'mock-data.sqlite'}"

    engine = create_engine(database_url)
    Base.metadata.create_all(engine)

    summary = seed_mock_data(database_url=database_url, fixture_path=fixture_path, reset=True)

    with Session(engine) as session:
        assert summary["agents"] == 20
        assert session.query(Agent).count() == 20
        assert session.query(Task).count() >= 20
        assert session.query(Workflow).count() >= 20
        assert session.query(CollectedData).count() >= 20

        statuses = {agent.status for agent in session.query(Agent).all()}
        assert {"Active", "Inactive", "Pending", "Error"}.issubset(statuses)
