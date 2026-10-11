import React, { useState } from 'react';
import { Cpu, Zap, ShieldCheck, AlertCircle, Play, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { FREE_LLM_PROVIDERS } from '../data/mockMissions';
import { FreeLLMProvider } from '../types/brain';

export const ZeroCostRouter: React.FC = () => {
  const [providers, setProviders] = useState<FreeLLMProvider[]>(FREE_LLM_PROVIDERS);
  const [activeProviderIndex, setActiveProviderIndex] = useState(0);
  const [isSimulatingFailover, setIsSimulatingFailover] = useState(false);
  const [failoverLog, setFailoverLog] = useState<string[]>([
    'All free keyless routes initialized.',
    'Primary route: FreeLLMPool (Local Loopback 127.0.0.1:8080). Cost: $0.00.',
    'Backup routes: Pollinations.ai -> LLM7 -> OVH Llama-3.3-70B -> OpenRouter Free.'
  ]);

  const activeProvider = providers[activeProviderIndex];

  const handleSimulateFailover = () => {
    setIsSimulatingFailover(true);
    const current = providers[activeProviderIndex];

    setFailoverLog((prev) => [
      `[FAILOVER TRIGGERED] Simulating HTTP 429 RESOURCE_EXHAUSTED on route: ${current.routeId}...`,
      `Parsing rate-limit headers: retryDelay=14s detected.`,
      `Auto-switching to next healthy keyless route in cascade...`,
      ...prev
    ]);

    setTimeout(() => {
      // Mark current provider as throttled and move to next
      const nextIndex = (activeProviderIndex + 1) % providers.length;
      setActiveProviderIndex(nextIndex);
      setIsSimulatingFailover(false);

      const nextProv = providers[nextIndex];
      setFailoverLog((prev) => [
        `[CASCADE SUCCESS] Switched to route: ${nextProv.name} (${nextProv.routeId}). Latency: ${nextProv.latencyMs}ms. Cost: $0.00.`,
        `Mission continues uninterrupted without paying for API tokens.`,
        ...prev
      ]);
    }, 1200);
  };

  const handleReset = () => {
    setActiveProviderIndex(0);
    setFailoverLog([
      'Reset router cascade to primary route: FreeLLMPool.',
      'All 5 free keyless routes verified healthy.'
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Zero Cost Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Zero-Cost Multi-Provider LLM Fallback Cascade
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                100% FREE ROOT MODELS
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Brain X routes all agent inference across keyless free models. If a provider returns 429 or 502, it automatically cascades to the next route with zero API token costs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSimulateFailover}
              disabled={isSimulatingFailover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium active:scale-95 transition-all disabled:opacity-50"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{isSimulatingFailover ? 'Cascading...' : 'Test 429 Failover'}</span>
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Reset routes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Active Route Banner */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
            <div>
              <span className="text-slate-400 text-[11px] block">CURRENT ACTIVE INFERENCE ROUTE</span>
              <span className="text-sm font-bold text-slate-100">{activeProvider.name}</span>
              <span className="text-slate-500 text-[11px] ml-2">({activeProvider.routeId})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500">LATENCY:</span>{' '}
              <span className="text-emerald-400 font-semibold">{activeProvider.latencyMs}ms</span>
            </div>
            <div>
              <span className="text-slate-500">COST:</span>{' '}
              <span className="text-emerald-400 font-bold">$0.00 / FREE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Cascade Chain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((prov, idx) => {
          const isActive = idx === activeProviderIndex;
          return (
            <div
              key={prov.id}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-slate-500">PRIORITY #{idx + 1}</span>
                  <h3 className="text-xs font-bold text-slate-100 mt-0.5">{prov.name}</h3>
                </div>
                {isActive ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50 font-bold">
                    ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    STANDBY
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono text-slate-400 border-t border-slate-800/80 pt-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Route ID:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{prov.routeId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Model:</span>
                  <span className="text-cyan-400 truncate max-w-[150px]">{prov.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Context Limit:</span>
                  <span className="text-slate-300">{prov.maxContextChars.toLocaleString()} chars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Token Fee:</span>
                  <span className="text-emerald-400 font-bold">$0.00 (Zero Token Fee)</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Avg Latency:</span>
                <span className="text-slate-300">{prov.latencyMs}ms</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Cascade Event Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Zero-Cost Routing & Failover Log
          </h3>
          <span className="text-xs font-mono text-slate-500">Live Health Stream</span>
        </div>

        <div className="mt-3 p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto space-y-1.5">
          {failoverLog.map((log, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-emerald-400 mr-2">›</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
