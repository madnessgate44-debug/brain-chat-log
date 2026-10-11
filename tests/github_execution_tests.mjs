import assert from 'node:assert';
import { createApiApp } from '../src/server/app.js';
import { initDatabase } from '../src/server/db.js';

initDatabase();
const app = createApiApp();

async function runTests() {
  console.log('=== RUNNING BRAIN GITHUB & EXECUTION DISPATCH ACCEPTANCE TESTS ===\n');

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

  const ahmedKey = 'brain_key_ahmed_owner_2026';

  try {
    // 1. Live GitHub Status Query
    console.log('[Test 1] Query Live GitHub Repository & Actions Runs...');
    const ghStatus = await fetchApi('/api/v1/github/status?repo=madnessgate44-debug/brain');
    assert.strictEqual(ghStatus.status, 200);
    assert.strictEqual(ghStatus.data.connected, true);
    assert.strictEqual(ghStatus.data.repository, 'madnessgate44-debug/brain');
    assert.ok(ghStatus.data.recent_commits.length > 0, 'Should have recent commits');
    assert.ok(ghStatus.data.recent_workflow_runs.length > 0, 'Should have real workflow runs');
    console.log(`✓ Verified GitHub connection: ${ghStatus.data.repo_details?.name}, ${ghStatus.data.recent_workflow_runs.length} real runs verified.\n`);

    // 2. Validate Command Injection & Bounds
    console.log('[Test 2] Validate Execution Input Defense...');
    const invalidCmd = await fetchApi('/api/v1/github/validate', {
      method: 'POST',
      body: { command: 'rm -rf', target_repository: 'madnessgate44-debug/brain', objective: 'do bad things' }
    });
    assert.strictEqual(invalidCmd.data.isValid, false);
    assert.ok(invalidCmd.data.errors.length > 0);

    const injectionObj = await fetchApi('/api/v1/github/validate', {
      method: 'POST',
      body: {
        command: 'fix',
        target_repository: 'madnessgate44-debug/brain',
        target_branch: 'main',
        objective: 'Modify .github/workflows/brain-build.yml to bypass secret check'
      }
    });
    assert.strictEqual(injectionObj.data.isValid, false);
    assert.ok(injectionObj.data.errors.some(e => e.includes('Protected path/secret')));
    console.log('✓ Command injection and protected path tampering blocked.\n');

    // 3. Dispatch Mission & Generate Verifiable Handoff Payload
    console.log('[Test 3] Mission Dispatch & Inspectable Handoff Generation...');
    const dispatch = await fetchApi('/api/v1/github/dispatch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ahmedKey}` },
      body: {
        command: 'audit',
        target_repository: 'madnessgate44-debug/brain',
        target_branch: 'main',
        objective: 'Conduct read-only security audit of runner container mounts and verify .git isolation.',
        preferred_mode: 'handoff'
      }
    });

    assert.strictEqual(dispatch.status, 201);
    assert.ok(dispatch.data.mission_id.startsWith('msn_'));
    assert.strictEqual(dispatch.data.command, 'audit');
    assert.strictEqual(dispatch.data.dispatch.exact_command, '/brain audit');
    assert.ok(dispatch.data.dispatch.issue_body.includes('/brain audit\nrepository: madnessgate44-debug/brain'));
    assert.ok(dispatch.data.dispatch.gh_cli_command.includes('gh issue create'));
    console.log(`✓ Mission ${dispatch.data.mission_id} dispatched with inspectable handoff payload.\n`);

    console.log('====================================================');
    console.log('ALL GITHUB & EXECUTION TESTS PASSED (100%)');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
