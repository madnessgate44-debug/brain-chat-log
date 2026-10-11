# Brain X: Universal GitHub Admin Controller, Tamayim Browser & Zero-Cost Fleet

Comprehensive architectural blueprint for **Brain X**—an autonomous software company operations system controlled conversationally by @madnessgate44-debug through ChatGPT on Android. Integrates universal administrative control over GitHub (secrets, apps, workflows, repositories), the **Tamayim** autonomous browser engine, and an automated zero-cost multi-provider keyless LLM fallback chain.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the expanded, unrestricted operational parameters for Brain X:
> - **LLM Engine**: **100% Free Root Models** via a multi-provider fallback chain across keyless routes (FreeLLMPool, Pollinations, LLM7, OVH, OpenRouter Free) with zero API token costs.
> - **GitHub Control**: **Universal Admin Freedom ("Each and every way")** — ChatGPT through Brain X controls GitHub via Personal Access Tokens with full admin scopes, GitHub Apps, and GitHub Actions tokens. It can autonomously create/encrypt repository secrets, write GitHub Actions workflows, manage apps, commit code, and auto-merge PRs.
> - **Browser Engine**: **Tamayim** ("Do nothing can stop Brain X") — unified multi-modal browser combining stealth anti-bot Chromium, DOM form/click interaction, structured markdown extraction, and mobile/desktop visual screenshot capture.

- **Confirmed Decision 1 (Zero-Cost Cascading LLM Pool)**: Brain X never incurs API token costs. A resilient router attempts primary keyless routes, intercepts 429/502/402 status codes, parses rate-limit backoffs, and seamlessly cascades to the next available free route.
- **Confirmed Decision 2 (Tamayim Autonomous Web Operations)**: Tamayim provides deep web interaction: dynamic JavaScript execution, session persistence, anti-bot bypass, automated form/navigation workflows, and dual-viewport verification (mobile 390x844 and desktop 1280x800).
- **Confirmed Decision 3 (Universal GitHub Administration)**: ChatGPT is equipped with complete GitHub management capabilities: libsodium-encrypted secret provisioning (`gh secret set`), workflow creation in `.github/workflows/`, webhook lifecycle handling, and direct branch merge authority.

---

## 1. Overview & Core Concept

### What It Does
**Brain X** serves as the omni-capable execution engine for a software company run entirely through conversational dialogue with ChatGPT:
1. **Universal GitHub Authority Plane**: Allows ChatGPT to execute any GitHub operation:
   - Create and configure new repositories.
   - Encrypt and store repository/organization secrets (`ACTIONS_SECRET`, environment keys).
   - Author, lint, and deploy GitHub Actions workflows (`.github/workflows/*.yml`).
   - Author code, run checks, open PRs, and perform autonomous direct merges.
2. **Tamayim Autonomous Browser Engine**:
   - Live web search and deep research across documentation, APIs, and competitor sites.
   - Headless Playwright/Chromium engine with anti-detection evasions and proxy rotation.
   - Full DOM interaction: clicking, typing, multi-step authenticated workflows.
   - Visual regression capture: full-page mobile (390x844) and desktop (1280x800) PNG generation.
3. **Zero-Cost Multi-Agent Fleet**:
   - **Lead Architect / CEO**: Synthesizes ChatGPT discussions into atomic milestones and workflow plans.
   - **SWE / Builder Agent**: Implements unified diffs, writes workflows, and configures build systems.
   - **QA / Security Auditor (Tamayim Linked)**: Runs Gitleaks (`--diff-filter=d`), executes test suites, and verifies live web interfaces using Tamayim.
   - **DevOps & Release Gatekeeper**: Encrypts secrets, manages tokens, and handles branch releases.

### Target Audience & Persona
- **@madnessgate44-debug** directing the software company from an **Android smartphone** via ChatGPT and GitHub mobile web.
- **ChatGPT** acting as the autonomous co-founder and orchestrator, issuing commands and operating Tamayim.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Conversational Command & Webhook Dispatch**:
   - The user instructs ChatGPT on mobile: *"Brain X, create a new repo for an auth service, set up testing workflows, add an encryption secret, and test the login page with Tamayim."*
   - ChatGPT posts the structured `/brain build` or `/brain browse` issue/comment.
   - Brain X ingests the webhook, acquires queue leases, routes to the fastest free keyless provider, and executes all requested tasks.
2. **Tamayim Autonomous Web Interaction Flow**:
   - ChatGPT or the user issues a browsing task: `/brain browse https://example.com/docs`.
   - Tamayim navigates the site, bypasses bot checks, extracts clean markdown, captures screenshots, and posts visual evidence directly back into the GitHub issue.
3. **Secret & Workflow Autonomous Provisioning Flow**:
   - When ChatGPT needs to store an API key or configure a new pipeline, Brain X fetches the repository's public key, encrypts the secret using libsodium, uploads it via the GitHub Secrets API, and writes the workflow file.

