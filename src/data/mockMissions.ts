import { AgentRole, SecurityVulnerability, Mission, FreeLLMProvider, GitHubSecret } from '../types/brain';

export const FREE_LLM_PROVIDERS: FreeLLMProvider[] = [
  {
    id: 'freellm-loopback',
    name: 'FreeLLMPool Pinned Proxy',
    routeId: 'local/freellmpool:0.13.0',
    model: 'auto-free-stream',
    latencyMs: 780,
    status: 'healthy',
    costPerToken: '$0.00 (Free Root)',
    endpoint: 'http://127.0.0.1:8080/v1/chat/completions',
    maxContextChars: 32000
  },
  {
    id: 'pollinations-free',
    name: 'Pollinations AI Free Route',
    routeId: 'pollinations/openai',
    model: 'openai-compatible-free',
    latencyMs: 1420,
    status: 'healthy',
    costPerToken: '$0.00 (Free Root)',
    endpoint: 'https://text.pollinations.ai/openai',
    maxContextChars: 28000
  },
  {
    id: 'llm7-free',
    name: 'LLM7 Default Engine',
    routeId: 'llm7/default',
    model: 'meta-llama-3.1-8b',
    latencyMs: 650,
    status: 'healthy',
    costPerToken: '$0.00 (Free Root)',
    endpoint: 'https://api.llm7.io/v1',
    maxContextChars: 24000
  },
  {
    id: 'ovh-llama',
    name: 'OVH AI Endpoints (Keyless)',
    routeId: 'ovh/Meta-Llama-3_3-70B',
    model: 'Llama-3.3-70B-Instruct',
    latencyMs: 890,
    status: 'healthy',
    costPerToken: '$0.00 (Free Root)',
    endpoint: 'https://llama-3-3-70b-instruct.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1',
    maxContextChars: 48000
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter Free Model Tier',
    routeId: 'openrouter/free',
    model: 'google/gemini-2.0-flash-lite:free',
    latencyMs: 1100,
    status: 'healthy',
    costPerToken: '$0.00 (Free Root)',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    maxContextChars: 64000
  }
];

export const INITIAL_SECRETS: GitHubSecret[] = [
  {
    name: 'BRAIN_GITHUB_TOKEN',
    environment: 'production',
    updatedAt: '2026-10-11T12:00:00Z',
    status: 'encrypted_libsodium'
  },
  {
    name: 'ACTIONS_SECRET_KEY',
    environment: 'default',
    updatedAt: '2026-10-11T14:20:00Z',
    status: 'encrypted_libsodium'
  },
  {
    name: 'TAMAYIM_PROXY_TOKEN',
    environment: 'browser-mesh',
    updatedAt: '2026-10-11T15:10:00Z',
    status: 'encrypted_libsodium'
  }
];

export const INITIAL_AGENTS: AgentRole[] = [
  {
    id: 'ceo-architect',
    name: 'Architect & Lead Strategist',
    title: 'Mission Structuring & Constraint Synthesis',
    icon: 'Brain',
    description: 'Interprets conversational prompts from ChatGPT, frames atomic milestones, synthesizes acceptance criteria, and enforces scope boundaries.',
    responsibilities: [
      'Parse conversational prompts from ChatGPT',
      'Validate repository ownership & permissions',
      'Enforce atomic, single-PR objectives',
      'Draft testable acceptance criteria'
    ],
    status: 'idle',
    lastAction: 'Synthesized mission roadmap for smart-farm',
    tokenUsage: 0,
    callLimit: 14
  },
  {
    id: 'builder-swe',
    name: 'Autonomous SWE Agent',
    title: 'Sandboxed Implementation & Unified Diffs',
    icon: 'Code2',
    description: 'Runs mini-swe-agent inside an isolated container with zero host token leakage and isolated .git to write patches.',
    responsibilities: [
      'Execute within isolated Docker sandbox',
      'Generate minimal, coherent unified diff patches',
      'Leave modifications uncommitted for verification',
      'Comply with strict 30-minute container timeout'
    ],
    status: 'idle',
    lastAction: 'Awaiting dispatch for candidate patch',
    tokenUsage: 0,
    callLimit: 14
  },
  {
    id: 'security-auditor',
    name: 'Security & QA Auditor (Tamayim Linked)',
    title: 'Gitleaks Scanner, Tests & Browser UI Verification',
    icon: 'ShieldCheck',
    description: 'Enforces pre-PR security gates: scans diffs with Gitleaks (--diff-filter=d), runs pytest/npm, and verifies web UI through Tamayim browser.',
    responsibilities: [
      'Scan additions/renames via Gitleaks with --diff-filter=d',
      'Isolate .git directory to prevent pre-commit hook hijacking',
      'Run project-aware pytest / npm test suites',
      'Capture Tamayim mobile and desktop screenshot proofs'
    ],
    status: 'idle',
    lastAction: 'Tamayim browser verification engine primed',
    tokenUsage: 0,
    callLimit: 14
  },
  {
    id: 'release-gatekeeper',
    name: 'Universal DevOps & Release Gatekeeper',
    title: 'Protected Path Guard, Secrets Encryptor & PR Publisher',
    icon: 'GitPullRequest',
    description: 'Manages GitHub administrative operations: encrypts secrets via libsodium, writes workflow files, opens PRs, and handles autonomous merges.',
    responsibilities: [
      'Verify no unauthorized workflow or environment modifications',
      'Encrypt repository secrets using libsodium public keys',
      'Publish candidate PRs with clean POSIX paste formatting',
      'Execute autonomous merge upon 100% passed test gates'
    ],
    status: 'idle',
    lastAction: 'Universal admin permissions active',
    tokenUsage: 0,
    callLimit: 14
  }
];

