import { Box, Button, Card, CardContent, Chip, Divider, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface AgentControlCardProps {
  agent: {
    agent_id: string;
    hostname: string;
    username: string;
    distribution: string;
    status: string;
    beacon_interval?: number;
    jitter?: number;
  };
  onConfigUpdated?: (interval: number, jitter: number) => Promise<void> | void;
  onKillAgent?: () => Promise<void> | void;
}

export function AgentControlCard({ agent, onConfigUpdated, onKillAgent }: AgentControlCardProps) {
  const [interval, setInterval] = useState(agent.beacon_interval ?? 15);
  const [jitter, setJitter] = useState(agent.jitter ?? 3);

  useEffect(() => {
    setInterval(agent.beacon_interval ?? 15);
    setJitter(agent.jitter ?? 3);
  }, [agent.beacon_interval, agent.jitter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'error';
    }
  };

  const handleUpdateConfig = async () => {
    await onConfigUpdated?.(interval, jitter);
  };

  const handleKillAgent = async () => {
    if (window.confirm(`Issue permanent termination instruction to host: ${agent.hostname}?`)) {
      await onKillAgent?.();
    }
  };

  return (
    <Card sx={{ bgcolor: '#0b0f19', color: '#fff', border: '1px solid #1e293b', height: '100%' }}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
              {agent.hostname}
            </Typography>
            <Chip label={agent.status} color={getStatusColor(agent.status)} size="small" variant="outlined" />
          </Box>

          <Box>
            <Typography variant="body2" color="#94a3b8">
              Context: <span style={{ color: '#fff' }}>{agent.username}</span>
            </Typography>
            <Typography variant="body2" color="#94a3b8">
              Distro: <span style={{ color: '#fff' }}>{agent.distribution}</span>
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#475569', display: 'block', mt: 0.5 }}>
              UUID: {agent.agent_id}
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#1e293b' }} />

          <Typography variant="subtitle2" color="#06b6d4" fontWeight="bold">
            Beacon Engine Configurations
          </Typography>
          <TextField
            label="Beacon Interval (seconds)"
            type="number"
            value={interval}
            onChange={(event) => setInterval(Number(event.target.value))}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              input: { color: '#fff' },
              '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#334155' } },
            }}
          />
          <TextField
            label="Jitter (seconds)"
            type="number"
            value={jitter}
            onChange={(event) => setJitter(Number(event.target.value))}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
              input: { color: '#fff' },
              '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#334155' } },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleUpdateConfig}
            sx={{ bgcolor: '#06b6d4', '&:hover': { bgcolor: '#0891b2' } }}
            fullWidth
          >
            Apply Microcode Rules
          </Button>

          <Divider sx={{ borderColor: '#1e293b' }} />

          <Button variant="outlined" color="error" size="small" onClick={handleKillAgent} fullWidth>
            Signal Kill/Shutdown
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
