# C1 Build-Workflow Security Defect Audit & Minimal PR-B Plan

- **Repository**: `madnessgate44-debug/brain`
- **Base Commit**: `1ed933157fa94ad011f325fc2c75b34079204b13` (tip of `main`)
- **PR #223 State**: Merged (`ace1668962ff4a9a0e71df8932fc4469e7f8e874`)
- **PR #235 State**: Open / Unmerged (`BRAIN_BUILD_ENABLED` kill switch remains unset)
- **PR #236 State**: Open / Unmerged (FreeLLMPool probe only; unproven for missions)

---

## 1. Verified Defect Findings

### Finding 1 [CRITICAL]: Host Runner Escape via Writable `.git` Mount
- **Location**: `.github/workflows/brain-build.yml`, Line 345 & Lines 563–574
- **Code**:
  ```python
  "run_args": ["--rm", "--user", f"{os.getuid()}:{os.getgid()}", "-e", "HOME=/tmp", "-v", f"{os.environ['GITHUB_WORKSPACE']}:/workspace"]
  ```
  Host runner then executes:
  ```bash
  git commit -m "Brain ${COMMAND}: automated candidate"
  ```
- **Root Cause & Attack Vector**: Mounting `$GITHUB_WORKSPACE` read-write allows the agent container to write executable scripts into `.git/hooks/pre-commit` or manipulate `.git/config` (`core.hooksPath`). When the workflow subsequently executes `git commit` on the host runner outside Docker, the hook executes on the host VM with access to `GH_TOKEN` (`secrets.BRAIN_GITHUB_TOKEN`) and `GH_CONTROL_TOKEN` (`github.token`).
- **Fix**:
  1. Move `.git` out of the workspace before launching the agent container:
     `mv "$GITHUB_WORKSPACE/.git" /tmp/brain-target-git`
  2. After agent completion, assert the agent did not create an untrusted `.git`:
     `[ ! -e "$GITHUB_WORKSPACE/.git" ] || { echo "::error::Agent created unexpected .git"; exit 1; }`
     and restore:
     `mv /tmp/brain-target-git "$GITHUB_WORKSPACE/.git"`
  3. Execute host git commits with `git -c core.hooksPath=/dev/null commit --no-verify ...`.
  4. For `/brain audit` missions, mount `/workspace` read-only (`:ro`).

---

### Finding 2 [MAJOR]: Gitleaks Crashes Unconditionally on File Deletions / Renames
- **Location**: `.github/workflows/brain-build.yml`, Lines 399–402
- **Code**:
  ```bash
  set -euo pipefail
  git diff --name-only -z | tar --null -T - -cf /tmp/brain-changed-files.tar
  mkdir -p /tmp/brain-gitleaks-source
  tar -xf /tmp/brain-changed-files.tar -C /tmp/brain-gitleaks-source
  ```
- **Root Cause**: `git diff --name-only -z` includes deleted files (`D`). When `tar` attempts to archive a deleted file from disk, it exits with `tar: <file>: Cannot stat: No such file or directory` (code 2), crashing the workflow immediately under `set -e`.
- **Fix**: Exclude deleted files using `--diff-filter=d`:
  ```bash
  git diff --name-only --diff-filter=d -z | tar --null -T - -cf /tmp/brain-changed-files.tar
  ```

---

### Finding 3 [MAJOR]: Silent Workflow Termination (No Failure Issue Comments)
- **Location**: `.github/workflows/brain-build.yml`, Lines 532, 551, 578
- **Code**:
  ```yaml
  if: always() && steps.agent.outcome == 'success' && (needs.prepare.outputs.command == 'audit' || (steps.checks.outcome == 'success' && steps.gitleaks.outcome == 'success'))
  ```
- **Root Cause**: Issue comments are only posted in the `publish` step, which is gated on all preceding steps succeeding. If lease acquisition times out, credentials fail, the agent errors out, gitleaks finds a secret, or tests fail, the workflow terminates silently.
- **Fix**: Add a dedicated failure reporting step executing on `if: always() && failure() && needs.prepare.outputs.issue_number != ''` that posts a structured failure notice with the failed step and run URL to the issue.

