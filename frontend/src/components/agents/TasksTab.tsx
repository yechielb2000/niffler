import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';

import type { ConnectionAttempt, Task } from '../../api';
import type { CollectedRecord } from '../data/types';
import { StatusBadge } from '../shared/StatusBadge';
import { formatDateTime, parseTimestamp } from '../../utils/datetime';

interface ActivityEvent {
  id: string;
  time: number | null;
  activity: string;
  result: string;
  details: string;
}

type ActivityColumn = keyof Omit<ActivityEvent, 'id'>;

const COLUMNS: { id: ActivityColumn; label: string }[] = [
  { id: 'time', label: 'Time' },
  { id: 'activity', label: 'Activity' },
  { id: 'result', label: 'Result' },
  { id: 'details', label: 'Details' },
];

export function TasksTab({
  tasks,
  records,
  attempts,
}: {
  tasks: Task[];
  records: CollectedRecord[];
  attempts: ConnectionAttempt[];
}) {
  const [sortBy, setSortBy] = useState<ActivityColumn>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<ActivityColumn, string>>({
    time: '',
    activity: '',
    result: '',
    details: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const events = useMemo<ActivityEvent[]>(
    () =>
      [
        ...records.map((record) => {
          const payload =
            record.payload !== null &&
            typeof record.payload === 'object' &&
            !Array.isArray(record.payload)
              ? (record.payload as Record<string, unknown>)
              : {};
          const label = typeof payload.label === 'string' ? payload.label : record.data_type;
          const associations = [
            record.task_id ? `Task ${record.task_id}` : null,
            record.workflow_id ? `Workflow ${record.workflow_id}` : null,
          ].filter(Boolean);
          return {
            id: `record-${record.id}`,
            time: parseTimestamp(record.collected_at),
            activity: `Data collection · ${label}`,
            result: 'Collected',
            details: [`Record ${record.id}`, ...associations].join(' · '),
          };
        }),
        ...attempts.map((attempt) => ({
          id: `connection-${attempt.id}`,
          time: parseTimestamp(attempt.attempted_at),
          activity: 'SSH connection attempt',
          result: attempt.succeeded ? 'Success' : 'Failed',
          details:
            attempt.reason?.trim() ||
            (attempt.succeeded ? 'Connection established' : 'No failure reason reported'),
        })),
        ...tasks.map((task) => ({
          id: `task-${task.task_id}`,
          time: null,
          activity: task.module_name || 'Task',
          result: task.status?.trim() || 'Recorded',
          details: [`Task ${task.task_id}`, task.schedule_type].filter(Boolean).join(' · '),
        })),
      ].sort((a, b) => {
        if (a.time === null) return b.time === null ? a.id.localeCompare(b.id) : 1;
        if (b.time === null) return -1;
        return b.time - a.time;
      }),
    [records, attempts, tasks],
  );

  const filteredEvents = useMemo(() => {
    const matchesFilters = (event: ActivityEvent) =>
      COLUMNS.every(({ id }) => {
        const filter = filters[id].trim().toLocaleLowerCase();
        if (!filter) return true;
        const value = id === 'time' ? formatDateTime(event.time) : event[id];
        return value.toLocaleLowerCase().includes(filter);
      });

    return events.filter(matchesFilters).sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];
      if (sortBy === 'time') {
        if (left === null) return right === null ? 0 : 1;
        if (right === null) return -1;
      }
      const compared =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left ?? '').localeCompare(String(right ?? ''), undefined, {
              numeric: true,
              sensitivity: 'base',
            });
      return sortBy === 'time' && (left === null || right === null)
        ? compared
        : sortDirection === 'asc'
          ? compared
          : -compared;
    });
  }, [events, filters, sortBy, sortDirection]);
  const visibleEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (!events.length) return <Typography color="text.secondary">No recorded activity.</Typography>;

  const updateFilter = (column: ActivityColumn, value: string) => {
    setFilters((current) => ({ ...current, [column]: value }));
    setPage(0);
  };

  const handleSort = (column: ActivityColumn) => {
    if (sortBy === column) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection(column === 'time' ? 'desc' : 'asc');
    }
    setPage(0);
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {COLUMNS.map(({ id, label }) => (
              <TableCell key={id} sortDirection={sortBy === id ? sortDirection : false}>
                <TableSortLabel
                  active={sortBy === id}
                  direction={sortBy === id ? sortDirection : 'asc'}
                  onClick={() => handleSort(id)}
                >
                  {label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            {COLUMNS.map(({ id, label }) => (
              <TableCell key={id}>
                <TextField
                  size="small"
                  fullWidth
                  value={filters[id]}
                  onChange={(event) => updateFilter(id, event.target.value)}
                  placeholder={`Filter ${label.toLowerCase()}`}
                  inputProps={{ 'aria-label': `Filter by ${label.toLowerCase()}` }}
                />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleEvents.length ? (
            visibleEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {event.time === null ? '—' : formatDateTime(event.time)}
                </TableCell>
                <TableCell>{event.activity}</TableCell>
                <TableCell>
                  {event.result === 'Collected' ? (
                    <Chip label={event.result} color="success" size="small" />
                  ) : (
                    <StatusBadge status={event.result} />
                  )}
                </TableCell>
                <TableCell sx={{ overflowWrap: 'anywhere' }}>{event.details}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={COLUMNS.length} align="center">
                <Typography color="text.secondary">No activity matches these filters.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={filteredEvents.length}
        page={page}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </TableContainer>
  );
}
