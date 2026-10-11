import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate } from '../auth.js';

export const syncRouter = Router();

// Incremental synchronization for offline recovery
syncRouter.get('/', authenticate, (req: Request, res: Response) => {
  const sinceSeq = parseInt(req.query.since_seq as string) || 0;
  const sinceTs = (req.query.since_ts as string) || '1970-01-01T00:00:00.000Z';
  const convId = req.query.conversation_id as string | undefined;

  let messageQuery = 'SELECT * FROM messages WHERE sequence > ?';
  const messageParams: any[] = [sinceSeq];

  if (convId) {
    messageQuery += ' AND conversation_id = ?';
    messageParams.push(convId);
  }
  messageQuery += ' ORDER BY sequence ASC LIMIT 200';

  const newMessages = db.prepare(messageQuery).all(...messageParams) as any[];

  // Missions updated since timestamp
  const updatedMissions = db.prepare(`
    SELECT * FROM missions
    WHERE updated_at > ?
    ORDER BY updated_at ASC
    LIMIT 100
  `).all(sinceTs) as any[];

  // Artifacts created since timestamp
  const newArtifacts = db.prepare(`
    SELECT id, mission_id, conversation_id, author_id, author_platform,
           filename, content_type, size_bytes, sha256_checksum, version, created_at
    FROM artifacts
    WHERE created_at > ?
    ORDER BY created_at ASC
    LIMIT 100
  `).all(sinceTs) as any[];

  // Reviews created since timestamp
  const newReviews = db.prepare(`
    SELECT * FROM reviews
    WHERE created_at > ?
    ORDER BY created_at ASC
    LIMIT 100
  `).all(sinceTs) as any[];

  // Participant presence status
  const participants = db.prepare(`
    SELECT id, display_name, platform, role, status, last_seen_at
    FROM participants
  `).all();

  const maxSeqRow = db.prepare('SELECT MAX(sequence) as max_seq FROM messages').get() as any;
  const currentSeq = maxSeqRow?.max_seq || 0;

  res.json({
    current_seq: currentSeq,
    server_time: new Date().toISOString(),
    sync: {
      messages: newMessages.map(m => ({
        ...m,
        artifact_ids: m.artifact_ids ? JSON.parse(m.artifact_ids) : []
      })),
      missions: updatedMissions.map(m => ({
        ...m,
        dependencies: m.dependencies ? JSON.parse(m.dependencies) : []
      })),
      artifacts: newArtifacts.map(a => ({
        ...a,
        download_url: `/api/v1/artifacts/${a.id}/download`
      })),
      reviews: newReviews,
      participants
    }
  });
});