---

### Finding 4 [MAJOR]: `tr '\\n'` Mangles File Names and Warning Messages
- **Location**: `.github/workflows/brain-build.yml`, Lines 566–567
- **Code**:
  ```bash
  files_changed="$(git diff --cached --name-only | head -8 | tr '\\n' ',')"
  warnings="$(grep '^WARN:' /tmp/brain-checks.log | head -2 | tr '\\n' ';' || true)"
  ```
- **Root Cause**: In bash single quotes (`'...'`), `'\\n'` represents the literal characters `\` and `n`. `tr` translates every backslash and every letter `n` into commas or semicolons (e.g., `main.py` becomes `mai,.py`), leaving actual newlines unreplaced.
- **Fix**: Use standard POSIX `paste`:
  ```bash
  files_changed="$(git diff --cached --name-only | head -8 | paste -sd, -)"
  warnings="$(grep '^WARN:' /tmp/brain-checks.log | head -2 | paste -sd';' - || true)"
  ```

---

### Finding 5 [MINOR]: `git diff --check` Aborts Agent Step on Whitespace Errors
- **Location**: `.github/workflows/brain-build.yml`, Lines 375, 380
- **Code**:
  ```bash
  set -e
  ...
  git diff --check
  ```
- **Root Cause**: `git diff --check` exits with status 2 if trailing whitespace is present. Under `set -e`, this immediately terminates the step without generating `/tmp/brain-build.patch` or reporting a controlled error.
- **Fix**: Convert to a non-fatal warning:
  ```bash
  git diff --check || echo "::warning::Whitespace errors detected in agent changes."
  ```

---

### Finding 6 [MINOR]: Trigger Expression Allows Unintended Suffixes
- **Location**: `.github/workflows/brain-build.yml`, Lines 45–47, 55–60
- **Code**:
  `startsWith(github.event.issue.body, '/brain build')`
- **Root Cause**: Matches `/brain builder`, `/brain build-all`, or `/brain retry-later`, spinning up runner VMs unnecessarily.
- **Fix**: Require exact match, trailing whitespace, or newline boundaries. Update `tests/test_brain_build_workflow_contract.py` in sync.

---

### Finding 7 [MINOR]: Misleading Test Reporting When No Tests Exist
- **Location**: `.github/workflows/brain-build.yml`, Lines 421–422, 444–449, 574, 578
- **Root Cause**: When a target repository contains no tests, the workflow falls back to `compileall` or emits a warning and exits 0, but reports `Checks: project checks and gitleaks passed`.
- **Fix**: Export `check_type` from the checks step and explicitly label fallback checks (`compileall smoke check`, `none`) in the PR description and issue comment.

---

## 2. Minimal PR-B Implementation Scope

**Target Files**:
1. `.github/workflows/brain-build.yml`
2. `tests/test_brain_build_workflow_contract.py`

**Strict Boundaries**:
- No keyless provider wiring.
- Do not edit `src/brain/llm_provider.py`.
- Do not merge PR #235 or PR #236.
- Leave `BRAIN_BUILD_ENABLED` unset until PR-B is merged and validated.

---

## 3. Acceptance Criteria Checklist

- [ ] **AC-1**: Host runner never executes `.git/hooks/*`; git commits use `core.hooksPath=/dev/null` and `--no-verify`.
- [ ] **AC-2**: `.git` directory is unmounted/isolated during agent execution.
- [ ] **AC-3**: Secret scan succeeds on patches containing file deletions, renames, and filenames with spaces.
- [ ] **AC-4**: `files_changed` and `warnings` format cleanly with `paste -sd` without character mangling.
- [ ] **AC-5**: Whitespace errors log warnings rather than crashing the workflow.
- [ ] **AC-6**: Workflow failures post a diagnostic comment to the initiating issue with the run URL.
- [ ] **AC-7**: Projects with no tests report `smoke check` or `no tests`, not `project checks passed`.
- [ ] **AC-8**: All contract tests in `tests/test_brain_build_workflow_contract.py` pass.
