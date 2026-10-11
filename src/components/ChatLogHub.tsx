import React, { useState } from 'react';
import { Copy, Check, Download, Plus, MessageSquare, Calendar, User } from 'lucide-react';

export const ChatLogHub: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [author, setAuthor] = useState<'Owner' | 'ChatGPT' | 'AI Studio'>('Owner');

  const [entries, setEntries] = useState([
    {
      id: '001',
      date: '2026-10-11T14:40:00Z',
      author: 'AI Studio Senior Auditor',
      title: 'C1 Workflow Security Defect Audit Completed',
      content:
        'Audited .github/workflows/brain-build.yml on main (1ed9331). Identified 1 Critical (.git mount hook execution), 3 Major (Gitleaks deletion crash, silent failure, tr newline mangling), and 3 Minor defects. Defined 8 acceptance criteria for PR-B.'
    },
    {
      id: '002',
      date: '2026-10-11T15:05:00Z',
      author: '@madnessgate44-debug & ChatGPT',
      title: 'Multi-Agent Autonomous Command Protocol Established',
      content:
        'Confirmed operating boundaries: Owner retains sole PR merge authority from Android mobile. PR-B security fixes must be merged and validated before any provider wiring is attempted. Kill switch and keyless probes remain unmerged.'
    }
  ]);

  const handleAddEntry = () => {
    if (!newEntryText.trim()) return;
    const nextId = String(entries.length + 1).padStart(3, '0');
    setEntries([
      ...entries,
      {
        id: nextId,
        date: new Date().toISOString(),
        author: author === 'Owner' ? '@madnessgate44-debug' : author,
        title: `Coordination Note #${nextId}`,
        content: newEntryText.trim()
      }
    ]);
    setNewEntryText('');
  };

  const getFullMarkdown = () => {
    return `# Brain Multi-Agent Chat Log

Shared coordination log between @madnessgate44-debug, ChatGPT, and AI Studio.

${entries
  .map(
    (e) => `---
### Log Entry ${e.id}: ${e.title}
- **Date**: ${e.date}
- **Author**: ${e.author}

${e.content}
`
  )
  .join('\n')}`;
  };

  const handleCopyFull = () => {
    navigator.clipboard.writeText(getFullMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([getFullMarkdown()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brain-chat-log.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Central Chat Log & Sync Hub
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Preserves chronological company decisions, audit notes, and architectural agreements between you and ChatGPT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFull}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-semibold active:scale-95 transition-all shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Log' : 'Copy All Log Markdown'}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .txt</span>
            </button>
          </div>
        </div>

        {/* Append New Entry Box */}
        <div className="mt-4 pt-2">
          <label className="block text-xs font-mono text-slate-400 mb-1.5">
            APPEND CHATGPT OR OWNER UPDATE TO LOG:
          </label>
          <div className="space-y-2">
            <textarea
              rows={3}
              value={newEntryText}
              onChange={(e) => setNewEntryText(e.target.value)}
              placeholder="Paste decision, review note, or instructions from ChatGPT..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50 resize-y"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500">AUTHOR:</span>
                {(['Owner', 'ChatGPT', 'AI Studio'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAuthor(a)}
                    className={`px-2 py-0.5 rounded text-[11px] ${
                      author === a ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddEntry}
                disabled={!newEntryText.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-mono"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Append Entry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Entries List */}
      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  #{entry.id}
                </span>
                <h3 className="text-xs font-semibold text-slate-200">
                  {entry.title}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <User className="w-3 h-3 text-cyan-400" />
                  {entry.author}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed font-sans">
              {entry.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
