# Brain Multi-Agent Chat Log

Shared coordination log between **@madnessgate44-debug**, **ChatGPT**, and **AI Studio Senior Engineer**.

---

## Log Entry 001: 2026-10-11 — C1 Workflow Security Audit & Minimal PR-B Plan

- **Target Repository**: [`madnessgate44-debug/brain`](https://github.com/madnessgate44-debug/brain)
- **Base Commit**: `1ed933157fa94ad011f325fc2c75b34079204b13` (tip of `main`)
- **PR #223 State**: Merged (`ace1668962ff4a9a0e71df8932fc4469e7f8e874`)
- **PR #235 State**: Open / Unmerged (`BRAIN_BUILD_ENABLED` kill switch unset)
- **PR #236 State**: Open / Unmerged (FreeLLMPool isolated probe only; unproven for missions)

### Summary of Confirmed C1 Workflow Defects
1. **[CRITICAL] Host Code Execution via `.git` Mount**:
   `.github/workflows/brain-build.yml` line 345 mounts `$GITHUB_WORKSPACE` read-write in the agent container. Untrusted code can write `.git/hooks/pre-commit`, which executes on the host runner VM outside Docker when `git commit` runs at line 570 with runner secrets (`GH_TOKEN`, `GH_CONTROL_TOKEN`).
   - *Fix*: Move `.git` out of workspace before running the agent (`mv "$GITHUB_WORKSPACE/.git" /tmp/brain-target-git`), verify agent did not recreate `.git`, restore after run, and run host commits with `git -c core.hooksPath=/dev/null commit --no-verify`.
2. **[MAJOR] Gitleaks Crash on Deletions/Renames**:
   Line 400 runs `git diff --name-only -z | tar --null -T -`. `tar` fails with exit code 2 when encountering deleted files.
   - *Fix*: Filter out deleted files using `--diff-filter=d`.
3. **[MAJOR] String Mangling with `tr '\\n'`**:
   Lines 566–567 use `tr '\\n' ','`, which in bash single quotes translates every literal backslash and letter `n` into commas (e.g. `main.py` -> `mai,.py`), leaving actual newlines unescaped.
   - *Fix*: Replace with POSIX `paste -sd, -` and `paste -sd';' -`.
4. **[MAJOR] Zero Failure Visibility on GitHub Issues**:
   The `publish` step only runs if all steps succeed. Any failure in lease queue, credentials, agent, checks, or gitleaks fails silently with zero issue feedback.
   - *Fix*: Add an always()-executed failure reporting step (`if: always() && failure()`) to report errors and run URLs to the initiating issue.
5. **[MINOR] `git diff --check` Whitespace Abort**:
   Line 380 fails abruptly on trailing whitespace under `set -e`.
   - *Fix*: Wrap with `|| echo "::warning::Whitespace errors detected"`.
6. **[MINOR] Trigger Suffix Matching**:
   `startsWith(..., '/brain build')` matches `/brain builder` or `/brain build-all`.
   - *Fix*: Constrain YAML matching to word/newline boundaries and update `test_brain_build_workflow_contract.py` in sync.
7. **[MINOR] Untruthful Check Claims**:
   Projects without test suites fall back to `compileall`, yet line 574 claims `project checks passed`.
   - *Fix*: Export explicit `check_type` (`pytest`, `compileall smoke check`, `none`).

---

## Log Entry 002: Next Actions for ChatGPT & Owner
1. **Confirm PR-B Scope**: Keep changes strictly bounded to `.github/workflows/brain-build.yml` and `tests/test_brain_build_workflow_contract.py`.
2. **Do Not Touch Provider Wiring**: Do not edit `src/brain/llm_provider.py` or merge PR #235 / PR #236.
3. **Acceptance Criteria Verification**: Verify that all 8 acceptance criteria in `c1-audit-pr-b.md` are satisfied.
