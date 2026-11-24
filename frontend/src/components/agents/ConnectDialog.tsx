import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface Props {
  open: boolean;
  saved?: { host?: string | null; port?: number | null; username?: string | null };
  onClose: () => void;
  onConnect: (details: {
    host: string;
    port: number;
    username: string;
    credential?: string;
  }) => Promise<void>;
}

export function ConnectDialog({ open, saved, onClose, onConnect }: Props) {
  const [host, setHost] = useState(saved?.host ?? '');
  const [port, setPort] = useState(String(saved?.port ?? 22));
  const [username, setUsername] = useState(saved?.username ?? '');
  const [credential, setCredential] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onConnect({ host, port: Number(port), username, credential: credential || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Connect to system</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {saved?.host ? (
            <Alert severity="info">
              Saved endpoint: {saved.username}@{saved.host}:{saved.port}. Authentication is
              requested for this session.
            </Alert>
          ) : null}
          <TextField
            label="Host or IP address"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            required
            autoComplete="off"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
            <TextField
              label="SSH username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </Stack>
          <TextField
            label="Password or private key"
            type="password"
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            autoComplete="new-password"
            helperText="Used for this connection only. Credentials are not saved by this app."
          />
          <Typography variant="caption" color="text.secondary">
            SSH credentials stay in this dialog and are not stored in the backend. Saved connection
            details include only host, port, and username.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={busy || !host || !username} onClick={submit}>
          {busy ? 'Connecting…' : 'Connect'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
