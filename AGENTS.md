# Repository Agent Instructions

## Mandatory Engineering Execution OS

Before any engineering, repository, audit, or implementation task, read `ENGINEERING_EXECUTION_OS.md` from the repository root and follow it as the controlling project procedure. If it is absent or cannot be read, stop and report BLOCKED; do not improvise a replacement.

Required:
- Follow OUTCOME → INSPECT → SPECIFY → PLAN → EXECUTE → VERIFY → REVIEW → CLOSE.
- Establish repository state and baseline before changing files; number requirements and map each to evidence and acceptance criteria.
- Use the OS's TOOL DECLARATION at the start and COMPLIANCE HEADER at the end of every execution report.
- Tag non-trivial claims inline with the OS evidence tags.
- Record real verification actions, outcomes, raw excerpts, timestamps, and exit codes; never claim checks passed if they were not run.
- Inspect diffs and preserve unrelated work. No fabricated paths, tests, results, sync, deployments, or agent capabilities.
- Follow the OS authority boundaries. Never bypass required human approval for consequential actions.
- If the OS conflicts with older repository instructions, identify the conflict and follow the OS unless the user explicitly directs otherwise in the current session.
