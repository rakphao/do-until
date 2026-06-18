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
/cancel-do-until
```

### Options

| Flag | Description |
|------|-------------|
| `--max-iterations N` | Stop after N turns (default: unlimited) |
| `--completion-promise TEXT` | Agent must output `<promise>TEXT</promise>` when truly done |

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

1. `/do-until` writes `.grok/do-until.local.md` with your prompt and settings.
2. The agent works on the task.
3. On turn end, the **Stop hook** blocks exit and re-feeds the same prompt.
4. Loop ends when:
   - completion promise matches (`<promise>TEXT</promise>`)
   - max iterations reached
   - `/cancel-do-until` is run
   - state file is removed or corrupted

Scripts are **Node.js** (`.mjs`) for cross-platform support on macOS, Linux, and Windows.

## Development

```bash
git clone https://github.com/rakphao/do-until.git
cd do-until
grok plugin install . --trust
```

Edit, validate (`grok plugin validate .`), then reload plugins in Grok (`/plugins` → reload).

## Roadmap

- **v0.1** — current loop + docs (this release)
- **v0.2** — `/do-until-plan`, Loop Spec, Confirmation Gate
- **v0.3** — deliverable-by-deliverable loop, verify gate, pause/resume

## License

MIT — see [LICENSE](LICENSE).

## Thai documentation

See [README.th.md](README.th.md).