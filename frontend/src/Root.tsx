import { CssBaseline, ThemeProvider } from '@mui/material';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';

import App from './App';
import { darkTheme, lightTheme, type ThemeMode } from './theme';

const THEME_STORAGE_KEY = 'niffler-theme-mode';

export default function Root() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedMode === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    setMode(nextMode);
  };

  return (
    <ThemeProvider theme={mode === 'light' ? lightTheme : darkTheme}>
      <CssBaseline />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App themeMode={mode} onThemeToggle={toggleTheme} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
