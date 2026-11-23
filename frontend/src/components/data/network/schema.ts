import { z } from 'zod';

export const NetworkPayloadSchema = z
  .object({
    interfaces: z.array(z.unknown()).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    ip_list: z.array(z.unknown()).optional(),
    neighbors: z.unknown().optional(),
    arp: z.unknown().optional(),
    arp_table: z.unknown().optional(),
    routes: z.unknown().optional(),
    sockets: z.unknown().optional(),
    listeners: z.unknown().optional(),
    listening_ports: z.unknown().optional(),
    firewall: z.unknown().optional(),
    firewall_rules: z.unknown().optional(),
    iptables: z.unknown().optional(),
    dns: z.unknown().optional(),
    dhcp: z.unknown().optional(),
    dhcp_server: z.unknown().optional(),
    dhcp_leases: z.unknown().optional(),
    resolver: z.unknown().optional(),
    resolv_conf: z.unknown().optional(),
    dns_config: z.unknown().optional(),
    hosts: z.unknown().optional(),
    hosts_file: z.unknown().optional(),
    topology: z.unknown().optional(),
  })
  .passthrough();

export type NetworkPayload = z.infer<typeof NetworkPayloadSchema>;

export interface NetworkInterface {
  name: string;
  state?: string;
  mac?: string;
  mtu?: string | number;
  addresses: string[];
  raw: Record<string, unknown>;
}

export interface NetworkNode {
  ip: string;
  hostname?: string;
  mac?: string;
  interface?: string;
  state?: string;
  kind?: string;
}

export interface NetworkRoute {
  destination?: string;
  gateway?: string;
  interface?: string;
  protocol?: string;
  metric?: string | number;
}

export interface FirewallRule {
  chain?: string;
  target?: string;
  protocol?: string;
  source?: string;
  destination?: string;
  ports?: string;
  raw: string;
}
