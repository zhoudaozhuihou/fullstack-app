import { Button, Stack, Typography } from '@mui/material';

/** Demo page showing the MUI (components) + Tailwind (layout) split. */
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <Stack spacing={2} className="items-center rounded-xl bg-white p-8 shadow-md">
        <Typography variant="h4" component="h1">
          Fullstack App
        </Typography>
        <Typography variant="body1" color="text.secondary">
          React 18 + MUI + Tailwind 前端骨架已就绪
        </Typography>
        <Button variant="contained" onClick={() => window.open('/docs/api/auth.md', '_blank')}>
          查看示例任务
        </Button>
      </Stack>
    </main>
  );
}
