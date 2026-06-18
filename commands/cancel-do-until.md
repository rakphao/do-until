---
description: "Cancel the active do-until loop"
allowed-tools: ["Bash(node *run.mjs cancel*:*)", "Bash(node *cancel-loop.mjs*:*)", "Read"]
---

Run the cancel script and report the result.
If a Planning Session (unconfirmed spec) is active it will be aborted; otherwise the Execution Loop is cancelled.

```!
node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" cancel
```