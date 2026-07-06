import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Grid, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';

interface TasksTabProps {
  tasks: any[];
  agentId: string;
  onQueueTask: (moduleName: string, sourceCode: string) => Promise<void> | void;
}

export function TasksTab({ tasks, agentId, onQueueTask }: TasksTabProps) {
  const [moduleName, setModuleName] = useState('system-info');
  const [sourceCode, setSourceCode] = useState('# Inject post-exploitation module instructions here...');
  const [selectedTaskOutput, setSelectedTaskOutput] = useState<string | null>(null);

  const handleQueueTask = async () => {
    await onQueueTask(moduleName, sourceCode);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2.5, bgcolor: '#0b0f19', border: '1px solid #1e293b' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff', fontWeight: 'bold' }}>
            Stage Remote Implantation Task
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Target Module Namespace"
                value={moduleName}
                onChange={(event) => setModuleName(event.target.value)}
                size="small"
                InputLabelProps={{ style: { color: '#64748b' } }}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: '#334155' } } }}
              >
                <MenuItem value="system-info">system-info</MenuItem>
                <MenuItem value="network-config">network-config</MenuItem>
                <MenuItem value="custom-exec">custom-exec</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Module Execution Source Buffer"
                placeholder="# Inject post-exploitation module instructions here..."
                value={sourceCode}
                onChange={(event) => setSourceCode(event.target.value)}
                InputLabelProps={{ style: { color: '#64748b' } }}
                sx={{ '& .MuiOutlinedInput-root': { color: '#fff', fontFamily: 'monospace', '& fieldset': { borderColor: '#334155' } } }}
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="flex-end">
              <Button variant="contained" sx={{ bgcolor: '#06b6d4', color: '#fff' }} onClick={handleQueueTask}>
                Queue Inbound Execution Frame
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper} sx={{ bgcolor: '#0b0f19', border: '1px solid #1e293b' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#1e293b' }}>
              <TableRow>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Task Identity Hash</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Execution Module</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Scheduling Strategy</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Job State</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 'bold' }} align="right">Interrogation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.task_id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#111827' } }}>
                  <TableCell sx={{ color: '#64748b', fontFamily: 'monospace' }}>{task.task_id}</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'medium' }}>{task.module_name}</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>{task.schedule_type ?? task.sched_type}</TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size="small"
                      color={task.status === 'Completed' ? 'success' : task.status === 'Pending' ? 'warning' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text" sx={{ color: '#06b6d4' }} onClick={() => setSelectedTaskOutput(task.output)}>
                      Read Output Buffer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Dialog open={!!selectedTaskOutput} onClose={() => setSelectedTaskOutput(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0b0f19', color: '#fff', borderBottom: '1px solid #1e293b' }}>
          Target Execution Telemetry
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#020617', pt: 2 }}>
          <Box component="pre" sx={{ p: 2, m: 0, bgcolor: '#000', color: '#4ade80', fontFamily: 'monospace', borderRadius: 1, overflowX: 'auto', border: '1px solid #22c55e' }}>
            {selectedTaskOutput || '[System Alert]: Host target returned an empty descriptor chain.'}
          </Box>
        </DialogContent>
      </Dialog>
    </Grid>
  );
}
