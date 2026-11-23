import {
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { asArray, asObject, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData } from '../shared/DataPanel';

const MountSchema = z
  .object({
    device: z.string().optional(),
    mount_point: z.string().optional(),
    filesystem: z.string().optional(),
    total_gb: z.number().optional(),
    used_gb: z.number().optional(),
    percent: z.number().optional(),
  })
  .passthrough();
const BlockSchema = z
  .object({
    name: z.string().optional(),
    size: z.number().optional(),
    type: z.string().optional(),
    mountpoint: z.string().nullable().optional(),
  })
  .passthrough();

export function DevicesDashboard({ records }: { records: CollectedRecord[] }) {
  const raw = sortNewest(records)
    .map((record) => recordPayload(record))
    .find((payload) => payload.mounted !== undefined || payload.block_devices !== undefined);
  if (!raw)
    return <EmptyData>No device and mount inventory has been collected for this system.</EmptyData>;
  const mounts = asArray(asObject(raw.mounted).mount_points)
    .map((item) => MountSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  const disks = asArray(raw.block_devices)
    .map((item) => BlockSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  return (
    <>
      <DataPanel title="Mounted filesystems" subtitle="Capacity and utilization by mount point">
        {mounts.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Mount</TableCell>
                <TableCell>Device</TableCell>
                <TableCell>Filesystem</TableCell>
                <TableCell>Used / total</TableCell>
                <TableCell>Usage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mounts.map((mount, index) => (
                <TableRow key={`${mount.mount_point}-${index}`}>
                  <TableCell>{mount.mount_point ?? '—'}</TableCell>
                  <TableCell>{mount.device ?? '—'}</TableCell>
                  <TableCell>{mount.filesystem ?? '—'}</TableCell>
                  <TableCell>
                    {mount.used_gb == null || mount.total_gb == null
                      ? '—'
                      : `${mount.used_gb} / ${mount.total_gb} GB`}
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    {mount.percent == null ? (
                      '—'
                    ) : (
                      <>
                        <Typography variant="caption">{mount.percent}%</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, Math.max(0, mount.percent))}
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyData>No mount points were reported.</EmptyData>
        )}
      </DataPanel>
      <DataPanel title="Block devices" subtitle="Detected disks and partitions">
        {disks.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Mount point</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {disks.map((disk, index) => (
                <TableRow key={`${disk.name}-${index}`}>
                  <TableCell>{disk.name ?? '—'}</TableCell>
                  <TableCell>{disk.type ?? '—'}</TableCell>
                  <TableCell>{disk.size == null ? '—' : formatBytes(disk.size)}</TableCell>
                  <TableCell>{disk.mountpoint ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyData>No block devices were reported.</EmptyData>
        )}
      </DataPanel>
    </>
  );
}

function formatBytes(value: number) {
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}
