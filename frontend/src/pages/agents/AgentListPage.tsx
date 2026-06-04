import { Alert, Box, Button, Chip, Paper, Stack, TextField, Toolbar, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { AgentCard } from '../../components/agents/AgentCard';
import { useAgents } from '../../hooks/agents/useAgents';

export function AgentListPage() {
  const { agents, health, loading, error, stats, refresh } = useAgents();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAgents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesQuery = !normalized || [agent.agent_id, agent.hostname, agent.username, agent.distribution, agent.status].join(' ').toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'All' || agent.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [agents, query, statusFilter]);

  return (
    <Box sx={{ p: 3 }}>
      <Toolbar disableGutters sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="overline" color="primary">Operator Console</Typography>
          <Typography variant="h4">Active Agents</Typography>
          <Typography variant="body2" color="text.secondary">Monitor live implants and open each one for management actions.</Typography>
        </Box>
        <Button variant="contained" onClick={refresh}>Refresh</Button>
      </Toolbar>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, flex: 1 }} variant="outlined"><Typography variant="subtitle2">Backend health</Typography><Typography variant="h6">{health}</Typography></Paper>
        <Paper sx={{ p: 2, flex: 1 }} variant="outlined"><Typography variant="subtitle2">Total agents</Typography><Typography variant="h6">{stats.total}</Typography></Paper>
        <Paper sx={{ p: 2, flex: 1 }} variant="outlined"><Typography variant="subtitle2">Active</Typography><Typography variant="h6">{stats.active}</Typography></Paper>
        <Paper sx={{ p: 2, flex: 1 }} variant="outlined"><Typography variant="subtitle2">Inactive</Typography><Typography variant="h6">{stats.inactive}</Typography></Paper>
      </Stack>

      <Paper sx={{ p: 2, mb: 2 }} variant="outlined">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <TextField select fullWidth label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} SelectProps={{ native: true }}>
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </TextField>
        </Stack>
      </Paper>

      {loading ? <Typography>Loading agents…</Typography> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`Visible agents: ${filteredAgents.length}`} />
      </Stack>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {filteredAgents.map((agent) => <AgentCard key={agent.agent_id} agent={agent} />)}
      </Box>
    </Box>
  );
}
