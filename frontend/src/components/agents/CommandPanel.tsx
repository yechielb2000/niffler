import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { PresetCommand } from '../../api';
import { StatusBadge } from '../shared/StatusBadge';

interface Props {
  commands: PresetCommand[];
  connected: boolean;
  host?: string;
  busy?: string | null;
  error?: string;
  onRun: (id: string) => void;
  onConnect: () => void;
  onDisconnect?: () => void;
}
export function CommandPanel({
  commands,
  connected,
  host,
  busy,
  error,
  onRun,
  onConnect,
  onDisconnect,
}: Props) {
  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={1}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6">Command panel</Typography>
          <Typography variant="body2" color="text.secondary">
            Run approved inventory collection actions. Command text cannot be entered here.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {connected && host ? <StatusBadge status={`Connected · ${host}`} /> : null}
          {connected && onDisconnect ? (
            <Button color="inherit" onClick={onDisconnect}>
              Disconnect
            </Button>
          ) : null}
          <Button variant={connected ? 'outlined' : 'contained'} onClick={onConnect}>
            {connected ? 'Reconnect' : 'Connect over SSH'}
          </Button>
        </Stack>
      </Stack>
      {!connected ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Connect to this system to collect inventory data.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Grid container spacing={2}>
        {commands.map((command) => (
          <Grid item xs={12} sm={6} lg={4} key={command.id}>
            <Card
              variant="outlined"
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Chip size="small" label={command.category} sx={{ mb: 1 }} />
                <Typography variant="subtitle1">{command.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {command.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  disabled={!connected || Boolean(busy)}
                  onClick={() => onRun(command.id)}
                >
                  {busy === command.id ? 'Collecting…' : 'Collect data'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
