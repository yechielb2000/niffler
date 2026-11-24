import { Alert, Box, Chip, Paper, Stack, TextField, Toolbar, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { AgentCard } from '../../components/agents/AgentCard';
import { useAgents } from '../../hooks/agents/useAgents';

export function AgentListPage() {
  const { agents, loading, error, stats } = useAgents();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesQuery =
        !normalized ||
        [agent.agent_id, agent.hostname, agent.username, agent.distribution, agent.status]
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      const matchesStatus = statusFilter === 'All' || agent.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [agents, query, statusFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Toolbar disableGutters sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="overline" color="primary">
            System Inventory
          </Typography>
          <Typography variant="h4">Managed Systems</Typography>
          <Typography variant="body2" color="text.secondary">
            Review registered system metadata and recorded observations.
          </Typography>
        </Box>
      </Toolbar>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <AgentMetric label="Total agents" value={stats.total} tone="primary.main" />
        <AgentMetric label="Active" value={stats.active} tone="success.main" />
        <AgentMetric label="Inactive" value={stats.inactive} tone="warning.main" />
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <TextField
            select
            fullWidth
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
            <option value="Error">Error</option>
          </TextField>
        </Stack>
      </Paper>

      {loading ? <Typography>Loading agents…</Typography> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`Visible agents: ${filteredAgents.length}`} />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {filteredAgents.map((agent) => (
          <AgentCard key={agent.agent_id} agent={agent} />
        ))}
      </Box>
    </Box>
  );
}

function AgentMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'primary.main' | 'success.main' | 'warning.main';
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.25, flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ width: 3, height: 30, flexShrink: 0, borderRadius: 1, bgcolor: tone }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h5" sx={{ color: tone, lineHeight: 1.1 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
