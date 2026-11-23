import type { CollectedRecord, JsonObject } from '../types';
import { asArray, asObject, recordPayload } from '../types';
import {
  NetworkPayloadSchema,
  type FirewallRule,
  type NetworkInterface,
  type NetworkNode,
  type NetworkRoute,
} from './schema';

export function objectRows(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.map(asObject).filter((row) => Object.keys(row).length > 0);
  const object = asObject(value);
  if (Array.isArray(object.entries)) return objectRows(object.entries);
  return Object.entries(object).map(([key, value]) => ({ key, ...asObject(value) }));
}

function strings(value: unknown): string[] {
  return asArray(value)
    .map((item) => (typeof item === 'string' ? item : String(asObject(item).address ?? '')))
    .filter(Boolean);
}

export function networkPayloads(records: CollectedRecord[]) {
  return records
    .map(recordPayload)
    .map((payload) => NetworkPayloadSchema.safeParse(payload))
    .filter((result) => result.success)
    .map((result) => result.data);
}

export function getInterfaces(payloads: ReturnType<typeof networkPayloads>): NetworkInterface[] {
  const result: NetworkInterface[] = [];
  for (const payload of payloads) {
    const details = payload.details ?? {};
    const interfaceObjects = new Map(
      asArray(payload.interfaces)
        .map((value) => asObject(value))
        .filter((value) => typeof value.name === 'string')
        .map((value) => [String(value.name), value]),
    );
    const names = new Set(
      [
        ...Object.keys(details),
        ...interfaceObjects.keys(),
        ...asArray(payload.interfaces)
          .filter((value) => typeof value === 'string')
          .map(String),
      ].filter(Boolean),
    );
    for (const name of names) {
      const detail = asObject(details[name]);
      const raw = Object.keys(detail).length ? detail : (interfaceObjects.get(name) ?? {});
      const known = result.find((item) => item.name === name);
      const iface: NetworkInterface = {
        name,
        state: raw.state == null ? undefined : String(raw.state),
        mac: raw.mac_address == null ? undefined : String(raw.mac_address),
        mtu: typeof raw.mtu === 'string' || typeof raw.mtu === 'number' ? raw.mtu : undefined,
        addresses: strings(raw.addresses ?? raw.address ?? raw.ip_addresses),
        raw,
      };
      if (!known) result.push(iface);
      else
        Object.assign(known, {
          ...iface,
          addresses: [...new Set([...known.addresses, ...iface.addresses])],
        });
    }
    const reportedIps = strings(payload.ip_list);
    if (reportedIps.length) {
      let target = result.find((item) => item.name !== 'lo') ?? result[0];
      if (!target) {
        target = {
          name: String(payload.default_interface ?? 'Network interface'),
          addresses: [],
          raw: {},
        };
        result.push(target);
      }
      target.addresses = [...new Set([...target.addresses, ...reportedIps])];
    }
  }
  return result;
}

function candidateRows(payload: JsonObject, keys: string[]): JsonObject[] {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null) return objectRows(value);
  }
  return [];
}

