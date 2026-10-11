import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, logAudit } from '../auth.js';
import crypto from 'node:crypto';

export const githubRouter = Router();

// In-memory cache for GitHub API data to avoid rate limits
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 15000; // 15 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, cachedAt: Date.now() });
}

function getGitHubAuthHeaders(req: Request): Record<string, string> {
  const token =
    (req.headers['x-github-token'] as string) ||
    process.env.BRAIN_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN;

  const headers: Record<string, string> = {
    'User-Agent': 'Brain-X-Collaboration-Engine/1.0',
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token && token.trim().length > 0) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  return headers;
}

// 1. Live GitHub Status & Workflow Runs
githubRouter.get('/status', async (req: Request, res: Response) => {
  const repo = (req.query.repo as string) || 'madnessgate44-debug/brain';

  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
    res.status(400).json({ error: 'Validation Error', message: 'Invalid repository format (must be owner/repo).' });
    return;
  }

  const cacheKey = `status:${repo}`;
  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const headers = getGitHubAuthHeaders(req);

  try {
    const [repoRes, commitsRes, prsRes, runsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=5`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/actions/runs?per_page=6`, { headers })
    ]);

    const repoInfo = repoRes.ok ? await repoRes.json() : null;
    const commits = commitsRes.ok ? await commitsRes.json() : [];
    const prs = prsRes.ok ? await prsRes.json() : [];
    const runsData = runsRes.ok ? await runsRes.json() : { workflow_runs: [] };

    const remainingRate = runsRes.headers.get('x-ratelimit-remaining');
    const limitRate = runsRes.headers.get('x-ratelimit-limit');

    const result = {
      repository: repo,
      connected: repoRes.ok,
      has_auth: Boolean(headers.Authorization),
      repo_details: repoInfo
        ? {
            name: repoInfo.full_name,
            default_branch: repoInfo.default_branch,
            open_issues: repoInfo.open_issues_count,
            description: repoInfo.description,
            html_url: repoInfo.html_url,
            pushed_at: repoInfo.pushed_at
          }
        : null,
      recent_commits: Array.isArray(commits)
        ? commits.map((c: any) => ({
            sha: c.sha ? c.sha.slice(0, 8) : '',
            full_sha: c.sha,
            message: c.commit?.message?.split('\n')[0] || '',
            author: c.commit?.author?.name || c.author?.login || 'Unknown',
            date: c.commit?.author?.date || ''
          }))
        : [],
      open_pull_requests: Array.isArray(prs)
        ? prs.map((pr: any) => ({
            number: pr.number,
            title: pr.title,
            author: pr.user?.login || 'Unknown',
            branch: pr.head?.ref || '',
            html_url: pr.html_url,
            created_at: pr.created_at,
            draft: pr.draft
          }))
        : [],
      recent_workflow_runs: Array.isArray(runsData.workflow_runs)
        ? runsData.workflow_runs.map((r: any) => ({
            id: r.id,
            name: r.name,
            head_branch: r.head_branch,
            head_sha: r.head_sha ? r.head_sha.slice(0, 8) : '',
            status: r.status,
            conclusion: r.conclusion,
            event: r.event,
            html_url: r.html_url,
            created_at: r.created_at,
            run_attempt: r.run_attempt
          }))
        : [],
      rate_limit: {
        remaining: remainingRate ? parseInt(remainingRate, 10) : null,
        limit: limitRate ? parseInt(limitRate, 10) : null
      },
      queried_at: new Date().toISOString()
    };

    setCached(cacheKey, result);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({
      error: 'GitHub API Gateway Error',
      message: err.message,
      repository: repo
    });
  }
});

