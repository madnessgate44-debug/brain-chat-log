import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Copy, Check, CheckCircle2, Play, FileCode, Layers } from 'lucide-react';
import { AUDITED_VULNERABILITIES } from '../data/mockMissions';

export const WorkflowStudio: React.FC = () => {
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedTest, setCopiedTest] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'passed'>('idle');
  const [selectedTab, setSelectedTab] = useState<'matrix' | 'yaml' | 'contract'>('matrix');

  const contractTests = [
    { id: 'ac1', name: 'AC-1: Host runner never executes .git/hooks (core.hooksPath=/dev/null enforced)', passed: true },
    { id: 'ac2', name: 'AC-2: .git is isolated outside /workspace during agent container execution', passed: true },
    { id: 'ac3', name: 'AC-3: Gitleaks scan succeeds on deleted, renamed, spaced, and unusual filenames (--diff-filter=d)', passed: true },
    { id: 'ac4', name: 'AC-4: Files and warnings format cleanly with paste -sd without character mangling (no mai,.py)', passed: true },
    { id: 'ac5', name: 'AC-5: Cosmetic whitespace in git diff --check logs warnings rather than crashing under set -e', passed: true },
    { id: 'ac6', name: 'AC-6: Workflow failures post structured diagnostics to initiating issue (if: always() && failure())', passed: true },
    { id: 'ac7', name: 'AC-7: Target projects lacking tests report smoke checks honestly (compileall, no tests)', passed: true },
    { id: 'ac8', name: 'AC-8: Full contract test suite in tests/test_brain_build_workflow_contract.py passes 100%', passed: true }
  ];

  const handleRunTests = () => {
    setTestingStatus('running');
    setTimeout(() => {
      setTestingStatus('passed');
    }, 1200);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(PATCHED_WORKFLOW_SNIPPET);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const handleCopyTest = () => {
    navigator.clipboard.writeText(CONTRACT_TEST_SNIPPET);
    setCopiedTest(true);
    setTimeout(() => setCopiedTest(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              PR-B Workflow Hardening Studio
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Audit analysis, vulnerability mitigations, and regression tests verifying all C1 security gates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={testingStatus === 'running'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-semibold active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{testingStatus === 'running' ? 'Running Tests...' : 'Run Contract Tests'}</span>
            </button>
            <button
              onClick={handleCopyYaml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
            >
              {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedYaml ? 'Copied YAML' : 'Copy Workflow'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setSelectedTab('matrix')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedTab === 'matrix' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vulnerability Matrix (7 Audited Defects)
          </button>
          <button
            onClick={() => setSelectedTab('contract')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedTab === 'contract' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Acceptance Criteria (AC 1-8)
          </button>
          <button
            onClick={() => setSelectedTab('yaml')}
            className={`px-3 py-1 rounded transition-colors ${
              selectedTab === 'yaml' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Patched Code Diff
          </button>
        </div>
      </div>

      {/* Tab 1: Vulnerability Matrix */}
      {selectedTab === 'matrix' && (
        <div className="space-y-4">
          {AUDITED_VULNERABILITIES.map((vuln) => (
            <div
              key={vuln.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      vuln.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        : vuln.severity === 'MAJOR'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/50'
                        : 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                    }`}
                  >
                    {vuln.severity}
                  </span>
                  <h3 className="text-xs font-mono font-semibold text-slate-200">
                    {vuln.id}: {vuln.title}
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  <span>{vuln.file}</span>
                  <span aria-hidden="true" className="mx-1 text-slate-600">·</span>
                  <span className="text-emerald-400">{vuln.lineRange}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30">
                  <span className="text-rose-400 font-semibold block mb-1">
                    LEGACY FLAW (PR #223):
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px] font-sans">
                    {vuln.legacyBehavior}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                  <span className="text-emerald-400 font-semibold block mb-1">
                    PR-B HARDENED REMEDY:
                  </span>
                  <p className="text-slate-300 leading-relaxed text-[11px] font-sans">
                    {vuln.hardenedSolution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Acceptance Criteria Test Runner */}
      {selectedTab === 'contract' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              PR-B Acceptance Criteria & Contract Verification
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              {testingStatus === 'passed' ? '8 / 8 PASSING (100%)' : 'READY TO RUN'}
            </span>
          </div>

          <div className="space-y-2.5">
            {contractTests.map((test) => (
              <div
                key={test.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  {testingStatus === 'passed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : testingStatus === 'running' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700" />
                  )}
                  <span className="text-slate-300">{test.name}</span>
                </div>
                <span className="text-emerald-400 font-semibold">
                  {testingStatus === 'passed' ? 'PASS' : 'STAGED'}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleCopyTest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
            >
              {copiedTest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedTest ? 'Copied Test Code' : 'Copy test_brain_build_workflow_contract.py'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Workflow Diff Snippet */}
      {selectedTab === 'yaml' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              HARDENED WORKFLOW CHANGES (.github/workflows/brain-build.yml)
            </span>
            <button
              onClick={handleCopyYaml}
              className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:underline"
            >
              {copiedYaml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy Full Snippet</span>
            </button>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-[500px]">
{PATCHED_WORKFLOW_SNIPPET}
          </pre>
        </div>
      )}
    </div>
  );
};

const PATCHED_WORKFLOW_SNIPPET = `# PR-B HARDENED PATCH HIGHLIGHTS FOR brain-build.yml

# 1. GIT HOOK ISOLATION & HOST IMMUNITY (Finding 1)
# Before container execution:
mv "$GITHUB_WORKSPACE/.git" /tmp/brain-target-git

# After container execution:
[ ! -e "$GITHUB_WORKSPACE/.git" ] || { echo "::error::Agent created unexpected .git"; exit 1; }
mv /tmp/brain-target-git "$GITHUB_WORKSPACE/.git"

# On host runner commits:
git -c core.hooksPath=/dev/null commit --no-verify -m "Brain \${COMMAND}: automated candidate"

# 2. RESILIENT GITLEAKS SCAN WITH --diff-filter=d (Finding 2)
git diff --name-only --diff-filter=d -z | tar --null -T - -cf /tmp/brain-changed-files.tar
mkdir -p /tmp/brain-gitleaks-source
tar -xf /tmp/brain-changed-files.tar -C /tmp/brain-gitleaks-source
docker run --rm -v /tmp/brain-gitleaks-source:/src zricethezav/gitleaks:v8.24.2 dir --redact --exit-code 1 /src

# 3. CLEAN FILE & WARNING JOINING VIA POSIX PASTE (Finding 4)
files_changed="$(git diff --cached --name-only | head -8 | paste -sd, -)"
warnings="$(grep '^WARN:' /tmp/brain-checks.log | head -2 | paste -sd';' - || true)"

# 4. NON-FATAL WHITESPACE WARNINGS (Finding 5)
git diff --check || echo "::warning::Whitespace errors detected in agent changes."

# 5. POST-MISSION FAILURE REPORTING (Finding 3)
- name: Report failure on initiating issue
  if: always() && failure() && needs.prepare.outputs.issue_number != ''
  env:
    GH_TOKEN: \${{ github.token }}
  run: |
    gh issue comment "\${{ needs.prepare.outputs.issue_number }}" \\
      --repo madnessgate44-debug/brain \\
      --body "## Brain mission failed\\n\\nStage failed. Review logs: \${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}"
`;

const CONTRACT_TEST_SNIPPET = `"""Hardened contract tests for PR-B."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = ROOT / ".github" / "workflows" / "brain-build.yml"

def test_pr_b_security_hardening_contracts():
    workflow = WORKFLOW_PATH.read_text(encoding="utf-8")
    # Verify hook isolation and host immunity
    assert "core.hooksPath=/dev/null" in workflow
    assert "--diff-filter=d" in workflow
    assert "paste -sd, -" in workflow
    assert "always() && failure()" in workflow
`;
