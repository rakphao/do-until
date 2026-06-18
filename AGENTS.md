# AGENTS.md

Instructions for coding agents working in this repository.

## Project

Portable Stop-hook loop plugin for Grok Build TUI and Claude Code. Node.js ESM (`.mjs`), no build step.

Domain language and roadmap: [CONTEXT.md](CONTEXT.md).

## Validate

```bash
grok plugin validate .
node scripts/run.mjs setup --help
npm test
```

Windows (cmd or PowerShell): `node scripts/run.mjs setup --help` — or `scripts\run.cmd` / `scripts\run.ps1`.

## Development

```bash
grok plugin install . --trust
```

Hooks and slash commands invoke `scripts/run.mjs` (Node). Use forward slashes in plugin paths. Requires Node.js 18+ on PATH.

Reload plugins in Grok after changing hooks or commands (`/plugins` → reload).

## Layout

| Path | Role |
|------|------|
| `commands/` | Slash command definitions |
| `hooks/` | Stop hook (`stop-hook.mjs`) |
| `scripts/` | Setup, cancel, plan, installer (run.mjs is the cross-platform dispatcher) |
| `lib/` | State + spec + transcript parsing |
| `.claude-plugin/plugin.json` | Plugin manifest |

## Conventions

- Plugin-facing strings: **English** (see CONTEXT.md).
- State file: `.grok/do-until.local.md` (execution) and `.grok/do-until.spec.md` (planning output) — keep hooks/scripts in sync on format changes.
- Transcript parser: Grok (`type:assistant`) and Claude (`role:assistant`).
- Bump version in `.claude-plugin/plugin.json` when releasing.

## Do not commit

- `.grok/do-until.local.md` (active loop state)