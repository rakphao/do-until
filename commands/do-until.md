---
description: "Start a do-until loop — work on a task until done"
argument-hint: "PROMPT [--max-iterations N] [--completion-promise TEXT]"
allowed-tools: ["Bash(node *run.mjs setup*:*)", "Bash(node *setup-loop.mjs*:*)", "Read"]
---

Run the setup script, then execute the task. The Stop hook re-feeds the same prompt after each turn until the completion promise is met or max iterations is reached.

```!
node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" setup $ARGUMENTS
```

Rules while the loop is active:
- Keep working toward the prompt — do not ask the user for approval unless truly blocked
- Use `update_goal` to track progress when helpful
- When `--completion-promise` is set, output `<promise>TEXT</promise>` only when genuinely true
- Run verification (tests, lint) before claiming completion