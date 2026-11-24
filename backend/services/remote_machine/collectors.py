"""Focused adapters from RemoteMachine's typed results to category models."""

from __future__ import annotations

import re
from datetime import timedelta
from typing import Any, Protocol

from pydantic import BaseModel

from backend.schemas.remote_inventory import (
    AccountsInventory,
    BlockDevice,
    CPUInfo,
    DevicesInventory,
    DirectoryEntry,
    DirectoryListing,
    DNSConfiguration,
    EnvironmentInventory,
    FileInfo,
    FilesystemInventory,
    Group,
    HostInfo,
    LoadAverage,
    MemoryInfo,
    MountedDevices,
    MountPoint,
    NetworkAddress,
    NetworkInterface,
    NetworkInventory,
    Process,
    ProcessesInventory,
    ProcessMemory,
    Service,
    ServicesInventory,
    SystemOverview,
    Uptime,
    User,
)


class CollectionClient(Protocol):
    sys: Any
    net: Any
    ps: Any
    service: Any
    device: Any
    fs: Any
    env: Any


class InventoryCollector(Protocol):
    preset_id: str

    def collect(self, client: CollectionClient) -> BaseModel: ...


def host_info_from_remote(info: Any) -> HostInfo:
    return HostInfo(
        hostname=info.hostname,
        distribution=info.os_release.pretty_name,
        os_name=info.os_release.name,
        os_version=info.os_release.version,
        os_id=info.os_release.id,
        kernel=info.kernel_version,
        architecture=info.uname.machine,
    )


class SystemOverviewCollector:
    preset_id = "system.overview"

    def collect(self, client: CollectionClient) -> SystemOverview:
        info = client.sys.info()
        cpu = info.cpu_info
        memory = info.memory_info
        uptime = info.uptime
        load = info.load_average
        return SystemOverview(
            info=host_info_from_remote(info),
            cpu=CPUInfo(
                model=cpu.model_name,
                cores=cpu.cores,
                threads=cpu.threads,
                processor=cpu.processor,
                vendor_id=cpu.vendor_id,
                cpu_mhz=cpu.cpu_mhz,
                l1_cache=cpu.l1_cache,
                l2_cache=cpu.l2_cache,
                l3_cache=cpu.l3_cache,
            ),
            memory=MemoryInfo(
                total_gb=_gib(memory.total),
                used_gb=_gib(memory.used),
                available_gb=_gib(memory.available),
                usage_percent=memory.percent,
                swap_total_gb=_gib(memory.swap_total),
                swap_used_gb=_gib(memory.swap_used),
                swap_percent=memory.swap_percent,
            ),
            uptime=Uptime(
                seconds=uptime.seconds,
                human=_format_uptime(uptime.uptime),
                boot_time=uptime.boot_time,
                days=uptime.days,
                hours=uptime.hours,
                minutes=uptime.minutes,
            ),
            load=LoadAverage(
                one_minute=load.one_minute,
                five_minutes=load.five_minutes,
                fifteen_minutes=load.fifteen_minutes,
                running_processes=load.running_processes,
                total_processes=load.total_processes,
            ),
        )


class NetworkInventoryCollector:
    preset_id = "network.inventory"

    def collect(self, client: CollectionClient) -> NetworkInventory:
        names = client.net.interfaces()
        details = {name: _network_interface(client.net.interface_info(name)) for name in names}
        addresses = client.net.ip_list().addresses
        return NetworkInventory(
            interfaces=names,
            details=details,
            ip_list=[
                NetworkAddress(
                    interface=item.interface,
                    address=item.address,
                    family=item.family,
                    netmask=item.netmask,
                    broadcast=item.broadcast,
                    gateway=item.gateway,
                )
                for item in addresses
            ],
        )


class DNSConfigurationCollector:
    preset_id = "network.dns"

    def collect(self, client: CollectionClient) -> DNSConfiguration:
        return DNSConfiguration(
            resolver=client.fs.read("/etc/resolv.conf"),
            hosts=client.fs.read("/etc/hosts"),
        )


class ProcessesInventoryCollector:
    preset_id = "processes.inventory"

    def collect(self, client: CollectionClient) -> ProcessesInventory:
        memory = client.ps.memory_usage()
        return ProcessesInventory(
            processes=[Process.model_validate(item) for item in client.ps.list()],
            memory=ProcessMemory.model_validate(memory),
        )


class ServicesInventoryCollector:
    preset_id = "services.inventory"

    def collect(self, client: CollectionClient) -> ServicesInventory:
        result = client.service.list()
        return ServicesInventory(
            services=[Service.model_validate(service) for service in result.services]
        )


