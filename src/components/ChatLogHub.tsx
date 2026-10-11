import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  FileCode,
  Paperclip,
  Download,
  Check,
  Copy,
  Plus,
  Search,
  User,
  Calendar,
  Shield,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertTriangle,
  Layers,
  Wifi,
  WifiOff,
  Eye,
  X,
  ChevronRight,
  Filter,
  Terminal,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import {
  workspaceApi,
  PRESET_IDENTITIES,
  ParticipantIdentity,
  Conversation,
  WorkspaceMessage,
  PersistedMission,
  ArtifactMeta,
  GitHubStatusResponse
} from '../services/api';

export const ChatLogHub: React.FC = () => {
  // Authentication & Identity
  const [currentIdentity, setCurrentIdentity] = useState<ParticipantIdentity>(workspaceApi.getIdentity());
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  // Sync & Connection State
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline' | 'error'>('connected');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTs, setLastSyncTs] = useState<string>(new Date().toISOString());
  const [currentCursor, setCurrentCursor] = useState<number>(0);
  const [autoPoll, setAutoPoll] = useState<boolean>(true);

  // Conversations & Messages
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');

  // Composer State
  const [messageText, setMessageText] = useState<string>('');
  const [messageType, setMessageType] = useState<'text' | 'directive' | 'review' | 'result' | 'code'>('text');
  const [replyToMessage, setReplyToMessage] = useState<WorkspaceMessage | null>(null);
  const [attachedArtifactIds, setAttachedArtifactIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  // New Conversation Modal
  const [showNewConvModal, setShowNewConvModal] = useState<boolean>(false);
  const [newConvTitle, setNewConvTitle] = useState<string>('');
  const [newConvChannel, setNewConvChannel] = useState<string>('missions');

  // Missions & Artifacts State
  const [missions, setMissions] = useState<PersistedMission[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactMeta[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'missions' | 'artifacts' | 'github'>('chat');

  // Live GitHub Status
  const [githubStatus, setGithubStatus] = useState<GitHubStatusResponse | null>(null);
  const [loadingGithub, setLoadingGithub] = useState<boolean>(false);
  const [selectedRepo, setSelectedRepo] = useState<string>('madnessgate44-debug/brain');

  // Modals & Inspectors
  const [viewingArtifact, setViewingArtifact] = useState<ArtifactMeta | null>(null);
  const [artifactContent, setArtifactContent] = useState<string>('');
  const [loadingArtifactContent, setLoadingArtifactContent] = useState<boolean>(false);

  // Upload Artifact Modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFilename, setUploadFilename] = useState<string>('');
  const [uploadContent, setUploadContent] = useState<string>('');
  const [uploadContentType, setUploadContentType] = useState<string>('text/x-python');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Quick Mission Dispatch Modal
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [dispatchCmd, setDispatchCmd] = useState<'build' | 'fix' | 'audit'>('fix');
  const [dispatchRepo, setDispatchRepo] = useState<string>('madnessgate44-debug/brain');
  const [dispatchBranch, setDispatchBranch] = useState<string>('main');
  const [dispatchObjective, setDispatchObjective] = useState<string>('');
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);

  // Clipboard Copied Status
  const [copiedHandoff, setCopiedHandoff] = useState<boolean>(false);
  const [copiedChecksum, setCopiedChecksum] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load of Conversations, Missions, Artifacts & GitHub
  useEffect(() => {
    loadInitialData();
  }, [currentIdentity]);

  const loadInitialData = async () => {
    try {
      setSyncStatus('syncing');
      setSyncError(null);

      // Load Conversations
      const convRes = await workspaceApi.getConversations();
      setConversations(convRes.conversations);

      let targetId = activeConvId;
      if (!targetId && convRes.conversations.length > 0) {
        targetId = convRes.conversations[0].id;
        setActiveConvId(targetId);
      }

      if (targetId) {
        await loadMessages(targetId);
      }

      // Load Missions
      const msnRes = await workspaceApi.getMissions();
      setMissions(msnRes.missions);

      // Load Artifacts
      const artRes = await workspaceApi.getArtifacts();
      setArtifacts(artRes.artifacts);

      // Load Live GitHub Status
      refreshGitHubStatus(selectedRepo);

      setSyncStatus('connected');
      setLastSyncTs(new Date().toISOString());
    } catch (err: any) {
      console.error('Initial workspace load failed:', err);
      setSyncStatus('error');
      setSyncError(err.message || 'Failed to connect to workspace API');
    }
  };

  const loadMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const msgRes = await workspaceApi.getMessages(convId, 0, 100);
      setMessages(msgRes.messages);
      setCurrentCursor(msgRes.next_cursor);
      scrollToBottom();
    } catch (err: any) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const refreshGitHubStatus = async (repo: string) => {
    setLoadingGithub(true);
    try {
      const gh = await workspaceApi.getGitHubStatus(repo);
      setGithubStatus(gh);
    } catch (err: any) {
      console.warn('GitHub status fetch warning:', err.message);
    } finally {
      setLoadingGithub(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 2. Polling Sync Loop for Real-time Multi-Client Collaboration
  useEffect(() => {
    if (!autoPoll) return;

    const interval = setInterval(async () => {
      try {
        const sync = await workspaceApi.getSync(currentCursor, lastSyncTs, activeConvId);

        // If new messages came in
        if (sync.messages && sync.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = sync.messages.filter((m: WorkspaceMessage) => !existingIds.has(m.id));
            if (fresh.length === 0) return prev;
            return [...prev, ...fresh];
          });
          setCurrentCursor(sync.current_seq);
          scrollToBottom();
        }

        // If missions updated
        if (sync.missions && sync.missions.length > 0) {
          const msnRes = await workspaceApi.getMissions();
          setMissions(msnRes.missions);
        }

        // If artifacts updated
        if (sync.artifacts && sync.artifacts.length > 0) {
          const artRes = await workspaceApi.getArtifacts();
          setArtifacts(artRes.artifacts);
        }

        setSyncStatus('connected');
        setSyncError(null);
        setLastSyncTs(new Date().toISOString());
      } catch (err: any) {
        if (err.status === 401 || err.status === 403) {
          setSyncStatus('error');
          setSyncError('Authentication invalid for current actor');
        } else {
          setSyncStatus('offline');
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [autoPoll, currentCursor, lastSyncTs, activeConvId]);

  // Handle Switching Identity
  const handleSelectIdentity = (identity: ParticipantIdentity) => {
    workspaceApi.setIdentity(identity);
    setCurrentIdentity(identity);
    setShowIdentityModal(false);
  };

  const handleApplyCustomKey = () => {
    if (!customKeyInput.trim()) return;
    workspaceApi.setCustomToken(customKeyInput.trim());
    setShowIdentityModal(false);
    loadInitialData();
  };

  // Handle Switching Conversation
  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setReplyToMessage(null);
    loadMessages(convId);
  };

  // Create New Conversation
  const handleCreateConversation = async () => {
    if (!newConvTitle.trim()) return;
    try {
      const created = await workspaceApi.createConversation(newConvTitle.trim(), newConvChannel);
      setConversations((prev) => [created, ...prev]);
      setActiveConvId(created.id);
      setNewConvTitle('');
      setShowNewConvModal(false);
      loadMessages(created.id);
    } catch (err: any) {
      alert(`Failed to create conversation: ${err.message}`);
    }
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() && attachedArtifactIds.length === 0) return;
    if (!activeConvId) {
      alert('Please select or create a conversation thread first.');
      return;
    }

    setIsSending(true);
    const content = messageText.trim();
    const currentReplyId = replyToMessage?.id || null;
    const currentType = messageType;
    const attachedIds = [...attachedArtifactIds];

    try {
      const posted = await workspaceApi.sendMessage({
        conversationId: activeConvId,
        content: content || '[Attached shared artifact]',
        messageType: currentType,
        replyToId: currentReplyId,
        artifactIds: attachedIds
      });

      setMessages((prev) => [...prev, posted]);
      setMessageText('');
      setReplyToMessage(null);
      setAttachedArtifactIds([]);
      setMessageType('text');
      setCurrentCursor(posted.sequence);
      scrollToBottom();
    } catch (err: any) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Upload Artifact
  const handleUploadArtifact = async () => {
    if (!uploadFilename.trim() || !uploadContent) {
      alert('Filename and file content are required.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await workspaceApi.uploadArtifact({
        filename: uploadFilename.trim(),
        contentText: uploadContent,
        contentType: uploadContentType,
        conversationId: activeConvId || undefined,
        metadata: {
          draft: true,
          status: 'shared_draft_uncommitted'
        }
      });

      setArtifacts((prev) => [uploaded, ...prev]);
      setAttachedArtifactIds((prev) => [...prev, uploaded.id]);
      setShowUploadModal(false);
      setUploadFilename('');
      setUploadContent('');

      // If active conversation, post notification message
      if (activeConvId) {
        await workspaceApi.sendMessage({
          conversationId: activeConvId,
          content: `Attached engineering artifact: ${uploaded.filename} (${uploaded.size_bytes} bytes, SHA-256: ${uploaded.sha256_checksum.slice(0, 10)}...)`,
          messageType: 'code',
          artifactIds: [uploaded.id]
        });
        loadMessages(activeConvId);
      }
    } catch (err: any) {
      alert(`Failed to upload artifact: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // View Artifact Details
  const handleViewArtifact = async (art: ArtifactMeta) => {
    setViewingArtifact(art);
    setLoadingArtifactContent(true);
    try {
      const res = await fetch(`/api/v1/artifacts/${art.id}/download`, {
        headers: { Authorization: `Bearer ${workspaceApi.getActiveToken()}` }
      });
      if (res.ok) {
        const text = await res.text();
        setArtifactContent(text);
      } else {
        setArtifactContent(`[Unable to preview content: HTTP ${res.status}]`);
      }
    } catch (err: any) {
      setArtifactContent(`[Error loading artifact: ${err.message}]`);
    } finally {
      setLoadingArtifactContent(false);
    }
  };

  // Quick Dispatch Mission to GitHub or Handoff
  const handleDispatchMission = async () => {
    if (!dispatchObjective.trim() || dispatchObjective.length < 20) {
      alert('Please provide an objective of at least 20 characters.');
      return;
    }

    setIsDispatching(true);
    setDispatchResult(null);

    try {
      const result = await workspaceApi.dispatchMission({
        command: dispatchCmd,
        target_repository: dispatchRepo.trim(),
        target_branch: dispatchBranch.trim(),
        objective: dispatchObjective.trim(),
        conversation_id: activeConvId || undefined,
        preferred_mode: 'auto'
      });

      setDispatchResult(result);

      // Refresh missions and conversation
      const msnRes = await workspaceApi.getMissions();
      setMissions(msnRes.missions);
      if (activeConvId) {
        loadMessages(activeConvId);
      }
    } catch (err: any) {
      alert(`Failed to dispatch mission: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyHandoff = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHandoff(true);
    setTimeout(() => setCopiedHandoff(false), 2000);
  };

  const handleCopyChecksum = (checksum: string) => {
    navigator.clipboard.writeText(checksum);
    setCopiedChecksum(checksum);
    setTimeout(() => setCopiedChecksum(null), 2000);
  };

  // Filtered Messages
  const filteredMessages = messages.filter((m) => {
    if (filterType !== 'all' && m.message_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.content.toLowerCase().includes(q) ||
        m.author_id.toLowerCase().includes(q) ||
        (m.message_type && m.message_type.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="space-y-4">
      {/* 1. TOP STATUS & ACTOR NAVIGATION BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 backdrop-blur shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Identity & Status Pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowIdentityModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 hover:border-slate-600 transition-all text-xs font-mono group"
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs border ${currentIdentity.avatarBg}`}
              >
                {currentIdentity.id.slice(0, 1).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200 group-hover:text-emerald-300">
                  <span>{currentIdentity.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal">▼</span>
                </div>
                <div className="text-[10px] text-slate-400">{currentIdentity.badge}</div>
              </div>
            </button>

            {/* Connection Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono">
              {syncStatus === 'connected' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-medium">LIVE CONNECTED</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500 text-[10px]">ACID WAL</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                  <span className="text-amber-400">SYNCING...</span>
                </>
              )}
              {syncStatus === 'offline' && (
                <>
                  <WifiOff className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-400">OFFLINE CACHED</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span className="text-rose-400">AUTH / ERROR</span>
                </>
              )}
            </div>

            {/* Auto-poll Toggle */}
            <button
              onClick={() => setAutoPoll(!autoPoll)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                autoPoll
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              Auto-Sync: {autoPoll ? 'ON (4s)' : 'PAUSED'}
            </button>
          </div>

          {/* Action Buttons: New Mission, Upload Artifact, Refresh */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setShowDispatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold active:scale-95 transition-all shadow-sm"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Dispatch Mission</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              <span>Attach Code / Patch</span>
            </button>

            <button
              onClick={() => loadInitialData()}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Manual Reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs: Chat Threads vs Missions Timeline vs Shared Artifacts vs GitHub Execution */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 no-scrollbar">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {[
              { id: 'chat', label: 'Collaboration Thread', count: messages.length, icon: MessageSquare },
              { id: 'missions', label: 'Company Missions', count: missions.length, icon: Shield },
              { id: 'artifacts', label: 'Code & Artifacts', count: artifacts.length, icon: FileCode },
              { id: 'github', label: 'GitHub Live Engine', count: githubStatus?.recent_workflow_runs.length || 0, icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 text-slate-100 font-semibold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-slate-700 text-emerald-300' : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">Target:</span>
            <span className="text-slate-300 font-semibold">{selectedRepo}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTENT */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column: Conversations Selector & Channels (1 column on lg) */}
          <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 flex flex-col h-[700px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                THREADS & CHANNELS
              </span>
              <button
                onClick={() => setShowNewConvModal(true)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors"
                title="New Thread"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {conversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/40 text-slate-100 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                        #{conv.channel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {conv.message_count || 0} msgs
                      </span>
                    </div>
                    <div className="text-xs font-medium truncate text-slate-200">{conv.title}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                      by @{conv.created_by} · {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Filter Box */}
            <div className="pt-2 border-t border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Chat History & Message Composer (3 columns on lg) */}
          <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col h-[700px] overflow-hidden">
            {/* Thread Header */}
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-100 font-mono">
                    {activeConversation ? activeConversation.title : 'No Thread Selected'}
                  </h3>
                  {activeConversation && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                      #{activeConversation.channel}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  ID: {activeConvId || 'none'} · Persistent SQLite ACID sync
                </div>
              </div>

              {/* Message Type Filter */}
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {(['all', 'directive', 'review', 'code'] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setFilterType(ft)}
                    className={`px-2 py-0.5 rounded text-[10px] capitalize transition-colors ${
                      filterType === ft
                        ? 'bg-slate-800 text-emerald-300 font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {loadingMessages && (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin mx-auto mb-2" />
                  Loading message history from SQLite...
                </div>
              )}

              {!loadingMessages && filteredMessages.length === 0 && (
                <div className="text-center py-12 text-xs font-mono text-slate-500">
                  <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-50" />
                  No messages found in this thread.
                  <div className="text-[10px] text-slate-600 mt-1">
                    Send an architectural directive or attach a patch below.
                  </div>
                </div>
              )}

              {filteredMessages.map((msg) => {
                const isAhmed = msg.author_id === 'ahmed';
                const isChatGPT = msg.author_id === 'chatgpt';
                const isClaude = msg.author_id === 'claude';
                const isAIStudio = msg.author_id === 'aistudio';

                // Look up parent reply if present
                const parentMsg = msg.reply_to_id ? messages.find((m) => m.id === msg.reply_to_id) : null;

                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      msg.message_type === 'directive'
                        ? 'bg-emerald-950/15 border-emerald-500/30'
                        : msg.message_type === 'review'
                        ? 'bg-purple-950/15 border-purple-500/30'
                        : msg.message_type === 'code'
                        ? 'bg-blue-950/15 border-blue-500/30'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Quoted Reply if any */}
                    {parentMsg && (
                      <div className="mb-2 p-2 rounded bg-slate-900 border-l-2 border-slate-600 text-[11px] font-mono text-slate-400">
                        <span className="text-slate-300 font-bold">@{parentMsg.author_id}:</span> {parentMsg.content.slice(0, 90)}...
                      </div>
                    )}

                    {/* Message Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/70 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                            isAhmed
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isChatGPT
                              ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                              : isClaude
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : isAIStudio
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {msg.author_id.toUpperCase()}
                        </span>

                        <span className="text-[10px] font-mono text-slate-500">
                          via {msg.author_platform}
                        </span>

                        {msg.message_type !== 'text' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                            {msg.message_type}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span>seq#{msg.sequence}</span>
                        <span>·</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                        <button
                          onClick={() => setReplyToMessage(msg)}
                          className="hover:text-emerald-400 text-slate-400 px-1 py-0.5 rounded hover:bg-slate-900"
                          title="Reply to message"
                        >
                          Reply
                        </button>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="mt-2 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Attached Artifacts */}
                    {msg.artifact_ids && msg.artifact_ids.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                        {msg.artifact_ids.map((artId) => {
                          const art = artifacts.find((a) => a.id === artId);
                          return (
                            <div
                              key={artId}
                              className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono"
                            >
                              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-slate-200">{art ? art.filename : artId}</span>
                              {art && (
                                <span className="text-[10px] text-slate-500">
                                  ({(art.size_bytes / 1024).toFixed(1)} KB)
                                </span>
                              )}
                              <button
                                onClick={() => art && handleViewArtifact(art)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px]"
                              >
                                View
                              </button>
                              <a
                                href={workspaceApi.getArtifactDownloadUrl(artId)}
                                download
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="Download"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Target Banner */}
            {replyToMessage && (
              <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-emerald-400 font-bold">Replying to @{replyToMessage.author_id}:</span>
                  <span className="text-slate-400 truncate">{replyToMessage.content.slice(0, 80)}...</span>
                </div>
                <button
                  onClick={() => setReplyToMessage(null)}
                  className="p-1 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Composer Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-500 text-[11px]">TYPE:</span>
                  {(['text', 'directive', 'review', 'code'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setMessageType(t)}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                        messageType === t
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  {attachedArtifactIds.length > 0 && (
                    <span className="text-[10px] text-cyan-400">
                      {attachedArtifactIds.length} artifact(s) attached
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>Attach Code</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Post directive or message as ${currentIdentity.name} (Shift+Enter for newline)...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isSending || (!messageText.trim() && attachedArtifactIds.length === 0)}
                  className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg flex items-center justify-center transition-all active:scale-95"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MISSIONS & HANDOFF TIMELINE TAB */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Persistent Multi-Agent Missions Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authoritative mission records, ownership handoffs between Ahmed, ChatGPT, Claude, and SWE agent.
              </p>
            </div>
            <button
              onClick={() => setShowDispatchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create / Dispatch Mission</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((msn) => (
              <div
                key={msn.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 uppercase font-bold">
                      {msn.command}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-[200px]">
                      {msn.title}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                      msn.status === 'approved' || msn.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : msn.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {msn.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Repository:</span>
                    <span className="text-slate-200 font-semibold">{msn.target_repository}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Target Branch:</span>
                    <span className="text-slate-200">{msn.target_branch}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Assigned Agent:</span>
                    <span className="text-cyan-400 font-bold">{msn.assigned_to || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Creator:</span>
                    <span className="text-slate-300">@{msn.creator_id} ({msn.creator_platform})</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                  {msn.objective}
                </div>

                {/* Handoff references */}
                {msn.execution_ref && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span>Execution Ref:</span>
                    <span className="text-emerald-400 truncate max-w-[180px]">{msn.execution_ref}</span>
                  </div>
                )}

                {/* Status Update Quick Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(msn.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {msn.status === 'queued' && (
                      <button
                        onClick={async () => {
                          await workspaceApi.updateMissionStatus(msn.id, 'in_progress', 'agent:swe');
                          const res = await workspaceApi.getMissions();
                          setMissions(res.missions);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-mono"
                      >
                        Claim as SWE Agent
                      </button>
                    )}
                    {msn.status === 'in_progress' && (
                      <button
                        onClick={async () => {
                          await workspaceApi.recordReview(msn.id, 'approved', 'Audit passes all criteria and smoke tests');
                          const res = await workspaceApi.getMissions();
                          setMissions(res.missions);
                        }}
                        className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/40 text-[10px] font-mono font-bold"
                      >
                        Approve via Claude
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SHARED CODE ARTIFACTS & PATCHES TAB */}
      {activeTab === 'artifacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Authoritative Engineering Artifacts Library
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Source files, patch diffs, test logs, and audit reports with SHA-256 verification.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Code / Artifact</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {artifacts.map((art) => (
              <div
                key={art.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      {art.filename}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      DRAFT ARTIFACT
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs font-mono text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Author:</span>
                      <span className="text-slate-200">@{art.author_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Size:</span>
                      <span className="text-slate-200 font-semibold">
                        {(art.size_bytes / 1024).toFixed(1)} KB ({art.size_bytes} B)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Content Type:</span>
                      <span className="text-slate-300">{art.content_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Version:</span>
                      <span className="text-emerald-400 font-bold">v{art.version}</span>
                    </div>
                  </div>

                  {/* SHA-256 Checksum Pill */}
                  <div className="mt-2.5 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono flex items-center justify-between">
                    <span className="text-slate-500">SHA-256:</span>
                    <span className="text-cyan-300 truncate max-w-[160px]">{art.sha256_checksum}</span>
                    <button
                      onClick={() => handleCopyChecksum(art.sha256_checksum)}
                      className="p-1 hover:text-emerald-400 text-slate-400"
                      title="Copy Checksum"
                    >
                      {copiedChecksum === art.sha256_checksum ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(art.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewArtifact(art)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                    <a
                      href={workspaceApi.getArtifactDownloadUrl(art.id)}
                      download
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. GITHUB LIVE EXECUTION STATUS TAB */}
      {activeTab === 'github' && (
        <div className="space-y-4">
          {/* Header & Repo Switcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold font-mono text-slate-100">
                  Live GitHub CI/CD & Workflow Engine
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  REAL-TIME API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direct queries to GitHub Actions runs, branch heads, and open pull requests.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">REPO:</span>
              <select
                value={selectedRepo}
                onChange={(e) => {
                  setSelectedRepo(e.target.value);
                  refreshGitHubStatus(e.target.value);
                }}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1 font-mono focus:outline-none"
              >
                <option value="madnessgate44-debug/brain">madnessgate44-debug/brain</option>
                <option value="madnessgate44-debug/brain-chat-log">madnessgate44-debug/brain-chat-log</option>
                <option value="madnessgate44-debug/smart-farm">madnessgate44-debug/smart-farm</option>
              </select>
              <button
                onClick={() => refreshGitHubStatus(selectedRepo)}
                disabled={loadingGithub}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingGithub ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* GitHub Status Cards */}
          {githubStatus && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
              {/* Card 1: Repo & Default Branch */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">REPOSITORY INFO</span>
                  <span className="text-[10px] text-emerald-400 font-bold">CONNECTED</span>
                </div>
                {githubStatus.repo_details && (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">Full Name: </span>
                      <a
                        href={githubStatus.repo_details.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                      >
                        {githubStatus.repo_details.name}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-500">Default Branch: </span>
                      <span className="text-emerald-400 font-bold">{githubStatus.repo_details.default_branch}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Open Issues: </span>
                      <span className="text-slate-200">{githubStatus.repo_details.open_issues}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Last Pushed: </span>
                      <span className="text-slate-400">
                        {new Date(githubStatus.repo_details.pushed_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Latest Commits */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5">RECENT COMMITS ON MAIN:</div>
                  <div className="space-y-1.5">
                    {githubStatus.recent_commits.slice(0, 3).map((c) => (
                      <div key={c.sha} className="p-1.5 rounded bg-slate-950 text-[11px] border border-slate-800/80">
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>{c.sha}</span>
                          <span className="text-slate-500 font-normal">@{c.author}</span>
                        </div>
                        <div className="text-slate-300 truncate mt-0.5">{c.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Open Pull Requests */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">OPEN PULL REQUESTS</span>
                  <span className="text-[10px] text-slate-400">{githubStatus.open_pull_requests.length} active</span>
                </div>
                <div className="space-y-2">
                  {githubStatus.open_pull_requests.map((pr) => (
                    <div
                      key={pr.number}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          #{pr.number} {pr.title.slice(0, 40)}...
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {pr.draft && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
                            DRAFT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>branch: {pr.branch}</span>
                        <span>by @{pr.author}</span>
                      </div>
                    </div>
                  ))}
                  {githubStatus.open_pull_requests.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-500">No open pull requests.</div>
                  )}
                </div>
              </div>

              {/* Card 3: Recent GitHub Actions Runs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">ACTIONS WORKFLOW RUNS</span>
                  <span className="text-[10px] text-emerald-400">REAL EVIDENCE</span>
                </div>
                <div className="space-y-2">
                  {githubStatus.recent_workflow_runs.map((run) => (
                    <div
                      key={run.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <a
                          href={run.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-slate-200 hover:text-cyan-300 truncate flex items-center gap-1"
                        >
                          {run.name}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            run.conclusion === 'success'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                              : run.status === 'in_progress'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {run.conclusion || run.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{run.head_branch} ({run.head_sha})</span>
                        <span>{run.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL: IDENTITY & API KEY SWITCHER */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Select Collaboration Identity
              </h3>
              <button
                onClick={() => setShowIdentityModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 font-mono">
              {PRESET_IDENTITIES.map((ident) => {
                const isSelected = ident.id === currentIdentity.id;
                return (
                  <button
                    key={ident.id}
                    onClick={() => handleSelectIdentity(ident)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/50 text-slate-100 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>{ident.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{ident.badge}</div>
                    </div>
                    <span className="text-[10px] text-slate-500">ID: {ident.id}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Token Box */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="block text-xs font-mono text-slate-400">
                OR SUPPLY CUSTOM PARTICIPANT BEARER TOKEN:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="brain_key_..."
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none"
                />
                <button
                  onClick={handleApplyCustomKey}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold font-mono"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: CREATE CONVERSATION */}
      {showNewConvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Start New Shared Conversation Thread
              </h3>
              <button
                onClick={() => setShowNewConvModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Thread Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Smart Farm C1 Audit & Hardening"
                  value={newConvTitle}
                  onChange={(e) => setNewConvTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Channel:</label>
                <select
                  value={newConvChannel}
                  onChange={(e) => setNewConvChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="missions">missions (Directives & Execution)</option>
                  <option value="reviews">reviews (Code Audits & Feedback)</option>
                  <option value="audits">audits (Security & CI Testing)</option>
                  <option value="general">general (Company Coordination)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowNewConvModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!newConvTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono"
              >
                Create Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: UPLOAD ARTIFACT */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                Upload Engineering Artifact / Patch
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Filename:</label>
                  <input
                    type="text"
                    placeholder="e.g. fix_poller.patch or test_audit.py"
                    value={uploadFilename}
                    onChange={(e) => setUploadFilename(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Content Type:</label>
                  <select
                    value={uploadContentType}
                    onChange={(e) => setUploadContentType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="text/x-diff">text/x-diff (.patch)</option>
                    <option value="text/x-python">text/x-python (.py)</option>
                    <option value="text/markdown">text/markdown (.md)</option>
                    <option value="application/json">application/json (.json)</option>
                    <option value="text/plain">text/plain (.log)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">File Contents:</label>
                <textarea
                  rows={8}
                  placeholder="Paste diff patch, test code, audit log, or JSON payload..."
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-y"
                />
              </div>

              <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
                Note: Uploaded files are persisted as Shared Draft Artifacts with SHA-256 integrity. They are not committed to GitHub repositories until PR merge.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 font-mono">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadArtifact}
                disabled={isUploading || !uploadFilename.trim() || !uploadContent}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs"
              >
                {isUploading ? 'Uploading...' : 'Save Artifact & Checksum'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: PREVIEW ARTIFACT CONTENT */}
      {viewingArtifact && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  {viewingArtifact.filename}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {(viewingArtifact.size_bytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                onClick={() => setViewingArtifact(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400 space-y-1">
              <div>Author: @{viewingArtifact.author_id} ({viewingArtifact.author_platform})</div>
              <div>SHA-256 Checksum: <span className="text-cyan-300">{viewingArtifact.sha256_checksum}</span></div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre leading-relaxed">
              {loadingArtifactContent ? 'Loading artifact stream...' : artifactContent}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center font-mono">
              <span className="text-[10px] text-amber-400">
                Shared draft artifact · Distinct from committed git tree
              </span>
              <a
                href={workspaceApi.getArtifactDownloadUrl(viewingArtifact.id)}
                download
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL: QUICK MISSION DISPATCH & INSPECTABLE HANDOFF */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Dispatch Real Brain Mission / Handoff
              </h3>
              <button
                onClick={() => {
                  setShowDispatchModal(false);
                  setDispatchResult(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!dispatchResult ? (
              <div className="space-y-3 font-mono">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Command:</label>
                    <select
                      value={dispatchCmd}
                      onChange={(e) => setDispatchCmd(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="fix">/brain fix</option>
                      <option value="build">/brain build</option>
                      <option value="audit">/brain audit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Repo:</label>
                    <input
                      type="text"
                      value={dispatchRepo}
                      onChange={(e) => setDispatchRepo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Branch:</label>
                    <input
                      type="text"
                      value={dispatchBranch}
                      onChange={(e) => setDispatchBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mission Objective (min 20 chars):</label>
                  <textarea
                    rows={4}
                    value={dispatchObjective}
                    onChange={(e) => setDispatchObjective(e.target.value)}
                    placeholder="e.g. Audit smart-farm poller and resolve race condition in interval scheduler with pytest regression tests."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-bold">Execution Contract: </span>
                  Submissions are validated against verified Brain execution contracts (strict prefix matching, bounded repository, safe path filtering). If write tokens are not yet configured on the runner, an inspectable handoff payload will be generated instantly.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowDispatchModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDispatchMission}
                    disabled={isDispatching || dispatchObjective.length < 20}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs"
                  >
                    {isDispatching ? 'Submitting to Brain Engine...' : 'Execute / Generate Handoff'}
                  </button>
                </div>
              </div>
            ) : (
              /* Inspectable Handoff Result Screen */
              <div className="space-y-3 font-mono">
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Mission Created in Shared Workspace (ID: {dispatchResult.mission_id})
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Mode: <span className="text-slate-200 font-semibold">{dispatchResult.dispatch?.mode}</span>
                  </div>
                </div>

                {/* Exact Issue Body */}
                {dispatchResult.dispatch?.issue_body && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Exact GitHub Issue Body / Command Trigger:</span>
                      <button
                        onClick={() => handleCopyHandoff(dispatchResult.dispatch.issue_body)}
                        className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        {copiedHandoff ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedHandoff ? 'Copied' : 'Copy Payload'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                      {dispatchResult.dispatch.issue_body}
                    </pre>
                  </div>
                )}

                {/* CLI Command */}
                {dispatchResult.dispatch?.gh_cli_command && (
                  <div>
                    <div className="text-xs text-slate-400 mb-1">GitHub CLI (gh) Command:</div>
                    <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto">
                      {dispatchResult.dispatch.gh_cli_command}
                    </pre>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setShowDispatchModal(false);
                      setDispatchResult(null);
                      setDispatchObjective('');
                    }}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