export function getNeighbors(payloads: ReturnType<typeof networkPayloads>): NetworkNode[] {
  const rows = payloads.flatMap((payload) => [
    ...candidateRows(payload, ['neighbors', 'arp', 'arp_table']),
    ...candidateRows(asObject(payload.topology), ['nodes', 'neighbors']),
  ]);
  const byIp = new Map<string, NetworkNode>();
  for (const row of rows) {
    const ip = String(row.ip ?? row.address ?? row.ip_address ?? row.destination ?? row.key ?? '');
    if (!ip) continue;
    byIp.set(ip, {
      ip,
      hostname: row.hostname == null ? undefined : String(row.hostname),
      mac: String(row.mac ?? row.mac_address ?? row.lladdr ?? row.value ?? '') || undefined,
      interface: String(row.interface ?? row.iface ?? row.device ?? '') || undefined,
      state: String(row.state ?? row.status ?? '') || undefined,
      kind: String(row.kind ?? row.type ?? '') || undefined,
    });
  }
  for (const payload of payloads) {
    for (const value of [payload.neighbors, payload.arp, payload.arp_table]) {
      if (typeof value !== 'string') continue;
      for (const line of value.split(/\r?\n/)) {
        const tokens = line.trim().split(/\s+/);
        const ip = tokens.find((token) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(token));
        const mac = tokens.find((token) => /^(?:[0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(token));
        if (!ip) continue;
        const ifaceIndex = tokens.findIndex((token) => token === 'dev' || token === 'on');
        byIp.set(ip, {
          ip,
          mac,
          interface: ifaceIndex >= 0 ? tokens[ifaceIndex + 1] : undefined,
          state: tokens.find((token) =>
            ['REACHABLE', 'STALE', 'DELAY', 'PROBE', 'PERMANENT', 'FAILED'].includes(
              token.toUpperCase(),
            ),
          ),
        });
      }
    }
  }
  return [...byIp.values()];
}

export function getRoutes(payloads: ReturnType<typeof networkPayloads>): NetworkRoute[] {
  const rows = payloads.flatMap((payload) => candidateRows(payload, ['routes', 'route_table']));
  const textRows: JsonObject[] = payloads
    .flatMap((payload) =>
      [payload.routes, payload.route_table].filter(
        (value): value is string => typeof value === 'string',
      ),
    )
    .flatMap((value) =>
      value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const tokens = line.split(/\s+/);
          const valueFor = (key: string) => {
            const index = tokens.indexOf(key);
            return index >= 0 ? tokens[index + 1] : undefined;
          };
          return {
            destination: tokens[0],
            gateway: valueFor('via') ?? valueFor('gateway'),
            interface: valueFor('dev') ?? valueFor('if'),
            protocol: valueFor('proto'),
            metric: valueFor('metric'),
          };
        }),
    );
  return [...rows, ...textRows].map((row) => ({
    destination: String(row.destination ?? row.dst ?? row.network ?? row.key ?? '') || undefined,
    gateway: String(row.gateway ?? row.via ?? '') || undefined,
    interface: String(row.interface ?? row.dev ?? row.device ?? '') || undefined,
    protocol: String(row.protocol ?? row.proto ?? '') || undefined,
    metric:
      typeof row.metric === 'string' || typeof row.metric === 'number' ? row.metric : undefined,
  }));
}

function parseRule(line: string): FirewallRule | null {
  const tokens = line.trim().split(/\s+/);
  if (!tokens.length || !tokens[0].startsWith('-')) return null;
  const values: Record<string, string> = {};
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (tokens[i].startsWith('-')) values[tokens[i]] = tokens[i + 1];
  }
  return {
    chain: values['-A'] ?? values['-P'],
    target: values['-j'] ?? values['-g'],
    protocol: values['-p'],
    source: values['-s'],
    destination: values['-d'],
    ports: values['--dport'] ?? values['--dports'] ?? values['--sport'],
    raw: line,
  };
}

export function getFirewall(payloads: ReturnType<typeof networkPayloads>): {
  policies: JsonObject;
  rules: FirewallRule[];
} {
  const policies: JsonObject = {};
  const rules: FirewallRule[] = [];
  for (const payload of payloads) {
    const firewall = asObject(payload.firewall);
    for (const [key, value] of Object.entries(firewall))
      if (key.toLowerCase().includes('policy')) policies[key] = value;
    Object.assign(policies, asObject(firewall.policies));
    const directRules =
      firewall.rules ??
      payload.firewall_rules ??
      asObject(payload.iptables).rules ??
      payload.iptables ??
      payload.firewall;
    if (typeof directRules === 'string') {
      directRules
        .split(/\r?\n/)
        .map(parseRule)
        .filter((rule): rule is FirewallRule => rule !== null)
        .forEach((rule) => rules.push(rule));
      for (const line of directRules.split(/\r?\n/)) {
        const policy = line.trim().match(/^-P\s+(\S+)\s+(\S+)/);
        if (policy) policies[policy[1]] = policy[2];
      }
    } else {
      for (const row of objectRows(directRules))
        rules.push({
          chain: String(row.chain ?? row.Chain ?? '') || undefined,
          target: String(row.target ?? row.Target ?? row.action ?? '') || undefined,
          protocol: String(row.protocol ?? row.Protocol ?? '') || undefined,
          source: String(row.source ?? row.Source ?? '') || undefined,
          destination: String(row.destination ?? row.Destination ?? '') || undefined,
          ports: String(row.ports ?? row.port ?? row.destination_port ?? '') || undefined,
          raw: String(row.raw ?? row.rule ?? ''),
        });
    }
  }
  return { policies, rules };
}

