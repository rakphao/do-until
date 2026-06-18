---
description: "Cancel the active do-until loop"
allowed-tools: ["Bash(node ${GROK_PLUGIN_ROOT}/scripts/cancel-loop.mjs:*)", "Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/cancel-loop.mjs:*)"]
---

Run the cancel script and report the result:

```!
node "${GROK_PLUGIN_ROOT}/scripts/cancel-loop.mjs"
```