import { Alert, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData } from '../shared/DataPanel';

const EnvironmentSchema = z
  .object({ variables: z.record(z.string(), z.unknown()).optional() })
  .passthrough();
const SECRET_KEY = /(password|passwd|secret|token|private.?key|credential|api.?key)/i;

export function EnvironmentDashboard({ records }: { records: CollectedRecord[] }) {
  const parsed = sortNewest(records)
    .map((record) => EnvironmentSchema.safeParse(recordPayload(record)))
    .find((result) => result.success)?.data;
  if (!parsed)
    return <EmptyData>No environment snapshot has been collected for this system.</EmptyData>;
  const entries = Object.entries(parsed.variables ?? {});
  return (
    <DataPanel title="Session environment" subtitle={`${entries.length} reported variables`}>
      <Alert severity="info" sx={{ mb: 1.5 }}>
        Values with secret-like names are redacted in this view.
      </Alert>
      {entries.length ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Variable</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{SECRET_KEY.test(key) ? 'Redacted' : displayEnvValue(value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyData>No variables were reported.</EmptyData>
      )}
    </DataPanel>
  );
}

function displayEnvValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return value.map(String).join(', ');
  return `${Object.keys(value as object).length} structured value(s)`;
}
