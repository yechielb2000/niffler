import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { AppBar, Box, Chip, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink, Route, Routes } from 'react-router-dom';

import { AgentDetailPage } from './pages/agents/AgentDetailPage';
import { AgentListPage } from './pages/agents/AgentListPage';
import type { ThemeMode } from './theme';

export default function App({
  themeMode,
  onThemeToggle,
}: {
  themeMode: ThemeMode;
  onThemeToggle: () => void;
}) {
  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar>
          <Stack
            component={RouterLink}
            to="/"
            aria-label="Niffler home"
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{ color: 'inherit', textDecoration: 'none' }}
          >
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              NIFFELER
            </Typography>
            <Chip
              label="OP"
              size="small"
              color="info"
              sx={{ height: 22, '& .MuiChip-label': { px: 0.75 } }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' }, letterSpacing: '.04em' }}
            >
              CYBER OPERATIONS PLATFORM
            </Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton
              color="primary"
              onClick={onThemeToggle}
              aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
              aria-pressed={themeMode === 'dark'}
            >
              {themeMode === 'light' ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Routes>
        <Route path="/" element={<AgentListPage />} />
        <Route path="/agents/:agentId" element={<AgentDetailPage />} />
      </Routes>
    </>
  );
}
