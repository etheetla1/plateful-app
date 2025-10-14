import { Hono } from 'hono';
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'plateful-api',
  });
});

export const GET = handle(app);

