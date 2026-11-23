from __future__ import annotations

import argparse
import contextlib
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
FRONTEND = ROOT / "frontend"
DATA = ROOT / "data"


def require(command: str, hint: str) -> str:
    resolved = shutil.which(command)
    if not resolved:
        raise RuntimeError(f"{command} is required. {hint}")
    return resolved


def ensure_port_available(port: int) -> None:
    with socket.socket() as listener:
        try:
            listener.bind(("127.0.0.1", port))
        except OSError as error:
            raise RuntimeError(f"Port {port} is already in use.") from error


def wait_for_url(url: str, process: subprocess.Popen, label: str, timeout: int) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"{label} exited during startup. Check its log under data/.")
        try:
            with urlopen(url, timeout=2):
                return
        except (OSError, URLError):
            time.sleep(0.5)
    raise RuntimeError(f"{label} did not become ready at {url}. Check its log under data/.")


def stop_process(process: subprocess.Popen | None) -> None:
    if process is None:
        return

    if os.name == "nt":
        if process.poll() is not None:
            return
        taskkill = shutil.which("taskkill")
        if taskkill:
            subprocess.run(
                [taskkill, "/PID", str(process.pid), "/T", "/F"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            process.terminate()
    else:
        with contextlib.suppress(ProcessLookupError):
            kill_process_group(process.pid, "SIGTERM")
        with contextlib.suppress(subprocess.TimeoutExpired):
            process.wait(timeout=3)
        with contextlib.suppress(ProcessLookupError):
            kill_process_group(process.pid, "SIGKILL")

    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        if os.name == "nt":
            process.kill()
        else:
            with contextlib.suppress(ProcessLookupError):
                kill_process_group(process.pid, "SIGKILL")
        process.wait()


def kill_process_group(process_id: int, signal_name: str) -> None:
    killpg = getattr(os, "killpg", None)
    signal_number = getattr(signal, signal_name, None)
    if killpg is None or signal_number is None:
        return
    killpg(process_id, signal_number)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run Niffler's local API and Vite development server."
    )
    parser.add_argument("--api-port", type=int, default=8000)
    parser.add_argument("--web-port", type=int, default=3000)
    parser.add_argument("--seed-demo-data", action="store_true")
    parser.add_argument("--seed-showcase-agent", action="store_true")
    args = parser.parse_args()

    uv = require("uv", "Install it from https://docs.astral.sh/uv/getting-started/installation/.")
    require("npm", "Install Node.js and npm.")
    node = require("node", "Install Node.js and npm.")
    DATA.mkdir(parents=True, exist_ok=True)
    ensure_port_available(args.api_port)
    ensure_port_available(args.web_port)

    subprocess.run([uv, "sync", "--frozen"], cwd=ROOT, check=True)
    if not (FRONTEND / "node_modules/vite/bin/vite.js").exists():
        # npm is a .cmd launcher on Windows and a shell command on Unix.
        subprocess.run("npm ci", cwd=FRONTEND, check=True, shell=True)

    if args.seed_demo_data:
        subprocess.run(
            [
                uv,
                "run",
                "python",
                "-m",
                "backend.seed_mock_data",
                "--fixture",
                "data/mock_agents.json",
            ],
            cwd=ROOT,
            check=True,
        )
    if args.seed_showcase_agent:
        subprocess.run(
            [
                uv,
                "run",
                "python",
                "-m",
                "backend.seed_mock_data",
                "--fixture",
                "data/showcase_agent.json",
            ],
            cwd=ROOT,
            check=True,
        )

    api_log = (DATA / "dev-api.log").open("ab")
    vite_log = (DATA / "dev-vite.log").open("ab")
    api = None
    vite = None
    env = os.environ.copy()
    env["VITE_API_PROXY"] = f"http://127.0.0.1:{args.api_port}"

    def handle_termination(_signum, _frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, handle_termination)

    try:
        api = subprocess.Popen(
            [
                uv,
                "run",
                "uvicorn",
                "backend.app:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(args.api_port),
            ],
            cwd=ROOT,
            stdout=api_log,
            stderr=subprocess.STDOUT,
            start_new_session=os.name != "nt",
        )
        health_url = f"http://127.0.0.1:{args.api_port}/api/v1/health"
        wait_for_url(health_url, api, "API", timeout=45)

        vite = subprocess.Popen(
            [
                node,
                str(FRONTEND / "node_modules/vite/bin/vite.js"),
                "--host",
                "127.0.0.1",
                "--port",
                str(args.web_port),
                "--strictPort",
            ],
            cwd=FRONTEND,
            env=env,
            stdout=vite_log,
            stderr=subprocess.STDOUT,
            start_new_session=os.name != "nt",
        )
        frontend_url = f"http://127.0.0.1:{args.web_port}/"
        wait_for_url(frontend_url, vite, "Vite", timeout=30)

        print(f"API:      http://127.0.0.1:{args.api_port}", flush=True)
        print(f"Health:   {health_url}", flush=True)
        print(f"Frontend: {frontend_url}", flush=True)
        print("Press Ctrl+C to stop both services.", flush=True)

        while True:
            if api.poll() is not None:
                raise RuntimeError("API stopped. Check data/dev-api.log.")
            if vite.poll() is not None:
                raise RuntimeError("Vite stopped. Check data/dev-vite.log.")
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping local services...", flush=True)
    finally:
        stop_process(vite)
        stop_process(api)
        api_log.close()
        vite_log.close()

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Error: {error}", file=sys.stderr)
        raise SystemExit(1) from error
