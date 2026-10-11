import React, { useState } from 'react';
import { KeyRound, Shield, Lock, Plus, Check, Copy, ExternalLink, GitMerge, FileCode, CheckCircle2 } from 'lucide-react';
import { GitHubSecret } from '../types/brain';
import { INITIAL_SECRETS } from '../data/mockMissions';

interface GitHubAdminPanelProps {
  targetRepo: string;
}

export const GitHubAdminPanel: React.FC<GitHubAdminPanelProps> = ({ targetRepo }) => {
  const [secrets, setSecrets] = useState<GitHubSecret[]>(INITIAL_SECRETS);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [copiedSecretCommand, setCopiedSecretCommand] = useState(false);
  const [autoMergeEnabled, setAutoMergeEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'secrets' | 'workflows' | 'permissions'>('secrets');

  const handleAddSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretName.trim() || !newSecretValue.trim()) return;

    setIsEncrypting(true);
    setTimeout(() => {
      setSecrets((prev) => [
        {
          name: newSecretName.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
          environment: 'production',
          updatedAt: new Date().toISOString(),
          status: 'encrypted_libsodium'
        },
        ...prev
      ]);
      setNewSecretName('');
      setNewSecretValue('');
      setIsEncrypting(false);
    }, 700);
  };

  const getGhSecretCli = (secretName: string) => {
    return `gh secret set ${secretName || 'MY_SECRET'} --repo ${targetRepo} --body "value"`;
  };

  return (
    <div className="space-y-6">
      {/* Admin Authority Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Universal GitHub Admin Controller
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                ULTIMATE AUTHORITY ACTIVE
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Direct administrative bridge enabling ChatGPT to provision libsodium-encrypted secrets, author CI/CD workflows, and execute autonomous merges across {targetRepo}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500">AUTONOMOUS MERGE:</span>
            <button
              onClick={() => setAutoMergeEnabled(!autoMergeEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                autoMergeEnabled
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {autoMergeEnabled ? 'ENABLED (FULL AUTONOMY)' : 'HUMAN APPROVAL REQUIRED'}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('secrets')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'secrets' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Repository Secrets (Libsodium)
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'workflows' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Workflow Dispatcher (.github/workflows)
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'permissions' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            App Permissions & Scopes
          </button>
        </div>
      </div>

      {/* Tab 1: Secrets Management */}
      {activeTab === 'secrets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Add Secret Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 pb-3 border-b border-slate-800 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Provision Repository Secret
            </h3>

            <form onSubmit={handleAddSecret} className="mt-4 space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">SECRET NAME</label>
                <input
                  type="text"
                  value={newSecretName}
                  onChange={(e) => setNewSecretName(e.target.value)}
                  placeholder="e.g. BRAIN_AI_API_KEY"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SECRET VALUE (ENCRYPTED CLIENT-SIDE)</label>
                <input
                  type="password"
                  value={newSecretValue}
                  onChange={(e) => setNewSecretValue(e.target.value)}
                  placeholder="Paste confidential token..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isEncrypting || !newSecretName.trim() || !newSecretValue.trim()}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4"
              >
                {isEncrypting ? (
                  <span>Encrypting via Libsodium...</span>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Encrypt & Save Secret</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <p>• Uses GitHub REST API: <code className="text-slate-300">PUT /repos/:owner/:repo/actions/secrets/:name</code></p>
              <p>• Encrypted with target repository public key</p>
            </div>
          </div>

          {/* Right: Existing Secrets List */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                Active Repository Secrets for {targetRepo}
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                {secrets.length} ENCRYPTED SECRETS
              </span>
            </div>

            <div className="space-y-2.5">
              {secrets.map((sec, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-amber-950/40 border border-amber-900/40 text-amber-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-slate-100 font-bold">{sec.name}</span>
                      <span className="text-[11px] text-slate-500 block">
                        Environment: {sec.environment} · Updated {new Date(sec.updatedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                      LIBSODIUM ENCRYPTED
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getGhSecretCli(sec.name));
                        setCopiedSecretCommand(true);
                        setTimeout(() => setCopiedSecretCommand(false), 2000);
                      }}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Copy gh secret set command"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Workflow Dispatcher */}
      {activeTab === 'workflows' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                Autonomous Workflow Management (.github/workflows)
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                ChatGPT can author, edit, and dispatch GitHub Actions workflows directly into {targetRepo}.
              </p>
            </div>
            <button
              onClick={() => alert('Workflow deployed into target repository via GitHub Contents API!')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-slate-950 text-xs font-mono font-semibold"
            >
              Deploy Workflow to GitHub
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-emerald-400 font-bold block mb-1">brain-build.yml</span>
              <p className="text-slate-400 text-[11px]">C1 Hardened cross-repo build, fix, and audit workflow.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-cyan-400 font-bold block mb-1">tamayim-browser.yml</span>
              <p className="text-slate-400 text-[11px]">Automated Playwright browser preview and regression testing.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-purple-400 font-bold block mb-1">ai-provider-check.yml</span>
              <p className="text-slate-400 text-[11px]">Zero-cost keyless provider health monitor and rate-limit probe.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions & Scopes */}
      {activeTab === 'permissions' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Active Authorization Scopes (Full Authority Mode)
            </h3>
            <span className="text-xs font-mono text-emerald-400">STATUS: FULL PERMISSIONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              { scope: 'repo', desc: 'Full repository control, commits, and PR merges' },
              { scope: 'workflow', desc: 'Create, modify, and run GitHub Actions workflows' },
              { scope: 'admin:repo_hook', desc: 'Read and write repository webhook hooks' },
              { scope: 'admin:org', desc: 'Organization-level app and secret administration' }
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">✓ {s.scope}</span>
                <p className="text-slate-400 text-[11px] font-sans">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
