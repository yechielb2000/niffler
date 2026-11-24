import { Box, Divider, Grid, LinearProgress, Stack, Typography, useTheme } from '@mui/material';
import type { CollectedRecord, JsonObject } from '../types';
import { asArray, asObject, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';
import { formatDateTime } from '../../../utils/datetime';

export function DataOverview({
  records,
  hostname,
}: {
  records: CollectedRecord[];
  hostname?: string;
}) {
  const systemRecords = sortNewest(
    records.filter((record) => record.data_type.toLowerCase().startsWith('system')),
  );
  const systemHistory = systemRecords.map((record) => recordPayload(record));
  const current = systemHistory[0] ?? {};
  const info = asObject(current.info);
  const cpu = asObject(current.cpu);
  const memory = asObject(current.memory);
  const load = asObject(current.load);
  const network = latestPayload(
    records,
    (record) =>
      record.data_type.toLowerCase().startsWith('network') && hasNetworkInfo(recordPayload(record)),
  );
  const addresses = networkAddresses(network);
  const location = latestPayload(records, (record) =>
    record.data_type.toLowerCase().startsWith('location'),
  );
  const timeInfo = asObject(current.time ?? info.time);
  const localTime = firstValue(
    current.local_time,
    current.system_time,
    info.local_time,
    info.system_time,
    info.current_time,
    timeInfo.local_time,
    timeInfo.local,
    timeInfo.current,
  );
  const timezone = firstValue(
    current.timezone,
    info.timezone,
    info.tz,
    timeInfo.timezone,
    timeInfo.zone,
  );
  const locationDetails = asObject(asObject(location).location);
  const country = firstValue(
    current.country,
    info.country,
    asObject(current.location).country,
    asObject(location).country,
    asObject(location).country_name,
    asObject(location).country_code,
    locationDetails.country,
    locationDetails.country_name,
    locationDetails.country_code,
  );
  const telemetryRecords = sortNewest(records.filter(isTelemetryRecord));
  if (!telemetryRecords.length)
    return <EmptyData>No telemetry has been collected for this system yet.</EmptyData>;
  const capturedAt = telemetryRecords[0]?.collected_at;
  const cpuPercent = numberValue(cpu.usage_percent);
  const memoryPercent = numberValue(memory.usage_percent);
  const interfaces = networkInterfaceNames(network);
  const primaryAddress = addresses[0] ?? null;
  const extraAddresses = addresses.slice(1);
  const addressDetail =
    detailText(
      extraAddresses.length ? `+${extraAddresses.length} more` : null,
      interfaces.length ? `${interfaces.length} interfaces` : null,
    ) || 'No address details reported';
  const usedMemory = numberValue(memory.used_gb);
  const totalMemory = numberValue(memory.total_gb);
  const loadValues = [
    ['1 minute', load.one_minute],
    ['5 minutes', load.five_minutes],
    ['15 minutes', load.fifteen_minutes],
  ] as const;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Hostname"
          value={firstValue(info.hostname, hostname) ?? '—'}
          detail={firstValue(info.distribution, info.os) ?? 'Operating system not reported'}
          mono
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Machine IP"
          value={primaryAddress ?? '—'}
          detail={addressDetail}
          title={addresses.length ? `Addresses: ${addresses.join(' · ')}` : undefined}
          mono
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Host time"
          value={localTime ?? '—'}
          detail={timezone ? `Timezone · ${display(timezone)}` : 'Timezone not reported'}
          mono={localTime != null}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Country / region"
          value={country ?? '—'}
          detail={country ? 'Reported location' : 'Not in this snapshot'}
        />
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="CPU usage"
          value={cpuPercent == null ? '—' : `${cpuPercent}%`}
          detail={
            detailText(
              valueText(cpu.cores) ? `${display(cpu.cores)} cores` : null,
              valueText(cpu.model),
            ) || 'Core details not reported'
          }
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Memory usage"
          value={memoryPercent == null ? '—' : `${memoryPercent}%`}
          detail={
            usedMemory != null && totalMemory != null
              ? `${usedMemory} / ${totalMemory} GB in use`
              : 'Capacity not reported'
          }
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Uptime"
          value={firstValue(asObject(current.uptime).human) ?? '—'}
          detail={valueText(info.kernel) ? `Kernel ${display(info.kernel)}` : 'Kernel not reported'}
          mono
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Last telemetry"
          value={formatDateTime(capturedAt)}
          detail="Latest collected snapshot"
          mono
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <DataPanel title="Load average" subtitle="Reported host load">
          <Stack
            direction="row"
            spacing={2}
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ pt: 0.25 }}
          >
            {loadValues.map(([label, value]) => (
              <Box key={label} sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: '.08em' }}
                >
                  {label}
                </Typography>
                <Typography variant="h5" sx={{ mt: 0.25, fontSize: 20, fontWeight: 600 }}>
                  {display(value)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={4}>
        <DataPanel title="CPU history" subtitle="Last 12 snapshots">
          <TelemetryTrend records={systemHistory} field="cpu" valueKey="usage_percent" />
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={4}>
        <DataPanel title="Memory history" subtitle="Last 12 snapshots">
          <TelemetryTrend records={systemHistory} field="memory" valueKey="usage_percent" />
        </DataPanel>
      </Grid>
    </Grid>
  );
}

