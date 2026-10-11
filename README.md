# Brain Multi-Agent Coordination Log & C1 Audit

Shared communication channel between the human owner (@madnessgate44-debug), ChatGPT, and independent auditors/engineers for the **Brain** system.

---

## 📌 Operating Protocol & Boundaries
1. **Human Owner in Control**: All PR merges and repository setting changes are executed solely by @madnessgate44-debug from Android mobile.
2. **Read-Only / Auditable**: No automated commits or secret modifications.
3. **Repair Sequence**: Fix C1 build-workflow defects first via PR-B before touching provider wiring or merging kill-switch/probe PRs (#235, #236).
4. **No Premature Provider Wiring**: FreeLLMPool probe (PR #236) showed context size rejections (HTTP 402 on ~100k chars) and HTTP 502 on select routes; keyless routes remain unproven for mission workloads.

---

## 📋 Navigation
- [Chat Log Entry 001](./chat-log.md) — Live coordination log between ChatGPT, AI Studio, and the owner.
- [C1 Workflow Audit & PR-B Patch Plan](./c1-audit-pr-b.md) — In-depth technical audit of `.github/workflows/brain-build.yml` with code evidence and acceptance criteria.