### Visual Identity & Theme (Mobile-First Cyber-Command Cockpit)
- **Palette**: Deep tactical background (`slate-950`), brushed dark surface panels (`slate-900`), electric emerald accents (`emerald-400`) for passing stages, cyber-cyan (`cyan-400`) for Tamayim browser telemetry, and neon amber (`amber-400`) for active secret/token operations.
- **Typography**: High-density tabular figures (`font-mono`) for commits, secrets status, latencies, and Tamayim DOM logs.
- **Mobile Touch Ergonomics**:
   - Fixed thumb-zone bottom navigation bar with $48\text{px}$ touch targets.
   - Collapsible telemetry drawers and single-tap copy actions tailored for Android phone browsers.
   - Unboxed metadata with clean typographic separators (`·`, `/`) compliant with zero-pill anti-slop rules.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: 100% Free Root LLM Multi-Provider Fallback Cascade
- **Chosen Approach**: Multi-tier keyless provider routing. Brain X cascades across:
  `FreeLLMPool (local proxy)` ➔ `Pollinations (OpenAI compatible)` ➔ `LLM7 Default` ➔ `OVH Llama-3.3-70B` ➔ `OpenRouter Free Tier`.
- **Why**: Zero token costs. Automatically bypasses transient rate limits (429) or upstream server issues (502/503) without stalling the company workflow.
- **Alternatives Considered**: Keyed commercial models (rejected per user mandate: *"It's all free, so all of the time we should use free root LLMs"*).

### Decision 2: Tamayim Browser Architecture
- **Chosen Approach**: Multi-mode browser engine supporting (a) rapid text/markdown extraction, (b) visual dual-viewport screenshot generation, and (c) full interactive DOM execution with form-filling and click workflows.
- **Why**: Gives ChatGPT true "sight" and physical agency on the live web, matching TinyFish's capabilities while remaining free and open-source.
- **Alternatives Considered**: Raw curl/fetch scraping (rejected because modern web apps require full JavaScript evaluation and visual screenshot evidence).

### Decision 3: Universal Administrative Execution ("Each and Every Way")
- **Chosen Approach**: Multi-credential authorization bridge supporting GitHub Personal Access Tokens (PAT with admin, repo, workflow, secret scopes), GitHub Apps, and GitHub Actions tokens. Includes client-side libsodium secret encryption.
- **Why**: Empowers ChatGPT to build full infrastructure (creating repos, provisioning secrets, setting up CI/CD) without manual human computer intervention.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HUMAN OWNER (Android Phone)                           │
│                 ChatGPT Mobile App · GitHub Mobile App                      │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ /brain build | /brain browse | secrets
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GITHUB ISSUES, WEBHOOKS & REST API                       │
│       (Repos · Secrets API · Workflows API · App Installations)             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Real-Time Event Stream
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BRAIN X COMMAND CENTER                              │
│                                                                             │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────┐  │
│  │ Universal Admin Hub   │  │ Tamayim Browser Engine│  │ Zero-Cost Router│  │
│  │ - Secret Encryptor    │  │ - Headless Playwright │  │ - FreeLLMPool   │  │
│  │ - Workflow Generator  │  │ - Anti-bot Stealth    │  │ - Pollinations  │  │
│  │ - Repo Creator / Push │  │ - DOM Click & Forms   │  │ - LLM7 / OVH    │  │
│  │ - Autonomous Merge    │  │ - Dual Screenshots    │  │ - Auto 429/502  │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └────────┬────────┘  │
└──────────────┼──────────────────────────┼───────────────────────┼───────────┘
               │                          │                       │
               ▼                          ▼                       ▼
┌───────────────────────────┐ ┌───────────────────────┐ ┌─────────────────────┐
│  SANDBOX RUNTIME (PR-B)   │ │  TAMAYIM WEB VIEWPORT │ │   CASCADE ENGINE    │
│ - .git isolated in /tmp   │ │ - Mobile: 390 x 844   │ │ - 100% Free routes  │
│ - Gitleaks diff-filter=d  │ │ - Desktop: 1280 x 800 │ │ - Exponential retry │
│ - pytest / npm checks     │ │ - Clean Markdown dump │ │ - No token fees     │
└───────────────────────────┘ └───────────────────────┘ └─────────────────────┘
```

### Key Modules & Capabilities
1. **`TamayimEngine`**:
   - Complete browser control suite: URL navigation, interactive element selector clicking, input typing, structured table/article extraction, and dual-viewport visual capture.
2. **`ZeroCostLLMRouter`**:
   - Cascading proxy router connecting keyless endpoints with zero credentials and auto-retry on 429/502.
3. **`GitHubAdminBridge`**:
   - Full-spectrum GitHub administrator: repository creation, libsodium secret encryption (`POST /repos/{owner}/{repo}/actions/secrets/{secret_name}`), workflow dispatch, and automated PR merging.
4. **`FleetOrchestrator`**:
   - Coordinates the 4 company agents, streams live logs to the mobile UI, and syncs execution history to `chat-log.md`.