class AccountsInventoryCollector:
    preset_id = "accounts.inventory"
    _uid_gid = re.compile(r"^\d+$")

    def collect(self, client: CollectionClient) -> AccountsInventory:
        users = self._users(client.fs.read("/etc/passwd"))
        groups = self._groups(client.fs.read("/etc/group"))
        return AccountsInventory(users=users, groups=groups)

    def _users(self, contents: str) -> list[User]:
        users = []
        for row in contents.splitlines():
            parts = row.split(":")
            if len(parts) < 7:
                continue
            uid = self._number_or_text(parts[2])
            gid = self._number_or_text(parts[3])
            users.append(
                User(
                    name=parts[0],
                    uid=uid,
                    gid=gid,
                    home=parts[5],
                    shell=parts[6],
                    system=isinstance(uid, int) and uid < 1000,
                )
            )
        return users

    def _groups(self, contents: str) -> list[Group]:
        groups = []
        for row in contents.splitlines():
            parts = row.split(":")
            if len(parts) < 4:
                continue
            groups.append(
                Group(
                    name=parts[0],
                    gid=self._number_or_text(parts[2]),
                    members=[member for member in parts[3].split(",") if member],
                )
            )
        return groups

    @classmethod
    def _number_or_text(cls, value: str) -> int | str:
        return int(value) if cls._uid_gid.fullmatch(value) else value


class DevicesInventoryCollector:
    preset_id = "devices.inventory"

    def collect(self, client: CollectionClient) -> DevicesInventory:
        blocks = client.device.list_block()
        mounted = client.device.mounted()
        return DevicesInventory(
            block_devices=[
                BlockDevice(
                    name=device.name,
                    path=device.path,
                    size=device.size,
                    read_only=device.ro,
                    filesystem=device.fstype,
                    uuid=device.uuid,
                    label=device.label,
                    model=device.model,
                    serial=device.serial,
                )
                for device in blocks
            ],
            mounted=MountedDevices(
                mount_points=[
                    MountPoint(
                        device=mount.device,
                        mount_point=mount.mount_point,
                        filesystem=mount.fstype,
                        total_gb=_gib(mount.total_size),
                        used_gb=_gib(mount.used),
                        percent=mount.percent,
                        options=mount.options,
                    )
                    for mount in mounted.mount_points
                ],
                count=mounted.count,
            ),
        )


class FilesystemInventoryCollector:
    preset_id = "filesystem.root"

    def collect(self, client: CollectionClient) -> FilesystemInventory:
        root = client.fs.stat("/")
        listing = client.fs.list("/")
        return FilesystemInventory(
            root=FileInfo(
                path=root.path,
                size=root.size,
                mode=root.mode,
                owner=root.owner,
                group=root.group,
                modified=root.modified,
                accessed=root.accessed,
                created=root.created,
                is_symlink=root.is_symlink,
                is_file=root.is_file,
                is_dir=root.is_dir,
                type=_file_type(root.is_dir, root.is_file, root.is_symlink),
            ),
            entries=DirectoryListing(
                path=listing.path,
                count=listing.count,
                entries=[DirectoryEntry.model_validate(entry) for entry in listing.entries],
            ),
        )


class EnvironmentInventoryCollector:
    preset_id = "environment.inventory"
    _sensitive = ("key", "secret", "token", "pass", "credential")

    def collect(self, client: CollectionClient) -> EnvironmentInventory:
        variables = client.env.list().vars
        return EnvironmentInventory(
            variables={key: self._safe_value(key, value) for key, value in variables.items()}
        )

    def _safe_value(self, key: str, value: str) -> str:
        return "[redacted]" if any(term in key.lower() for term in self._sensitive) else value


def default_collectors() -> tuple[InventoryCollector, ...]:
    return (
        SystemOverviewCollector(),
        NetworkInventoryCollector(),
        DNSConfigurationCollector(),
        ProcessesInventoryCollector(),
        ServicesInventoryCollector(),
        AccountsInventoryCollector(),
        DevicesInventoryCollector(),
        FilesystemInventoryCollector(),
        EnvironmentInventoryCollector(),
    )


def _network_interface(info: Any) -> NetworkInterface:
    return NetworkInterface(
        name=info.name,
        state="UP" if info.isup else "DOWN",
        mac_address=info.mac_address,
        addresses=[
            *(str(address) for address in info.ipv4_addresses),
            *(str(address) for address in info.ipv6_addresses),
        ],
        mtu=info.mtu,
        is_running=info.is_running,
        broadcast=info.broadcast,
        netmask=info.netmask,
        speed=info.speed,
    )


def _gib(value: int) -> float:
    return round(value / 1024**3, 2)


def _format_uptime(value: timedelta) -> str:
    parts = []
    if value.days:
        parts.append(f"{value.days} day{'s' if value.days != 1 else ''}")
    hours, remainder = divmod(value.seconds, 3600)
    minutes = remainder // 60
    if hours:
        parts.append(f"{hours} hour{'s' if hours != 1 else ''}")
    if minutes and len(parts) < 2:
        parts.append(f"{minutes} minute{'s' if minutes != 1 else ''}")
    return ", ".join(parts) or "Less than a minute"


def _file_type(is_dir: bool, is_file: bool, is_symlink: bool) -> str:
    if is_symlink:
        return "symlink"
    if is_dir:
        return "directory"
    if is_file:
        return "file"
    return "unknown"
