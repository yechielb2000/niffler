import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

import type { CollectedRecord } from '../types';
import { asObject, recordPayload } from '../types';
import { DataPanel, EmptyData } from '../shared/DataPanel';

export function OtherDataDashboard({ records }: { records: CollectedRecord[] }) {
  if (!records.length) return <EmptyData>No records in this category.</EmptyData>;
  const row = asObject(recordPayload(records[0]));
  const fields = Object.entries(row).filter(
    ([key]) => !['content', 'raw', 'result'].includes(key.toLowerCase()),
  );
  return (
    <DataPanel title="Additional inventory" subtitle="Structured fields from the latest record">
      {fields.length ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Field</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{formatValue(value)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyData>No displayable structured fields were reported.</EmptyData>
      )}
    </DataPanel>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return `${value.length} item(s)`;
  return `${Object.keys(asObject(value)).length} field(s)`;
}