export const AUDITED_VULNERABILITIES: SecurityVulnerability[] = [
  {
    id: 'VULN-01',
    title: 'Host Runner Takeover via Writable .git Mount',
    severity: 'CRITICAL',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 345 & 570',
    legacyBehavior: 'Mounted GITHUB_WORKSPACE directly to /workspace read-write. Untrusted agent container could write .git/hooks/pre-commit, which executed on host VM when host ran git commit.',
    hardenedSolution: 'Moves .git to /tmp/brain-target-git before container runs. Verifies agent did not forge .git. Runs host git commit with -c core.hooksPath=/dev/null --no-verify.',
    status: 'Resolved in PR-B'
  },
  {
    id: 'VULN-02',
    title: 'Gitleaks Crashes on File Deletions & Renames',
    severity: 'MAJOR',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 399-402',
    legacyBehavior: 'git diff --name-only -z piped to tar -T - crashed with exit code 2 on any deleted file because the file no longer existed on disk.',
    hardenedSolution: 'Applies --diff-filter=d to exclude deleted files from tar stream, allowing clean scans of additions, modifications, and renames.',
    status: 'Resolved in PR-B'
  },
  {
    id: 'VULN-03',
    title: 'Silent Workflow Abort (Zero Issue Feedback)',
    severity: 'MAJOR',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 532 & 578',
    legacyBehavior: 'Issue comments were only called in the publish step, which ran only if every prior stage succeeded. Any failure resulted in silent exit.',
    hardenedSolution: 'Adds an always() failure reporting step that posts the exact failed stage and Actions run URL directly to the triggering issue.',
    status: 'Resolved in PR-B'
  },
  {
    id: 'VULN-04',
    title: "tr '\\\\n' Corrupts Filenames and Warning Strings",
    severity: 'MAJOR',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 566-567',
    legacyBehavior: "Inside bash single quotes, '\\\\n' passed literal '\\' and 'n' to tr, converting every backslash and letter 'n' into commas (e.g. main.py -> mai,.py).",
    hardenedSolution: 'Uses POSIX paste -sd, - and paste -sd\';\' - for clean, delimiter-exact joining without character substitution.',
    status: 'Resolved in PR-B'
  },
  {
    id: 'VULN-05',
    title: 'git diff --check Under set -e Aborts on Whitespace',
    severity: 'MINOR',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 375 & 380',
    legacyBehavior: 'git diff --check exits with status 2 if trailing whitespace is present, terminating bash abruptly before patch capture.',
    hardenedSolution: 'Wraps check with || echo "::warning::Whitespace errors detected" so cosmetic whitespace produces warnings without aborting.',
    status: 'Resolved in PR-B'
  },
  {
    id: 'VULN-06',
    title: 'Trigger Suffix Bypass (/brain builder, /brain retry-now)',
    severity: 'MINOR',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 45-47 & 55',
    legacyBehavior: 'startsWith in YAML matched arbitrary suffixes like /brain builder, wasting GitHub Actions runner compute minutes.',
    hardenedSolution: 'Enforces word boundary matching in YAML triggers and synchronizes contract assertions in test suite.',
    status: 'Resolved in PR-B'
  },
  {
    id: 'VULN-07',
    title: 'Misleading Test Claims When No Tests Exist',
    severity: 'MINOR',
    file: '.github/workflows/brain-build.yml',
    lineRange: 'Lines 421, 449 & 574',
    legacyBehavior: 'Repos lacking test suites fell back to compileall but reported "project checks and gitleaks passed" in PR descriptions.',
    hardenedSolution: 'Exports explicit check_type output so PRs and issue comments honestly state "compileall smoke check (no tests found)".',
    status: 'Resolved in PR-B'
  }
];

