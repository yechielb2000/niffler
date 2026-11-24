import { createTheme } from '@mui/material/styles';

export const lightPalette = {
  mode: 'light' as const,
  primary: { main: '#05668d' }, // Baltic Blue
  secondary: { main: '#028090' }, // Teal
  success: { main: '#00a896' }, // Verdigris
  info: { main: '#02c39a' }, // Mint Leaf
  warning: { main: '#f0f3bd' }, // Cream
};

export const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#74b3ce' }, // Sky Reflection
  secondary: { main: '#508991' }, // Pacific Cyan
  background: { default: '#172a3a', paper: '#004346' }, // Jet Black, Dark Teal
  success: { main: '#09bc8a' }, // Mint Leaf
};

export const lightTheme = createTheme({ palette: lightPalette, shape: { borderRadius: 14 } });
export const darkTheme = createTheme({ palette: darkPalette, shape: { borderRadius: 14 } });

// Keep the existing application appearance while making both schemes available centrally.
export const theme = darkTheme;
