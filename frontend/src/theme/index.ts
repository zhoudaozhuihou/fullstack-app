import { createTheme } from '@mui/material/styles';

/** Single source of truth for colors/typography. Tailwind side maps the same palette. */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
});
