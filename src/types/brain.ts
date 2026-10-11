export type MissionCommand = 'build' | 'fix' | 'audit' | 'browse' | 'secret' | 'merge';

export type MissionStatus = 'draft' | 'queued' | 'running' | 'success' | 'failed' | 'gated';

export interface AgentRole {
  id: string;
  name: string;
  title: string;
  icon: string;
  description: string;
  responsibilities: string[];
  status: 'idle' | 'active' | 'waiting_approval' | 'standby';
  lastAction: string;
  tokenUsage: number;
  callLimit: number;
}

export interface PipelineStep {
  id: string;
  name: string;
  stage: 'intake' | 'lease' | 'sandbox' | 'secrets' | 'checks' | 'publish';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning' | 'skipped';
  durationMs?: number;
  details?: string;
  logLines: string[];
}

export interface Mission {
  id: string;
  command: MissionCommand;
  targetRepository: string;
  targetBranch: string;
  objective: string;
  status: MissionStatus;
  createdAt: string;
  completedAt?: string;
  candidatePrUrl?: string;
  checksResult?: {
    type: string;
    passed: boolean;
    warning?: string;
  };
  filesChanged?: string[];
  steps: PipelineStep[];
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  file: string;
  lineRange: string;
  legacyBehavior: string;
  hardenedSolution: string;
  status: 'Vulnerable in PR #223' | 'Resolved in PR-B';
}

export interface FreeLLMProvider {
  id: string;
  name: string;
  routeId: string;
  model: string;
  latencyMs: number;
  status: 'healthy' | 'throttled' | 'offline';
  costPerToken: '$0.00 (Free Root)';
  endpoint: string;
  maxContextChars: number;
}

export interface TamayimSession {
  url: string;
  status: 'idle' | 'navigating' | 'extracting' | 'capturing' | 'complete' | 'error';
  title?: string;
  markdownContent?: string;
  desktopScreenshotUrl?: string;
  mobileScreenshotUrl?: string;
  interactiveLog: string[];
  stealthBypassActive: boolean;
}

export interface GitHubSecret {
  name: string;
  environment: string;
  updatedAt: string;
  status: 'encrypted_libsodium' | 'active';
}