// 2. Fetch Detailed Workflow Run Jobs & Logs
githubRouter.get('/runs/:runId/jobs', async (req: Request, res: Response) => {
  const repo = (req.query.repo as string) || 'madnessgate44-debug/brain';
  const runId = req.params.runId;

  if (!/^\d+$/.test(runId)) {
    res.status(400).json({ error: 'Validation Error', message: 'runId must be numeric.' });
    return;
  }

  const headers = getGitHubAuthHeaders(req);

  try {
    const jobsRes = await fetch(`https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`, { headers });
    if (!jobsRes.ok) {
      res.status(jobsRes.status).json({
        error: 'Failed to fetch jobs',
        status: jobsRes.status,
        statusText: jobsRes.statusText
      });
      return;
    }

    const data = await jobsRes.json();
    res.json({
      run_id: runId,
      repository: repo,
      jobs: (data.jobs || []).map((j: any) => ({
        id: j.id,
        name: j.name,
        status: j.status,
        conclusion: j.conclusion,
        started_at: j.started_at,
        completed_at: j.completed_at,
        steps: (j.steps || []).map((s: any) => ({
          name: s.name,
          status: s.status,
          conclusion: s.conclusion,
          number: s.number
        })),
        html_url: j.html_url
      }))
    });
  } catch (err: any) {
    res.status(502).json({ error: 'GitHub Gateway Error', message: err.message });
  }
});

