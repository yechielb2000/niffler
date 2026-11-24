import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { lazy, Suspense, useMemo, useState } from 'react';

import { DataOverview } from './overview/DataOverview';
import { parseCollectedRecords, sortNewest, type CollectedRecord } from './types';

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
  const [query, setQuery] = useState('');
  const parsed = useMemo(() => parseCollectedRecords(data), [data]);
  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return parsed.records;
    return parsed.records.filter((record) =>
      JSON.stringify(record).toLowerCase().includes(normalized),
    );
  }, [parsed.records, query]);
  const buckets = useMemo(() => {
    const categorized: Record<string, CollectedRecord[]> = Object.fromEntries(
      CATEGORIES.map((item) => [item.id, []]),
    );
    const latestByType = new Map<string, CollectedRecord>();
    for (const record of sortNewest(filteredRecords)) {
      const type = record.data_type.toLowerCase();
      if (!latestByType.has(type)) latestByType.set(type, record);
    }
    for (const record of filteredRecords) {
      const bucket = categoryFor(record.data_type);
      if (bucket === 'overview' || bucket === 'location') categorized[bucket].push(record);
    }
    for (const record of latestByType.values()) {
      const bucket = categoryFor(record.data_type);
      if (bucket !== 'overview' && bucket !== 'location') categorized[bucket].push(record);
    }
    return categorized;
  }, [filteredRecords]);
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="h6">Agent telemetry</Typography>
        <TextField
          size="small"
          fullWidth
          label="Search collected data"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ maxWidth: { sm: 360 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Clear data search"
                  onClick={() => setQuery('')}
                  edge="end"
                >
                  <ClearOutlinedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      </Box>
      {parsed.invalid ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {parsed.invalid} record(s) did not match the collected-data envelope and were skipped.
        </Alert>
      ) : null}
      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: { xs: 1.5, md: 2.5 } }}>
        <Tabs
          orientation="vertical"
          value={category}
          onChange={(_, value) => setCategory(value)}
          sx={{
            flexShrink: 0,
            width: { xs: 132, sm: 164, md: 188 },
            borderRight: 1,
            borderColor: 'divider',
            '& .MuiTabs-indicator': { left: 0, width: 2, height: 'auto', borderRadius: 0 },
            '& .MuiTab-root': {
              alignItems: 'flex-start',
              textAlign: 'left',
              minHeight: 40,
              px: 1.5,
              py: 1,
              mr: 0.5,
              borderRadius: 1,
              '&.Mui-selected': {
                color: 'primary.main',
                backgroundColor: 'action.selected',
              },
            },
          }}
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {category === 'overview' ? (
            <DataOverview records={filteredRecords} hostname={hostname} />
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
      </Box>
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
