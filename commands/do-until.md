---
description: "Start a do-until loop — work on a task until done"
argument-hint: "PROMPT [--max-iterations N] [--completion-promise TEXT] | --from-spec"
allowed-tools: ["Bash(node *run.mjs setup*:*)", "Bash(node *setup-loop.mjs*:*)", "Read"]
---

Run the setup script, then execute the task. The Stop hook re-feeds the (current deliverable) prompt after each turn until the completion promise is met, all deliverables complete, or max iterations is reached.

```!
node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" setup $ARGUMENTS
```

Rules while the loop is active:
- Keep working toward the prompt (or the objective from a confirmed .grok/do-until.spec.md when started with --from-spec) — do not ask the user for approval unless truly blocked
- Use `update_goal` to track progress when helpful (use one goal per deliverable)
- When `--completion-promise` is set, output `<promise>TEXT</promise>` only when genuinely true
- Run verification (tests, lint) before claiming completion
- If started via --from-spec, the Stop hook focuses the prompt on the next pending deliverable from the spec (one at a time, shown with #id). When a verify_command is set, the hook runs it as a gate and auto-advances on success. Without verify, mention the title or #id in output to claim complete and advance.
- The .grok/do-until.spec.md (plan + deliverable statuses [x]) and .grok/do-until.local.md (runtime state with current_deliverable + current_deliverable_id + deliverables_progress + pending_deliverables + completed_deliverables) are available for reference. Use /cancel-do-until + /do-until --from-spec to pause/resume.