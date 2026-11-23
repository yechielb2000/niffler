import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { Task } from '../../api';

export function TasksTab({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return <Typography color="text.secondary">No recorded activity.</Typography>;

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Record ID</TableCell>
            <TableCell>Activity</TableCell>
            <TableCell>Schedule</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.task_id}>
              <TableCell>{task.task_id}</TableCell>
              <TableCell>{task.module_name}</TableCell>
              <TableCell>{task.schedule_type ?? '—'}</TableCell>
              <TableCell>
                <Chip label={task.status ?? 'Unknown'} size="small" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
