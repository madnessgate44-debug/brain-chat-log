import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, logAudit } from '../auth.js';
import crypto from 'node:crypto';

export const conversationsRouter = Router();

// 1. List conversations
conversationsRouter.get('/', authenticate, (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
      (SELECT MAX(created_at) FROM messages m WHERE m.conversation_id = c.id) as last_message_at
    FROM conversations c
    ORDER BY c.updated_at DESC
  `).all();

  res.json({
    conversations: rows.map((r: any) => ({
      ...r,
      metadata: r.metadata ? JSON.parse(r.metadata) : null
    }))
  });
});

// 2. Create conversation
conversationsRouter.post('/', authenticate, (req: Request, res: Response) => {
  const { title, channel = 'general', metadata } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'Validation Error', message: 'Conversation title is required.' });
    return;
  }

  const actor = req.participant!;
  const id = 'conv_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO conversations (id, title, channel, created_by, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, title.trim(), channel.trim(), actor.id, now, now, metadata ? JSON.stringify(metadata) : null);

  logAudit('conversation.create', actor, 'conversation', id, { title });

  res.status(201).json({
    id,
    title: title.trim(),
    channel: channel.trim(),
    created_by: actor.id,
    created_at: now,
    updated_at: now
  });
});

// 3. Get single conversation
conversationsRouter.get('/:id', authenticate, (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    res.status(404).json({ error: 'Not Found', message: 'Conversation not found.' });
    return;
  }
  res.json({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  });
});

// 4. Get messages in conversation (with cursor pagination)
conversationsRouter.get('/:id/messages', authenticate, (req: Request, res: Response) => {
  const convId = req.params.id;
  const sinceSeq = parseInt(req.query.since as string) || 0;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

  const conv = db.prepare('SELECT id FROM conversations WHERE id = ?').get(convId);
  if (!conv) {
    res.status(404).json({ error: 'Not Found', message: 'Conversation not found.' });
    return;
  }

  const rows = db.prepare(`
    SELECT sequence, id, conversation_id, author_id, author_platform,
           content, message_type, reply_to_id, mission_id, artifact_ids,
           created_at
    FROM messages
    WHERE conversation_id = ? AND sequence > ?
    ORDER BY sequence ASC
    LIMIT ?
  `).all(convId, sinceSeq, limit) as any[];

  const nextCursor = rows.length > 0 ? rows[rows.length - 1].sequence : sinceSeq;

  res.json({
    conversation_id: convId,
    messages: rows.map(r => ({
      ...r,
      artifact_ids: r.artifact_ids ? JSON.parse(r.artifact_ids) : []
    })),
    next_cursor: nextCursor,
    has_more: rows.length === limit
  });
});

// 5. Post message to conversation
conversationsRouter.post('/:id/messages', authenticate, (req: Request, res: Response) => {
  const convId = req.params.id;
  const {
    content,
    message_type = 'text',
    reply_to_id,
    mission_id,
    artifact_ids = [],
    idempotency_key
  } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'Validation Error', message: 'Message content cannot be empty.' });
    return;
  }

  const actor = req.participant!;

  // Handle idempotency
  if (idempotency_key && typeof idempotency_key === 'string') {
    const existing = db.prepare('SELECT * FROM messages WHERE idempotency_key = ?').get(idempotency_key) as any;
    if (existing) {
      res.status(200).json({
        ...existing,
        artifact_ids: existing.artifact_ids ? JSON.parse(existing.artifact_ids) : [],
        idempotent_replay: true
      });
      return;
    }
  }

  const conv = db.prepare('SELECT id FROM conversations WHERE id = ?').get(convId);
  if (!conv) {
    res.status(404).json({ error: 'Not Found', message: 'Conversation not found.' });
    return;
  }

  const msgId = 'msg_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO messages (
      id, conversation_id, author_id, author_platform, content,
      message_type, reply_to_id, mission_id, artifact_ids, idempotency_key, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = insert.run(
    msgId,
    convId,
    actor.id,
    actor.platform,
    content.trim(),
    message_type,
    reply_to_id || null,
    mission_id || null,
    JSON.stringify(artifact_ids),
    idempotency_key || null,
    now
  );

  // Update conversation updated_at
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, convId);

  logAudit('message.create', actor, 'message', msgId, { conversation_id: convId, mission_id });

  const sequence = Number(info.lastInsertRowid);

  res.status(201).json({
    sequence,
    id: msgId,
    conversation_id: convId,
    author_id: actor.id,
    author_platform: actor.platform,
    content: content.trim(),
    message_type,
    reply_to_id: reply_to_id || null,
    mission_id: mission_id || null,
    artifact_ids,
    created_at: now
  });
});
