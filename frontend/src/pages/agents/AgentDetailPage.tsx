import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { killAgent, queueTask, updateConfig } from '../../api';
import { LocationHistoryMap } from '../../components/agents/LocationHistoryMap';
import { useAgentDetails } from '../../hooks/agents/useAgents';

type TabKey = 'overview' | 'data' | 'management';

export function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agent, tasks, workflows, data, loading, error, refresh } = useAgentDetails(agentId);
  const [tab, setTab] = useState<TabKey>('overview');
  const [moduleName, setModuleName] = useState('demo_module');
  const [code, setCode] = useState('class Module:\n    def run(self):\n        return "hello from operator"');
  const [schedType, setSchedType] = useState('Immediate');
  const [schedVal, setSchedVal] = useState('0');
  const [duration, setDuration] = useState(0);
  const [jitter, setJitter] = useState(3);
  const [beaconInterval, setBeaconInterval] = useState(15);
  const [message, setMessage] = useState('');

  const summaryCards = useMemo(() => [
    { label: 'Agent ID', value: agent?.agent_id ?? '—' },
    { label: 'Hostname', value: agent?.hostname ?? '—' },
    { label: 'User', value: agent?.username ?? '—' },
    { label: 'Status', value: agent?.status ?? '—' },
    { label: 'OS', value: agent?.distribution ?? 'Unknown' },
    { label: 'Last seen', value: agent?.status ? 'Now' : 'Unknown' },
  ], [agent]);

  const submitTask = async (templateCode = code, templateName = moduleName) => {
    if (!agentId) return;
    const res = await queueTask(agentId, {
      module_name: templateName,
      code: templateCode,
      sched_type: schedType,
      sched_val: schedVal,
      duration_sec: duration,
    });
    setMessage(`Queued task ${res.task_id}`);
    refresh();
  };

  const saveConfig = async () => {
    if (!agentId) return;
    const res = await updateConfig(agentId, jitter, beaconInterval);
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
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'start', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="overline" color="primary">Agent Details</Typography>
          <Typography variant="h4">{agent.hostname}</Typography>
          <Typography variant="body2" color="text.secondary">{agent.username} • {agent.distribution} • {agent.status}</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/')}>Back to agents</Button>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
        {summaryCards.map((card) => (
          <Card key={card.label} variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              <Typography variant="h6">{card.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Overview" value="overview" />
          <Tab label="Data" value="data" />
          <Tab label="Management" value="management" />
        </Tabs>
      </Box>

      {tab === 'overview' ? (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Activity timeline</Typography>
              <Stack spacing={1} divider={<Divider flexItem />}> 
                {tasks.length === 0 ? <Typography color="text.secondary">No activity captured yet.</Typography> : tasks.map((task) => (
                  <Box key={task.task_id}>
                    <Typography variant="subtitle2">{task.module_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{task.status} • Task {task.task_id}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Telemetry snapshot</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Chip label={`Tasks: ${tasks.length}`} />
                <Chip label={`Workflows: ${workflows.length}`} />
                <Chip label={`Collected data: ${data.length}`} />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {tab === 'data' ? (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Location history</Typography>
              <LocationHistoryMap records={data} />
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Collected data</Typography>
              {data.length === 0 ? <Typography color="text.secondary">No collected data yet.</Typography> : data.map((record) => (
                <Box key={`${record.task_id ?? 'n/a'}-${record.data_type}-${record.id ?? 'n/a'}`} sx={{ py: 1 }}>
                  <Typography variant="subtitle2">{record.data_type}</Typography>
                  <Typography variant="body2" color="text.secondary">Task {record.task_id ?? '—'} • Workflow {record.workflow_id ?? '—'}</Typography>
                  <Typography variant="body2">{JSON.stringify(record.payload)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Workflow definitions</Typography>
              {workflows.length === 0 ? <Typography color="text.secondary">No workflows configured yet.</Typography> : workflows.map((workflow) => (
                <Box key={workflow.workflow_id} sx={{ py: 1 }}>
                  <Typography variant="subtitle2">{workflow.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{workflow.workflow_id}</Typography>
                  <Typography variant="body2">{JSON.stringify(workflow.definition)}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Stack>
      ) : null}

      {tab === 'management' ? (
        <Stack spacing={2}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Quick actions</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="contained" onClick={() => submitTask('class Module:\n    def run(self):\n        return "screenshot"', 'take_screenshot')}>Take screenshot</Button>
                <Button variant="outlined" onClick={() => submitTask('class Module:\n    def run(self):\n        return "command"', 'run_command')}>Run command</Button>
                <Button variant="outlined" onClick={() => submitTask('class Module:\n    def run(self):\n        return "collect_process"', 'collect_process_list')}>Collect process list</Button>
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Task builder</Typography>
              <Stack spacing={2}>
                <TextField label="Module name" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
                <TextField select label="Schedule type" value={schedType} onChange={(e) => setSchedType(e.target.value)} SelectProps={{ native: true }}>
                  <option value="Immediate">Immediate</option>
                  <option value="Period">Period</option>
                  <option value="Event">Event</option>
                </TextField>
                <TextField label="Schedule value" value={schedVal} onChange={(e) => setSchedVal(e.target.value)} />
                <TextField type="number" label="Duration (sec)" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                <TextField label="Module code" multiline minRows={6} value={code} onChange={(e) => setCode(e.target.value)} />
                <Button variant="contained" onClick={() => submitTask()}>Queue task</Button>
              </Stack>
            </CardContent>
          </Card>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Runtime controls</Typography>
              <Stack spacing={2}>
                <TextField type="number" label="Jitter" value={jitter} onChange={(e) => setJitter(Number(e.target.value))} />
                <TextField type="number" label="Beacon interval (sec)" value={beaconInterval} onChange={(e) => setBeaconInterval(Number(e.target.value))} />
                <Button variant="contained" onClick={saveConfig}>Save config</Button>
                <Button color="error" variant="contained" onClick={terminate}>Kill agent</Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      ) : null}
    </Box>
  );
}
