import {
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';

import type { CollectedRecord, JsonObject } from '../types';
import { asObject, displayValue } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';
import {
  getDhcp,
  getDns,
  getFirewall,
  getInterfaces,
  getListeners,
  getNeighbors,
  getRoutes,
  networkPayloads,
} from './normalize';
import { NetworkTopology } from './NetworkTopology';

export function NetworkDashboard({
  records,
  hostname,
}: {
  records: CollectedRecord[];
  hostname?: string;
}) {
  const payloads = useMemo(() => networkPayloads(records), [records]);
  const interfaces = useMemo(() => getInterfaces(payloads), [payloads]);
  const neighbors = useMemo(() => getNeighbors(payloads), [payloads]);
  const routes = useMemo(() => getRoutes(payloads), [payloads]);
  const firewall = useMemo(() => getFirewall(payloads), [payloads]);
  const listeners = useMemo(() => getListeners(payloads), [payloads]);
  const dns = useMemo(() => getDns(payloads), [payloads]);
  const dhcp = useMemo(() => getDhcp(payloads), [payloads]);
  const ips = [...new Set(interfaces.flatMap((item) => item.addresses))];
  const switchName = payloads
    .map((item) => asObject(item.topology).switch_name ?? asObject(item.topology).switch)
    .find((value) => typeof value === 'string') as string | undefined;

  if (!records.length)
    return <EmptyData>No network snapshots have been collected for this system.</EmptyData>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Interfaces"
          value={interfaces.length}
          detail={`${interfaces.filter((item) => item.state?.toLowerCase() === 'up').length} reported up`}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="IP addresses"
          value={ips.length}
          detail={ips.slice(0, 2).join(' · ') || 'No addresses reported'}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Adjacent nodes"
          value={neighbors.length}
          detail="From neighbor or topology records"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Routes / listeners"
          value={`${routes.length} / ${listeners.length}`}
          detail={`${firewall.rules.length} firewall rules`}
        />
      </Grid>

      <Grid item xs={12}>
        <NetworkTopology
          hostname={hostname}
          interfaces={interfaces}
          neighbors={neighbors}
          routes={routes}
          switchName={switchName}
        />
      </Grid>

      <Grid item xs={12}>
        <DataPanel
          title="Network interfaces"
          subtitle="Addresses, link state, hardware address, and MTU"
        >
          {interfaces.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Interface</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>IP / CIDR</TableCell>
                  <TableCell>MAC</TableCell>
                  <TableCell>MTU</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interfaces.map((iface, index) => (
                  <TableRow key={`${iface.name}-${index}`}>
                    <TableCell>{iface.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={iface.state || 'Unknown'}
                        color={iface.state?.toLowerCase() === 'up' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{iface.addresses.join(', ') || '—'}</TableCell>
                    <TableCell>{iface.mac || '—'}</TableCell>
                    <TableCell>{iface.mtu ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>Interface details were not included in these records.</EmptyData>
          )}
        </DataPanel>
      </Grid>

      <Grid item xs={12} lg={6}>
        <DataPanel
          title="ARP / neighbor table"
          subtitle="Known layer-2 neighbors and their reported reachability"
        >
          {neighbors.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>IP address</TableCell>
                  <TableCell>Hostname</TableCell>
                  <TableCell>MAC address</TableCell>
                  <TableCell>Interface</TableCell>
                  <TableCell>State</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {neighbors.map((node, index) => (
                  <TableRow key={`${node.ip}-${index}`}>
                    <TableCell>{node.ip}</TableCell>
                    <TableCell>{node.hostname || '—'}</TableCell>
                    <TableCell>{node.mac || '—'}</TableCell>
                    <TableCell>{node.interface || '—'}</TableCell>
                    <TableCell>{node.state || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No ARP or neighbor entries were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
      <Grid item xs={12} lg={6}>
        <DataPanel title="Routing table" subtitle="Destination, next hop, and egress interface">
          {routes.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Destination</TableCell>
                  <TableCell>Gateway</TableCell>
                  <TableCell>Interface</TableCell>
                  <TableCell>Metric</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routes.map((route, index) => (
                  <TableRow key={`${route.destination}-${index}`}>
                    <TableCell>{route.destination || '—'}</TableCell>
                    <TableCell>{route.gateway || '—'}</TableCell>
                    <TableCell>{route.interface || '—'}</TableCell>
                    <TableCell>{route.metric ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No route records were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>

      <Grid item xs={12}>
        <DataPanel
          title="Firewall rules · iptables"
          subtitle="Default chain policies and observed packet rules"
        >
          {firewall.rules.length || Object.keys(firewall.policies).length ? (
            <>
              {Object.keys(firewall.policies).length ? (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Policies:{' '}
                  {Object.entries(firewall.policies)
                    .map(([chain, policy]) => `${chain}: ${displayValue(policy)}`)
                    .join(' · ')}
                </Typography>
              ) : null}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Chain</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Protocol</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Port</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {firewall.rules.map((rule, index) => (
                    <TableRow key={`${rule.chain}-${index}`}>
                      <TableCell>{rule.chain || '—'}</TableCell>
                      <TableCell>{rule.target || '—'}</TableCell>
                      <TableCell>{rule.protocol || '—'}</TableCell>
                      <TableCell>{rule.source || '—'}</TableCell>
                      <TableCell>{rule.destination || '—'}</TableCell>
                      <TableCell>{rule.ports || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <EmptyData>No firewall or iptables rules were included in these records.</EmptyData>
          )}
        </DataPanel>
      </Grid>

      <Grid item xs={12}>
        <DataPanel
          title="Listening ports and sockets"
          subtitle="Locally reported protocol, bind address, process, and state"
        >
          {listeners.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Local address</TableCell>
                  <TableCell>Port</TableCell>
                  <TableCell>Process</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Remote endpoint</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {listeners.map((item, index) => (
                  <TableRow key={`${item.local_address ?? item.address}-${index}`}>
                    <TableCell>{displayValue(item.protocol ?? item.proto)}</TableCell>
                    <TableCell>
                      {displayValue(item.local_address ?? item.address ?? item.local_addr)}
                    </TableCell>
                    <TableCell>{displayValue(item.port ?? item.local_port)}</TableCell>
                    <TableCell>{displayValue(item.process ?? item.program ?? item.name)}</TableCell>
                    <TableCell>{displayValue(item.state)}</TableCell>
                    <TableCell>
                      {displayValue(item.remote_address ?? item.peer ?? item.foreign_address)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No listening-port or socket records were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>

      <Grid item xs={12} md={6}>
        <DataPanel
          title="DNS configuration"
          subtitle="Resolver nameservers, search domains, and hosts entries"
        >
          {dns.nameservers.length || dns.searchDomains.length || dns.hosts.length ? (
            <>
              <Typography variant="body2">
                <strong>Nameservers:</strong> {dns.nameservers.join(', ') || '—'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Search domains:</strong> {dns.searchDomains.join(', ') || '—'}
              </Typography>
              {dns.hosts.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Address</TableCell>
                      <TableCell>Names</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dns.hosts.map((entry, index) => (
                      <TableRow key={`${entry.ip}-${index}`}>
                        <TableCell>{entry.ip}</TableCell>
                        <TableCell>{entry.names}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </>
          ) : (
            <EmptyData>No DNS resolver or hosts data was reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={6}>
        <DataPanel
          title="DHCP lease details"
          subtitle="Lease source, gateway, DNS, and lease period when available"
        >
          {dhcp.length ? (
            <DhcpDetails rows={dhcp} />
          ) : (
            <EmptyData>No DHCP server or lease details were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
      {!payloads.length ? (
        <Grid item xs={12}>
          <Typography color="warning.main">
            Network records exist, but their payloads do not match a recognized network shape.
          </Typography>
        </Grid>
      ) : null}
    </Grid>
  );
}

function DhcpDetails({ rows }: { rows: JsonObject[] }) {
  const items = rows.flatMap((row, index) => {
    const lease = asObject(row.lease);
    const source = Object.keys(lease).length ? lease : row;
    const label = String(
      source.hostname ?? source.client_hostname ?? source.ip ?? `Lease ${index + 1}`,
    );
    const details = Object.entries(source).filter(
      ([, value]) => value !== null && (typeof value !== 'object' || Array.isArray(value)),
    );
    return [{ label, details }];
  });
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Lease</TableCell>
          <TableCell>Attribute</TableCell>
          <TableCell>Value</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.flatMap((item, index) =>
          item.details.map(([key, value]) => (
            <TableRow key={`${index}-${key}`}>
              <TableCell>{item.label}</TableCell>
              <TableCell>{key.replace(/_/g, ' ')}</TableCell>
              <TableCell>{displayValue(value)}</TableCell>
            </TableRow>
          )),
        )}
      </TableBody>
    </Table>
  );
}
