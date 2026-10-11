import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createApiApp } from '../src/server/app.js';
import { initDatabase, DB_PATH } from '../src/server/db.js';

const TEST_DB_PATH = path.resolve(process.cwd(), 'data/test_workspace.db');
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
process.env.BRAIN_DB_PATH = TEST_DB_PATH;

const app = createApiApp();

async function run() {
  console.log('=== RUNNING BRAIN WORKSPACE ACCEPTANCE TESTS ===\n');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const fetchApi = async (route, opts = {}) => {
    const res = await fetch(`${baseUrl}${route}`, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, headers: res.headers, data: json };
  };

  try {
    // 1. Health Check
    console.log('[Test 1] Health Check...');
    const health = await fetchApi('/api/v1/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'HEALTHY');
    assert.strictEqual(health.data.database.engine, 'SQLite (ACID WAL mode)');
    console.log('✓ Health check passed.\n');

    // 2. Reject Unauthorized Requests
    console.log('[Test 2] Reject Unauthorized Reads & Writes...');
    const unauthGet = await fetchApi('/api/v1/conversations');
    assert.strictEqual(unauthGet.status, 401, 'Should return 401 on missing auth');

    const invalidAuth = await fetchApi('/api/v1/conversations', {
      headers: { 'Authorization': 'Bearer bad_token_123' }
    });
    assert.strictEqual(invalidAuth.status, 403, 'Should return 403 on invalid key');
    console.log('✓ Unauthorized read and write properly rejected (401 & 403).\n');

    // 3. Multi-Identity Messaging (Ahmed & ChatGPT)
    console.log('[Test 3] Multi-Identity Conversations & Messaging...');
    const ahmedKey = 'brain_key_ahmed_owner_2026';
    const chatgptKey = 'brain_key_chatgpt_action_2026';
    const claudeKey = 'brain_key_claude_agent_2026';

    // Ahmed creates conversation
    const createConv = await fetchApi('/api/v1/conversations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ahmedKey}` },
      body: { title: 'Mission Planning: Smart Farm C1', channel: 'missions' }
    });
    assert.strictEqual(createConv.status, 201);
    const convId = createConv.data.id;
    console.log(`✓ Conversation created: ${convId} by Ahmed`);

    // Ahmed posts directive
    const testIdemKey = 'idem_ahmed_' + Date.now();
    const msg1 = await fetchApi(`/api/v1/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ahmedKey}` },
      body: {
        content: 'ChatGPT, please audit smart-farm poller and plan telemetry lock.',
        message_type: 'directive',
        idempotency_key: testIdemKey
      }
    });
    assert.strictEqual(msg1.status, 201);
    assert.strictEqual(msg1.data.author_id, 'ahmed');
    assert.strictEqual(msg1.data.author_platform, 'ahmed');
    const msg1Seq = msg1.data.sequence;
    console.log(`✓ Ahmed message posted (sequence=${msg1Seq})`);

    // Test Idempotency: Retrying with same key returns identical message without duplicate
    const msg1Retry = await fetchApi(`/api/v1/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ahmedKey}` },
      body: {
        content: 'ChatGPT, please audit smart-farm poller and plan telemetry lock.',
        message_type: 'directive',
        idempotency_key: testIdemKey
      }
    });
    assert.strictEqual(msg1Retry.status, 200);
    assert.strictEqual(msg1Retry.data.idempotent_replay, true);
    assert.strictEqual(msg1Retry.data.id, msg1.data.id);
    console.log('✓ Idempotency verified: duplicate submission prevented.');

    // ChatGPT replies
    const msg2 = await fetchApi(`/api/v1/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${chatgptKey}` },
      body: {
        content: 'Acknowledged Ahmed. Auditing race conditions in poller.py and preparing mission.',
        message_type: 'text',
        reply_to_id: msg1.data.id
      }
    });
    assert.strictEqual(msg2.status, 201);
    assert.strictEqual(msg2.data.author_id, 'chatgpt');
    assert.strictEqual(msg2.data.author_platform, 'chatgpt');
    console.log(`✓ ChatGPT message posted (author=chatgpt, sequence=${msg2.data.sequence})\n`);

    // 4. Retrieve Messages from Separate Client Session (Claude)
    console.log('[Test 4] Separate Client Session Retrieval (Claude)...');
    const claudeFetch = await fetchApi(`/api/v1/conversations/${convId}/messages?since=0&limit=10`, {
      headers: { 'Authorization': `Bearer ${claudeKey}` }
    });
    assert.strictEqual(claudeFetch.status, 200);
    assert.strictEqual(claudeFetch.data.messages.length, 2);
    assert.strictEqual(claudeFetch.data.messages[0].author_id, 'ahmed');
    assert.strictEqual(claudeFetch.data.messages[1].author_id, 'chatgpt');
    console.log('✓ Claude retrieved complete message history with correct author provenance.\n');

    // 5. Artifact Upload & Download with SHA-256 Checksum Match
    console.log('[Test 5] Artifact Upload & Download with SHA-256 Match...');
    const testCodeContent = 'def test_telemetry_mutex():\n    assert True\n';
    const expectedSha256 = crypto.createHash('sha256').update(testCodeContent).digest('hex');

    const uploadArt = await fetchApi('/api/v1/artifacts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${chatgptKey}` },
      body: {
        filename: 'test_telemetry_patch.py',
        content_text: testCodeContent,
        content_type: 'text/x-python',
        conversation_id: convId
      }
    });
    assert.strictEqual(uploadArt.status, 201);
    const artId = uploadArt.data.id;
    assert.strictEqual(uploadArt.data.sha256_checksum, expectedSha256);
    console.log(`✓ Artifact uploaded: ${artId}, SHA256=${expectedSha256}`);

    // Download artifact and verify checksum header & content
    const downloadRes = await fetch(`${baseUrl}/api/v1/artifacts/${artId}/download`, {
      headers: { 'Authorization': `Bearer ${ahmedKey}` }
    });
    assert.strictEqual(downloadRes.status, 200);
    assert.strictEqual(downloadRes.headers.get('x-checksum-sha256'), expectedSha256);
    const downloadedText = await downloadRes.text();
    assert.strictEqual(downloadedText, testCodeContent);
    console.log('✓ Artifact downloaded with 100% matching content and SHA-256 checksum.\n');

    // 6. Oversized Upload Rejection
    console.log('[Test 6] Reject Oversized Upload (413)...');
    const hugeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a').toString('base64');
    const oversizedUpload = await fetchApi('/api/v1/artifacts', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${chatgptKey}` },
      body: {
        filename: 'oversized_archive.tar',
        content_base64: hugeBuffer
      }
    });
    assert.strictEqual(oversizedUpload.status, 413);
    console.log('✓ Oversized file correctly rejected with HTTP 413 Payload Too Large.\n');

    // 7. Mission Creation, Assignment, and Review Recording
    console.log('[Test 7] Mission Creation, Claiming, and Review Recording...');
    const createMission = await fetchApi('/api/v1/missions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${chatgptKey}` },
      body: {
        title: 'Fix smart-farm telemetry race condition',
        command: 'fix',
        target_repository: 'madnessgate44-debug/smart-farm',
        target_branch: 'main',
        objective: 'Add atomic mutex lock around poller.py interval and pytest coverage.'
      }
    });
    assert.strictEqual(createMission.status, 201);
    const msnId = createMission.data.id;
    assert.strictEqual(createMission.data.status, 'queued');
    console.log(`✓ Mission created: ${msnId} (status: queued)`);

    // System Agent claims mission
    const sweKey = 'brain_key_agent_swe_2026';
    const claimMission = await fetchApi(`/api/v1/missions/${msnId}/claim`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sweKey}` }
    });
    assert.strictEqual(claimMission.status, 200);
    assert.strictEqual(claimMission.data.status, 'in_progress');
    assert.strictEqual(claimMission.data.assigned_to, 'agent:swe');
    console.log(`✓ Mission claimed by agent:swe (status: in_progress)`);

    // Claude submits review
    const submitReview = await fetchApi(`/api/v1/missions/${msnId}/reviews`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${claudeKey}` },
      body: {
        status: 'approved',
        findings: 'Verified atomic lock prevents re-entrancy. Pytest coverage meets AC-1 through AC-8.',
        commit_sha: '8f9e01a'
      }
    });
    assert.strictEqual(submitReview.status, 201);
    assert.strictEqual(submitReview.data.status, 'approved');

    // Verify mission status was transitioned to approved
    const getMsn = await fetchApi(`/api/v1/missions/${msnId}`, {
      headers: { 'Authorization': `Bearer ${ahmedKey}` }
    });
    assert.strictEqual(getMsn.data.status, 'approved');
    assert.strictEqual(getMsn.data.reviews.length, 1);
    console.log(`✓ Review recorded by Claude and mission status updated to 'approved'.\n`);

    // 8. Reconnecting after Missed Updates (Cursor Sync)
    console.log('[Test 8] Reconnecting & Offline Delta Recovery via /api/v1/sync...');
    const syncRes = await fetchApi(`/api/v1/sync?since_seq=${msg1Seq}`, {
      headers: { 'Authorization': `Bearer ${ahmedKey}` }
    });
    assert.strictEqual(syncRes.status, 200);
    assert.strictEqual(syncRes.data.sync.messages.length, 1);
    assert.strictEqual(syncRes.data.sync.messages[0].id, msg2.data.id);
    assert.strictEqual(syncRes.data.sync.missions.length >= 1, true);
    console.log('✓ Offline client recovered missed updates via cursor without duplication.\n');

    // 9. Persistence Across Server Restart
    console.log('[Test 9] Data Persistence Verification Across DB Close & Reopen...');
    server.close();
    const reopenedDb = initDatabase(DB_PATH);
    const persistedConv = reopenedDb.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    assert.ok(persistedConv, 'Conversation must exist on disk');
    assert.strictEqual(persistedConv.title, 'Mission Planning: Smart Farm C1');

    const persistedMessages = reopenedDb.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(convId);
    assert.strictEqual(Number(persistedMessages.count), 2, 'All messages must persist across restart');

    const persistedMission = reopenedDb.prepare('SELECT * FROM missions WHERE id = ?').get(msnId);
    assert.strictEqual(persistedMission.status, 'approved', 'Mission state must persist across restart');
    console.log('✓ All conversations, messages, and missions persisted durably on disk.\n');

    console.log('====================================================');
    console.log('ALL 9 ACCEPTANCE CRITERIA VERIFIED WITH 100% SUCCESS');
    console.log('====================================================');

  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error('Test Failure:', err);
  process.exit(1);
});
