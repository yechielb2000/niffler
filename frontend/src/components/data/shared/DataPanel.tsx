import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { ReactNode } from 'react';

export function DataPanel({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2 },
        height: '100%',
        transition: (theme) => theme.transitions.create(['border-color', 'box-shadow']),
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          mb: 1.5,
        }}
      >
        <Box>
          <Typography variant="subtitle1">{title}</Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  );
}

export function EmptyData({ children = 'No data in this snapshot.' }: { children?: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
      {children}
    </Typography>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  mono = false,
  title,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  mono?: boolean;
  title?: string;
}) {
  return (
    <Paper
      variant="outlined"
      title={title}
      sx={(theme) => ({
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        height: '100%',
        overflow: 'hidden',
        transition: theme.transitions.create(['border-color', 'background-color']),
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 3,
          bgcolor: 'primary.main',
          opacity: 0,
          transition: theme.transitions.create('opacity'),
        },
        '&:hover': {
          borderColor: 'primary.light',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.025),
        },
        '&:hover::before': { opacity: 1 },
      })}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', lineHeight: 1.4 }}
      >
        {label}
      </Typography>
      <Typography
        component="div"
        variant="h5"
        sx={{
          mt: 0.35,
          fontSize: { xs: 18, md: 20 },
          fontWeight: 600,
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
          overflowWrap: 'anywhere',
          ...(mono
            ? {
                fontFamily: '"JetBrains Mono", "Cascadia Code", "Consolas", monospace',
                fontSize: { xs: 15, md: 16 },
              }
            : {}),
        }}
      >
        {value}
      </Typography>
      {detail ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 'auto', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}
        >
          {detail}
        </Typography>
      ) : null}
    </Paper>
  );
}
