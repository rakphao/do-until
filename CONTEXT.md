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
The plan artifact at `.grok/do-until.spec.md` produced by Planning Session. Fields: objective, deliverables (id, title, status), verify_command, completion_promise, max_iterations, constraints, confirmed. Consumed by Execution Loop after Confirmation Gate.
_Avoid_: plan.md (when referring to the runtime contract), prompt (ambiguous)

**Verify Command**:
The shell gate run before marking a deliverable complete (e.g. `pnpm test && pnpm lint`).
_Avoid_: test command (generic), CI (when meaning local gate)

**Blocked Policy**:
Intentionally not implemented in this plugin.

The design philosophy is to let the agent continue improvising with best-effort heuristics as long as it does not cause damage (e.g. the loop only stops on explicit completion conditions: completion promise, all deliverables verified, max iterations, or explicit cancel).

This aligns with favoring agent autonomy over frequent human intervention for "stuck" states. Native agent platforms (such as Claude Code's /goal) already surface "blocked on you" when real human input is required.

See user guidance: prefer "keep going with best heuristic" over building stop-and-wait behavior into the portable loop.

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
Phased OSS publish up to v0.3 (deliverable loop + pause/resume). v0.3 is the final major version. Subsequent work is limited to fine-tuning and maintenance.
_Avoid_: big-bang release, v1.0 day one, scope creep beyond portable stop-hook loop.

**Primary Language**:
English for all plugin surfaces — command descriptions, script output, hook messages, and the main README.
_Avoid_: Thai-first plugin UI, mixed-language commands

**Locale**:
Thai as supplementary documentation only (e.g. README.th.md). Not duplicated inside runtime plugin strings.
_Avoid_: i18n framework (for v1), bilingual commands

**Upstream Repository**:
https://github.com/rakphao/do-until — source of truth for development and releases.

**Installed Copy**:
The plugin tree loaded by the agent CLI after `grok plugin install` or the npx installer.
_Avoid_: editing the installed copy in place instead of this repository

**Supported Platform** (v1):
Grok Build TUI and Claude Code — shared plugin format (commands, hooks, skills). Primary OSS targets for initial release.
_Avoid_: agent-agnostic (for v1 scope), all CLIs

**Platform Adapter**:
A thin compatibility layer for a future agent CLI (e.g. Codex) that maps its hook/slash-command model to the shared loop core. Not in v1 scope.
_Avoid_: compat shim (vague), port (ambiguous)