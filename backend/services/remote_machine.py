"""Read-only inventory collection using the remote-machine typed API."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class Preset:
    id: str
    label: str
    category: str
    description: str


PRESETS = {
    p.id: p
    for p in (
        Preset("system.overview", "System overview", "system", "OS, CPU, memory, uptime, and load"),
        Preset(
            "network.inventory",
            "Network inventory",
            "network",
            "Interfaces, addresses, and interface details",
        ),
        Preset(
            "network.dns",
            "DNS configuration",
            "network",
            "Resolver configuration and DNS lookup capability",
        ),
        Preset(
            "processes.inventory",
            "Processes and memory",
            "processes",
            "Running processes and process memory usage",
        ),
        Preset("services.inventory", "Services", "services", "Service names and active states"),
        Preset(
            "accounts.inventory",
            "Users and groups",
            "users",
            "Local users and groups (including memberships)",
        ),
        Preset(
            "devices.inventory",
            "Devices and mounts",
            "devices",
            "Block devices, mounts, and filesystem use",
        ),
        Preset(
            "filesystem.root",
            "Root filesystem",
            "filesystem",
            "Root filesystem metadata and directory listing",
        ),
        Preset(
            "environment.inventory",
            "Environment",
            "environment",
            "Environment variables available to the SSH session",
        ),
    )
}


def _plain(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, dict):
        return {str(k): _plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_plain(v) for v in value]
    if hasattr(value, "__dataclass_fields__"):
        return {k: _plain(getattr(value, k)) for k in value.__dataclass_fields__}
    if hasattr(value, "__dict__"):
        return {k: _plain(v) for k, v in vars(value).items() if not k.startswith("_")}
    return str(value)


class RemoteMachineConnector:
    """Creates short-lived RemoteMachine sessions for each operation.

    Credentials are supplied by the caller and never kept on the connector.
    The library's higher-level APIs are used for collection; no arbitrary
    command execution is exposed.
    """

    def _open(self, host: str, port: int, username: str, credential: str | None):
        try:
            from remote_machine import RemoteMachine
        except ImportError as exc:
            raise RuntimeError(
                "Install remote-machine and paramiko to enable SSH collection"
            ) from exc
        kwargs: dict[str, Any] = {"port": port}
        if credential:
            import io

            import paramiko

            parsed_key = None
            for key_type in (paramiko.Ed25519Key, paramiko.RSAKey, paramiko.ECDSAKey):
                try:
                    parsed_key = key_type.from_private_key(io.StringIO(credential))
                    break
                except paramiko.SSHException:
                    continue
            if parsed_key is not None:
                kwargs["pkey"] = parsed_key
            else:
                kwargs["password"] = credential
        return RemoteMachine(host, username, **kwargs)

    def connect(
        self, host: str, port: int, username: str, credential: str | None
    ) -> dict[str, Any]:
        conn = self._open(host, port, username, credential)
        with conn:
            info = _plain(conn.sys.info())
            return {"connected": True, "system": info}

    def collect(self, connection: dict[str, Any], preset: Preset) -> dict[str, Any]:
        conn = self._open(
            connection["host"],
            connection["port"],
            connection["username"],
            connection.get("credential"),
        )
        with conn:
            if preset.id == "system.overview":
                return {
                    "info": _plain(conn.sys.info()),
                    "cpu": _plain(conn.sys.cpu_info()),
                    "memory": _plain(conn.sys.memory_info()),
                    "uptime": _plain(conn.sys.uptime()),
                    "load": _plain(conn.sys.load_average()),
                }
            if preset.id == "network.inventory":
                interfaces = conn.net.interfaces()
                return {
                    "interfaces": _plain(interfaces),
                    "details": {
                        str(name): _plain(conn.net.interface_info(name)) for name in interfaces
                    },
                    "ip_list": _plain(conn.net.ip_list()),
                }
            if preset.id == "network.dns":
                return {
                    "resolver": _plain(conn.fs.read("/etc/resolv.conf")),
                    "hosts": _plain(conn.fs.read("/etc/hosts")),
                }
            if preset.id == "processes.inventory":
                return {
                    "processes": _plain(conn.ps.list()),
                    "memory": _plain(conn.ps.memory_usage()),
                }
            if preset.id == "services.inventory":
                return {"services": _plain(conn.service.list())}
            if preset.id == "accounts.inventory":
                passwd = str(conn.fs.read("/etc/passwd"))
                group = str(conn.fs.read("/etc/group"))
                users = []
                for row in passwd.splitlines():
                    parts = row.split(":")
                    if len(parts) >= 7:
                        users.append(
                            {
                                "name": parts[0],
                                "uid": int(parts[2]) if parts[2].isdigit() else parts[2],
                                "gid": int(parts[3]) if parts[3].isdigit() else parts[3],
                                "home": parts[5],
                                "shell": parts[6],
                                "system": parts[0] != "root"
                                and parts[2].isdigit()
                                and int(parts[2]) < 1000,
                            }
                        )
                groups = []
                for row in group.splitlines():
                    parts = row.split(":")
                    if len(parts) >= 4:
                        groups.append(
                            {
                                "name": parts[0],
                                "gid": int(parts[2]) if parts[2].isdigit() else parts[2],
                                "members": [name for name in parts[3].split(",") if name],
                            }
                        )
                return {"users": users, "groups": groups}
            if preset.id == "devices.inventory":
                return {
                    "block_devices": _plain(conn.device.list_block()),
                    "mounted": _plain(conn.device.mounted()),
                }
            if preset.id == "filesystem.root":
                return {"root": _plain(conn.fs.stat("/")), "entries": _plain(conn.fs.list("/"))}
            if preset.id == "environment.inventory":
                # Filter likely secrets before storage/display.
                env = _plain(conn.env.list())
                if isinstance(env, dict):
                    env = {
                        k: (
                            "[redacted]"
                            if any(
                                x in k.lower()
                                for x in ("key", "secret", "token", "pass", "credential")
                            )
                            else v
                        )
                        for k, v in env.items()
                    }
                return {"variables": env}
        raise RuntimeError("Preset is not supported")
