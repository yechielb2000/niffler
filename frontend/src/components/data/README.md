# Collected data components

`DataExplorer` owns category navigation and the common collected-record envelope. Each record has an ID, a `data_type`, a schema version, a capture time, and a JSON payload.

Each category lives in its own directory. Dashboards accept `CollectedRecord[]`, unwrap an optional collector `result` envelope, and validate their category payload with Zod before rendering it. Keep collection and API calls outside these presentation components; missing fields should have an explicit empty state rather than guessed values.

- `network/`: interfaces, logical topology, neighbors/ARP, routes, firewall rules, listeners, DNS, and DHCP.
- `packages/`: installed package inventory.
- `config/`: configuration file metadata and redacted settings.
- `system/`, `processes/`, `services/`, `devices/`, `accounts/`, `filesystem/`, `environment/`, `location/`: typed views for the other collected categories.
- `overview/`: snapshot summary and category counts.
- `shared/`: common panels, metrics, and empty states.
- `other/`: safe field/value presentation for unrecognized record types; it does not dump raw payload JSON.
