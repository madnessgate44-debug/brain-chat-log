import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, logAudit } from '../auth.js';
import crypto from 'node:crypto';

export const missionsRouter = Router();

// 1. List missions with filtering
missionsRouter.get('/', authenticate, (req: Request, res: Response) => {
  const { status, assigned_to, repository } = req.query;

  let query = 'SELECT * FROM missions WHERE 1=1';
  const params: any[] = [];

  if (status && typeof status === 'string') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (assigned_to && typeof assigned_to === 'string') {
    query += ' AND assigned_to = ?';
    params.push(assigned_to);
  }
  if (repository && typeof repository === 'string') {
    query += ' AND target_repository = ?';
    params.push(repository);
  }

  query += ' ORDER BY updated_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  res.json({
    missions: rows.map(r => ({
      ...r,
      dependencies: r.dependencies ? JSON.parse(r.dependencies) : []
    }))
  });
});

// 2. Create mission
missionsRouter.post('/', authenticate, (req: Request, res: Response) => {
  const {
    title,
    command,
    target_repository,
    target_branch = 'main',
    objective,
    assigned_to,
    deadline,
    dependencies = []
  } = req.body;

  if (!title || !command || !target_repository || !objective) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Missing required mission fields: title, command, target_repository, objective.'
    });
    return;
  }

  const validCommands = ['build', 'fix', 'audit', 'browse', 'secret', 'merge', 'sync'];
  if (!validCommands.includes(command)) {
    res.status(400).json({
      error: 'Validation Error',
      message: `Invalid command. Must be one of: ${validCommands.join(', ')}`
    });
    return;
  }

  const actor = req.participant!;
  const id = 'msn_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO missions (
      id, title, command, target_repository, target_branch, objective,
      status, assigned_to, creator_id, creator_platform, deadline, dependencies,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title.trim(),
    command,
    target_repository.trim(),
    target_branch.trim(),
    objective.trim(),
    assigned_to || null,
    actor.id,
    actor.platform,
    deadline || null,
    JSON.stringify(dependencies),
    now,
    now
  );

  logAudit('mission.create', actor, 'mission', id, { target_repository, command });

  res.status(201).json({
    id,
    title: title.trim(),
    command,
    target_repository: target_repository.trim(),
    target_branch: target_branch.trim(),
    objective: objective.trim(),
    status: 'queued',
    assigned_to: assigned_to || null,
    creator_id: actor.id,
    creator_platform: actor.platform,
    created_at: now,
    updated_at: now
  });
});

// 3. Get single mission with linked artifacts & reviews
missionsRouter.get('/:id', authenticate, (req: Request, res: Response) => {
  const id = req.params.id;
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as any;
  if (!mission) {
    res.status(404).json({ error: 'Not Found', message: 'Mission not found.' });
    return;
  }

  const artifacts = db.prepare('SELECT id, filename, content_type, size_bytes, sha256_checksum, version, created_at FROM artifacts WHERE mission_id = ?').all(id);
  const reviews = db.prepare('SELECT * FROM reviews WHERE mission_id = ? ORDER BY created_at DESC').all(id);

  res.json({
    ...mission,
    dependencies: mission.dependencies ? JSON.parse(mission.dependencies) : [],
    artifacts,
    reviews
  });
});

// 4. Update mission status / PR URL / execution ref
missionsRouter.patch('/:id', authenticate, (req: Request, res: Response) => {
  const id = req.params.id;
  const { status, assigned_to, execution_ref, pr_url, commit_sha } = req.body;

  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as any;
  if (!mission) {
    res.status(404).json({ error: 'Not Found', message: 'Mission not found.' });
    return;
  }

  const actor = req.participant!;
  const now = new Date().toISOString();

  const updates: string[] = ['updated_at = ?'];
  const params: any[] = [now];

  if (status) {
    const validStatuses = ['draft', 'queued', 'in_progress', 'review_requested', 'approved', 'rejected', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Validation Error', message: `Invalid status: ${status}` });
      return;
    }
    updates.push('status = ?');
    params.push(status);
  }
  if (assigned_to !== undefined) {
    updates.push('assigned_to = ?');
    params.push(assigned_to);
  }
  if (execution_ref !== undefined) {
    updates.push('execution_ref = ?');
    params.push(execution_ref);
  }
  if (pr_url !== undefined) {
    updates.push('pr_url = ?');
    params.push(pr_url);
  }
  if (commit_sha !== undefined) {
    updates.push('commit_sha = ?');
    params.push(commit_sha);
  }

  params.push(id);
  db.prepare(`UPDATE missions SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  logAudit('mission.update', actor, 'mission', id, { status, pr_url, commit_sha });

  const updated = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as any;
  res.json({
    ...updated,
    dependencies: updated.dependencies ? JSON.parse(updated.dependencies) : []
  });
});

// 5. Claim a mission
missionsRouter.post('/:id/claim', authenticate, (req: Request, res: Response) => {
  const id = req.params.id;
  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as any;
  if (!mission) {
    res.status(404).json({ error: 'Not Found', message: 'Mission not found.' });
    return;
  }

  const actor = req.participant!;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE missions
    SET assigned_to = ?, status = 'in_progress', updated_at = ?
    WHERE id = ?
  `).run(actor.id, now, id);

  logAudit('mission.claim', actor, 'mission', id, { assigned_to: actor.id });

  res.json({
    id,
    status: 'in_progress',
    assigned_to: actor.id,
    claimed_at: now
  });
});

// 6. Submit a review
missionsRouter.post('/:id/reviews', authenticate, (req: Request, res: Response) => {
  const missionId = req.params.id;
  const { status, findings, comments, commit_sha } = req.body;

  if (!status || !findings) {
    res.status(400).json({ error: 'Validation Error', message: 'Review requires status and findings.' });
    return;
  }

  const validReviewStatuses = ['pending', 'approved', 'changes_requested', 'rejected'];
  if (!validReviewStatuses.includes(status)) {
    res.status(400).json({ error: 'Validation Error', message: `Invalid review status: ${status}` });
    return;
  }

  const mission = db.prepare('SELECT id FROM missions WHERE id = ?').get(missionId);
  if (!mission) {
    res.status(404).json({ error: 'Not Found', message: 'Mission not found.' });
    return;
  }

  const actor = req.participant!;
  const reviewId = 'rev_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reviews (id, mission_id, reviewer_id, reviewer_platform, status, findings, comments, commit_sha, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(reviewId, missionId, actor.id, actor.platform, status, findings, comments || null, commit_sha || null, now);

  // If approved or rejected, update mission status accordingly
  if (status === 'approved') {
    db.prepare("UPDATE missions SET status = 'approved', updated_at = ? WHERE id = ?").run(now, missionId);
  } else if (status === 'rejected') {
    db.prepare("UPDATE missions SET status = 'rejected', updated_at = ? WHERE id = ?").run(now, missionId);
  }

  logAudit('review.submit', actor, 'review', reviewId, { mission_id: missionId, status });

  res.status(201).json({
    id: reviewId,
    mission_id: missionId,
    reviewer_id: actor.id,
    reviewer_platform: actor.platform,
    status,
    findings,
    comments: comments || null,
    created_at: now
  });
});
