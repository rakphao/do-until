# AGENTS.md

Instructions for coding agents working in this repository.

## Project

Portable Stop-hook loop plugin for Grok Build TUI and Claude Code. Node.js ESM (`.mjs`), no build step.

Domain language and roadmap: see [CONTEXT.md](CONTEXT.md).

## Validate

```bash
grok plugin validate .
node scripts/setup-loop.mjs --help
```

## Development workflow

1. Edit in this repo (dev tree).
2. Install or refresh runtime separately — **do not symlink this repo into `~/.grok/plugins/`**. A broken dev tree must not take down plugins in other projects.
3. Test locally:

```bash
grok plugin install . --trust
# after changes to hooks/commands:
# reload plugins in Grok (/plugins → reload)
```

4. Push to GitHub; users install via `npx github:rakphao/do-until` or `grok plugin install https://github.com/rakphao/do-until --trust`.

## Layout

| Path | Role |
|------|------|
| `commands/` | Slash command definitions |
| `hooks/` | Stop hook (`stop-hook.mjs`) |
| `scripts/` | Setup, cancel, installer |
| `lib/` | State + transcript parsing |
| `.claude-plugin/plugin.json` | Plugin manifest |

## Conventions

- Plugin-facing strings: **English** (see CONTEXT.md — Primary Language).
- State file shape: `.grok/do-until.local.md` — do not rename without updating hooks and scripts.
- Transcript parser must support Grok (`type:assistant`) and Claude (`role:assistant`).
- Bump `.claude-plugin/plugin.json` version when releasing.

## Do not commit

- `.grok/do-until.local.md` (loop runtime state)
- Machine-specific paths (`~/Projects/...`, personal harness notes)
- Competitive comparisons with other plugins in user-facing docs

## Docs gate (before push)

Skim all `*.md` in the repo: README, README.th, CONTEXT, AGENTS, `commands/`. No personal paths, no unpublished internal notes, no trash-talk.