import { Alert, Box, Chip, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { lazy, Suspense, useMemo, useState } from 'react';

import { DataOverview } from './overview/DataOverview';
import { parseCollectedRecords, type CollectedRecord } from './types';

const AccountsDashboard = lazy(() =>
  import('./accounts/AccountsDashboard').then((module) => ({ default: module.AccountsDashboard })),
);
const ConfigDashboard = lazy(() =>
  import('./config/ConfigDashboard').then((module) => ({ default: module.ConfigDashboard })),
);
const DevicesDashboard = lazy(() =>
  import('./devices/DevicesDashboard').then((module) => ({ default: module.DevicesDashboard })),
);
const EnvironmentDashboard = lazy(() =>
  import('./environment/EnvironmentDashboard').then((module) => ({
    default: module.EnvironmentDashboard,
  })),
);
const FilesystemDashboard = lazy(() =>
  import('./filesystem/FilesystemDashboard').then((module) => ({
    default: module.FilesystemDashboard,
  })),
);
const NetworkDashboard = lazy(() =>
  import('./network/NetworkDashboard').then((module) => ({ default: module.NetworkDashboard })),
);
const LocationDashboard = lazy(() =>
  import('./location/LocationDashboard').then((module) => ({ default: module.LocationDashboard })),
);
const OtherDataDashboard = lazy(() =>
  import('./other/OtherDataDashboard').then((module) => ({ default: module.OtherDataDashboard })),
);
const PackagesDashboard = lazy(() =>
  import('./packages/PackagesDashboard').then((module) => ({ default: module.PackagesDashboard })),
);
const ProcessesDashboard = lazy(() =>
  import('./processes/ProcessesDashboard').then((module) => ({
    default: module.ProcessesDashboard,
  })),
);
const ServicesDashboard = lazy(() =>
  import('./services/ServicesDashboard').then((module) => ({ default: module.ServicesDashboard })),
);
const SystemDashboard = lazy(() =>
  import('./system/SystemDashboard').then((module) => ({ default: module.SystemDashboard })),
);

const CATEGORIES = [
  { id: 'overview', label: 'Overview' },
  { id: 'network', label: 'Network' },
  { id: 'packages', label: 'Packages' },
  { id: 'config', label: 'Configuration' },
  { id: 'system', label: 'System' },
  { id: 'processes', label: 'Processes' },
  { id: 'services', label: 'Services' },
  { id: 'devices', label: 'Devices' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'filesystem', label: 'Filesystem' },
  { id: 'environment', label: 'Environment' },
  { id: 'location', label: 'Location' },
  { id: 'other', label: 'Other' },
];

export function DataExplorer({ data, hostname }: { data: unknown[]; hostname?: string }) {
  const [category, setCategory] = useState('overview');
  const parsed = useMemo(() => parseCollectedRecords(data), [data]);
  const buckets = useMemo(() => {
    const categorized: Record<string, CollectedRecord[]> = Object.fromEntries(
      CATEGORIES.map((item) => [item.id, []]),
    );
    for (const record of parsed.records) categorized[categoryFor(record.data_type)].push(record);
    return categorized;
  }, [parsed.records]);
  const telemetryCount = parsed.records.filter((record) => {
    const type = record.data_type.toLowerCase();
    return (
      type.startsWith('system') ||
      type.startsWith('network') ||
      type.startsWith('process') ||
      type.startsWith('service')
    );
  }).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="h6">Agent telemetry</Typography>
        <Chip size="small" variant="outlined" label={`${telemetryCount} telemetry snapshots`} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Structured system records presented as focused inventory views. Fields that were not
        collected are identified explicitly.
      </Typography>
      {parsed.invalid ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {parsed.invalid} record(s) did not match the collected-data envelope and were skipped.
        </Alert>
      ) : null}
      <Tabs
        value={category}
        onChange={(_, value) => setCategory(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        {CATEGORIES.map((item) => (
          <Tab
            key={item.id}
            value={item.id}
            label={
              item.id === 'overview' ? item.label : `${item.label} (${buckets[item.id].length})`
            }
          />
        ))}
      </Tabs>
      {category === 'overview' ? (
        <DataOverview records={parsed.records} hostname={hostname} />
      ) : null}
      {category === 'network' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <NetworkDashboard records={buckets.network} hostname={hostname} />
        </Suspense>
      ) : null}
      {category === 'packages' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <PackagesDashboard records={buckets.packages} />
        </Suspense>
      ) : null}
      {category === 'config' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <ConfigDashboard records={buckets.config} />
        </Suspense>
      ) : null}
      {category === 'system' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <SystemDashboard records={buckets.system} />
        </Suspense>
      ) : null}
      {category === 'processes' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <ProcessesDashboard records={buckets.processes} />
        </Suspense>
      ) : null}
      {category === 'services' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <ServicesDashboard records={buckets.services} />
        </Suspense>
      ) : null}
      {category === 'devices' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <DevicesDashboard records={buckets.devices} />
        </Suspense>
      ) : null}
      {category === 'accounts' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <AccountsDashboard records={buckets.accounts} />
        </Suspense>
      ) : null}
      {category === 'filesystem' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <FilesystemDashboard records={buckets.filesystem} />
        </Suspense>
      ) : null}
      {category === 'environment' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <EnvironmentDashboard records={buckets.environment} />
        </Suspense>
      ) : null}
      {category === 'location' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <LocationDashboard records={buckets.location} />
        </Suspense>
      ) : null}
      {category === 'other' ? (
        <Suspense fallback={<CircularProgress size={24} />}>
          <OtherDataDashboard records={buckets.other} />
        </Suspense>
      ) : null}
    </Box>
  );
}

function categoryFor(type: string): string {
  const normalized = type.toLowerCase().replace(/[_ ]/g, '-');
  if (
    normalized.startsWith('network') ||
    [
      'dns',
      'arp',
      'dhcp',
      'iptables',
      'firewall',
      'routes',
      'route-table',
      'interfaces',
      'network-interface',
    ].includes(normalized)
  )
    return 'network';
  if (['package', 'packages', 'software'].some((name) => normalized.startsWith(name)))
    return 'packages';
  if (normalized.includes('config')) return 'config';
  if (normalized.startsWith('system')) return 'system';
  if (normalized.startsWith('process')) return 'processes';
  if (normalized.startsWith('service')) return 'services';
  if (normalized.startsWith('device')) return 'devices';
  if (['user', 'users', 'account', 'accounts'].some((name) => normalized.startsWith(name)))
    return 'accounts';
  if (normalized.startsWith('filesystem') || normalized.startsWith('file-system'))
    return 'filesystem';
  if (normalized.startsWith('environment')) return 'environment';
  if (normalized.startsWith('location')) return 'location';
  return 'other';
}
