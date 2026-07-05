from sqlalchemy import JSON, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(String, primary_key=True)
    hostname = Column(String, nullable=True)
    username = Column(String, nullable=True)
    distribution = Column(String, nullable=True)
    status = Column(String, nullable=True)
    jitter = Column(Integer, nullable=True)
    beacon_interval = Column(Integer, nullable=True)


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(String, primary_key=True)
    agent_id = Column(String, nullable=True)
    module_name = Column(String, nullable=True)
    source_code = Column(Text, nullable=True)
    status = Column(String, nullable=True)
    output = Column(Text, nullable=True)
    schedule_type = Column(String, nullable=True)
    schedule_value = Column(String, nullable=True)
    duration = Column(Integer, nullable=True)


class Workflow(Base):
    __tablename__ = "workflows"

    workflow_id = Column(String, primary_key=True)
    agent_id = Column(String, nullable=True)
    name = Column(String, nullable=True)
    definition = Column(JSON, nullable=True)
    version = Column(Integer, default=1)


class CollectedData(Base):
    __tablename__ = "collected_data"

    id = Column(Integer, primary_key=True)
    agent_id = Column(String, nullable=True)
    task_id = Column(String, nullable=True)
    workflow_id = Column(String, nullable=True)
    data_type = Column(String, nullable=True)
    schema_version = Column(Integer, nullable=True)
    payload = Column(JSON, nullable=True)
    collected_at = Column(String, nullable=True)
