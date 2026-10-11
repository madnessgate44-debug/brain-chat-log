import React, { useState } from 'react';
import { Header } from './components/Header';
import { FleetOverview } from './components/FleetOverview';
import { ChatGPTBridge } from './components/ChatGPTBridge';
import { TamayimBrowser } from './components/TamayimBrowser';
import { ZeroCostRouter } from './components/ZeroCostRouter';
import { GitHubAdminPanel } from './components/GitHubAdminPanel';
import { MissionSimulator } from './components/MissionSimulator';
import { WorkflowStudio } from './components/WorkflowStudio';
import { ChatLogHub } from './components/ChatLogHub';
import { INITIAL_AGENTS } from './data/mockMissions';
import { MissionCommand } from './types/brain';
import { Terminal, Shield, Copy, Layers, Globe, Zap, KeyRound, MessageSquare } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('chatgpt');
  const [targetRepo, setTargetRepo] = useState('madnessgate44-debug/smart-farm');
  const [copiedQuick, setCopiedQuick] = useState(false);

  const [dispatchedMission, setDispatchedMission] = useState<{
    command: MissionCommand;
    targetRepo: string;
    objective: string;
    branch: string;
  }>({
    command: 'fix',
    targetRepo: 'madnessgate44-debug/smart-farm',
    objective: 'Resolve race condition in sensor telemetry poller and verify UI render with Tamayim browser.',
    branch: 'main'
  });

  const handleCopyQuickDirective = () => {
    const directive = `/brain fix\nrepository: ${targetRepo}\nbranch: main\n\nFix telemetry interval scheduler, add pytest coverage, and verify dashboard via Tamayim browser.`;
    navigator.clipboard.writeText(directive);
    setCopiedQuick(true);
    setTimeout(() => setCopiedQuick(false), 2000);
  };

  const handleDispatchToSimulator = (mission: {
    command: MissionCommand;
    targetRepo: string;
    objective: string;
    branch: string;
  }) => {
    setDispatchedMission(mission);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        targetRepo={targetRepo}
        setTargetRepo={setTargetRepo}
        onCopyQuickDirective={handleCopyQuickDirective}
        copiedQuick={copiedQuick}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 mb-16 sm:mb-0">
        {activeTab === 'chatgpt' && (
          <ChatGPTBridge
            targetRepo={targetRepo}
            onDispatchToSimulator={handleDispatchToSimulator}
          />
        )}

        {activeTab === 'tamayim' && (
          <TamayimBrowser />
        )}

        {activeTab === 'zerocost' && (
          <ZeroCostRouter />
        )}

        {activeTab === 'admin' && (
          <GitHubAdminPanel targetRepo={targetRepo} />
        )}

        {activeTab === 'simulator' && (
          <MissionSimulator currentMission={dispatchedMission} />
        )}

        {activeTab === 'fleet' && (
          <FleetOverview agents={INITIAL_AGENTS} />
        )}

        {activeTab === 'workflow' && (
          <WorkflowStudio />
        )}

        {activeTab === 'chatlog' && (
          <ChatLogHub />
        )}
      </main>

      {/* Mobile Ergonomic Bottom Navigation Bar (Android Touch Optimized) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 border-t border-slate-800 z-50 backdrop-blur px-2 py-1.5 flex justify-around">
        {[
          { id: 'chatgpt', label: 'ChatGPT', icon: Terminal },
          { id: 'tamayim', label: 'Tamayim', icon: Globe },
          { id: 'zerocost', label: '$0 LLM', icon: Zap },
          { id: 'admin', label: 'Admin', icon: KeyRound },
          { id: 'simulator', label: 'Pipeline', icon: Shield },
          { id: 'chatlog', label: 'Workspace', icon: MessageSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-mono transition-colors ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 text-xs py-4 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-emerald-400">●</span>
            <span>Brain X Universal Control Plane</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Tamayim Browser Active</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>100% Free Root Models</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>Universal GitHub Authority</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Targeting: <span className="text-slate-400">{targetRepo}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
