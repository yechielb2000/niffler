import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import App from './App';
import './styles.css';

const theme = createTheme({
  palette: { mode: 'dark', primary: { main: '#38bdf8' }, secondary: { main: '#818cf8' } },
  shape: { borderRadius: 14 },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
