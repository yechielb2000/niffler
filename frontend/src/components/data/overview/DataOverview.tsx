import { Box, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import type { CollectedRecord, JsonObject } from '../types';
import { asArray, asObject, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';

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
          value={firstValue(info.hostname, hostname) ?? 'Not reported'}
          detail={firstValue(info.distribution, info.os) ?? 'Operating system not reported'}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Machine IP"
          value={addresses.length ? addresses.join(', ') : 'Not reported'}
          detail={networkInterfaceNames(network).join(', ') || 'Interfaces not reported'}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Host time"
          value={localTime ?? 'Not reported'}
          detail={`Timezone: ${display(timezone)}`}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Country / region"
          value={country ?? 'Not reported'}
          detail="Shown only when present in collected telemetry"
        />
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="CPU usage"
          value={cpuPercent == null ? 'Not reported' : `${cpuPercent}%`}
          detail={`${display(cpu.cores)} cores · ${display(cpu.model)}`}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Memory usage"
          value={memoryPercent == null ? 'Not reported' : `${memoryPercent}%`}
          detail={`${display(memory.used_gb)} / ${display(memory.total_gb)} GB`}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Uptime"
          value={display(asObject(current.uptime).human)}
          detail={`Kernel: ${display(info.kernel)}`}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Last telemetry"
          value={formatTimestamp(capturedAt)}
          detail="Capture timestamp from the latest telemetry snapshot"
        />
      </Grid>

      <Grid item xs={12} md={4}>
        <DataPanel title="Load average" subtitle="Reported host load">
          <Stack direction="row" spacing={1}>
            {loadValues.map(([label, value]) => (
              <MetricCard key={label} label={label} value={display(value)} />
            ))}
          </Stack>
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={4}>
        <DataPanel title="CPU history" subtitle="Recent system snapshots">
          <TelemetryTrend records={systemHistory} field="cpu" valueKey="usage_percent" />
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={4}>
        <DataPanel title="Memory history" subtitle="Recent system snapshots">
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
  const values = records
    .slice(0, 12)
    .reverse()
    .map((record) => numberValue(asObject(record[field])[valueKey]))
    .filter((value): value is number => value !== null);
  if (!values.length) return <EmptyData>No history reported.</EmptyData>;
  if (values.length === 1)
    return (
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {values[0]}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={clamp(values[0])}
          sx={{ mt: 1, height: 8, borderRadius: 8 }}
        />
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
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.split(' ').map((point, index) => {
          const [cx, cy] = point.split(',');
          return <circle key={index} cx={cx} cy={cy} r="3.5" fill="#38bdf8" />;
        })}
      </svg>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption" color="text.secondary">
          {values[0]}%
        </Typography>
        <Typography variant="caption" fontWeight={700}>
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
  const addresses = Object.values(interfaces).flatMap((value) => {
    const info = asObject(value);
    return toStringArray(info.addresses ?? info.address ?? info.ip_addresses);
  });
  return [
    ...new Set(
      [...addresses, ...toStringArray(payload.ip_list)].filter(
        (address) => !address.startsWith('127.') && !address.startsWith('::1'),
      ),
    ),
  ].slice(0, 4);
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

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return 'Not reported';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
  if (value === null || value === undefined || value === '') return 'Not reported';
  if (typeof value === 'object') {
    const object = asObject(value);
    return display(object.name ?? object.timezone ?? object.offset ?? object.value);
  }
  return String(value);
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}
