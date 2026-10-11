import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate } from '../auth.js';

export const participantsRouter = Router();

// 1. List participants & connection health
participantsRouter.get('/', authenticate, (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, display_name, platform, role, status, last_seen_at, metadata
    FROM participants
    ORDER BY id ASC
  `).all() as any[];

  res.json({
    participants: rows.map(r => ({
      ...r,
      metadata: r.metadata ? JSON.parse(r.metadata) : null
    }))
  });
});

// 2. Heartbeat to maintain online status
participantsRouter.post('/heartbeat', authenticate, (req: Request, res: Response) => {
  const actor = req.participant!;
  const { status = 'online', metadata } = req.body;
  const now = new Date().toISOString();

  let query = 'UPDATE participants SET status = ?, last_seen_at = ?';
  const params: any[] = [status, now];

  if (metadata) {
    query += ', metadata = ?';
    params.push(JSON.stringify(metadata));
  }

  query += ' WHERE id = ?';
  params.push(actor.id);

  db.prepare(query).run(...params);

  res.json({
    id: actor.id,
    status,
    last_seen_at: now
  });
});
