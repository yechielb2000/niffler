"""Validated models returned by the remote inventory collectors."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class InventoryModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")


class HostInfo(InventoryModel):
    hostname: str
    distribution: str | None = None
    os_name: str | None = None
    os_version: str | None = None
    os_id: str | None = None
    kernel: str | None = None
    architecture: str | None = None


class CPUInfo(InventoryModel):
    model: str
    cores: int
    threads: int
    processor: str | None = None
    vendor_id: str | None = None
    cpu_mhz: float | None = None
    l1_cache: str | None = None
    l2_cache: str | None = None
    l3_cache: str | None = None
    usage_percent: float | None = None


class MemoryInfo(InventoryModel):
    total_gb: float
    used_gb: float
    available_gb: float
    usage_percent: float
    swap_total_gb: float | None = None
    swap_used_gb: float | None = None
    swap_percent: float | None = None


class Uptime(InventoryModel):
    seconds: float
    human: str
    boot_time: datetime | None = None
    days: int | None = None
    hours: int | None = None
    minutes: int | None = None


class LoadAverage(InventoryModel):
    one_minute: float
    five_minutes: float
    fifteen_minutes: float
    running_processes: int
    total_processes: int


class SystemOverview(InventoryModel):
    info: HostInfo
    cpu: CPUInfo
    memory: MemoryInfo
    uptime: Uptime
    load: LoadAverage


class NetworkInterface(InventoryModel):
    name: str
    state: str
    mac_address: str
    addresses: list[str]
    mtu: int
    is_running: bool
    broadcast: str | None = None
    netmask: str | None = None
    speed: int | None = None


class NetworkAddress(InventoryModel):
    interface: str
    address: str
    family: str
    netmask: str | None = None
    broadcast: str | None = None
    gateway: str | None = None


class NetworkInventory(InventoryModel):
    interfaces: list[str]
    details: dict[str, NetworkInterface]
    ip_list: list[NetworkAddress]


class DNSConfiguration(InventoryModel):
    resolver: str
    hosts: str


class Process(InventoryModel):
    pid: int
    ppid: int
    name: str
    state: str
    user: str
    cpu_percent: float
    memory_percent: float
    memory_rss: int
    memory_vms: int
    started: datetime
    command: str


class ProcessMemory(InventoryModel):
    total: int
    available: int
    used: int
    free: int
    percent: float
    buffers: int
    cached: int
    swap_total: int
    swap_used: int
    swap_free: int
    swap_percent: float


class ProcessesInventory(InventoryModel):
    processes: list[Process]
    memory: ProcessMemory


class Service(InventoryModel):
    name: str
    state: str
    enabled: bool
    active: bool
    loaded: bool
    pid: int | None = None
    memory: int | None = None
    cpu_percent: float | None = None
    uptime: int | None = None


class ServicesInventory(InventoryModel):
    services: list[Service]


class User(InventoryModel):
    name: str
    uid: int | str
    gid: int | str
    home: str
    shell: str
    system: bool


class Group(InventoryModel):
    name: str
    gid: int | str
    members: list[str]


class AccountsInventory(InventoryModel):
    users: list[User]
    groups: list[Group]


class BlockDevice(InventoryModel):
    name: str
    path: str
    size: int
    read_only: bool
    filesystem: str | None = None
    uuid: str | None = None
    label: str | None = None
    model: str | None = None
    serial: str | None = None
    type: str = "block"
    mountpoint: str | None = None


class MountPoint(InventoryModel):
    device: str
    mount_point: str
    filesystem: str
    total_gb: float
    used_gb: float
    percent: float
    options: str


class MountedDevices(InventoryModel):
    mount_points: list[MountPoint]
    count: int


class DevicesInventory(InventoryModel):
    block_devices: list[BlockDevice]
    mounted: MountedDevices


class FileInfo(InventoryModel):
    path: str
    size: int
    mode: str
    owner: str
    group: str
    modified: datetime
    accessed: datetime
    created: datetime
    is_symlink: bool
    is_file: bool
    is_dir: bool
    type: str


class DirectoryEntry(InventoryModel):
    name: str
    path: str
    type: str
    size: int
    modified: datetime
    owner: str
    group: str
    permissions: str


class DirectoryListing(InventoryModel):
    path: str
    entries: list[DirectoryEntry]
    count: int


class FilesystemInventory(InventoryModel):
    root: FileInfo
    entries: DirectoryListing


class EnvironmentInventory(InventoryModel):
    variables: dict[str, Any]
