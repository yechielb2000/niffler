export interface CollectedRecord {
  id: number;
  data_type: string;
  schema_version?: number | null;
  payload: unknown;
  collected_at?: string | null;
  [key: string]: unknown;
}

export type JsonObject = Record<string, unknown>;

export function parseCollectedRecords(input: unknown[]): {
  records: CollectedRecord[];
  invalid: number;
} {
  const records = input.filter(isCollectedRecord);
  return { records, invalid: input.length - records.length };
}

function isCollectedRecord(value: unknown): value is CollectedRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'number' &&
    typeof record.data_type === 'string' &&
    Object.prototype.hasOwnProperty.call(record, 'payload') &&
    (record.schema_version == null || typeof record.schema_version === 'number') &&
    (record.collected_at == null || typeof record.collected_at === 'string')
  );
}

export function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function recordPayload(record: CollectedRecord): JsonObject {
  const payload = asObject(record.payload);
  return Object.prototype.hasOwnProperty.call(payload, 'result')
    ? asObject(payload.result)
    : payload;
}

export function sortNewest(records: CollectedRecord[]): CollectedRecord[] {
  return [...records].sort((a, b) => (b.collected_at ?? '').localeCompare(a.collected_at ?? ''));
}

export function displayValue(value: unknown, fallback = 'Not reported'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value))
    return (
      value
        .map((item) => displayValue(item, ''))
        .filter(Boolean)
        .join(', ') || fallback
    );
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
