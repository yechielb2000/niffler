import { Alert, Box, Button, Card, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { killAgent, queueTask, updateConfig } from '../../api';
import { AgentControlCard } from '../../components/agents/AgentControlCard';
import { CollectedDataTab } from '../../components/agents/CollectedDataTab';
import { TasksTab } from '../../components/agents/TasksTab';
import { WorkflowsTab } from '../../components/agents/WorkflowsTab';
import { useAgentDetails } from '../../hooks/agents/useAgents';

type TabKey = 'execution' | 'data' | 'workflows';

export function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agent, tasks, workflows, data, loading, error, refresh } = useAgentDetails(agentId);
  const [tab, setTab] = useState<TabKey>('execution');
  const [message, setMessage] = useState('');

  const submitTask = async (moduleName: string, sourceCode: string) => {
    if (!agentId) return;
    const res = await queueTask(agentId, {
      module_name: moduleName,
      code: sourceCode,
      sched_type: 'Immediate',
      sched_val: '0',
      duration_sec: 0,
    });
    setMessage(`Queued task ${res.task_id}`);
    refresh();
  };

  const saveConfig = async (interval: number, jitter: number) => {
    if (!agentId) return;
    const res = await updateConfig(agentId, jitter, interval);
    setMessage(res.status || 'Configuration updated');
  };

  const terminate = async () => {
    if (!agentId) return;
    await killAgent(agentId);
    setMessage('Agent marked inactive.');
    navigate('/');
  };

  if (loading || !agent) return <Box sx={{ p: 3 }}><Typography>Loading agent…</Typography></Box>;

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#020617' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" color="#06b6d4">Agent Operations Console</Typography>
          <Typography variant="h4" sx={{ color: '#fff' }}>{agent.hostname}</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>{agent.username} • {agent.distribution} • {agent.status}</Typography>
        </Box>
        <Button variant="outlined" sx={{ color: '#fff', borderColor: '#334155' }} onClick={() => navigate('/')}>
          Back to agents
        </Button>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={3}>
          <AgentControlCard agent={agent} onConfigUpdated={saveConfig} onKillAgent={terminate} />
        </Grid>

        <Grid item xs={12} lg={9}>
          <Card sx={{ height: '100%', bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #1e293b' }}>
            <Box sx={{ borderBottom: 1, borderColor: '#1e293b' }}>
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                textColor="inherit"
                sx={{
                  '& .MuiTabs-indicator': { bgcolor: '#06b6d4' },
                  '& .MuiTab-root': { color: '#94a3b8', '&.Mui-selected': { color: '#06b6d4' } },
                }}
              >
                <Tab label="Execution Console" value="execution" />
                <Tab label={`Loot Repository (${data.length})`} value="data" />
                <Tab label="Workflows / Playbooks" value="workflows" />
              </Tabs>
            </Box>

            <Box sx={{ p: 3 }}>
              {tab === 'execution' ? <TasksTab tasks={tasks} agentId={agentId ?? ''} onQueueTask={submitTask} /> : null}
              {tab === 'data' ? <CollectedDataTab data={data} /> : null}
              {tab === 'workflows' ? <WorkflowsTab workflows={workflows} /> : null}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
