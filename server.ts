import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createApiApp } from './src/server/app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

async function startServer() {
  const app = createApiApp();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // In dev: mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Brain Server] Mounted Vite development middleware.');
  } else {
    // In production: serve built static files from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
          next();
          return;
        }
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log('[Brain Server] Serving production build from dist.');
    }
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Brain Server] Running on http://${HOST}:${PORT}`);
    console.log(`[Brain Server] Health: http://${HOST}:${PORT}/api/v1/health`);
    console.log(`[Brain Server] OpenAPI: http://${HOST}:${PORT}/api/v1/openapi.json`);
  });

  const shutdown = () => {
    console.log('[Brain Server] Graceful shutdown initiated...');
    server.close(() => {
      console.log('[Brain Server] Closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('[Brain Server] Fatal startup error:', err);
  process.exit(1);
});
