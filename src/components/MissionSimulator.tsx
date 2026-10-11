import React, { useState } from 'react';
import { Play, RotateCcw, Shield, CheckCircle2, XCircle, AlertTriangle, Terminal, GitCommit, FileCode, ExternalLink } from 'lucide-react';
import { Mission, PipelineStep, MissionCommand } from '../types/brain';
import { SAMPLE_MISSIONS } from '../data/mockMissions';

interface MissionSimulatorProps {
  currentMission?: { command: MissionCommand; targetRepo: string; objective: string; branch: string };
}

export const MissionSimulator: React.FC<MissionSimulatorProps> = ({ currentMission }) => {
  const [activeMission, setActiveMission] = useState<Mission>(SAMPLE_MISSIONS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(5);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'logs' | 'patch'>('pipeline');
  const [selectedScenario, setSelectedScenario] = useState<'standard' | 'deletion_test' | 'hook_attack_test' | 'rate_limit_test'>('standard');

  const runSimulation = (scenario = selectedScenario) => {
    setIsRunning(true);
    setCurrentStepIndex(0);

    const target = currentMission?.targetRepo || 'madnessgate44-debug/smart-farm';
    const cmd = currentMission?.command || 'fix';
    const obj = currentMission?.objective || 'Resolve telemetry timeout and race condition';

    // Build dynamic steps based on scenario
    const steps: PipelineStep[] = [
      {
        id: 's1',
        name: 'Stage 1: Intake & Permission Validation',
        stage: 'intake',
        status: 'running',
        logLines: [
          `Parsing mission: /brain ${cmd}`,
          `Target repository: ${target}`,
          'Verifying repository owner matches madnessgate44-debug... PASS',
          'Validating objective length and bounded syntax... PASS'
        ]
      },
      {
        id: 's2',
        name: 'Stage 2: Acquire Shared Queue Lease',
        stage: 'lease',
        status: 'pending',
        logLines: [
          'Checking refs/heads/brain-company-workflow-lock...',
          'No competing lease active. Acquired lock commit sha=7f8a12e'
        ]
      },
      {
        id: 's3',
        name: 'Stage 3: Sandboxed Agent (.git Isolated)',
        stage: 'sandbox',
        status: 'pending',
        logLines: []
      },
      {
        id: 's4',
        name: 'Stage 4: Resilient Gitleaks Secret Scan',
        stage: 'secrets',
        status: 'pending',
        logLines: []
      },
      {
        id: 's5',
        name: 'Stage 5: Project-Aware Checks',
        stage: 'checks',
        status: 'pending',
        logLines: []
      },
      {
        id: 's6',
        name: 'Stage 6: Human Gate & Candidate PR',
        stage: 'publish',
        status: 'pending',
        logLines: []
      }
    ];

    // Configure scenario-specific logs and behaviors
    if (scenario === 'deletion_test') {
      steps[2].logLines = [
        'Relocated .git -> /tmp/brain-target-git',
        'Agent deleted deprecated telemetry script: rm src/legacy/poller_old.py',
        'Patch produced: 1 deletion, 0 additions.',
        'Restored untampered .git to working directory.'
      ];
      steps[3].logLines = [
        'Scanning with hardened command: git diff --name-only --diff-filter=d -z',
        'Excluded deleted file from tar stream (avoiding PR #223 exit code 2 crash).',
        'Tar archive built cleanly: 0 files to scan.',
        'Gitleaks v8.24.2: 0 leaks found (PASS)'
      ];
    } else if (scenario === 'hook_attack_test') {
      steps[2].logLines = [
        'Relocated .git -> /tmp/brain-target-git before container mount.',
        'Container attempted to write /workspace/.git/hooks/pre-commit...',
        'DEFENSE TRIGGERED: .git was not present in /workspace during execution.',
        'Verified workspace .git integrity before restoring.',
        'Host git operations executed with core.hooksPath=/dev/null --no-verify.'
      ];
      steps[3].logLines = [
        'Gitleaks scan complete: 0 secrets leaked.',
        'Hook tampering neutralised.'
      ];
    } else if (scenario === 'rate_limit_test') {
      steps[2].logLines = [
        'Mini-SWE-Agent call attempt 1: Provider returned 429 RESOURCE_EXHAUSTED',
        'Log parsed: retryDelay 12.4s detected.',
        'Honoring reported retryDelay with bounded wait of 18s...',
        'Attempt 2 succeeded! Generated patch cleanly.'
      ];
      steps[3].logLines = ['Gitleaks passed cleanly.'];
    } else {
      steps[2].logLines = [
        'Relocated .git -> /tmp/brain-target-git',
        'Mini-SWE-Agent executed in brain-build-sandbox:local',
        'LLM calls: 4 (limit: 14)',
        'Unified diff generated: 2 files changed.',
        'Restored .git cleanly.'
      ];
      steps[3].logLines = [
        'Running Gitleaks scan with --diff-filter=d...',
        '0 leaks detected in changed files.'
      ];
    }

    steps[4].logLines = [
      'Detecting test framework: pytest in pyproject.toml',
      'Running: python -m pytest -q',
      '14 passed, 0 failed in 0.84s (PASS)'
    ];

    steps[5].logLines = [
      'Scanning for protected paths (.github/workflows, .env)... NONE MODIFIED',
      'Formatting changed files with POSIX paste -sd, -: clean delimiters, no corruption',
      `Candidate PR created on ${target}: PR #43`,
      'Published diagnostics to issue; human review required.'
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < 6) {
        steps[step - 1].status = 'passed';
        steps[step].status = 'running';
        setCurrentStepIndex(step);
      } else {
        steps[5].status = 'passed';
        clearInterval(interval);
        setIsRunning(false);
        setActiveMission({
          ...activeMission,
          command: cmd,
          targetRepository: target,
          objective: obj,
          status: 'success',
          candidatePrUrl: `https://github.com/${target}/pull/43`,
          steps: steps.map((s) => ({ ...s, status: 'passed' }))
        });
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Simulator Control Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              6-Stage Pipeline Simulator (PR-B Hardened)
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Simulates the full autonomous execution lifecycle with the audited vulnerabilities patched and isolated.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isRunning}
              onClick={() => runSimulation()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Running Pipeline...' : 'Run Simulation'}</span>
            </button>
            <button
              disabled={isRunning}
              onClick={() => runSimulation('standard')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Test Scenarios Selector */}
        <div className="mt-4 pt-1 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">SCENARIOS:</span>
          {[
            { id: 'standard', label: 'Standard Build/Fix' },
            { id: 'deletion_test', label: 'Deleted File Test (Gitleaks Fix)' },
            { id: 'hook_attack_test', label: 'Git Hook Attack Isolation' },
            { id: 'rate_limit_test', label: '429 Rate Limit Parser' }
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenario(sc.id as any);
                runSimulation(sc.id as any);
              }}
              disabled={isRunning}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedScenario === sc.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline Visualizer & Logs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        {/* Navigation within Simulator */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">MISSION:</span>
            <span className="text-xs font-mono text-emerald-400 font-medium">
              /brain {activeMission.command} {activeMission.targetRepository}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                activeTab === 'pipeline' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pipeline View
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                activeTab === 'logs' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terminal Logs
            </button>
            <button
              onClick={() => setActiveTab('patch')}
              className={`px-2.5 py-1 text-xs font-mono rounded ${
                activeTab === 'patch' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Patch & PR
            </button>
          </div>
        </div>

        {/* Tab 1: Pipeline Stage Cards */}
        {activeTab === 'pipeline' && (
          <div className="p-5 space-y-3">
            {activeMission.steps.map((step, idx) => {
              const isPassed = idx < currentStepIndex || (!isRunning && step.status === 'passed');
              const isCurrent = isRunning && idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-slate-100 shadow-md'
                      : isPassed
                      ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                      : 'bg-slate-950/30 border-slate-900 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-semibold">{step.name}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {step.details || (step.logLines[0] ?? 'Awaiting execution...')}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono">
                      {isCurrent ? (
                        <span className="text-emerald-400 animate-pulse">EXECUTING...</span>
                      ) : isPassed ? (
                        <span className="text-emerald-400">PASSED</span>
                      ) : (
                        <span className="text-slate-600">QUEUED</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Terminal Logs */}
        {activeTab === 'logs' && (
          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-96">
            <div className="text-slate-500 pb-2 border-b border-slate-800/80 mb-3 flex justify-between">
              <span>GITHUB ACTIONS HOST CONSOLE (SIMULATED)</span>
              <span>RUN ID: 381920182</span>
            </div>
            {activeMission.steps.map((st, i) => (
              <div key={i} className="mb-4">
                <div className="text-emerald-400 font-semibold mb-1">
                  ==&gt; Step {i + 1}: {st.name}
                </div>
                {st.logLines.map((log, li) => (
                  <div key={li} className="text-slate-400 pl-3 leading-relaxed">
                    <span className="text-slate-600 mr-2">$</span>
                    {log}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Generated Patch & PR */}
        {activeTab === 'patch' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Candidate Pull Request Opened</span>
              </div>
              <a
                href={activeMission.candidatePrUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline"
              >
                <span>{activeMission.candidatePrUrl}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div>
              <span className="text-xs font-mono text-slate-400 block mb-2">
                UNIFIED DIFF ARTIFACT (CANDIDATE PATCH)
              </span>
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`diff --git a/src/telemetry/poller.py b/src/telemetry/poller.py
index a4f2c01..8b9d3e4 100644
--- a/src/telemetry/poller.py
+++ b/src/telemetry/poller.py
@@ -12,6 +12,7 @@ import asyncio
+import threading
 
 class TelemetryPoller:
     def __init__(self, interval: float = 1.0):
@@ -24,8 +25,12 @@ class TelemetryPoller:
     async def poll_once(self):
-        data = await self.fetch_raw()
-        self.buffer.append(data)
+        async with self._lock:
+            data = await self.fetch_raw()
+            self.buffer.append(data)
 
diff --git a/tests/test_sensors.py b/tests/test_sensors.py
new file mode 100644
--- /dev/null
+++ b/tests/test_sensors.py
@@ -0,0 +1,14 @@
+import pytest
+from telemetry.poller import TelemetryPoller
+
+@pytest.mark.asyncio
+async def test_concurrent_poll_lock():
+    poller = TelemetryPoller()
+    results = await asyncio.gather(poller.poll_once(), poller.poll_once())
+    assert len(poller.buffer) == 2`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
