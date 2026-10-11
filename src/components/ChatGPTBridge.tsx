import React, { useState } from 'react';
import { Copy, Check, ArrowRight, ShieldCheck, AlertCircle, Sparkles, Send, FileCode } from 'lucide-react';
import { MissionCommand } from '../types/brain';

interface ChatGPTBridgeProps {
  targetRepo: string;
  onDispatchToSimulator: (mission: { command: MissionCommand; targetRepo: string; objective: string; branch: string }) => void;
}

export const ChatGPTBridge: React.FC<ChatGPTBridgeProps> = ({ targetRepo, onDispatchToSimulator }) => {
  const [command, setCommand] = useState<MissionCommand>('fix');
  const [branch, setBranch] = useState('main');
  const [objective, setObjective] = useState(
    'Resolve sensor telemetry race condition in src/telemetry/poller.py, add atomic lock around interval scheduler, and add regression tests in tests/test_sensors.py.'
  );

  const [chatGptOutput, setChatGptOutput] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedIssuePayload, setCopiedIssuePayload] = useState(false);

  // Generate outbound prompt for ChatGPT
  const generatedChatGptPrompt = `You are the lead architect for Brain, an autonomous software company multi-agent system.
I am @madnessgate44-debug, working from my Android phone.

TARGET MISSION SPECIFICATION:
- Command: /brain ${command}
- Target Repository: ${targetRepo}
- Base Branch: ${branch}
- Objective: ${objective}

OPERATING CONSTRAINTS:
1. Make the smallest complete, coherent change.
2. Do not modify .github/workflows, secrets, deployment configs, or .env.
3. Include tests/smoke checks.
4. Output the final dispatch block using strict Brain syntax:

/brain ${command}
repository: ${targetRepo}
branch: ${branch}

${objective}
`;

  // Validation of inbound ChatGPT output or manual objective
  const validateIssuePayload = (text: string) => {
    const lines = text.trim().split('\n');
    const firstLine = lines[0] || '';
    const matchCmd = firstLine.match(/^\/brain\s+(build|fix|audit)\b/i);
    const repoMatch = text.match(/(?:repository|repo):\s*([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/i);
    const objLength = text.length;

    const errors: string[] = [];
    if (!matchCmd) {
      errors.push("Must start with exact '/brain build', '/brain fix', or '/brain audit'");
    }
    if (!repoMatch) {
      errors.push("Missing valid repository: owner/name format");
    } else if (!repoMatch[1].toLowerCase().startsWith('madnessgate44-debug/')) {
      errors.push("Cross-owner targets blocked; repository must belong to madnessgate44-debug");
    }
    if (objLength < 25) {
      errors.push("Objective must be at least 25 characters for meaningful mission execution");
    }
    if (/(\.github\/workflows|\.env|Dockerfile|render\.yaml)/i.test(text)) {
      errors.push("Protected path references detected; agent changes to workflows or envs are blocked");
    }

    return {
      isValid: errors.length === 0,
      errors,
      detectedCommand: matchCmd ? (matchCmd[1].toLowerCase() as MissionCommand) : command,
      detectedRepo: repoMatch ? repoMatch[1] : targetRepo
    };
  };

  const validation = validateIssuePayload(
    chatGptOutput.trim() ||
      `/brain ${command}\nrepository: ${targetRepo}\nbranch: ${branch}\n\n${objective}`
  );

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedChatGptPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyIssuePayload = () => {
    const payload = chatGptOutput.trim() || `/brain ${command}\nrepository: ${targetRepo}\nbranch: ${branch}\n\n${objective}`;
    navigator.clipboard.writeText(payload);
    setCopiedIssuePayload(true);
    setTimeout(() => setCopiedIssuePayload(false), 2000);
  };

  const handleDispatch = () => {
    onDispatchToSimulator({
      command: validation.detectedCommand,
      targetRepo: validation.detectedRepo,
      objective: objective,
      branch: branch
    });
  };

  const setPreset = (cmd: MissionCommand, repo: string, obj: string) => {
    setCommand(cmd);
    setObjective(obj);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Shared ChatGPT Conversation Bridge
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Formulate tasks with ChatGPT on your phone, generate injection-safe directives, and validate mission payloads before dispatching to the company pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-lg w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>Injection-Safe Parser Active</span>
          </div>
        </div>

        {/* Quick Task Presets */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">QUICK PRESETS:</span>
          <button
            onClick={() => setPreset('fix', 'madnessgate44-debug/smart-farm', 'Fix sensor telemetry timeout and add exponential retry with pytest coverage')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Telemetry Bug Fix
          </button>
          <button
            onClick={() => setPreset('build', 'madnessgate44-debug/smart-farm', 'Add REST endpoint /api/v1/health with system uptime and memory diagnostics')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Health Endpoint Feature
          </button>
          <button
            onClick={() => setPreset('audit', 'madnessgate44-debug/brain', 'Audit GitHub workflow permissions and secret leakage vectors without modifying files')}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Security Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Mission Builder & Directive Generator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                1. Frame Objective for ChatGPT
              </h3>
              <span className="text-xs font-mono text-slate-500">Outgoing Prompt</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  MISSION COMMAND
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['fix', 'build', 'audit'] as MissionCommand[]).map((cmd) => (
                    <button
                      key={cmd}
                      onClick={() => setCommand(cmd)}
                      className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border text-center transition-colors ${
                        command === cmd
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      /brain {cmd}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  TARGET REPO & BRANCH
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={targetRepo}
                    disabled
                    aria-label="Target Repository Path"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 opacity-80"
                  />
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="Base branch (main)"
                    aria-label="Base Branch"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  MISSION OBJECTIVE (What should the company build/fix?)
                </label>
                <textarea
                  rows={4}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Describe exact mission requirements..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50 resize-y"
                />
              </div>

              {/* Generated Prompt Preview */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>FORMATTED PROMPT FOR CHATGPT</span>
                  <span>{generatedChatGptPrompt.length} chars</span>
                </div>
                <pre className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-40 whitespace-pre-wrap">
                  {generatedChatGptPrompt}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800">
            <button
              onClick={handleCopyPrompt}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-medium text-xs font-mono active:scale-95 transition-all shadow-sm"
            >
              {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPrompt ? 'Copied Prompt to Clipboard!' : 'Copy Directive for ChatGPT'}</span>
            </button>
            <p className="mt-2 text-center text-[11px] text-slate-500">
              Paste this into your ChatGPT mobile app to brainstorm, design, or review.
            </p>
          </div>
        </div>

        {/* Right Column: Inbound Ingest & Validation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                2. Ingest & Validate From ChatGPT
              </h3>
              <span className="text-xs font-mono text-slate-500">Incoming Dispatch</span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">
                  PASTE CHATGPT DIRECTIVE OR PREVIEW DISPATCH
                </label>
                <textarea
                  rows={7}
                  value={chatGptOutput}
                  onChange={(e) => setChatGptOutput(e.target.value)}
                  placeholder={`Paste the reply from ChatGPT here, or leave empty to use above fields.\nExample:\n/brain fix\nrepository: ${targetRepo}\nbranch: main\n\nFix telemetry interval...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50 resize-y"
                />
              </div>

              {/* Validation Feedback Box */}
              <div
                className={`p-3.5 rounded-lg border text-xs font-mono ${
                  validation.isValid
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold mb-1">
                  {validation.isValid ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>MISSION READY FOR DISPATCH</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>GRAMMAR OR PERMISSION DEFECT DETECTED</span>
                    </>
                  )}
                </div>

                {validation.isValid ? (
                  <div className="text-[11px] text-emerald-400/80 space-y-0.5">
                    <p>✓ Command verified: /brain {validation.detectedCommand}</p>
                    <p>✓ Target verified: {validation.detectedRepo} (Owner confirmed)</p>
                    <p>✓ Protected paths (.github, .env) clean and isolated</p>
                  </div>
                ) : (
                  <ul className="list-disc list-inside text-[11px] text-rose-300/90 space-y-0.5">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleCopyIssuePayload}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs active:scale-95 transition-all"
              >
                {copiedIssuePayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
                <span>{copiedIssuePayload ? 'Copied Issue Text' : 'Copy GitHub Issue Text'}</span>
              </button>

              <button
                disabled={!validation.isValid}
                onClick={handleDispatch}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs active:scale-95 transition-all ${
                  validation.isValid
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Run in Simulator</span>
              </button>
            </div>
            <p className="text-center text-[11px] text-slate-500">
              Dispatches directly to the 6-stage pipeline simulator below to test sandboxing and checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
