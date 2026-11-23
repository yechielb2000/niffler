import { Grid, LinearProgress, Stack, Typography } from '@mui/material';

import type { CollectedRecord } from '../types';
import { recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';
import { SystemPayloadSchema } from './schema';

export function SystemDashboard({ records }: { records: CollectedRecord[] }) {
  const latest = sortNewest(records)
    .map((record) => SystemPayloadSchema.safeParse(recordPayload(record)))
    .find((result) => result.success)?.data;
  if (!latest) return <EmptyData>No system overview has been collected for this system.</EmptyData>;

  const info = latest.info ?? {};
  const cpu = latest.cpu ?? {};
  const memory = latest.memory ?? {};
  const load = latest.load ?? {};
  const cpuPercent = numeric(cpu.usage_percent);
  const memoryPercent = numeric(memory.usage_percent);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Operating system"
          value={text(info.distribution, 'Not reported')}
          detail={[info.kernel, info.architecture]
            .map((value) => (value == null ? '' : String(value)))
            .filter(Boolean)
            .join(' · ')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Processor"
          value={`${text(cpu.cores, '—')} cores`}
          detail={`${text(cpu.model, 'Model not reported')} · ${text(cpu.threads, '—')} threads`}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Memory"
          value={`${text(memory.used_gb, '—')} / ${text(memory.total_gb, '—')} GB`}
          detail={`${memoryPercent ?? '—'}% used`}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <MetricCard
          label="Uptime"
          value={text(latest.uptime?.human, 'Not reported')}
          detail={`Hostname: ${text(info.hostname, '—')}`}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <DataPanel title="Resource utilization">
          <Stack spacing={2}>
            <Progress label="CPU" value={cpuPercent} detail={`${cpuPercent ?? '—'}%`} />
            <Progress
              label="Memory"
              value={memoryPercent}
              detail={`${text(memory.used_gb, '—')} of ${text(memory.total_gb, '—')} GB`}
            />
          </Stack>
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={6}>
        <DataPanel title="Load average" subtitle="1, 5, and 15 minute samples">
          <Stack direction="row" spacing={2}>
            {[
              ['1 min', load.one_minute],
              ['5 min', load.five_minutes],
              ['15 min', load.fifteen_minutes],
            ].map(([label, value]) => (
              <MetricCard key={String(label)} label={String(label)} value={text(value, '—')} />
            ))}
          </Stack>
        </DataPanel>
      </Grid>
    </Grid>
  );
}

function Progress({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | undefined;
  detail: string;
}) {
  return (
    <div>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="caption" color="text.secondary">
          {detail}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, value ?? 0))}
        sx={{ mt: 0.75, height: 8, borderRadius: 8 }}
      />
    </div>
  );
}

function numeric(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function text(value: unknown, fallback: string): string {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}
