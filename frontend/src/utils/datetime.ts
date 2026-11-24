export function parseTimestamp(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const time = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  const time =
    value instanceof Date
      ? value.getTime()
      : typeof value === 'number'
        ? value
        : parseTimestamp(value);
  if (time === null) return '—';

  return new Date(time).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(Math.max(0, ms) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
