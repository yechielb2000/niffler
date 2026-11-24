import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { asArray, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';
import { CodeValue } from '../../shared/CodeValue';
import { StatusBadge } from '../../shared/StatusBadge';

const ProcessSchema = z
  .object({
    pid: z.union([z.string(), z.number()]).optional(),
    name: z.string().optional(),
    user: z.string().optional(),
    cpu_percent: z.number().optional(),
    memory_percent: z.number().optional(),
    status: z.string().optional(),
  })
  .passthrough();

export function ProcessesDashboard({ records }: { records: CollectedRecord[] }) {
  const raw = sortNewest(records)
    .map((record) => recordPayload(record))
    .find((payload) => Array.isArray(payload.processes));
  if (!raw) return <EmptyData>No process inventory has been collected for this system.</EmptyData>;
  const processes = asArray(raw.processes)
    .map((item) => ProcessSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  const running = processes.filter((item) => item.status?.toLowerCase() === 'running').length;
  return (
    <>
      <MetricCard
        label="Processes"
        value={processes.length}
        detail={`${running} reported running`}
      />
      <DataPanel title="Process inventory" subtitle="PID, owner, resource use, and current state">
        {processes.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>PID</TableCell>
                <TableCell>Process</TableCell>
                <TableCell>User</TableCell>
                <TableCell>CPU</TableCell>
                <TableCell>Memory</TableCell>
                <TableCell>State</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {processes.map((process, index) => (
                <TableRow key={`${process.pid ?? process.name}-${index}`}>
                  <TableCell>
                    {process.pid == null ? (
                      '—'
                    ) : (
                      <CodeValue value={String(process.pid)} maxWidth={80} />
                    )}
                  </TableCell>
                  <TableCell>{process.name ?? 'Unnamed process'}</TableCell>
                  <TableCell>{process.user ?? '—'}</TableCell>
                  <TableCell>
                    {process.cpu_percent == null ? '—' : `${process.cpu_percent}%`}
                  </TableCell>
                  <TableCell>
                    {process.memory_percent == null ? '—' : `${process.memory_percent}%`}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={process.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyData>Process records exist, but no rows match the supported schema.</EmptyData>
        )}
      </DataPanel>
    </>
  );
}
