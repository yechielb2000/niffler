import { Chip, Grid, Paper, Stack, Typography } from '@mui/material';
import { z } from 'zod';

import type { CollectedRecord } from '../types';
import { asArray, asObject, recordPayload, sortNewest } from '../types';
import { DataPanel, EmptyData, MetricCard } from '../shared/DataPanel';

const ServiceSchema = z
  .object({
    name: z.string().optional(),
    active: z.boolean().optional(),
    state: z.string().optional(),
    enabled: z.boolean().optional(),
  })
  .passthrough();

export function ServicesDashboard({ records }: { records: CollectedRecord[] }) {
  const raw = sortNewest(records)
    .map((record) => recordPayload(record))
    .find((payload) => payload.services !== undefined);
  if (!raw) return <EmptyData>No service inventory has been collected for this system.</EmptyData>;
  const servicesValue = asObject(raw.services).services ?? raw.services;
  const services = asArray(servicesValue)
    .map((item) => ServiceSchema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);
  const active = services.filter(
    (service) => service.active || service.state?.toLowerCase() === 'running',
  ).length;
  return (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <MetricCard label="Services" value={services.length} />
      </Grid>
      <Grid item xs={6} md={3}>
        <MetricCard
          label="Active"
          value={active}
          detail={`${services.length - active} not running`}
        />
      </Grid>
      <Grid item xs={12}>
        <DataPanel title="Service status" subtitle="Active state and boot configuration">
          {services.length ? (
            <Grid container spacing={1}>
              {services.map((service, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${service.name}-${index}`}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {service.name ?? 'Unnamed service'}
                      </Typography>
                      <Chip
                        size="small"
                        color={service.active ? 'success' : 'default'}
                        label={service.state ?? (service.active ? 'running' : 'stopped')}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Enabled at boot:{' '}
                      {service.enabled == null ? 'Not reported' : service.enabled ? 'Yes' : 'No'}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyData>No service rows were included in the snapshot.</EmptyData>
          )}
        </DataPanel>
      </Grid>
    </Grid>
  );
}
