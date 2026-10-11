import React from 'react';
import { AgentRole } from '../types/brain';
import { Brain, Code2, ShieldCheck, GitPullRequest, Cpu, AlertTriangle, Layers, Activity } from 'lucide-react';

interface FleetOverviewProps {
  agents: AgentRole[];
}

export const FleetOverview: React.FC<FleetOverviewProps> = ({ agents }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain':
        return <Brain className="w-5 h-5 text-purple-400" />;
      case 'Code2':
        return <Code2 className="w-5 h-5 text-cyan-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'GitPullRequest':
        return <GitPullRequest className="w-5 h-5 text-amber-400" />;
      default:
        return <Cpu className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: AgentRole['status']) => {
    switch (status) {
      case 'active':
        return <span className="text-emerald-400 font-mono text-[11px] font-medium">● ACTIVE</span>;
      case 'waiting_approval':
        return <span className="text-amber-400 font-mono text-[11px] font-medium">● HUMAN GATE</span>;
      case 'standby':
        return <span className="text-cyan-400 font-mono text-[11px] font-medium">● READY</span>;
      default:
        return <span className="text-slate-400 font-mono text-[11px] font-medium">● IDLE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Fleet Executive Summary */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Software Company Agent Fleet
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Role-segregated multi-agent hierarchy ensuring single-responsibility execution, human review gating, and credential isolation.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="text-slate-500">PROVIDER: </span>
              <span className="text-emerald-400">gemini-3.8-flash</span>
            </div>
            <div>
              <span className="text-slate-500">CALL LIMIT: </span>
              <span className="text-cyan-400">14 MAX</span>
            </div>
          </div>
        </div>

        {/* Fleet Architecture Principles */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 font-mono font-semibold block mb-1">1. Credential Segregation</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Coding agent receives zero GitHub tokens. Tokens are only loaded in the host publisher step after testing passes.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 font-mono font-semibold block mb-1">2. Sandboxed .git Relocation</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              .git is moved to /tmp outside the Docker container during execution, neutralizing pre-commit hook takeover.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-400 font-mono font-semibold block mb-1">3. Human Merge Authority</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Agents never merge, push to main, or auto-deploy. Every output is published as an unmerged candidate PR.
            </p>
          </div>
        </div>
      </div>

      {/* Agent Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getIcon(agent.icon)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{agent.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{agent.title}</p>
                  </div>
                </div>
                {getStatusBadge(agent.status)}
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                {agent.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 font-semibold block mb-2">
                  CORE RESPONSIBILITIES
                </span>
                <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
                  {agent.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 text-xs">›</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="text-slate-500 text-[11px]">
                LAST: <span className="text-slate-400">{agent.lastAction}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>{agent.tokenUsage}/{agent.callLimit} calls</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
