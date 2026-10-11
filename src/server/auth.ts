import { Request, Response, NextFunction } from 'express';
import { db, hashApiKey } from './db.js';
import crypto from 'node:crypto';

export interface AuthenticatedParticipant {
  id: string;
  display_name: string;
  platform: string;
  role: string;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      participant?: AuthenticatedParticipant;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];

  let token: string | undefined;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (typeof apiKeyHeader === 'string') {
    token = apiKeyHeader.trim();
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing credentials. Provide Bearer token or X-API-Key header.'
    });
    return;
  }

  const tokenHash = hashApiKey(token);
  const participant = db.prepare(`
    SELECT id, display_name, platform, role, status
    FROM participants
    WHERE api_key_hash = ?
  `).get(tokenHash) as AuthenticatedParticipant | undefined;

  if (!participant) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key or token.'
    });
    return;
  }

  // Update last_seen_at and set status online
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE participants
    SET last_seen_at = ?, status = 'online'
    WHERE id = ?
  `).run(now, participant.id);

  req.participant = participant;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.participant) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.participant.role) && req.participant.role !== 'owner') {
      res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}.`
      });
      return;
    }
    next();
  };
}

export function logAudit(
  eventType: string,
  actor: AuthenticatedParticipant,
  targetType: string,
  targetId: string,
  payload: Record<string, unknown> = {}
): void {
  const auditId = 'aud_' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO audit_events (id, event_type, actor_id, actor_platform, target_type, target_id, payload, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    auditId,
    eventType,
    actor.id,
    actor.platform,
    targetType,
    targetId,
    JSON.stringify(payload),
    new Date().toISOString()
  );
}
