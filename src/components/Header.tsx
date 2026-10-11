import React from 'react';
import { Shield, Smartphone, Terminal, Copy, Check, Globe, Zap, KeyRound, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  targetRepo: string;
  setTargetRepo: (repo: string) => void;
  onCopyQuickDirective: () => void;
  copiedQuick: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  targetRepo,
  setTargetRepo,
  onCopyQuickDirective,
  copiedQuick
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Logo & Platform Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg">
                X
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold tracking-tight text-slate-100">
                    BRAIN X
                  </h1>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    UNIVERSAL AUTHORITY
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    TAMAYIM BROWSER
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Autonomous Software Company</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Smartphone className="w-3 h-3 text-cyan-400" />
                    Android Mobile-First
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-emerald-400 font-mono">$0 Token Cost</span>
                </div>
              </div>
            </div>

            {/* Mobile Fast Action */}
            <button
              onClick={onCopyQuickDirective}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-medium rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 active:scale-95 transition-transform"
            >
              {copiedQuick ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedQuick ? 'Copied' : 'Directive'}</span>
            </button>
          </div>

          {/* Controls: Target Repository & Fast Actions */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 text-[11px]">TARGET:</span>
              <select
                value={targetRepo}
                onChange={(e) => setTargetRepo(e.target.value)}
                aria-label="Target Repository"
                className="bg-transparent text-slate-200 font-mono focus:outline-none cursor-pointer"
              >
                <option value="madnessgate44-debug/smart-farm" className="bg-slate-900">madnessgate44-debug/smart-farm</option>
                <option value="madnessgate44-debug/brain" className="bg-slate-900">madnessgate44-debug/brain</option>
                <option value="madnessgate44-debug/company-gateway" className="bg-slate-900">madnessgate44-debug/company-gateway</option>
              </select>
            </div>

            <button
              onClick={onCopyQuickDirective}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
            >
              {copiedQuick ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Copy ChatGPT Directive</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-3 flex overflow-x-auto gap-1 border-t border-slate-800/80 pt-2.5 no-scrollbar">
          {[
            { id: 'chatgpt', label: 'ChatGPT Controller', icon: Terminal },
            { id: 'tamayim', label: 'Tamayim Browser', icon: Globe },
            { id: 'zerocost', label: 'Zero-Cost LLMs ($0)', icon: Zap },
            { id: 'admin', label: 'GitHub Admin & Secrets', icon: KeyRound },
            { id: 'simulator', label: 'Pipeline Simulator', icon: Shield },
            { id: 'fleet', label: 'Company Fleet', icon: Layers },
            { id: 'workflow', label: 'PR-B Studio', icon: Shield },
            { id: 'chatlog', label: 'Chat Log & Sync', icon: Copy }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
