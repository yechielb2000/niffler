"""Fixed, read-only collection catalog."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Preset:
    id: str
    label: str
    category: str
    description: str


PRESETS: tuple[Preset, ...] = (
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
        "Resolver and hosts-file configuration",
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
        "Local users and groups, including memberships",
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
        "Environment variables with likely secrets redacted",
    ),
)

PRESETS_BY_ID = {preset.id: preset for preset in PRESETS}