export const SAMPLE_MISSIONS: Mission[] = [
  {
    id: 'MSN-2026-001',
    command: 'fix',
    targetRepository: 'madnessgate44-debug/smart-farm',
    targetBranch: 'main',
    objective: 'Resolve race condition in sensor telemetry polling interval, add atomic lock, and verify web dashboard with Tamayim browser.',
    status: 'success',
    createdAt: '2026-10-11T13:42:00Z',
    completedAt: '2026-10-11T13:48:22Z',
    candidatePrUrl: 'https://github.com/madnessgate44-debug/smart-farm/pull/42',
    checksResult: {
      type: 'pytest + Tamayim browser render',
      passed: true
    },
    filesChanged: ['src/telemetry/poller.py', 'tests/test_sensors.py'],
    steps: [
      {
        id: 's1',
        name: 'Validate Intake & Universal Authority',
        stage: 'intake',
        status: 'passed',
        durationMs: 1200,
        details: 'Confirmed target madnessgate44-debug/smart-farm. Admin rights validated.',
        logLines: [
          'Owner validation: madnessgate44-debug == madnessgate44-debug (PASS)',
          'Command validated: /brain fix',
          'Target authority: Universal admin write/merge enabled'
        ]
      },
      {
        id: 's2',
        name: 'Acquire Queue Lease Lock',
        stage: 'lease',
        status: 'passed',
        durationMs: 780,
        details: 'Acquired shared lease on refs/heads/brain-company-workflow-lock.',
        logLines: [
          'Checking refs/heads/brain-company-workflow-lock...',
          'Lease acquired for run=381920182.'
        ]
      },
      {
        id: 's3',
        name: 'Sandboxed SWE Agent (Isolated .git)',
        stage: 'sandbox',
        status: 'passed',
        durationMs: 21500,
        details: 'Agent executed via zero-cost FreeLLMPool route with .git isolated.',
        logLines: [
          'Relocated .git -> /tmp/brain-target-git',
          'Free root model: OVH/Meta-Llama-3_3-70B via FreeLLMPool ($0.00 cost)',
          'Unified diff generated: 18 lines added, 3 deleted.',
          'Restored untampered .git to working tree.'
        ]
      },
      {
        id: 's4',
        name: 'Resilient Gitleaks Secret Scan',
        stage: 'secrets',
        status: 'passed',
        durationMs: 2900,
        details: 'Scanned 2 changed files with --diff-filter=d. 0 leaks detected.',
        logLines: [
          'git diff --name-only --diff-filter=d -z | tar --null -T - -cf /tmp/brain-changed-files.tar',
          'Gitleaks v8.24.2: 0 leaks identified (PASS)'
        ]
      },
      {
        id: 's5',
        name: 'Project-Aware Checks & Tamayim Browser',
        stage: 'checks',
        status: 'passed',
        durationMs: 5100,
        details: 'pytest 14/14 passed + Tamayim captured mobile & desktop screenshots.',
        logLines: [
          'Running pytest -q: 14 passed in 0.82s',
          'Tamayim launched Chromium: rendered 390x844 and 1280x800 previews',
          'Visual checks verified without errors.'
        ]
      },
      {
        id: 's6',
        name: 'Autonomous Branch, PR & Merge Authority',
        stage: 'publish',
        status: 'passed',
        durationMs: 2100,
        details: 'Candidate PR #42 created and autonomously merged under full write authority.',
        logLines: [
          'Published candidate branch brain/fix-381920182',
          'Opened PR #42 with clean paste -sd formatting',
          'All gates green: executed autonomous merge into main'
        ]
      }
    ]
  }
];
