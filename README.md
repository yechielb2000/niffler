# Niffler

Niffler is a local system inventory console. Connect to a registered Linux system over SSH, collect inventory through a fixed catalog of read-only actions, and review network, machine, user, group, cgroup, service, package, and storage records. Data views retain the most recent 180 days.

The UI does not accept arbitrary command lines. The API accepts preset IDs only. SSH connection metadata can be remembered; credentials exist only in a temporary backend memory session (30-minute expiry) and are not written to the database. Collection uses `remote-machine` structured system, network, process, service, device, filesystem, and environment APIs. The Compose configuration binds the web service to `127.0.0.1`.

## Run with Docker Compose

Set `POSTGRES_PASSWORD` in your environment, then run:

```sh
docker compose up --build
```

Open <http://127.0.0.1:8000/>. API endpoints and documentation are under `/api/v1`; the docs are at <http://127.0.0.1:8000/api/v1/docs>, and `/api/v1/health` checks the database connection.

The demo database starts empty. Load the included inventory and visualization history with `docker compose exec server uv run python -m backend.seed_mock_data --fixture data/mock_agents.json`. The repeatable seed adds sample system, network, process, service, device, filesystem, account, and environment snapshots across a 180-day period. Use an alphanumeric `POSTGRES_PASSWORD` so it can be safely embedded in the database connection URL.

## Run locally with Vite

Run both the API and Vite frontend together on Windows, macOS, or Linux:

```sh
python scripts/dev/run.py
```

The script syncs Python dependencies, installs frontend dependencies when needed, starts the API with the local SQLite database, waits for its health check, then starts Vite. Open <http://127.0.0.1:3000/>. Pass `--seed-demo-data` to load the included inventory or `--seed-showcase-agent` to add one agent with sample records for every data view; both options are safe to repeat. Logs are written under `data/`. Press Ctrl+C to stop both services.

To add the all-data showcase agent to an already running local database, run `uv run python -m backend.seed_mock_data --fixture data/showcase_agent.json`. Find it in the agent list as **showcase-linux-01** (agent ID `showcase-all-datatypes`). Its records are synthetic examples, including private demo network addresses and a sample map point.

For manual development, run `uv sync` and `npm ci`, then start the API with `uv run uvicorn backend.app:app --host 127.0.0.1 --port 8000` and Vite with `npm run dev` from `frontend`.
