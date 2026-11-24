import { Grid, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { useMemo, useState } from 'react';

import type { CollectedRecord } from '../types';
import { recordPayload } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';
import { StatusBadge } from '../../shared/StatusBadge';
import { PackagesPayloadSchema, type PackageRow } from './schema';

export function PackagesDashboard({ records }: { records: CollectedRecord[] }) {
  const [query, setQuery] = useState('');
  const packages = useMemo(
    () =>
      records.flatMap((record) => {
        const payload = recordPayload(record);
        const parsed = PackagesPayloadSchema.safeParse(payload);
        if (parsed.success)
          return parsed.data.packages ?? parsed.data.installed ?? parsed.data.items ?? [];
        const raw = payload.packages ?? payload.installed ?? payload.items;
        if (Array.isArray(raw)) return raw.map((item) => PackageRowFallback(item));
        return Object.entries(raw && typeof raw === 'object' ? raw : {}).map(([name, version]) => ({
          name,
          version: String(version),
        }));
      }),
    [records],
  );
  const filtered = packages.filter((item) =>
    `${item.name ?? item.package ?? ''} ${item.version ?? ''} ${item.source ?? item.manager ?? ''}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const managers = [
    ...new Set(packages.map((item) => item.manager ?? item.source).filter(Boolean)),
  ];

  if (!records.length)
    return <EmptyData>No package inventory has been collected for this system.</EmptyData>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Installed packages"
          value={packages.length}
          detail="Entries in collected package records"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Package managers"
          value={managers.length || '—'}
          detail={managers.join(', ') || 'Not reported'}
        />
      </Grid>
      <Grid item xs={12}>
        <DataPanel
          title="Installed package inventory"
          subtitle="Package name, installed version, architecture, and source"
        >
          {packages.length ? (
            <>
              <TextField
                size="small"
                fullWidth
                label="Filter packages"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                sx={{ mb: 2, maxWidth: 420 }}
              />
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Package</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Architecture</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((item, index) => (
                    <TableRow key={`${item.name ?? item.package}-${index}`}>
                      <TableCell>{item.name ?? item.package ?? 'Unnamed package'}</TableCell>
                      <TableCell>{item.version ?? '—'}</TableCell>
                      <TableCell>{item.architecture ?? item.arch ?? '—'}</TableCell>
                      <TableCell>{item.manager ?? item.source ?? '—'}</TableCell>
                      <TableCell>
                        {item.status ? <StatusBadge status={item.status} /> : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filtered.length ? <EmptyData>No packages match this filter.</EmptyData> : null}
            </>
          ) : (
            <EmptyData>Package records exist, but contain no recognized package list.</EmptyData>
          )}
        </DataPanel>
      </Grid>
    </Grid>
  );
}

function PackageRowFallback(value: unknown): PackageRow {
  if (typeof value === 'string') return { name: value };
  const parsed = PackagesPayloadSchema.shape.packages.unwrap().element.safeParse(value);
  return parsed.success ? parsed.data : {};
}
