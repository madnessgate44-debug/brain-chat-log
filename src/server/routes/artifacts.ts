import { Router, Request, Response } from 'express';
import { db, ARTIFACTS_DIR } from '../db.js';
import { authenticate, logAudit } from '../auth.js';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

export const artifactsRouter = Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFilename(name: string): string {
  // Strip paths, null bytes, backslashes
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

// 1. Upload Artifact (Base64 or text)
artifactsRouter.post('/', authenticate, (req: Request, res: Response) => {
  const {
    filename,
    content_base64,
    content_text,
    content_type = 'application/octet-stream',
    mission_id,
    conversation_id,
    metadata
  } = req.body;

  if (!filename || (!content_base64 && content_text === undefined)) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Filename and either content_base64 or content_text are required.'
    });
    return;
  }

  const safeName = sanitizeFilename(filename);
  if (!safeName) {
    res.status(400).json({ error: 'Validation Error', message: 'Invalid filename.' });
    return;
  }

  let buffer: Buffer;
  try {
    if (content_base64) {
      buffer = Buffer.from(content_base64, 'base64');
    } else {
      buffer = Buffer.from(content_text, 'utf-8');
    }
  } catch (err: any) {
    res.status(400).json({ error: 'Validation Error', message: 'Failed to decode file payload.' });
    return;
  }

  if (buffer.length > MAX_FILE_SIZE) {
    res.status(413).json({
      error: 'Payload Too Large',
      message: `File size (${buffer.length} bytes) exceeds maximum allowable limit (${MAX_FILE_SIZE} bytes).`
    });
    return;
  }

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const artifactId = 'art_' + crypto.randomUUID().replace(/-/g, '').slice(0, 14);
  const storageFilename = `${sha256}_${safeName}`;
  const storagePath = path.resolve(ARTIFACTS_DIR, storageFilename);

  // Write file to disk
  fs.writeFileSync(storagePath, buffer);

  const actor = req.participant!;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO artifacts (
      id, mission_id, conversation_id, author_id, author_platform,
      filename, content_type, size_bytes, sha256_checksum, storage_path,
      version, metadata, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    artifactId,
    mission_id || null,
    conversation_id || null,
    actor.id,
    actor.platform,
    safeName,
    content_type,
    buffer.length,
    sha256,
    storagePath,
    metadata ? JSON.stringify(metadata) : null,
    now
  );

  logAudit('artifact.upload', actor, 'artifact', artifactId, { filename: safeName, size_bytes: buffer.length, sha256 });

  res.status(201).json({
    id: artifactId,
    filename: safeName,
    content_type,
    size_bytes: buffer.length,
    sha256_checksum: sha256,
    mission_id: mission_id || null,
    conversation_id: conversation_id || null,
    author_id: actor.id,
    created_at: now,
    download_url: `/api/v1/artifacts/${artifactId}/download`
  });
});

// 2. List Artifacts
artifactsRouter.get('/', authenticate, (req: Request, res: Response) => {
  const { mission_id, conversation_id } = req.query;

  let query = 'SELECT * FROM artifacts WHERE 1=1';
  const params: any[] = [];

  if (mission_id && typeof mission_id === 'string') {
    query += ' AND mission_id = ?';
    params.push(mission_id);
  }
  if (conversation_id && typeof conversation_id === 'string') {
    query += ' AND conversation_id = ?';
    params.push(conversation_id);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  res.json({
    artifacts: rows.map(r => ({
      id: r.id,
      mission_id: r.mission_id,
      conversation_id: r.conversation_id,
      author_id: r.author_id,
      author_platform: r.author_platform,
      filename: r.filename,
      content_type: r.content_type,
      size_bytes: r.size_bytes,
      sha256_checksum: r.sha256_checksum,
      version: r.version,
      created_at: r.created_at,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      download_url: `/api/v1/artifacts/${r.id}/download`
    }))
  });
});

// 3. Get Artifact Metadata
artifactsRouter.get('/:id', authenticate, (req: Request, res: Response) => {
  const id = req.params.id;
  const artifact = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as any;
  if (!artifact) {
    res.status(404).json({ error: 'Not Found', message: 'Artifact not found.' });
    return;
  }

  res.json({
    id: artifact.id,
    mission_id: artifact.mission_id,
    conversation_id: artifact.conversation_id,
    author_id: artifact.author_id,
    author_platform: artifact.author_platform,
    filename: artifact.filename,
    content_type: artifact.content_type,
    size_bytes: artifact.size_bytes,
    sha256_checksum: artifact.sha256_checksum,
    version: artifact.version,
    created_at: artifact.created_at,
    metadata: artifact.metadata ? JSON.parse(artifact.metadata) : null,
    download_url: `/api/v1/artifacts/${artifact.id}/download`
  });
});

// 4. Download Artifact
artifactsRouter.get('/:id/download', authenticate, (req: Request, res: Response) => {
  const id = req.params.id;
  const artifact = db.prepare('SELECT * FROM artifacts WHERE id = ?').get(id) as any;
  if (!artifact) {
    res.status(404).json({ error: 'Not Found', message: 'Artifact not found.' });
    return;
  }

  if (!fs.existsSync(artifact.storage_path)) {
    res.status(410).json({ error: 'Gone', message: 'Underlying artifact file was moved or deleted from disk.' });
    return;
  }

  res.setHeader('Content-Type', artifact.content_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
  res.setHeader('X-Checksum-SHA256', artifact.sha256_checksum);

  const stream = fs.createReadStream(artifact.storage_path);
  stream.pipe(res);
});
