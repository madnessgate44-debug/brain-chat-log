import express, { Request, Response, NextFunction } from 'express';
import { conversationsRouter } from './routes/conversations.js';
import { missionsRouter } from './routes/missions.js';
import { artifactsRouter } from './routes/artifacts.js';
import { syncRouter } from './routes/sync.js';
import { participantsRouter } from './routes/participants.js';
import { openApiSpec } from './openapi.js';
import { db } from './db.js';

export function createApiApp(): express.Express {
  const app = express();

  // Security and JSON body parser with 12MB limit for code/patches
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  // Basic CORS support
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Public Health Check (No secrets disclosed)
  app.get('/api/v1/health', (req: Request, res: Response) => {
    try {
      const convCount = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as any;
      const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get() as any;
      const msnCount = db.prepare('SELECT COUNT(*) as count FROM missions').get() as any;
      const artCount = db.prepare('SELECT COUNT(*) as count FROM artifacts').get() as any;

      res.json({
        status: 'HEALTHY',
        service: 'Brain Shared Collaboration Workspace',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime_seconds: process.uptime(),
        database: {
          engine: 'SQLite (ACID WAL mode)',
          conversations: convCount.count,
          messages: msgCount.count,
          missions: msnCount.count,
          artifacts: artCount.count
        }
      });
    } catch (err: any) {
      res.status(500).json({ status: 'UNHEALTHY', error: err.message });
    }
  });

  // OpenAPI 3.1 Spec Endpoint
  app.get('/api/v1/openapi.json', (req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // API v1 Routers
  app.use('/api/v1/conversations', conversationsRouter);
  app.use('/api/v1/missions', missionsRouter);
  app.use('/api/v1/artifacts', artifactsRouter);
  app.use('/api/v1/sync', syncRouter);
  app.use('/api/v1/participants', participantsRouter);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Payload Too Large', message: 'Upload body exceeded size limit.' });
      return;
    }
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected server error occurred.' });
  });

  return app;
}
