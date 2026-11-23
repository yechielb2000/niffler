import { Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { asArray, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';

const UserSchema = z
  .object({
    name: z.string().optional(),
    uid: z.union([z.string(), z.number()]).optional(),
    gid: z.union([z.string(), z.number()]).optional(),
    shell: z.string().optional(),
    home: z.string().optional(),
    system: z.boolean().optional(),
  })
  .passthrough();
const GroupSchema = z
  .object({
    name: z.string().optional(),
    gid: z.union([z.string(), z.number()]).optional(),
    members: z.array(z.string()).optional(),
  })
  .passthrough();

export function AccountsDashboard({ records }: { records: CollectedRecord[] }) {
  const raw = sortNewest(records)
    .map((record) => recordPayload(record))
    .find((payload) => payload.users !== undefined || payload.groups !== undefined);
  if (!raw)
    return <EmptyData>No local account inventory has been collected for this system.</EmptyData>;
  const users = asArray(raw.users)
    .map((item) => UserSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  const groups = asArray(raw.groups)
    .map((item) => GroupSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Local users"
          value={users.length}
          detail={`${users.filter((user) => !user.system).length} non-system accounts`}
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard label="Groups" value={groups.length} />
      </Grid>
      <Grid item xs={12} md={6}>
        <DataPanel title="Local users" subtitle="UID, primary group, home, and login shell">
          {users.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>UID</TableCell>
                  <TableCell>GID</TableCell>
                  <TableCell>Shell</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={`${user.name}-${index}`}>
                    <TableCell>{user.name ?? '—'}</TableCell>
                    <TableCell>{user.uid ?? '—'}</TableCell>
                    <TableCell>{user.gid ?? '—'}</TableCell>
                    <TableCell>{user.shell ?? '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={user.system ? 'System' : 'User'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No user rows were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
      <Grid item xs={12} md={6}>
        <DataPanel title="Groups and membership" subtitle="Group IDs and listed members">
          {groups.length ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Group</TableCell>
                  <TableCell>GID</TableCell>
                  <TableCell>Members</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((group, index) => (
                  <TableRow key={`${group.name}-${index}`}>
                    <TableCell>{group.name ?? '—'}</TableCell>
                    <TableCell>{group.gid ?? '—'}</TableCell>
                    <TableCell>{group.members?.join(', ') || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyData>No group rows were reported.</EmptyData>
          )}
        </DataPanel>
      </Grid>
    </Grid>
  );
}
