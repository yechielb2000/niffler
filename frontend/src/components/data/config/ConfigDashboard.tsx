import {
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { CollectedRecord } from '../types';
import { asArray, asObject, recordPayload } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';
import { ConfigFileSchema, ConfigPayloadSchema, type ConfigFile } from './schema';

const SECRET_KEY = /(password|passwd|secret|token|private.?key|credential|api.?key)/i;

export function ConfigDashboard({ records }: { records: CollectedRecord[] }) {
  const files = records.flatMap((record) => {
    const parsed = ConfigPayloadSchema.safeParse(recordPayload(record));
    if (parsed.success) return parsed.data.files ?? parsed.data.configurations ?? [];
    return asArray(asObject(recordPayload(record)).files)
      .map(parseConfigFile)
      .filter((file): file is ConfigFile => file !== null);
  });
  const settings = records.flatMap((record) => {
    const parsed = ConfigPayloadSchema.safeParse(recordPayload(record));
    if (!parsed.success) return [];
    const fileSettings = (parsed.data.files ?? parsed.data.configurations ?? []).flatMap((file) =>
      Object.entries(file.settings ?? {}).map(
        ([key, value]) =>
          [`${file.path ?? file.name ?? 'file'}.${key}`, value] as [string, unknown],
      ),
    );
    return [
      ...Object.entries(parsed.data.settings ?? parsed.data.variables ?? {}),
      ...fileSettings,
    ];
  });
  const flagged = files.filter((file) =>
    ['changed', 'warning', 'error', 'non-default'].includes((file.status ?? '').toLowerCase()),
  ).length;

  if (!records.length)
    return <EmptyData>No configuration snapshots have been collected for this system.</EmptyData>;

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Configuration files"
          value={files.length}
          detail="Paths represented in collected snapshots"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard label="Settings" value={settings.length} detail="Key-value settings reported" />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard label="Flagged records" value={flagged} detail="Changed or warning status" />
      </Grid>
      <Grid item xs={12}>
        <DataPanel
          title="Configuration files"
          subtitle="Metadata and reported status; sensitive content is not rendered"
        >
          {files.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Path</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Owner / mode</TableCell>
                  <TableCell>Modified</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Settings</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow key={`${file.path ?? file.name}-${index}`}>
                    <TableCell>{file.path ?? file.name ?? 'Unnamed configuration'}</TableCell>
                    <TableCell>{file.format ?? '—'}</TableCell>
                    <TableCell>
                      {[file.owner, file.mode].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell>{file.modified ?? '—'}</TableCell>
                    <TableCell>
                      {file.status ? (
                        <Chip
                          size="small"
                          label={file.status}
                          color={flaggedStatus(file.status) ? 'warning' : 'default'}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{Object.keys(file.settings ?? {}).length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No file-level configuration metadata was reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
      <Grid item xs={12}>
        <DataPanel
          title="Configuration values"
          subtitle="Secret-like keys are redacted automatically"
        >
          {settings.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Setting</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settings.map(([key, value], index) => (
                  <TableRow key={`${key}-${index}`}>
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      {SECRET_KEY.test(key) ? (
                        <Typography color="warning.main">Redacted</Typography>
                      ) : (
                        displayConfigValue(value)
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No key-value settings were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
    </Grid>
  );
}

function parseConfigFile(value: unknown): ConfigFile | null {
  const parsed = ConfigFileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function flaggedStatus(status: string) {
  return ['changed', 'warning', 'error', 'non-default'].includes(status.toLowerCase());
}

function displayConfigValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  if (Array.isArray(value)) return value.map(String).join(', ');
  return `${Object.keys(asObject(value)).length} structured value(s)`;
}