// 3. Validation helper for execution payload
export function validateExecutionInput(command: string, repo: string, branch: string, objective: string) {
  const errors: string[] = [];
  const validCommands = ['build', 'fix', 'audit', 'browse', 'secret', 'merge', 'sync'];

  if (!validCommands.includes(command)) {
    errors.push(`Command must be one of: ${validCommands.join(', ')}`);
  }
  if (!repo || !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
    errors.push('Repository must be in format owner/repo.');
  }
  if (!branch || !/^[a-zA-Z0-9_.-]+$/.test(branch)) {
    errors.push('Branch must only contain alphanumeric, dot, underscore, and dash.');
  }
  if (!objective || objective.trim().length < 20) {
    errors.push('Objective must be at least 20 characters.');
  }
  if (/(?:\.github\/workflows|\.env|secrets\.)/i.test(objective)) {
    errors.push('Protected path/secret references in objective are blocked by security policy.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 4. Validate input endpoint
githubRouter.post('/validate', (req: Request, res: Response) => {
  const { command, target_repository, target_branch = 'main', objective } = req.body;
  const result = validateExecutionInput(command, target_repository, target_branch, objective);
  res.json(result);
});

// 5. Mission Dispatch to GitHub or Verifiable Handoff Payload
githubRouter.post('/dispatch', authenticate, async (req: Request, res: Response) => {
  const {
    command,
    target_repository,
    target_branch = 'main',
    objective,
    conversation_id,
    assigned_to = 'agent:swe',
    preferred_mode = 'auto' // 'auto' | 'handoff' | 'direct'
  } = req.body;

  const actor = req.participant!;
  const validation = validateExecutionInput(command, target_repository, target_branch, objective);

  if (!validation.isValid) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Mission execution input failed security validation.',
      errors: validation.errors
    });
    return;
  }

  // Exact Brain trigger payload (guaranteed to match command contracts)
  const exactCommandPrefix = `/brain ${command}`;
  const exactIssueBody = `${exactCommandPrefix}
repository: ${target_repository}
branch: ${target_branch}

${objective.trim()}`;

  const missionId = 'msn_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const now = new Date().toISOString();

  // Create Mission record in shared SQLite database
  db.prepare(`
    INSERT INTO missions (
      id, title, command, target_repository, target_branch, objective,
      status, assigned_to, creator_id, creator_platform,
      dependencies, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, '[]', ?, ?)
  `).run(
    missionId,
    `[${command.toUpperCase()}] ${target_repository.split('/')[1] || target_repository}: ${objective.slice(0, 50)}...`,
    command,
    target_repository.trim(),
    target_branch.trim(),
    objective.trim(),
    assigned_to,
    actor.id,
    actor.platform,
    now,
    now
  );

  logAudit('mission.dispatch', actor, 'mission', missionId, {
    target_repository,
    command,
    target_branch
  });

  // Check if live dispatch via GitHub token is possible
  const ghToken =
    (req.headers['x-github-token'] as string) ||
    process.env.BRAIN_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN;

  let dispatchResult: any = null;
  let executionRef: string = `manual:${missionId}`;
  let liveUrl: string | null = null;

  if (ghToken && preferred_mode !== 'handoff') {
    try {
      // Attempt live creation of GitHub issue trigger
      const issueRes = await fetch(`https://api.github.com/repos/${target_repository}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ghToken.trim()}`,
          'User-Agent': 'Brain-X-Collaboration-Engine/1.0',
          Accept: 'application/vnd.github+json'
        },
        body: JSON.stringify({
          title: `Brain ${command}: ${objective.slice(0, 60)}`,
          body: exactIssueBody,
          labels: ['brain-automation', `cmd:${command}`]
        })
      });

      if (issueRes.ok) {
        const issueData = await issueRes.json();
        executionRef = `github:issue:#${issueData.number}`;
        liveUrl = issueData.html_url;

        db.prepare('UPDATE missions SET execution_ref = ?, pr_url = ?, status = ? WHERE id = ?')
          .run(executionRef, liveUrl, 'in_progress', missionId);

        dispatchResult = {
          mode: 'live_github_issue',
          issue_number: issueData.number,
          html_url: issueData.html_url,
          status: 'dispatched_live'
        };
      }
    } catch (err: any) {
      console.warn('[GitHub Dispatch] Live GitHub issue creation failed, falling back to handoff payload:', err.message);
    }
  }

  // If live dispatch did not occur, formulate inspectable handoff payload
  if (!dispatchResult) {
    const curlCommand = `curl -X POST "https://api.github.com/repos/${target_repository}/issues" \\
  -H "Authorization: Bearer \$GH_TOKEN" \\
  -H "Accept: application/vnd.github+json" \\
  -d '${JSON.stringify({
    title: `Brain ${command}: ${objective.slice(0, 60)}`,
    body: exactIssueBody
  })}'`;

    const ghCliCommand = `gh issue create --repo "${target_repository}" --title "Brain ${command}: ${objective.slice(0, 60)}" --body "${exactIssueBody.replace(/"/g, '\\"')}"`;

    dispatchResult = {
      mode: 'inspectable_handoff',
      reason: ghToken ? 'Direct dispatch fallback' : 'No GitHub write token configured',
      exact_command: exactCommandPrefix,
      issue_title: `Brain ${command}: ${objective.slice(0, 60)}`,
      issue_body: exactIssueBody,
      curl_command: curlCommand,
      gh_cli_command: ghCliCommand,
      instructions: [
        '1. Copy the exact issue body or CLI command above.',
        `2. Create an issue or comment in ${target_repository}.`,
        '3. The .github/workflows/brain-build.yml workflow will trigger automatically upon issue creation.',
        '4. Results, test logs, and PRs will post back directly to the issue.'
      ]
    };
  }

  // If conversation_id was provided, append a system directive message so the thread reflects this dispatch
  if (conversation_id) {
    const conv = db.prepare('SELECT id FROM conversations WHERE id = ?').get(conversation_id);
    if (conv) {
      const msgId = 'msg_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const msgContent = `[MISSION DISPATCHED] ${exactCommandPrefix} -> ${target_repository} (${target_branch})\nObjective: ${objective}\nExecution Ref: ${executionRef}`;

      db.prepare(`
        INSERT INTO messages (
          id, conversation_id, author_id, author_platform,
          content, message_type, mission_id, created_at
        )
        VALUES (?, ?, ?, ?, ?, 'directive', ?, ?)
      `).run(msgId, conversation_id, actor.id, actor.platform, msgContent, missionId, now);

      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, conversation_id);
    }
  }

  res.status(201).json({
    mission_id: missionId,
    command,
    target_repository,
    target_branch,
    execution_ref: executionRef,
    live_url: liveUrl,
    dispatch: dispatchResult,
    created_at: now
  });
});
