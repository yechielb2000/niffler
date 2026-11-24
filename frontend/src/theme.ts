import { alpha, createTheme, type PaletteOptions } from '@mui/material/styles';
import type { CSSProperties } from 'react';

export type ThemeMode = 'light' | 'dark';

interface SurfaceTokens {
  elevated: string;
  hover: string;
  selected: string;
  borderSubtle: string;
  textMuted: string;
  textInverse: string;
  accentHover: string;
  accentSubtle: string;
  neutral: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    surfaces: SurfaceTokens;
  }

  interface PaletteOptions {
    surfaces?: SurfaceTokens;
  }

  interface TypographyVariants {
    technical: CSSProperties;
  }

  interface TypographyVariantsOptions {
    technical?: CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    technical: true;
  }
}

export const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: '#087F8C',
    light: '#066B77',
    dark: '#066B77',
    contrastText: '#FFFFFF',
  },
  secondary: { main: '#687786', contrastText: '#FFFFFF' },
  success: { main: '#238A68', light: '#E8F4EF', dark: '#17664B', contrastText: '#FFFFFF' },
  warning: { main: '#A66B12', light: '#FBF2E2', dark: '#7A4B08', contrastText: '#FFFFFF' },
  error: { main: '#C83F49', light: '#FBEAEC', dark: '#9E2932', contrastText: '#FFFFFF' },
  info: { main: '#087F8C', light: '#E1F2F3', dark: '#066B77', contrastText: '#FFFFFF' },
  background: { default: '#F3F6F8', paper: '#FFFFFF' },
  text: { primary: '#17232D', secondary: '#61717E', disabled: '#8997A2' },
  divider: '#D5DEE5',
  action: {
    hover: '#E9EFF3',
    selected: '#E1F2F3',
    disabled: '#8997A2',
    disabledOpacity: 0.72,
  },
  surfaces: {
    elevated: '#FFFFFF',
    hover: '#E9EFF3',
    selected: '#E1F2F3',
    borderSubtle: '#E9EFF3',
    textMuted: '#8997A2',
    textInverse: '#FFFFFF',
    accentHover: '#066B77',
    accentSubtle: '#E1F2F3',
    neutral: '#687786',
  },
} as const;

export const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: '#36B7C5',
    light: '#55C9D4',
    dark: '#248D99',
    contrastText: '#09232A',
  },
  secondary: { main: '#91A1AE', contrastText: '#0D141B' },
  success: { main: '#42C99A', light: '#183A34', dark: '#75DCB8', contrastText: '#09231D' },
  warning: { main: '#F2B84B', light: '#3A3020', dark: '#F7CD7C', contrastText: '#241A08' },
  error: { main: '#FF6B6B', light: '#3D262B', dark: '#FF9595', contrastText: '#2A1114' },
  info: { main: '#36B7C5', light: '#173942', dark: '#55C9D4', contrastText: '#09232A' },
  background: { default: '#0D141B', paper: '#151F29' },
  text: { primary: '#E7EEF3', secondary: '#91A1AE', disabled: '#647583' },
  divider: '#2B3A47',
  action: {
    hover: '#223340',
    selected: '#173942',
    disabled: '#647583',
    disabledOpacity: 0.72,
  },
  surfaces: {
    elevated: '#1C2A36',
    hover: '#223340',
    selected: '#173942',
    borderSubtle: '#202D38',
    textMuted: '#647583',
    textInverse: '#09232A',
    accentHover: '#55C9D4',
    accentSubtle: '#173942',
    neutral: '#91A1AE',
  },
} as const;