export function getListeners(payloads: ReturnType<typeof networkPayloads>): JsonObject[] {
  return payloads.flatMap((payload) =>
    candidateRows(payload, ['listeners', 'listening_ports', 'sockets']),
  );
}

function resolverEntries(value: unknown): { name: string; value: string }[] {
  if (typeof value === 'string')
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [name, ...parts] = line.split(/\s+/);
        return { name, value: parts.join(' ') };
      });
  const object = asObject(value);
  return Object.entries(object).flatMap(([name, entry]) =>
    asArray(entry).length
      ? asArray(entry).map((value) => ({ name, value: String(value) }))
      : [{ name, value: String(entry ?? '') }],
  );
}

export function getDns(payloads: ReturnType<typeof networkPayloads>) {
  const nameservers: string[] = [];
  const searchDomains: string[] = [];
  const hosts: { ip: string; names: string }[] = [];
  for (const payload of payloads) {
    const dns = asObject(payload.dns);
    for (const entry of resolverEntries(
      payload.resolver ?? payload.resolv_conf ?? payload.dns_config ?? dns.resolver ?? dns,
    )) {
      if (entry.name === 'nameserver' || entry.name === 'nameservers')
        nameservers.push(entry.value);
      if (entry.name === 'search' || entry.name === 'domain' || entry.name === 'search_domains')
        searchDomains.push(...entry.value.split(/\s+/).filter(Boolean));
    }
    const hostsText = payload.hosts ?? payload.hosts_file ?? dns.hosts;
    if (typeof hostsText === 'string') {
      for (const line of hostsText.split(/\r?\n/)) {
        const content = line.split('#')[0].trim();
        if (!content) continue;
        const [ip, ...names] = content.split(/\s+/);
        if (ip && names.length) hosts.push({ ip, names: names.join(', ') });
      }
    } else {
      for (const row of objectRows(hostsText))
        hosts.push({ ip: String(row.ip ?? ''), names: String(row.names ?? row.hostname ?? '') });
    }
  }
  return {
    nameservers: [...new Set(nameservers)],
    searchDomains: [...new Set(searchDomains)],
    hosts,
  };
}

export function getDhcp(payloads: ReturnType<typeof networkPayloads>): JsonObject[] {
  return payloads.flatMap((payload) => {
    const server = payload.dhcp_server;
    const dhcp = asObject(payload.dhcp ?? payload.dhcp_server);
    const leases = candidateRows(payload, ['dhcp_leases', 'leases']);
    const leaseText =
      typeof payload.dhcp_leases === 'string'
        ? payload.dhcp_leases
        : typeof payload.leases === 'string'
          ? payload.leases
          : undefined;
    const parsedLeases =
      leaseText
        ?.split(/\r?\n/)
        .filter(Boolean)
        .map((line) => {
          const [expires, mac, ip, hostname] = line.trim().split(/\s+/);
          return { expires, mac, ip, hostname };
        }) ?? [];
    const rows = Object.keys(dhcp).length ? [dhcp] : [...leases, ...parsedLeases];
    return typeof server === 'string' ? [{ server }, ...rows] : rows;
  });
}

export function subnetFor(address: string): string | undefined {
  const [ip, prefixText] = address.split('/');
  const octets = ip.split('.').map(Number);
  const prefix = Number(prefixText);
  if (
    octets.length !== 4 ||
    octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255) ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 32
  )
    return undefined;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const number = octets.reduce((value, octet) => ((value << 8) | octet) >>> 0, 0);
  const subnet = (number & mask) >>> 0;
  return `${(subnet >>> 24) & 255}.${(subnet >>> 16) & 255}.${(subnet >>> 8) & 255}.${subnet & 255}/${prefix}`;
}
