import { Chip, List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { asArray, asObject, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData } from '../shared/DataPanel';

const EntrySchema = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    size: z.number().optional(),
    owner: z.string().optional(),
    mode: z.string().optional(),
  })
  .passthrough();

export function FilesystemDashboard({ records }: { records: CollectedRecord[] }) {
  const raw = sortNewest(records)
    .map((record) => recordPayload(record))
    .find((payload) => payload.root !== undefined || payload.entries !== undefined);
  if (!raw)
    return <EmptyData>No filesystem metadata has been collected for this system.</EmptyData>;
  const root = asObject(raw.root);
  const entries = asArray(asObject(raw.entries).entries ?? raw.entries)
    .map((item) => EntrySchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip label={`Path ${String(root.path ?? asObject(raw.entries).path ?? '/')}`} />
          <Chip label={`Owner ${String(root.owner ?? 'not reported')}`} />
          <Chip label={`Mode ${String(root.mode ?? 'not reported')}`} />
          <Chip label={`Type ${String(root.type ?? 'not reported')}`} />
        </Stack>
      </Paper>
      <DataPanel
        title="Directory entries"
        subtitle={`${entries.length} entries in the reported listing`}
      >
        {entries.length ? (
          <List dense>
            {entries.map((entry, index) => (
              <ListItem key={`${entry.name}-${index}`} divider>
                <ListItemText
                  primary={entry.name ?? 'Unnamed entry'}
                  secondary={
                    <>
                      {entry.type ?? 'Unknown type'} ·{' '}
                      {entry.size == null
                        ? 'Size not reported'
                        : `${entry.size.toLocaleString()} bytes`}{' '}
                      · {entry.mode ?? 'mode not reported'}
                    </>
                  }
                />
                <Typography variant="caption" color="text.secondary">
                  {entry.owner ?? ''}
                </Typography>
              </ListItem>
            ))}
          </List>
        ) : (
          <EmptyData>No directory entries were reported.</EmptyData>
        )}
      </DataPanel>
    </Stack>
  );
}
