import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

export function AgentCard({ agent }: { agent: any }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">Agent ID: {agent.agent_id}</Typography>
        <Typography variant="h6" gutterBottom>{agent.hostname}</Typography>
        <Typography variant="body2" color="text.secondary">{agent.username} • {agent.distribution}</Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Chip label={agent.status ?? 'Unknown'} color={agent.status === 'Active' ? 'success' : 'default'} size="small" />
          <Chip label={`Jitter ${agent.jitter ?? '-'}`} size="small" />
        </Stack>
      </CardContent>
      <CardActions>
        <Button component={Link} to={`/agents/${agent.agent_id}`} size="small">Manage</Button>
      </CardActions>
    </Card>
  );
}