function TelemetryTrend({
  records,
  field,
  valueKey,
}: {
  records: JsonObject[];
  field: string;
  valueKey: string;
}) {
  const theme = useTheme();
  const values = records
    .slice(0, 12)
    .reverse()
    .map((record) => numberValue(asObject(record[field])[valueKey]))
    .filter((value): value is number => value !== null);
  if (!values.length) return <EmptyData>No history reported.</EmptyData>;
  if (values.length === 1)
    return (
      <Box>
        <Typography variant="h5" sx={{ fontSize: 20, fontWeight: 600 }}>
          {values[0]}%
        </Typography>
        <LinearProgress variant="determinate" value={clamp(values[0])} sx={{ mt: 1 }} />
        <Typography variant="caption" color="text.secondary">
          One snapshot available
        </Typography>
      </Box>
    );

  const points = values
    .map(
      (value, index) => `${12 + index * (276 / (values.length - 1))},${86 - clamp(value) * 0.68}`,
    )
    .join(' ');
  return (
    <Box>
      <svg
        viewBox="0 0 300 100"
        width="100%"
        role="img"
        aria-label={`${field} usage history from ${values.length} snapshots`}
      >
        {[20, 50, 80].map((y) => (
          <line key={y} x1="8" x2="292" y1={y} y2={y} stroke="currentColor" opacity="0.12" />
        ))}
        <polyline
          points={points}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.split(' ').map((point, index) => {
          const [cx, cy] = point.split(',');
          return (
            <circle key={index} cx={cx} cy={cy} r="3.5" fill={theme.palette.primary.main}>
              <title>{values[index]}% usage</title>
            </circle>
          );
        })}
      </svg>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {values[0]}%
        </Typography>
        <Typography variant="caption" fontWeight={600}>
          {values[values.length - 1]}%
        </Typography>
      </Stack>
    </Box>
  );
}

function latestPayload(
  records: CollectedRecord[],
  predicate: (record: CollectedRecord) => boolean,
): JsonObject {
  const record = sortNewest(records.filter(predicate))[0];
  return record ? recordPayload(record) : {};
}

function hasNetworkInfo(payload: JsonObject): boolean {
  return Boolean(payload.details || payload.interfaces || payload.ip_list);
}

function networkAddresses(payload: JsonObject): string[] {
  const interfaces = asObject(payload.details);
  const fromInterfaces = Object.values(interfaces).flatMap((value) => {
    const info = asObject(value);
    return toStringArray(info.addresses ?? info.address ?? info.ip_addresses);
  });
  const seen = new Set<string>();
  return [...fromInterfaces, ...toStringArray(payload.ip_list)]
    .filter((address) => {
      const base = address.split('/')[0].trim().toLowerCase();
      if (!base || base.startsWith('127.') || base === '::1' || seen.has(base)) return false;
      seen.add(base);
      return true;
    })
    .slice(0, 4);
}

function networkInterfaceNames(payload: JsonObject): string[] {
  const details = Object.keys(asObject(payload.details));
  const interfaces = asArray(payload.interfaces)
    .map((value) => (typeof value === 'string' ? value : String(asObject(value).name ?? '')))
    .filter(Boolean);
  return [...new Set([...details, ...interfaces])];
}

function isTelemetryRecord(record: CollectedRecord): boolean {
  const type = record.data_type.toLowerCase();
  return (
    type.startsWith('system') ||
    type.startsWith('network') ||
    type.startsWith('process') ||
    type.startsWith('service')
  );
}

function detailText(...parts: Array<string | null | undefined>): string {
  return parts.filter((part): part is string => Boolean(part)).join(' · ');
}

function valueText(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  return display(value);
}

function toStringArray(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  return asArray(value)
    .map((item) => (typeof item === 'string' ? item : String(asObject(item).address ?? '')))
    .filter(Boolean);
}

function numberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstValue(...values: unknown[]): string | null {
  const value = values.find((item) => item !== null && item !== undefined && item !== '');
  return value === undefined ? null : display(value);
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') {
    const object = asObject(value);
    return display(object.name ?? object.timezone ?? object.offset ?? object.value);
  }
  return String(value);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
