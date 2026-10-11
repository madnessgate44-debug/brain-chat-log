import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ARTIFACTS_DIR = path.resolve(DATA_DIR, 'artifacts');
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

const DB_PATH = process.env.BRAIN_DB_PATH || path.resolve(DATA_DIR, 'brain_workspace.db');

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key.trim()).digest('hex');
}

export function initDatabase(dbPath = DB_PATH): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // 1. Participants
  db.exec(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      role TEXT NOT NULL,
      api_key_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      last_seen_at TEXT,
      metadata TEXT
    );
  `);

  // 2. Conversations
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'general',
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      metadata TEXT
    );
  `);

  // 3. Messages (with monotonic sequence for cursor-based sync)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT UNIQUE NOT NULL,
      conversation_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_platform TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text',
      reply_to_id TEXT,
      mission_id TEXT,
      artifact_ids TEXT,
      idempotency_key TEXT UNIQUE,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conv_seq ON messages (conversation_id, sequence);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);
  `);

  // 4. Missions
  db.exec(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      command TEXT NOT NULL,
      target_repository TEXT NOT NULL,
      target_branch TEXT NOT NULL DEFAULT 'main',
      objective TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      assigned_to TEXT,
      creator_id TEXT NOT NULL,
      creator_platform TEXT NOT NULL,
      deadline TEXT,
      execution_ref TEXT,
      pr_url TEXT,
      commit_sha TEXT,
      dependencies TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      sequence INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_missions_status ON missions (status);
  `);

  // 5. Artifacts (code files, patches, logs, reports)
  db.exec(`
    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      mission_id TEXT,
      conversation_id TEXT,
      author_id TEXT NOT NULL,
      author_platform TEXT NOT NULL,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256_checksum TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      metadata TEXT,
      created_at TEXT NOT NULL,
      sequence INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_artifacts_mission ON artifacts (mission_id);
    CREATE INDEX IF NOT EXISTS idx_artifacts_checksum ON artifacts (sha256_checksum);
  `);

  // 6. Review Requests and Findings
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewer_platform TEXT NOT NULL,
      status TEXT NOT NULL,
      findings TEXT NOT NULL,
      comments TEXT,
      commit_sha TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
    );
  `);

  // 7. Audit Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_events (
      sequence INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT UNIQUE NOT NULL,
      event_type TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_platform TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      payload TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Pre-seed known identities with pre-defined API keys (hashed)
  const defaultParticipants = [
    {
      id: 'ahmed',
      display_name: 'Ahmed (Owner)',
      platform: 'ahmed',
      role: 'owner',
      rawKey: 'brain_key_ahmed_owner_2026',
      metadata: JSON.stringify({ device: 'Android Pixel 8 Pro', access: 'full_admin' })
    },
    {
      id: 'chatgpt',
      display_name: 'ChatGPT Lead Co-Founder',
      platform: 'chatgpt',
      role: 'architect_orchestrator',
      rawKey: 'brain_key_chatgpt_action_2026',
      metadata: JSON.stringify({ connector: 'Custom GPT Action / Webhook', model: 'gpt-4o' })
    },
    {
      id: 'claude',
      display_name: 'Claude Senior Reviewer',
      platform: 'claude',
      role: 'auditor_architect',
      rawKey: 'brain_key_claude_agent_2026',
      metadata: JSON.stringify({ connector: 'MCP / REST Tool Bridge', model: 'claude-3-7-sonnet' })
    },
    {
      id: 'aistudio',
      display_name: 'Google AI Studio Engine',
      platform: 'aistudio',
      role: 'host_engine',
      rawKey: 'brain_key_aistudio_runner_2026',
      metadata: JSON.stringify({ hosting: 'Google Cloud Run', runtime: 'Node.js 22 / Express' })
    },
    {
      id: 'agent:swe',
      display_name: 'Autonomous SWE Agent',
      platform: 'system_agent',
      role: 'coder',
      rawKey: 'brain_key_agent_swe_2026',
      metadata: JSON.stringify({ sandbox: 'docker:brain-build-sandbox' })
    },
    {
      id: 'agent:tamayim',
      display_name: 'Tamayim Browser Engine',
      platform: 'system_agent',
      role: 'web_agent',
      rawKey: 'brain_key_agent_tamayim_2026',
      metadata: JSON.stringify({ engine: 'Playwright Chromium Stealth' })
    },
    {
      id: 'agent:auditor',
      display_name: 'Security & QA Auditor',
      platform: 'system_agent',
      role: 'auditor',
      rawKey: 'brain_key_agent_auditor_2026',
      metadata: JSON.stringify({ tools: ['gitleaks', 'pytest', 'diff-check'] })
    },
    {
      id: 'agent:gatekeeper',
      display_name: 'DevOps & Release Gatekeeper',
      platform: 'system_agent',
      role: 'devops',
      rawKey: 'brain_key_agent_gatekeeper_2026',
      metadata: JSON.stringify({ capabilities: ['secrets_encryption', 'branch_merge'] })
    }
  ];

  const insertParticipant = db.prepare(`
    INSERT INTO participants (id, display_name, platform, role, api_key_hash, status, metadata)
    VALUES (?, ?, ?, ?, ?, 'offline', ?)
    ON CONFLICT(id) DO UPDATE SET
      display_name = excluded.display_name,
      role = excluded.role,
      api_key_hash = excluded.api_key_hash,
      metadata = excluded.metadata
  `);

  for (const p of defaultParticipants) {
    insertParticipant.run(p.id, p.display_name, p.platform, p.role, hashApiKey(p.rawKey), p.metadata);
  }

  // Pre-seed default main conversation thread
  db.prepare(`
    INSERT INTO conversations (id, title, channel, created_by, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `).run(
    'conv_main',
    'Brain Ecosystem Multi-Agent Workspace',
    'general',
    'ahmed',
    new Date().toISOString(),
    new Date().toISOString(),
    JSON.stringify({ repo: 'madnessgate44-debug/brain', topic: 'Cross-platform collaboration' })
  );

  return db;
}

export const db = initDatabase();
export { ARTIFACTS_DIR, DB_PATH };
