# do-until

Portable autonomous loop plugin for **Grok Build TUI** and **Claude Code**. Run a task until completion using a Stop hook and inspectable local state — no platform-native `/goal` feature required.

## Why do-until?

Inspired by the [Ralph Wiggum technique](https://github.com/anthropics/claude-plugins-public/tree/main/plugins/ralph-loop) — a portable Stop-hook loop you can run without platform-native `/goal`.

- Slash commands: `/do-until`, `/cancel-do-until`
- Inspect state at `.grok/do-until.local.md`
- Cross-platform Node.js scripts (macOS, Linux, Windows)
- One-line install: `npx github:rakphao/do-until`

## Commands

```
/do-until "Fix failing tests" --max-iterations 20 --completion-promise "ALL GREEN"
/do-until-plan "High-level objective for a plan"
 /do-until --from-spec
/cancel-do-until
```

### Options

| Flag | Description |
|------|-------------|
| `--max-iterations N` | Stop after N turns (default: unlimited) |
| `--completion-promise TEXT` | Agent must output `<promise>TEXT</promise>` when truly done |

### Planning (optional, produces a reusable Loop Spec)

```
/do-until-plan "Objective description" [--max-iterations N] [--completion-promise TEXT]
```

The agent runs a **Planning Session** (human-in-the-loop, one question per turn with explicit choices):

- Refine objective
- List 3–7 deliverables
- Set verify command (e.g. `npm test`)
- Set completion promise token
- Max iterations
- Any constraints

Persist answers with the `plan` subcommands (agent does this automatically):

- `node .../run.mjs plan set <field> <value>`
- `node .../run.mjs plan add-deliverable "Title"`
- `node .../run.mjs plan show`
- `node .../run.mjs plan confirm` (or just reply `CONFIRM`)

After `CONFIRM`, start execution with:

```
/do-until --from-spec
```

Inspect plan at `.grok/do-until.spec.md`. Cancel planning or loop with `/cancel-do-until`.

**Example runtime state (v0.3 with --from-spec + verify gate):**

`.grok/do-until.local.md` (excerpt):
```
current_deliverable: "Implement the verify gate"
current_deliverable_id: 2
deliverables_progress: "1/3"
pending_deliverables: "#2 Polish docs, #3 Final task"
completed_deliverables: "#1 Implement the verify gate"
verify_command: "npm test"
```

The hook re-feeds a focused prompt like:
```
Objective: ...
Current deliverable #2 (2/3): Polish docs
Remaining: #3 Final task
Verify command: npm test
...
(Full plan ... : .grok/do-until.spec.md)
```

The local state and spec are the source of truth for current progress.

**Example of startup message on resume (with one deliverable completed):**

```
do-until loop started (from confirmed spec)

Iteration: 1
Max iterations: unlimited
Completion promise: none
State: .grok/do-until.local.md
Current deliverable: Task two (id: 2)
Deliverables progress: 1/2
Pending: #2 Task two
Completed: #1 Task one
Verify command: echo verified && exit 0

The Stop hook will re-feed this prompt after each turn until done or the limit is reached.
Cancel anytime: /cancel-do-until
```

If the spec already has all deliverables marked complete when you run `/do-until --from-spec`, setup exits early ("All deliverables already complete according to the spec. No execution loop started.") and does not write .local.md or start the loop.

## Install

### Grok Build TUI (recommended)

**One-liner (macOS, Linux, Windows — requires Node.js 18+ and Grok CLI):**

```bash
npx github:rakphao/do-until
```

This runs `grok plugin install`, enables the plugin in your Grok config, and prints next steps.

**Manual install:**

```bash
grok plugin install https://github.com/rakphao/do-until --trust
```

Enable in your Grok config:

```toml
[plugins]
enabled = ["do-until"]
```

Restart Grok or run `/plugins` → reload. Verify with `grok inspect | rg do-until`.

### Claude Code

```bash
grok plugin install https://github.com/rakphao/do-until --trust
```

Or clone locally and trust when prompted:

```bash
git clone https://github.com/rakphao/do-until.git
cd do-until
grok plugin install . --trust
```

## How it works

**Simple path:**

1. `/do-until "..."` writes `.grok/do-until.local.md` with your prompt and settings (when using `--from-spec` this also includes `current_deliverable` and `deliverables_progress`).
2. The agent works on the task.
3. On turn end, the **Stop hook** blocks exit and re-feeds the (current deliverable) prompt.
4. Loop ends when:
   - completion promise matches (`<promise>TEXT</promise>`)
   - all deliverables complete (via verify gate)
   - max iterations reached
   - `/cancel-do-until` is run
   - state file is removed or corrupted

**With planning (recommended for complex work):**

1. `/do-until-plan "objective"` starts interactive Planning Session → writes `.grok/do-until.spec.md`.
2. Answer questions one-by-one (agent persists via `plan` subcommands).
3. Reply `CONFIRM` (or `/do-until-plan --confirm`) to pass Confirmation Gate.
4. `/do-until --from-spec` starts the Execution Loop from the confirmed spec (writes local state).
5. The Stop hook focuses on the next pending deliverable (one at a time, shown with #id). If verify_command is set, it runs the verify as a gate and auto-advances on success. Without verify, mention the title or #id in output to claim and advance. Use `.grok/do-until.spec.md` for full plan and live status. Pause/resume by `/cancel-do-until` then `/do-until --from-spec`.

Scripts are **Node.js** (`.mjs`) with `scripts/run.mjs` entry points. Works on macOS, Linux, Windows (cmd and PowerShell). Requires Node.js 18+ on PATH.

## Development

```bash
git clone https://github.com/rakphao/do-until.git
cd do-until
grok plugin install . --trust
```

Edit, validate (`grok plugin validate .`), run `npm test`, then reload plugins in Grok (`/plugins` → reload).

## Roadmap

- **v0.1** — current loop + docs
- **v0.2** — `/do-until-plan`, Loop Spec, Confirmation Gate
- **v0.3** — deliverable-by-deliverable loop + verify gate + pause/resume via cancel + --from-spec (final major version)

Future work is limited to fine-tuning, bug fixes, and documentation improvements. No further major feature versions are planned. Platform adapters for other CLIs (e.g. Codex) are out of scope, as those platforms already provide native goal functionality.

## License

MIT — see [LICENSE](LICENSE).

## Thai documentation

See [README.th.md](README.th.md).