import { Alert, Box, Button, Card, Chip, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DataExplorer } from '../../components/data/DataExplorer';
import { CommandPanel } from '../../components/agents/CommandPanel';
import { ConnectDialog } from '../../components/agents/ConnectDialog';
import { ConnectivityTrend } from '../../components/agents/ConnectivityTrend';
import { TasksTab } from '../../components/agents/TasksTab';
import {
  connectAgent,
  ConnectionAttempt,
  ConnectionStatus,
  disconnectAgent,
  getConnection,
  getConnectionAttempts,
  listCommands,
  PresetCommand,
  runPreset,
} from '../../api';
import { useAgentDetails } from '../../hooks/agents/useAgents';
import { CodeValue } from '../../components/shared/CodeValue';
import { formatDateTime, formatDuration, parseTimestamp } from '../../utils/datetime';

type TabKey = 'commands' | 'activity' | 'data';
export function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agent, tasks, data, loading, error, refresh } = useAgentDetails(agentId);
  const [tab, setTab] = useState<TabKey>('commands');
  const [connectOpen, setConnectOpen] = useState(false);
  const [connection, setConnection] = useState<ConnectionStatus>({
    connected: false,
    saved: false,
  });
  const [attempts, setAttempts] = useState<ConnectionAttempt[]>([]);
  const [commands, setCommands] = useState<PresetCommand[]>([]);
  const [commandError, setCommandError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!agentId) return;
    Promise.all([listCommands(), getConnection(agentId), getConnectionAttempts(agentId)])
      .then(([catalog, saved, history]) => {
        setCommands(catalog.commands);
        setConnection(saved);
        setAttempts(history.attempts);
      })
      .catch((err) => setCommandError(err.message));
  }, [agentId]);

  useEffect(() => {
    if (!connection.connected) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [connection.connected]);

  const refreshAttempts = useCallback(async () => {
    if (!agentId) return;
    const history = await getConnectionAttempts(agentId);
    setAttempts(history.attempts);
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

  const lastSuccessfulAttemptAt = attempts.reduce<string | null>((latest, attempt) => {
    if (!attempt.succeeded || !attempt.attempted_at) return latest;
    const time = parseTimestamp(attempt.attempted_at);
    if (time === null) return latest;
    const previous = parseTimestamp(latest);
    return previous === null || time > previous ? attempt.attempted_at : latest;
  }, null);
  const lastConnectionAt = connection.connected_at ?? lastSuccessfulAttemptAt;
  const lastConnectionTime = parseTimestamp(lastConnectionAt);
  const connectedForMs =
    connection.connected && lastConnectionTime !== null
      ? Math.max(0, now - lastConnectionTime)
      : null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', maxWidth: 1440, mx: 'auto' }}>
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
            <Typography variant="caption" color="text.disabled">
              /
            </Typography>
            <CodeValue value={agent.agent_id} maxWidth={220} />
          </Stack>
          <Typography variant="h4">{agent.hostname}</Typography>
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
        <ConnectionSummary
          connected={connection.connected}
          connectedAt={lastConnectionAt}
          durationMs={connectedForMs}
          host={connection.host}
        />
      </Stack>
      <ConnectivityTrend records={data} connected={connection.connected} attempts={attempts} />
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
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
              <Tab label="Agent data" value="data" />
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
                    const status = await disconnectAgent(agentId);
                    setConnection(status);
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
              {tab === 'activity' ? (
                <TasksTab tasks={tasks} records={data} attempts={attempts} />
              ) : null}
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
          try {
            const status = await connectAgent(agentId, details);
            setConnection(status);
            setConnectOpen(false);
            setTab('commands');
          } finally {
            await refreshAttempts().catch(() => undefined);
          }
        }}
      />
    </Box>
  );
}

function ConnectionSummary({
  connected,
  connectedAt,
  durationMs,
  host,
}: {
  connected: boolean;
  connectedAt?: string | null;
  durationMs?: number | null;
  host?: string | null;
}) {
  const connectionTime = parseTimestamp(connectedAt);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        alignSelf: { xs: 'stretch', md: 'center' },
        minWidth: { md: 260 },
        maxWidth: { xs: '100%', md: 380 },
        p: 1.25,
        borderRadius: 1,
        border: '1px solid',
        borderColor: connected ? 'success.main' : 'divider',
        bgcolor: (theme) =>
          connected ? alpha(theme.palette.success.main, 0.08) : 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 10,
          height: 10,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: connected ? 'success.main' : 'text.disabled',
          boxShadow: (theme) =>
            connected ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.14)}` : 'none',
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" color={connected ? 'success.main' : 'text.primary'}>
          {connected ? 'Connected' : 'Not connected'}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          {connected ? (
            <>
              {connectionTime !== null
                ? `Since ${formatDateTime(connectionTime)}`
                : 'Connected now'}
              {durationMs !== null && durationMs !== undefined
                ? ` · ${formatDuration(durationMs)}`
                : ''}
            </>
          ) : connectionTime !== null ? (
            `Last connected ${formatDateTime(connectionTime)}`
          ) : (
            'SSH connection required'
          )}
        </Typography>
        {connected && host ? (
          <Typography variant="caption" color="text.secondary" display="block" noWrap title={host}>
            {host}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
