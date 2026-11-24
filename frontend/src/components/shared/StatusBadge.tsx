import { Chip, type ChipProps } from '@mui/material';

type StatusColor = NonNullable<ChipProps['color']>;

const SUCCESS_STATUSES = [
  'active',
  'connected',
  'completed',
  'healthy',
  'installed',
  'operational',
  'reachable',
  'running',
  'success',
  'up',
  'verified',
];
const WARNING_STATUSES = [
  'changed',
  'degraded',
  'non-default',
  'pending',
  'review',
  'update available',
  'warning',
];
const ERROR_STATUSES = ['blocked', 'critical', 'dead', 'down', 'error', 'failed', 'unhealthy'];
const INFO_STATUSES = ['collecting', 'discovered', 'info'];

export function StatusBadge({
  status,
  size = 'small',
}: {
  status?: string | null;
  size?: ChipProps['size'];
}) {
  const label = status?.trim() || 'Unknown';
  return <Chip label={label} color={getStatusColor(label)} size={size} />;
}

function getStatusColor(status: string): StatusColor {
  const normalized = status.trim().toLowerCase();
  if (SUCCESS_STATUSES.some((value) => normalized === value || normalized.startsWith(`${value} `)))
    return 'success';
  if (ERROR_STATUSES.some((value) => normalized.includes(value))) return 'error';
  if (WARNING_STATUSES.some((value) => normalized.includes(value))) return 'warning';
  if (INFO_STATUSES.some((value) => normalized.includes(value))) return 'info';
  return 'default';
}
