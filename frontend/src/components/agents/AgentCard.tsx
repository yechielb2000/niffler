import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { Box, Button, Card, CardActions, CardContent, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

import type { Agent } from '../../api';
import { CodeValue } from '../shared/CodeValue';
import { StatusBadge } from '../shared/StatusBadge';

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              MANAGED HOST
            </Typography>
            <Typography variant="h6" noWrap title={agent.hostname ?? 'Unnamed host'}>
              {agent.hostname ?? 'Unnamed host'}
            </Typography>
          </Box>
          <StatusBadge status={agent.status} />
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: 1,
            p: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.default',
          }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              AGENT ID
            </Typography>
            <CodeValue value={agent.agent_id} maxWidth={180} />
          </Stack>
          <Stack spacing={0.25} alignItems="flex-end">
            <Typography variant="caption" color="text.secondary">
              JITTER
            </Typography>
            <Typography variant="technical">{agent.jitter ?? '—'}</Typography>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1.5,
          }}
        >
          <Metadata label="Account" value={agent.username ?? 'Not reported'} />
          <Metadata label="Distribution" value={agent.distribution ?? 'Not reported'} />
        </Box>
      </CardContent>
      <CardActions sx={{ px: 2, pt: 0, pb: 1.5, justifyContent: 'flex-end' }}>
        <Button
          component={Link}
          to={`/agents/${agent.agent_id}`}
          size="small"
          endIcon={<ArrowForwardRoundedIcon />}
        >
          View system
        </Button>
      </CardActions>
    </Card>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" noWrap title={value}>
        {value}
      </Typography>
    </Box>
  );
}
