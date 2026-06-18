# do-until

Open-source autonomous loop plugin for agent CLIs (Grok Build TUI, Claude Code). Runs work until completion using hooks and inspectable local state — without requiring platform-native goal features.

## Language

**North Star**:
Win on portability, transparency, and cross-agent support; match native goal UX only where a plugin can (plan, verify, pause/resume). Do not replicate server-side goal engines.
_Avoid_: "Beat goal" (unqualified), feature parity (absolute)

**Autonomous Loop**:
A session-scoped cycle that continues working toward an objective across turns until a completion condition is met or the loop is cancelled.
_Avoid_: Ralph loop (as product name), goal mode (when referring to this plugin)

**Completion Promise**:
A exact text token the agent outputs (`<promise>TEXT</promise>`) to signal genuine completion when the loop's exit criterion is promise-based.
_Avoid_: Done signal, exit phrase

**Deliverable**:
A discrete unit of work within a loop (e.g. one task from a plan) tracked in loop state and verified before the loop advances.
_Avoid_: Task (generic), step (ambiguous)

**Loop Spec**:
The plan artifact at `.grok/do-until.spec.md` produced by Planning Session. Fields: objective, deliverables (id, title, status), verify_command, completion_promise, max_iterations, blocked_policy, constraints, confirmed. Consumed by Execution Loop after Confirmation Gate.
_Avoid_: plan.md (when referring to the runtime contract), prompt (ambiguous)

**Verify Command**:
The shell gate run before marking a deliverable complete (e.g. `pnpm test && pnpm lint`).
_Avoid_: test command (generic), CI (when meaning local gate)

**Blocked Policy**:
What Execution Loop does when the agent is truly stuck. v1 default: stop the loop and log — not ask the developer mid-loop.
_Avoid_: escalation (ambiguous), human-in-the-loop (during execution)

**Planning Session**:
An interactive, human-in-the-loop interview (one question at a time) that produces a Loop Spec and requires explicit developer confirmation before execution starts.
_Avoid_: grill (as product name), plan phase (ambiguous)

**Execution Loop**:
The autonomous, human-out-of-loop phase that runs against a confirmed Loop Spec until completion or cancellation.
_Avoid_: do-until (when referring only to this phase), ralph loop

**Confirmation Gate**:
A mandatory developer approval step after Planning Session ends. Execution Loop does not start until the developer explicitly confirms (e.g. types confirm or runs `/do-until --from-spec`). Default is no auto-start.
_Avoid_: auto-run (as default behavior), approval prompt (generic)

**Planning Question**:
One interview step in a Planning Session. Each question must offer explicit choices and a recommended option — never open-ended-only.
_Avoid_: grill question (generic), prompt (ambiguous)

**Project Name**:
do-until — chosen for clarity-first naming. Slash commands and repo name match the product name.
_Avoid_: charter, pact (rejected alternatives), clever names (deferred)

**Release Strategy**:
Phased OSS publish — v0.1 (current plugin + docs), v0.2 (do-until-plan + Loop Spec), v0.3 (deliverable loop + pause/resume).
_Avoid_: big-bang release, v1.0 day one

**Primary Language**:
English for all plugin surfaces — command descriptions, script output, hook messages, and the main README.
_Avoid_: Thai-first plugin UI, mixed-language commands

**Locale**:
Thai as supplementary documentation only (e.g. README.th.md). Not duplicated inside runtime plugin strings.
_Avoid_: i18n framework (for v1), bilingual commands

**Upstream Repository**:
https://github.com/rakphao/do-until — source of truth for development and releases.
_Avoid_: ~/.grok/plugins (as dev workspace), runtime path (as git root)

**Dev Repository**:
A local git clone used for editing, commits, and PRs. Separate from the runtime install path.
_Avoid_: developing in-place inside runtime, home folder repo

**Runtime Install**:
The copy Grok/Claude Code loads at session start (via `grok plugin install` or `npx` installer). Separate from the dev git clone — not edited directly, not symlinked from the dev tree (a broken dev copy must not break other projects).
_Avoid_: source tree, dev repo, dev-to-runtime symlink

**Supported Platform** (v1):
Grok Build TUI and Claude Code — shared plugin format (commands, hooks, skills). Primary OSS targets for initial release.
_Avoid_: agent-agnostic (for v1 scope), all CLIs

**Platform Adapter**:
A thin compatibility layer for a future agent CLI (e.g. Codex) that maps its hook/slash-command model to the shared loop core. Not in v1 scope.
_Avoid_: compat shim (vague), port (ambiguous)