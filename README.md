# pi-agent-config

Personal [Pi coding agent](https://pi.dev) configuration for CUDA, NVIDIA Blackwell/Hopper, and TileLang development.

## Quick Start

### 1. Install Pi

```bash
curl -fsSL https://pi.dev/install.sh | sh
pi --version
```

### 2. Clone

```bash
git clone \
  git@github.com:Ruihan11/pi-agent-config.git \
  "$HOME/.pi/agent"
```

If `~/.pi/agent` already exists, stop Pi and back it up first:

```bash
mv "$HOME/.pi/agent" "$HOME/.pi/agent.backup.$(date +%Y%m%d-%H%M%S)"
```

### 3. Configure API Keys

Add the following to your local `~/.bashrc`:

```bash
export OPENAI_API_KEY="<your-openai-api-key>"
export ANTHROPIC_API_KEY="<your-anthropic-api-key>"
```

Then reload the shell and start Pi:

```bash
source "$HOME/.bashrc"
pi
```

Pi reads both variables directly. `models.example.json` is an optional safe template for a local, ignored `models.json`:

```bash
cp "$HOME/.pi/agent/models.example.json" "$HOME/.pi/agent/models.json"
```

## Pi Packages

The configured Pi packages are declared in [`settings.json`](settings.json) and are loaded for both OpenAI and Anthropic models:

| Package | Purpose |
|---|---|
| `npm:pi-terminal-math` | Render LaTeX equations as terminal-native text |
| `npm:@plannotator/pi-extension` | Review plans, annotate messages, and review code changes |

On a fresh checkout, Pi installs missing packages from these declarations. To inspect or refresh them:

```bash
cd "$HOME/.pi/agent"
pi list
pi update --extensions
```

The package caches under `npm/` and `git/` are machine-local and intentionally ignored by Git. Do not edit or commit them; update the declarations in `settings.json` when changing the package set.

## Skill Categories

Skills are grouped by directory for navigation; Pi still discovers every nested `SKILL.md`, and skill commands use the frontmatter name (for example, `/skill:cuda`).

```text
skills/
├── gpu/             cuda (directory: cuda_skill/), ncu-report-skill
├── tilelang/        writing, debugging, profiling, optimizing, torch-profiling
├── visualization/   architecture-diagram
├── workflow/        save-for-the-day, save-for-the-week
└── KernelWiki/      vendored GPU knowledge snapshot (path retained)
```

`ncu-report-skill` is vendored at `skills/gpu/ncu-report-skill/`; see its [`UPSTREAM.md`](skills/gpu/ncu-report-skill/UPSTREAM.md) for the pinned source commit and licensing note. `KernelWiki` remains at the top level because it is a larger vendored snapshot with its own layout.

## Update

```bash
cd "$HOME/.pi/agent"
git pull --ff-only
```

## Local State

`models.json`, `APPEND_SYSTEM.md`, `auth.json`, sessions, caches, and machine-specific configuration are ignored by Git. Never place real API keys or exported sessions in tracked files.
