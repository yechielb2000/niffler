from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from backend.models import Agent, Base, CollectedData, Task, Workflow
from backend.seed_mock_data import load_fixture, seed_mock_data


def test_seed_mock_data_populates_agents_and_related_records(tmp_path):
    fixture_path = Path(__file__).resolve().parents[1] / ".." / "data" / "mock_agents.json"
    database_url = f"sqlite:///{tmp_path / 'mock-data.sqlite'}"

    engine = create_engine(database_url)
    Base.metadata.create_all(engine)

    expected_agents = len(load_fixture(fixture_path))
    summary = seed_mock_data(database_url=database_url, fixture_path=fixture_path, reset=True)

    with Session(engine) as session:
        assert summary["agents"] == expected_agents
        assert session.query(Agent).count() == expected_agents
        assert session.query(Task).count() >= expected_agents
        assert session.query(Workflow).count() >= expected_agents
        assert session.query(CollectedData).count() >= expected_agents

        statuses = {agent.status for agent in session.query(Agent).all()}
        assert {"Active", "Inactive", "Pending", "Error"}.issubset(statuses)

        demo_agent = session.query(Agent).filter_by(hostname="demo-host-01").one()
        demo_types = {
            record.data_type
            for record in session.query(CollectedData).filter_by(agent_id=demo_agent.agent_id)
        }
        assert {
            "system",
            "network",
            "processes",
            "services",
            "devices",
            "filesystem",
            "environment",
            "users",
            "packages",
            "configuration",
            "location",
            "host-inventory",
        }.issubset(demo_types)
