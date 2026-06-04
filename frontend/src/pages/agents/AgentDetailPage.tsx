import { Alert, Box, Button, ButtonGroup, Card, CardContent, Divider, Stack, TextField, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

import { killAgent, queueTask, updateConfig } from '../../api';
import { useAgentDetails } from '../../hooks/agents/useAgents';

export function AgentDetailPage() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { agent, tasks, loading, error, refresh } = useAgentDetails(agentId);
  const [moduleName, setModuleName] = useState('demo_module');
  const [code, setCode] = useState('class Module:\n    def run(self):\n        return "hello from operator"');
  const [schedType, setSchedType] = useState('Immediate');
  const [schedVal, setSchedVal] = useState('0');
  const [duration, setDuration] = useState(0);
  const [jitter, setJitter] = useState(3);
  const [beaconInterval, setBeaconInterval] = useState(15);
  const [message, setMessage] = useState('');

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

  const applyPreset = (preset: 'hello' | 'install') => {
    if (preset === 'hello') {
      setModuleName('demo_hello');
      setCode('class Module:\n    def run(self):\n        return "hello from operator"');
    } else {
      setModuleName('install_demo_pkg');
      setCode('class Module:\n    def run(self):\n        return "__VENV_INSTALL__:requests"');
    }
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
          <Typography variant="overline" color="primary">Agent Management</Typography>
          <Typography variant="h4">{agent.hostname}</Typography>
          <Typography variant="body2" color="text.secondary">{agent.username} • {agent.distribution} • {agent.status}</Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/')}>Back to agents</Button>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert> : null}

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }} variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Send a task to this agent</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Use a preset or paste custom Python to queue an operation directly on the implant.</Typography>
            <ButtonGroup variant="outlined" sx={{ mb: 1 }}>
              <Button onClick={() => applyPreset('hello')}>Hello task</Button>
              <Button onClick={() => applyPreset('install')}>Install package</Button>
            </ButtonGroup>
            <Stack spacing={2}>
              <TextField label="Module name" value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
              <TextField select label="Schedule type" value={schedType} onChange={(e) => setSchedType(e.target.value)} SelectProps={{ native: true }}>
                <option value="Immediate">Immediate</option>
                <option value="Period">Period</option>
                <option value="Event">Event</option>
              </TextField>
              <TextField label="Schedule value" value={schedVal} onChange={(e) => setSchedVal(e.target.value)} />
              <TextField type="number" label="Duration (sec)" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              <TextField label="Module code" multiline minRows={8} value={code} onChange={(e) => setCode(e.target.value)} />
              <Button variant="contained" onClick={() => submitTask()}>Queue task</Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }} variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>Adjust runtime</Typography>
            <Stack spacing={2}>
              <TextField type="number" label="Jitter" value={jitter} onChange={(e) => setJitter(Number(e.target.value))} />
              <TextField type="number" label="Beacon interval (sec)" value={beaconInterval} onChange={(e) => setBeaconInterval(Number(e.target.value))} />
              <Button variant="contained" onClick={saveConfig}>Save config</Button>
              <Button color="error" variant="contained" onClick={terminate}>Kill agent</Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card sx={{ mt: 2 }} variant="outlined">
        <CardContent>
          <Typography variant="h6">Queued tasks</Typography>
          {tasks.length === 0 ? <Typography color="text.secondary">No queued tasks yet.</Typography> : tasks.map((task) => (
            <Box key={task.task_id} sx={{ py: 1 }}>
              <Typography variant="subtitle1"><strong>{task.module_name}</strong> — {task.status} — {task.schedule_type}</Typography>
              <Typography variant="body2" color="text.secondary">Task ID: {task.task_id}</Typography>
              <Divider sx={{ my: 1 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
