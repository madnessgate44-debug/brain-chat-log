// Brain X Client API Service
// Connects UI directly to SQLite-backed /api/v1 REST endpoints

export interface ParticipantIdentity {
  id: string;
  name: string;
  platform: string;
  role: string;
  defaultKey: string;
  badge: string;
  avatarBg: string;
}

export const PRESET_IDENTITIES: ParticipantIdentity[] = [
  {
    id: 'ahmed',
    name: 'Ahmed (Owner)',
    platform: 'ahmed',
    role: 'owner',
    defaultKey: 'brain_key_ahmed_owner_2026',
    badge: 'OWNER / ANDROID',
    avatarBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT Lead Orchestrator',
    platform: 'chatgpt',
    role: 'architect_orchestrator',
    defaultKey: 'brain_key_chatgpt_action_2026',
    badge: 'CO-FOUNDER / GPT-4o',
    avatarBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
  },
  {
    id: 'claude',
    name: 'Claude Senior Reviewer',
    platform: 'claude',
    role: 'auditor_architect',
    defaultKey: 'brain_key_claude_agent_2026',
    badge: 'AUDITOR / SONNET',
    avatarBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: 'aistudio',
    name: 'Google AI Studio Engine',
    platform: 'aistudio',
    role: 'host_engine',
    defaultKey: 'brain_key_aistudio_runner_2026',
    badge: 'BUILDER / CLOUD RUN',
    avatarBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  {
    id: 'agent:swe',
    name: 'SWE Agent Sandbox',
    platform: 'system_agent',
    role: 'coder',
    defaultKey: 'brain_key_agent_swe_2026',
    badge: 'EXECUTION WORKER',
    avatarBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  }
];

export interface Conversation {
  id: string;
  title: string;
  channel: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  message_count?: number;
  last_message_at?: string;
}

export interface WorkspaceMessage {
  sequence: number;
  id: string;
  conversation_id: string;
  author_id: string;
  author_platform: string;
  content: string;
  message_type: 'text' | 'directive' | 'review' | 'result' | 'code';
  reply_to_id?: string | null;
  mission_id?: string | null;
  artifact_ids?: string[];
  created_at: string;
}

export interface PersistedMission {
  id: string;
  title: string;
  command: string;
  target_repository: string;
  target_branch: string;
  objective: string;
  status: 'draft' | 'queued' | 'in_progress' | 'review_pending' | 'approved' | 'completed' | 'failed';
  assigned_to?: string | null;
  creator_id: string;
  creator_platform: string;
  deadline?: string | null;
  execution_ref?: string | null;
  pr_url?: string | null;
  commit_sha?: string | null;
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

export interface ArtifactMeta {
  id: string;
  mission_id?: string | null;
  conversation_id?: string | null;
  author_id: string;
  author_platform: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  sha256_checksum: string;
  version: number;
  created_at: string;
  metadata?: any;
}

export interface GitHubStatusResponse {
  repository: string;
  connected: boolean;
  has_auth: boolean;
  repo_details: {
    name: string;
    default_branch: string;
    open_issues: number;
    description: string;
    html_url: string;
    pushed_at: string;
  } | null;
  recent_commits: Array<{
    sha: string;
    full_sha: string;
    message: string;
    author: string;
    date: string;
  }>;
  open_pull_requests: Array<{
    number: number;
    title: string;
    author: string;
    branch: string;
    html_url: string;
    created_at: string;
    draft: boolean;
  }>;
  recent_workflow_runs: Array<{
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: string;
    event: string;
    html_url: string;
    created_at: string;
    run_attempt: number;
  }>;
  rate_limit: {
    remaining: number | null;
    limit: number | null;
  };
  queried_at: string;
}

class BrainWorkspaceClient {
  private currentIdentity: ParticipantIdentity = PRESET_IDENTITIES[0];
  private customToken: string | null = null;

  constructor() {
    const savedId = localStorage.getItem('brain_active_identity');
    if (savedId) {
      const found = PRESET_IDENTITIES.find((p) => p.id === savedId);
      if (found) this.currentIdentity = found;
    }
  }

  public getIdentity(): ParticipantIdentity {
    return this.currentIdentity;
  }

  public setIdentity(identity: ParticipantIdentity): void {
    this.currentIdentity = identity;
    this.customToken = null;
    localStorage.setItem('brain_active_identity', identity.id);
  }

  public setCustomToken(token: string): void {
    this.customToken = token;
  }

  public getActiveToken(): string {
    return this.customToken || this.currentIdentity.defaultKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${this.getActiveToken()}`);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(path, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errMessage = `HTTP ${res.status} ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.message) errMessage = errorJson.message;
        else if (errorJson.error) errMessage = errorJson.error;
      } catch {
        // ignore
      }
      const err = new Error(errMessage) as any;
      err.status = res.status;
      throw err;
    }

    return res.json() as Promise<T>;
  }

  // Health
  public async getHealth() {
    const res = await fetch('/api/v1/health');
    return res.json();
  }

  // Conversations
  public async getConversations(): Promise<{ conversations: Conversation[] }> {
    return this.request('/api/v1/conversations');
  }

  public async createConversation(title: string, channel = 'general', metadata?: any): Promise<Conversation> {
    return this.request('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, channel, metadata })
    });
  }

  public async getMessages(
    conversationId: string,
    sinceSeq = 0,
    limit = 100
  ): Promise<{ conversation_id: string; messages: WorkspaceMessage[]; next_cursor: number; has_more: boolean }> {
    return this.request(`/api/v1/conversations/${conversationId}/messages?since=${sinceSeq}&limit=${limit}`);
  }

  public async sendMessage(params: {
    conversationId: string;
    content: string;
    messageType?: 'text' | 'directive' | 'review' | 'result' | 'code';
    replyToId?: string | null;
    missionId?: string | null;
    artifactIds?: string[];
  }): Promise<WorkspaceMessage> {
    const idempotencyKey = `ui_${this.currentIdentity.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.request(`/api/v1/conversations/${params.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: params.content,
        message_type: params.messageType || 'text',
        reply_to_id: params.replyToId || null,
        mission_id: params.missionId || null,
        artifact_ids: params.artifactIds || [],
        idempotency_key: idempotencyKey
      })
    });
  }

  // Missions
  public async getMissions(filter?: { status?: string; assigned_to?: string; repository?: string }): Promise<{ missions: PersistedMission[] }> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.assigned_to) params.set('assigned_to', filter.assigned_to);
    if (filter?.repository) params.set('repository', filter.repository);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/v1/missions${qs}`);
  }

  public async createMission(data: {
    title: string;
    command: string;
    target_repository: string;
    target_branch?: string;
    objective: string;
    assigned_to?: string;
    deadline?: string;
    dependencies?: string[];
  }): Promise<PersistedMission> {
    return this.request('/api/v1/missions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateMissionStatus(id: string, status: string, assignedTo?: string): Promise<PersistedMission> {
    return this.request(`/api/v1/missions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, assigned_to: assignedTo })
    });
  }

  public async recordReview(
    missionId: string,
    status: 'approved' | 'rejected' | 'changes_requested',
    findings: string,
    comments?: string
  ) {
    return this.request(`/api/v1/missions/${missionId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ status, findings, comments })
    });
  }

  // Artifacts
  public async getArtifacts(missionId?: string): Promise<{ artifacts: ArtifactMeta[] }> {
    const qs = missionId ? `?mission_id=${encodeURIComponent(missionId)}` : '';
    return this.request(`/api/v1/artifacts${qs}`);
  }

  public async uploadArtifact(payload: {
    filename: string;
    contentText?: string;
    contentBase64?: string;
    contentType?: string;
    missionId?: string;
    conversationId?: string;
    metadata?: any;
  }): Promise<ArtifactMeta> {
    return this.request('/api/v1/artifacts', {
      method: 'POST',
      body: JSON.stringify({
        filename: payload.filename,
        content_text: payload.contentText,
        content_base64: payload.contentBase64,
        content_type: payload.contentType || 'text/plain',
        mission_id: payload.missionId,
        conversation_id: payload.conversationId,
        metadata: payload.metadata
      })
    });
  }

  public getArtifactDownloadUrl(artifactId: string): string {
    return `/api/v1/artifacts/${artifactId}/download`;
  }

  // Sync
  public async getSync(sinceSeq = 0, sinceTs = '1970-01-01T00:00:00.000Z', conversationId?: string) {
    const params = new URLSearchParams({
      since_seq: String(sinceSeq),
      since_ts: sinceTs
    });
    if (conversationId) params.set('conversation_id', conversationId);
    return this.request(`/api/v1/sync?${params.toString()}`);
  }

  // GitHub Execution & Status
  public async getGitHubStatus(repo = 'madnessgate44-debug/brain'): Promise<GitHubStatusResponse> {
    const res = await fetch(`/api/v1/github/status?repo=${encodeURIComponent(repo)}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch GitHub status: ${res.statusText}`);
    }
    return res.json();
  }

  public async dispatchMission(payload: {
    command: string;
    target_repository: string;
    target_branch?: string;
    objective: string;
    conversation_id?: string;
    assigned_to?: string;
    preferred_mode?: 'auto' | 'handoff' | 'direct';
  }) {
    return this.request('/api/v1/github/dispatch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async getWorkflowRunJobs(runId: number | string, repo = 'madnessgate44-debug/brain') {
    const res = await fetch(`/api/v1/github/runs/${runId}/jobs?repo=${encodeURIComponent(repo)}`);
    if (!res.ok) throw new Error('Failed to fetch run jobs');
    return res.json();
  }
}

export const workspaceApi = new BrainWorkspaceClient();
