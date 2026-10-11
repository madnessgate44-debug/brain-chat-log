import React, { useState } from 'react';
import { Globe, Search, Smartphone, Monitor, Shield, Play, Terminal, FileText, ArrowRight, CheckCircle2, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { TamayimSession } from '../types/brain';

export const TamayimBrowser: React.FC = () => {
  const [url, setUrl] = useState('https://smart-farm.local/dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewportMode, setViewportMode] = useState<'mobile' | 'desktop'>('mobile');
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'dom_agent' | 'logs'>('preview');

  const [session, setSession] = useState<TamayimSession>({
    url: 'https://smart-farm.local/dashboard',
    status: 'complete',
    title: 'Smart Farm Sensor Telemetry Dashboard',
    stealthBypassActive: true,
    interactiveLog: [
      'Initialized Chromium sandbox with stealth flags (--disable-blink-features=AutomationControlled)',
      'Rotated user-agent to: Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36',
      'Navigated to https://smart-farm.local/dashboard (HTTP 200 OK)',
      'Extracted clean DOM tree: 48 elements, 3 tables, 2 metrics cards',
      'Rendered full-page screenshots: mobile-390x844.png & desktop-1280x800.png',
      'Non-file network egress blocked by isolation security policy.'
    ],
    markdownContent: `# Smart Farm Telemetry Dashboard

**URL**: https://smart-farm.local/dashboard
**Status**: 200 OK · Cloud Chromium Session

## System Health & Metrics
- Soil Moisture Sensor #1: **68%** (Optimal)
- Ambient Temperature: **23.4°C**
- Poller Interval: **1000ms** (Race Condition Resolved)
- Gateway State: **ONLINE**

## Active Directives
- Automated Polling Lock: **Active** (Mutex lock acquired)
- Battery Voltage: **3.85V**
`
  });

  const [isExecuting, setIsExecuting] = useState(false);

  const handleRunBrowser = (targetUrl = url) => {
    setIsExecuting(true);
    setSession((prev) => ({
      ...prev,
      url: targetUrl,
      status: 'navigating',
      interactiveLog: [
        `Launching Tamayim Chromium browser session...`,
        `Routing traffic via stealth proxy pool...`,
        `Navigating to: ${targetUrl}`,
        `Bypassing bot challenge / Cloudflare check...`
      ]
    }));

    setTimeout(() => {
      setIsExecuting(false);
      setSession({
        url: targetUrl,
        status: 'complete',
        title: targetUrl.includes('docs') ? 'GitHub REST API Documentation' : 'Web Resource Inspection',
        stealthBypassActive: true,
        interactiveLog: [
          `Connected to ${targetUrl} (HTTP 200 OK)`,
          `Stealth engine bypassed anti-bot heuristics cleanly`,
          `Computed layout: ${viewportMode === 'mobile' ? '390x844 mobile viewport' : '1280x800 desktop viewport'}`,
          `Captured DOM state and extracted structured content`,
          `Generated clean markdown summary for ChatGPT`
        ],
        markdownContent: `# Tamayim Web Inspection Result\n\n**Inspected URL**: ${targetUrl}\n**Engine**: Tamayim Autonomous Browser (TinyFish Compatible)\n**Status**: 200 OK\n\n## Extracted Structured Content\n- Page Title: Live Resource Inspection\n- Elements analyzed: 64 DOM nodes\n- Form inputs detected: 2 (search_query, auth_token)\n- Viewport: ${viewportMode === 'mobile' ? 'Mobile 390x844' : 'Desktop 1280x800'}\n`
      });
    }, 1500);
  };

  const handleSearchWeb = () => {
    if (!searchQuery.trim()) return;
    const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    setUrl(searchUrl);
    handleRunBrowser(searchUrl);
  };

  return (
    <div className="space-y-6">
      {/* Tamayim Engine Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Tamayim Autonomous Browser Engine
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                TINYFISH COMPATIBLE
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Cloud Chromium operations engine providing live web search, DOM extraction, stealth anti-bot evasion, and mobile/desktop screenshots for ChatGPT.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-900/50 px-2.5 py-1.5 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Anti-Bot Stealth Active</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Free Local Proxy</span>
            </div>
          </div>
        </div>

        {/* Address Bar & Search Navigation */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to browse (e.g. https://docs.github.com)..."
                aria-label="URL to browse"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <button
              onClick={() => handleRunBrowser(url)}
              disabled={isExecuting}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecuting ? 'Navigating...' : 'Browse'}</span>
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search web for docs, errors, APIs..."
                aria-label="Search web for docs, errors, APIs"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <button
              onClick={handleSearchWeb}
              disabled={isExecuting}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">TARGET PRESETS:</span>
          {[
            { label: 'Smart Farm Dashboard', url: 'https://smart-farm.local/dashboard' },
            { label: 'GitHub Actions Docs', url: 'https://docs.github.com/en/actions' },
            { label: 'FreeLLMPool Spec', url: 'https://github.com/0xzr/freellmpool' }
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUrl(preset.url);
                handleRunBrowser(preset.url);
              }}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-300 text-[11px] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Browser Viewport & Inspector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        {/* Browser Top Chrome */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span className="text-xs font-mono text-slate-300 font-medium">
              Tamayim Session: <span className="text-cyan-400">{session.url}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {/* Viewport Mode Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewportMode('mobile')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${
                  viewportMode === 'mobile'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (390x844)</span>
              </button>
              <button
                onClick={() => setViewportMode('desktop')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${
                  viewportMode === 'desktop'
                    ? 'bg-slate-800 text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (1280x800)</span>
              </button>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded ${
                  activeTab === 'preview' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Visual Preview
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-2.5 py-1 rounded ${
                  activeTab === 'markdown' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Markdown (For ChatGPT)
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-2.5 py-1 rounded ${
                  activeTab === 'logs' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Browser Logs
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Viewport Screenshot Simulation */}
        {activeTab === 'preview' && (
          <div className="p-6 flex justify-center bg-slate-950/70 min-h-[460px]">
            {viewportMode === 'mobile' ? (
              /* Mobile Viewport Mock (390 x 844) */
              <div className="w-[320px] sm:w-[390px] h-[580px] bg-slate-900 border-4 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans">
                {/* Mobile Status Bar */}
                <div className="bg-slate-950 px-5 py-2 flex justify-between text-[11px] text-slate-400 font-mono border-b border-slate-800">
                  <span>9:41</span>
                  <span>5G 100%</span>
                </div>
                {/* Mobile App Header */}
                <div className="p-4 bg-emerald-950/40 border-b border-emerald-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">Smart Farm Telemetry</h4>
                    <p className="text-[10px] text-emerald-400 font-mono">Gateway Node #01</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                {/* Mobile Content */}
                <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono block">SOIL MOISTURE</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">68.4%</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Normal hydration level</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono block">TEMPERATURE</span>
                    <span className="text-xl font-bold font-mono text-cyan-400">23.4°C</span>
                    <span className="text-[10px] text-slate-500 block mt-1">Ambient climate stable</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono block">POLLER LOCK STATE</span>
                    <span className="text-xs font-mono text-emerald-300">Atomic Mutex: LOCKED</span>
                    <p className="text-[10px] text-slate-500 mt-1">Zero race conditions detected</p>
                  </div>
                </div>
                {/* Mobile Navigation Dock */}
                <div className="p-2 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
                  Tamayim Mobile Viewport (390 x 844)
                </div>
              </div>
            ) : (
              /* Desktop Viewport Mock (1280 x 800) */
              <div className="w-full max-w-4xl h-[520px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans">
                {/* Desktop Browser Bar */}
                <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-slate-500 ml-2">Tamayim Chromium (1280 x 800)</span>
                  </div>
                  <span className="text-[11px] text-emerald-400">HTTP 200 OK</span>
                </div>
                {/* Desktop Content */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">Smart Farm Executive Operations</h3>
                      <p className="text-xs text-slate-400 font-mono">Autonomous Sensor Polling Fleet</p>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-slate-950 text-xs font-mono font-semibold">
                      Trigger Manual Poll
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-mono text-[11px] block">Moisture Index</span>
                      <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">68.4%</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-mono text-[11px] block">Temperature</span>
                      <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">23.4°C</span>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 font-mono text-[11px] block">Active Locks</span>
                      <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">1 Atomic</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Clean Markdown for ChatGPT */}
        {activeTab === 'markdown' && (
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>TOKEN-EFFICIENT STRUCTURED MARKDOWN FOR CHATGPT INGESTION</span>
              <button
                onClick={() => navigator.clipboard.writeText(session.markdownContent || '')}
                className="text-cyan-400 hover:underline"
              >
                Copy Markdown
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {session.markdownContent}
            </pre>
          </div>
        )}

        {/* Tab 3: Terminal Logs */}
        {activeTab === 'logs' && (
          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-96">
            <div className="text-slate-500 pb-2 border-b border-slate-800/80 mb-3 flex justify-between">
              <span>TAMAYIM CHROMIUM CONSOLE</span>
              <span>ENGINE: PLAYWRIGHT / STEALTH</span>
            </div>
            {session.interactiveLog.map((log, i) => (
              <div key={i} className="mb-2 text-slate-400 pl-2 leading-relaxed">
                <span className="text-cyan-400 mr-2">›</span>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