function createAppTheme(palette: PaletteOptions) {
  const isDark = palette.mode === 'dark';
  return createTheme({
    palette,
    shape: { borderRadius: 6 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Arial", sans-serif',
      fontSize: 14,
      h1: { fontSize: 24, fontWeight: 600, lineHeight: 1.35 },
      h2: { fontSize: 24, fontWeight: 600, lineHeight: 1.35 },
      h3: { fontSize: 20, fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: 24, fontWeight: 600, lineHeight: 1.35, letterSpacing: 0 },
      h5: { fontSize: 20, fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: 16, fontWeight: 600, lineHeight: 1.45 },
      subtitle1: { fontSize: 14, fontWeight: 600, lineHeight: 1.45 },
      subtitle2: { fontSize: 13, fontWeight: 600, lineHeight: 1.45 },
      body1: { fontSize: 14, lineHeight: 1.5 },
      body2: { fontSize: 13, lineHeight: 1.5 },
      caption: { fontSize: 12, lineHeight: 1.45 },
      overline: { fontSize: 12, fontWeight: 600, lineHeight: 1.4, letterSpacing: '0.06em' },
      button: { fontSize: 14, fontWeight: 600, textTransform: 'none' },
      technical: {
        fontFamily: '"JetBrains Mono", "Cascadia Code", "Consolas", monospace',
        fontSize: 12,
        lineHeight: 1.5,
        fontWeight: 400,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: (theme) => ({
          html: { colorScheme: theme.palette.mode },
          body: {
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
          },
          '#root': { minHeight: '100vh' },
          '::selection': {
            backgroundColor: theme.palette.surfaces.accentSubtle,
          },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
              scrollBehavior: 'auto !important',
            },
          },
        }),
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          }),
        },
      },
      MuiToolbar: {
        styleOverrides: { root: { minHeight: '56px !important' } },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            backgroundColor: theme.palette.background.paper,
            borderRadius: 8,
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
            boxShadow: 'none',
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            boxShadow: 'none',
            backgroundImage: 'none',
            transition: theme.transitions.create('border-color'),
            '&:hover': { borderColor: theme.palette.primary.main },
          }),
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, '&:last-child': { paddingBottom: 16 } },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            height: 36,
            borderRadius: 4,
            padding: '6px 12px',
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }),
          contained: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
          containedPrimary: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.surfaces.accentHover,
              boxShadow: 'none',
            },
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.surfaces.hover,
            },
          }),
          text: ({ theme }) => ({
            '&:hover': { backgroundColor: theme.palette.surfaces.hover },
          }),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 4,
            '&:hover': { backgroundColor: theme.palette.surfaces.hover },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }),
        },
      },
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            height: 36,
            borderRadius: 4,
            backgroundColor: theme.palette.background.paper,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.text.secondary,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          }),
          input: { padding: '7px 10px', lineHeight: '20px' },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: ({ theme }) => ({ color: theme.palette.text.secondary, fontSize: 13 }),
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: ({ theme }) => ({ color: theme.palette.text.primary, fontSize: 14 }),
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: ({ theme }) => ({ color: theme.palette.text.secondary }),
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { borderRadius: 6 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            padding: '12px',
            fontSize: 13,
          }),
          sizeSmall: { padding: '12px' },
          head: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.secondary,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            height: 44,
            transition: theme.transitions.create('background-color'),
            '&:hover': { backgroundColor: theme.palette.surfaces.hover },
            '&.Mui-selected': {
              backgroundColor: theme.palette.surfaces.selected,
              '&:hover': { backgroundColor: theme.palette.surfaces.selected },
              '& td:first-of-type': {
                borderLeft: `2px solid ${theme.palette.primary.main}`,
                paddingLeft: 10,
              },
            },
            '&:last-child td, &:last-child th': { borderBottom: 0 },
          }),
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 44 },
          indicator: { height: 2, borderRadius: 0 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 44,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'none',
            '&:focus-visible': {
              outline: '2px solid currentColor',
              outlineOffset: -2,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: ({ theme, ownerState }) => ({
            height: 24,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            ...(ownerState.color === 'default'
              ? {
                  backgroundColor: theme.palette.surfaces.hover,
                  color: theme.palette.surfaces.neutral,
                }
              : {}),
          }),
          outlined: ({ theme }) => ({ borderColor: theme.palette.divider }),
          colorSuccess: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.success.main, isDark ? 0.16 : 0.1),
            color: theme.palette.success.main,
          }),
          colorWarning: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.warning.main, isDark ? 0.16 : 0.1),
            color: theme.palette.warning.main,
          }),
          colorError: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.1),
            color: theme.palette.error.main,
          }),
          colorInfo: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.info.main, isDark ? 0.16 : 0.1),
            color: theme.palette.info.main,
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 10,
            backgroundColor: theme.palette.surfaces.elevated,
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none',
          }),
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.surfaces.elevated,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.surfaces.elevated,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.divider,
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 4,
            '&:hover': { backgroundColor: theme.palette.surfaces.hover },
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.surfaces.selected,
              '&:hover': { backgroundColor: theme.palette.surfaces.selected },
            },
          }),
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 6, fontSize: 13 },
          standardSuccess: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.success.main, isDark ? 0.16 : 0.1),
            color: theme.palette.success.dark,
          }),
          standardWarning: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.warning.main, isDark ? 0.16 : 0.1),
            color: theme.palette.warning.dark,
          }),
          standardError: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.1),
            color: theme.palette.error.dark,
          }),
          standardInfo: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.info.main, isDark ? 0.16 : 0.1),
            color: theme.palette.info.dark,
          }),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            borderRadius: 4,
            fontSize: 12,
            maxWidth: 480,
            overflowWrap: 'anywhere',
            backgroundColor: theme.palette.surfaces.elevated,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: ({ theme }) => ({
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.surfaces.hover,
          }),
          bar: { borderRadius: 3 },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.08),
          }),
        },
      },
    },
  });
}

export const lightTheme = createAppTheme(lightPalette);
export const darkTheme = createAppTheme(darkPalette);
export const theme = lightTheme;
