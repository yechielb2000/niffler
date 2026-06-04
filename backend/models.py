from sqlalchemy import Column, Integer, String, Text
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
