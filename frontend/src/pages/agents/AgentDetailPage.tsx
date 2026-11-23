import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DataExplorer } from '../../components/data/DataExplorer';
import { CommandPanel } from '../../components/agents/CommandPanel';
import { ConnectDialog } from '../../components/agents/ConnectDialog';
import { TasksTab } from '../../components/agents/TasksTab';
import {
  connectAgent,
  disconnectAgent,
  getConnection,
  listCommands,
  PresetCommand,
  runPreset,
} from '../../api';
import { useAgentDetails } from '../../hooks/agents/useAgents';

type TabKey = 'commands' | 'activity' | 'data';
export function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agent, tasks, data, loading, error, refresh } = useAgentDetails(agentId);
  const [tab, setTab] = useState<TabKey>('commands');
  const [connectOpen, setConnectOpen] = useState(false);
  const [connection, setConnection] = useState<{
    connected: boolean;
    saved: boolean;
    host?: string;
    port?: number;
    username?: string;
  }>({ connected: false, saved: false });
  const [commands, setCommands] = useState<PresetCommand[]>([]);
  const [commandError, setCommandError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;
    Promise.all([listCommands(), getConnection(agentId)])
      .then(([catalog, saved]) => {
        setCommands(catalog.commands);
        setConnection(saved);
      })
      .catch((err) => setCommandError(err.message));
  }, [agentId]);

  if (loading)
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading system…</Typography>
      </Box>
    );
  if (!agent)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'System not found.'}
        </Alert>
        <Button onClick={() => navigate('/')}>Back to inventory</Button>
      </Box>
    );
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', maxWidth: 1440, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: '.14em' }}>
              System inventory
            </Typography>
            <Typography variant="caption" color="text.disabled">/</Typography>
            <Typography variant="caption" color="text.secondary">{agent.agent_id}</Typography>
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-.025em' }}>
            {agent.hostname}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={agent.status ?? 'Unknown'}
              color={agent.status === 'Active' ? 'success' : 'default'}
              variant="outlined"
            />
            <Typography variant="body2" color="text.secondary">
              {agent.username} ? {agent.distribution}
            </Typography>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/')}>All systems</Button>
          <Button variant="contained" onClick={() => setConnectOpen(true)}>
            {connection.connected ? 'Reconnect' : 'Connect'}
          </Button>
        </Stack>
      </Stack>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: 'Connection', value: connection.connected ? 'Connected' : 'Not connected', hint: connection.host ?? 'SSH connection required' },
          { label: 'Data records', value: data.length, hint: 'Collected inventory records' },
          { label: 'Activity', value: tasks.length, hint: 'Recorded task events' },
        ].map((metric) => (
          <Grid item xs={6} md={3} key={metric.label}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', bgcolor: 'background.paper' }}>
              <Typography variant="caption" color="text.secondary">{metric.label}</Typography>
              <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 700 }}>{metric.value}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {metric.hint}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Grid container>
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ overflow: 'hidden' }}>
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{ px: { xs: 1, md: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label="Command panel" value="commands" />
              <Tab label="Activity" value="activity" />
              <Tab label={`Agent data (${data.length})`} value="data" />
            </Tabs>
            <Box sx={{ p: { xs: 2, md: 3 }, minHeight: 360 }}>
              {tab === 'commands' ? (
                <CommandPanel
                  commands={commands}
                  connected={connection.connected}
                  host={connection.host ?? undefined}
                  busy={busy}
                  error={commandError}
                  onConnect={() => setConnectOpen(true)}
                  onDisconnect={async () => {
                    if (!agentId) return;
                    await disconnectAgent(agentId);
                    setConnection((value) => ({ ...value, connected: false }));
                  }}
                  onRun={async (id) => {
                    if (!agentId) return;
                    setBusy(id);
                    setCommandError('');
                    try {
                      await runPreset(agentId, id);
                      await refresh();
                    } catch (err) {
                      setCommandError(err instanceof Error ? err.message : 'Collection failed');
                    } finally {
                      setBusy(null);
                    }
                  }}
                />
              ) : null}
              {tab === 'activity' ? <TasksTab tasks={tasks} /> : null}
              {tab === 'data' ? (
                <DataExplorer data={data} hostname={agent.hostname ?? undefined} />
              ) : null}
            </Box>
          </Card>
        </Grid>
      </Grid>
      <ConnectDialog
        key={`${connectOpen}-${connection.host ?? ''}-${connection.port ?? ''}-${connection.username ?? ''}`}
        open={connectOpen}
        saved={connection.saved ? connection : undefined}
        onClose={() => setConnectOpen(false)}
        onConnect={async (details) => {
          if (!agentId) return;
          await connectAgent(agentId, details);
          setConnection({
            connected: true,
            saved: true,
            host: details.host,
            port: details.port,
            username: details.username,
          });
          setConnectOpen(false);
          setTab('commands');
        }}
      />
    </Box>
  );
}
