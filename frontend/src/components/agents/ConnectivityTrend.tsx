import { Box, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useMemo } from 'react';

import type { ConnectionAttempt } from '../../api';
import type { CollectedRecord } from '../data/types';
import { formatDateTime, formatDuration } from '../../utils/datetime';

const DAY = 24 * 60 * 60 * 1000;
const SESSION_GAP = 2 * DAY;
const CLUSTER_GAP = 36 * 60 * 60 * 1000;

interface CollectionEvent {
  time: number;
  types: string[];
  count: number;
  lane: number;
}

interface ConnectivityWindow {
  start: number;
  end: number;
  collections: number;
}

interface FailedConnection {
  time: number;
  reason: string;
}

interface Timeline {
  events: CollectionEvent[];
  windows: ConnectivityWindow[];
  failures: FailedConnection[];
  types: string[];
  start: number;
  end: number;
}

export function ConnectivityTrend({
  records,
  connected,
  attempts,
}: {
  records: CollectedRecord[];
  connected: boolean;
  attempts: ConnectionAttempt[];
}) {
  const theme = useTheme();
  const timeline = useMemo(
    () => buildTimeline(records, connected, attempts),
    [records, connected, attempts],
  );

  if (!timeline) {
    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2">Connectivity trend</Typography>
        <Typography variant="caption" color="text.secondary">
          No connectivity history is available for this system yet.
        </Typography>
      </Paper>
    );
  }

  const palette = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
  ];
  const colorFor = (type: string) => palette[timeline.types.indexOf(type) % palette.length];
  const toPercent = (time: number) =>
    ((time - timeline.start) / (timeline.end - timeline.start)) * 100;
  const clampedLeft = (percent: number, radiusPx: number) =>
    `clamp(${radiusPx}px, ${percent}%, calc(100% - ${radiusPx}px))`;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="subtitle2">Connectivity trend</Typography>
          <Typography variant="caption" color="text.secondary">
            Collection windows inferred from snapshot timestamps across the recorded period
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 14,
                height: 10,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.success.main, 0.22),
                border: `1px solid ${theme.palette.success.main}`,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Connected
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Data collected
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 14,
                height: 10,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.error.main, 0.2),
                border: `1px solid ${theme.palette.error.main}`,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Failed connection
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {connected ? 'Live session active' : 'No live session'}
          </Typography>
        </Stack>
      </Stack>

      <Box
        role="img"
        aria-label={`Connectivity trend with ${timeline.windows.length} connected windows, ${timeline.failures.length} failed connections and ${timeline.events.length} collection events`}
        sx={{ position: 'relative', height: 136, mx: 1, overflow: 'hidden' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <Box key={fraction}>
            <Box
              sx={{
                position: 'absolute',
                left: `${fraction * 100}%`,
                top: 0,
                bottom: 24,
                borderLeft: '1px dashed',
                borderColor: 'divider',
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                position: 'absolute',
                left: `${fraction * 100}%`,
                bottom: 2,
                transform:
                  fraction === 0
                    ? 'none'
                    : fraction === 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatDate(timeline.start + fraction * (timeline.end - timeline.start))}
            </Typography>
          </Box>
        ))}

        {timeline.windows.map((window, index) => (
          <Tooltip
            key={`${window.start}-${index}`}
            title={`Connected window · ${formatDuration(window.end - window.start)} · ${window.collections} collection${window.collections === 1 ? '' : 's'}`}
          >
            <Box
              sx={{
                position: 'absolute',
                left: `${toPercent(window.start)}%`,
                width: `${Math.max(toPercent(window.end) - toPercent(window.start), 1)}%`,
                top: 14,
                bottom: 32,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.success.main, 0.18),
                border: `1px solid ${alpha(theme.palette.success.main, 0.5)}`,
              }}
            />
          </Tooltip>
        ))}

        {timeline.failures.map((failure, index) => (
          <Tooltip
            key={`${failure.time}-${index}`}
            placement="top"
            title={
              <Box sx={{ py: 0.5, maxWidth: 260 }}>
                <Typography variant="caption" fontWeight={700} display="block">
                  Connection failed
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatDateTime(failure.time)}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  {failure.reason}
                </Typography>
              </Box>
            }
          >
            <Box
              component="button"
              type="button"
              aria-label={`Connection failed at ${formatDateTime(failure.time)}: ${failure.reason}`}
              sx={{
                position: 'absolute',
                left: clampedLeft(toPercent(failure.time), 8),
                top: 8,
                bottom: 26,
                width: 16,
                transform: 'translateX(-50%)',
                p: 0,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.error.main, 0.22),
                border: `1px solid ${alpha(theme.palette.error.main, 0.7)}`,
                cursor: 'help',
              }}
            />
          </Tooltip>
        ))}

        {timeline.events.map((event, index) => (
          <Tooltip
            key={`${event.time}-${index}`}
            placement="top"
            title={
              <Box sx={{ py: 0.5 }}>
                <Typography variant="caption" fontWeight={700} display="block">
                  {formatDateTime(event.time)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {event.count} records · {event.types.length} data types
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                  {event.types.map((type) => (
                    <Chip
                      key={type}
                      size="small"
                      label={type}
                      sx={{ height: 20, fontSize: 11, bgcolor: alpha(colorFor(type), 0.14) }}
                    />
                  ))}
                </Box>
              </Box>
            }
          >
            <Box
              component="button"
              type="button"
              aria-label={`${formatDateTime(event.time)}: ${event.types.join(', ')}`}
              sx={{
                position: 'absolute',
                left: clampedLeft(toPercent(event.time), 5),
                top: 44 + event.lane * 12,
                transform: 'translateX(-50%)',
                width: 10,
                height: 10,
                p: 0,
                borderRadius: '50%',
                bgcolor: colorFor(event.types[0]),
                border: '2px solid',
                borderColor: 'background.paper',
                boxShadow: `0 0 0 1px ${alpha(colorFor(event.types[0]), 0.6)}`,
                cursor: 'help',
              }}
            />
          </Tooltip>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {timeline.types.map((type) => (
          <Chip
            key={type}
            size="small"
            variant="outlined"
            label={type}
            sx={{
              height: 22,
              fontSize: 11,
              borderColor: alpha(colorFor(type), 0.5),
              color: colorFor(type),
            }}
          />
        ))}
      </Box>
    </Paper>
  );
}

function buildTimeline(
  records: CollectedRecord[],
  connected: boolean,
  attempts: ConnectionAttempt[],
): Timeline | null {
  const grouped = new Map<number, { types: Set<string>; count: number }>();
  for (const record of records) {
    if (!record.collected_at || !record.data_type) continue;
    const time = Date.parse(record.collected_at);
    if (!Number.isFinite(time)) continue;
    const group = grouped.get(time) ?? { types: new Set<string>(), count: 0 };
    group.types.add(record.data_type);
    group.count += 1;
    grouped.set(time, group);
  }

  const sorted = [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, group]) => ({ time, types: [...group.types].sort(), count: group.count }));

  const failures: FailedConnection[] = attempts
    .filter((attempt) => !attempt.succeeded)
    .map((attempt) => ({
      time: Date.parse(attempt.attempted_at),
      reason: attempt.reason?.trim() || 'Connection failed',
    }))
    .filter((failure) => Number.isFinite(failure.time))
    .sort((a, b) => a.time - b.time);
  if (!sorted.length && !failures.length) return null;

  const events: CollectionEvent[] = [];
  let clusterStart = Number.NEGATIVE_INFINITY;
  let lane = 0;
  for (const event of sorted) {
    if (event.time - clusterStart > CLUSTER_GAP) {
      clusterStart = event.time;
      lane = 0;
    }
    events.push({ ...event, lane: lane % 8 });
    lane += 1;
  }

  const allTimes = [...events.map((event) => event.time), ...failures.map((item) => item.time)];
  const first = Math.min(...allTimes);
  const last = Math.max(...allTimes);
  const span = Math.max(last - first, DAY);
  const start = first - span * 0.04;
  const end = Math.max(last + span * 0.04, connected ? Date.now() : 0);

  const windows: ConnectivityWindow[] = [];
  for (const event of events) {
    let window = windows[windows.length - 1];
    if (!window || event.time - window.end > SESSION_GAP) {
      window = { start: event.time - DAY / 2, end: event.time, collections: 0 };
      windows.push(window);
    }
    window.end = event.time + DAY / 2;
    window.collections += 1;
  }
  const minimumWidth = (end - start) * 0.02;
  for (const window of windows) {
    if (window.end - window.start < minimumWidth) {
      window.end = window.start + minimumWidth;
    }
  }
  if (connected && windows.length) {
    windows[windows.length - 1].end = end;
  }

  return {
    events,
    windows,
    failures,
    types: [...new Set(events.flatMap((event) => event.types))].sort(),
    start,
    end,
  };
}

function formatDate(time: number): string {
  return new Date(time).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}
