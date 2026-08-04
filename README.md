# pi-agent-config

Personal configuration for the [Pi coding agent](https://pi.dev), including global agent instructions, model defaults, and reusable skills for CUDA, NVIDIA Blackwell, and TileLang development.

> [!IMPORTANT]
> Credentials and session history are intentionally not versioned. For now, this configuration only enables the OpenAI/Codex and Anthropic/Claude APIs. Configure their keys locally on every machine.

## Quick Start

### 1. Install Pi

Use the official installer:

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Or install the npm package:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Verify the installation:

```bash
pi --version
```

### 2. Install This Configuration

For a fresh setup, clone directly into Pi's default configuration directory:

```bash
git clone --recurse-submodules \
  git@github.com:Ruihan11/pi-agent-config.git \
  "$HOME/.pi/agent"
```

If `~/.pi/agent` already exists, stop Pi and back it up first:

```bash
backup="$HOME/.pi/agent.backup.$(date +%Y%m%d-%H%M%S)"
mv "$HOME/.pi/agent" "$backup"
git clone --recurse-submodules \
  git@github.com:Ruihan11/pi-agent-config.git \
  "$HOME/.pi/agent"
```

To keep the checkout elsewhere, point Pi to it explicitly:

```bash
export PI_CODING_AGENT_DIR="/path/to/pi-agent-config"
```

### 3. Configure OpenAI/Codex and Anthropic/Claude APIs

Only these two API credentials are currently required:

| Model family | Pi provider | Environment variable |
|---|---|---|
| OpenAI / Codex | `openai` | `OPENAI_API_KEY` |
| Anthropic / Claude | `anthropic` | `ANTHROPIC_API_KEY` |

These variables use direct API billing; they are not ChatGPT Plus/Pro or Claude Pro/Max subscription credentials.

Add the exports to your local `~/.bashrc`:

```bash
# OpenAI / Codex API
export OPENAI_API_KEY="<your-openai-api-key>"

# Anthropic / Claude API
export ANTHROPIC_API_KEY="<your-anthropic-api-key>"
```

Apply the changes to the current shell:

```bash
source "$HOME/.bashrc"
```

Verify that both variables are present without printing either secret:

```bash
test -n "${OPENAI_API_KEY:-}" && echo "OPENAI_API_KEY is set"
test -n "${ANTHROPIC_API_KEY:-}" && echo "ANTHROPIC_API_KEY is set"
```

Pi's built-in providers read these variables directly, so an active `models.json` is not required for the official APIs. To materialize the repository's safe example as a machine-local configuration, optionally run:

```bash
cp "$HOME/.pi/agent/models.example.json" "$HOME/.pi/agent/models.json"
```

The resulting `models.json` is ignored by Git and may be customized locally. Then start Pi:

```bash
pi
```

Do not commit `~/.bashrc` or copy real keys into this repository. The exports are plaintext local secrets; use a password manager or a separate mode-`0600` file sourced by `~/.bashrc` if stronger isolation is needed.

As an alternative, `/login` can store API keys in `~/.pi/agent/auth.json`. That file is ignored by Git, and its credentials take precedence over shell environment variables.

### 4. Verify the Configuration

The configured model scope contains exactly three models:

| Provider | Model ID |
|---|---|
| OpenAI | `gpt-5.6-sol` |
| Anthropic | `claude-opus-5` |
| Anthropic | `claude-fable-5` |

Useful interactive commands and shortcuts:

```text
/model                     Select an authenticated model
/scoped-models             Review the three enabled cycling models
/settings                  Configure model and thinking defaults
/reload                    Reload extensions and other configuration resources
/skill:ncu-report-skill    Force-load a skill as a smoke test
Shift+Tab                  Cycle the current thinking level
```

## Repository Layout

```text
~/.pi/agent/
├── AGENTS.md              Global behavior and workflow instructions
├── settings.json          Default provider, model, and UI settings
├── models.example.json    Safe provider credential template
├── extensions/
│   └── status-line.ts     Rainbow model, Git diff, and context footer
├── skills/                Locally maintained and third-party skills
│   ├── KernelWiki/        Vendored Blackwell/Hopper knowledge base
│   └── ncu-report-skill/  Git submodule for B200 Nsight Compute analysis
├── themes/
│   └── catppuccin-mocha.json  Active custom TUI theme
├── .gitmodules            Pinned third-party submodule metadata
├── .gitignore             Deny-by-default tracking policy
└── README.md
```

Pi automatically discovers skill directories containing `SKILL.md` under `~/.pi/agent/skills/`.

## Included Skills

| Skill | Purpose |
|---|---|
| `architecture-diagram` | Generate dark-themed HTML and SVG architecture diagrams |
| `cuda` | General CUDA development, debugging, profiling, and optimization |
| `debugging-tilelang-programs` | Diagnose TileLang build failures, crashes, and wrong results |
| `kernel-wiki` | Query Blackwell and Hopper kernel optimization knowledge |
| `ncu-report-skill` | Profile B200 kernels and produce evidence-backed NCU reports |
| `optimizing-tilelang-programs` | Tune TileLang tiles, pipelines, occupancy, and fusion |
| `profiling-tilelang-programs` | Benchmark TileLang kernels with built-in and NVIDIA profilers |
| `save-for-the-day` | Save a daily work log |
| `save-for-the-week` | Aggregate daily logs into a weekly summary |
| `torch-profiling-tilelang-programs` | Profile TileLang pipelines with `torch.profiler` |
| `writing-tilelang-kernels` | Implement new TileLang GPU kernels |

Use a skill explicitly with:

```text
/skill:<skill-name>
```

Otherwise Pi advertises skill names and descriptions to the active model and loads matching instructions on demand. The same skill catalog works with both Anthropic and OpenAI models.

## Configuration

### Global Instructions

`AGENTS.md` is loaded for every Pi session. It defines communication style, plan-before-edit behavior, Git safety, testing expectations, and command conventions.

### Settings

`settings.json` contains reproducible defaults. Its `enabledModels` list limits model cycling to `openai/gpt-5.6-sol`, `anthropic/claude-opus-5`, and `anthropic/claude-fable-5`. Project-level `.pi/settings.json` files override these global settings when the project is trusted.

Common interactive controls:

```text
/settings    Edit common settings
/model       Change the active model
Shift+Tab    Change thinking level for the current session
```

### Theme

`themes/catppuccin-mocha.json` defines the Catppuccin Mocha TUI palette, and `settings.json` selects it with:

```json
{
  "theme": "catppuccin-mocha"
}
```

Pi hot-reloads edits to the active custom theme. Use `/settings` to switch temporarily to another installed theme.

### Status Line

`extensions/status-line.ts` replaces Pi's built-in footer with a one-line, theme-aware rainbow status line modeled after the corresponding Claude Code configuration:

```text
GPT-5.6 Sol | main | +12 -3 | 42k/272k
```

The fields are the active model, Git branch, tracked-line additions and deletions relative to `HEAD` (staged and unstaged combined), and current context usage. Branch and diff fields are omitted outside a Git repository, untracked files are not included, and context usage is shown as unknown (for example, `?/272k`) when Pi cannot estimate it immediately after compaction.

The extension refreshes Git statistics after tool execution and every three seconds so changes made outside Pi also appear. It uses `ctx.ui.setFooter()`, so it intentionally replaces the built-in token, cache, cost, provider, session-name, and thinking-level display. Run `/reload` after editing the extension; new installations discover it automatically at startup.

### Models and Credentials

`models.example.json` is the only versioned provider configuration. It contains environment-variable references for the built-in `openai` and `anthropic` providers, never literal API keys:

```json
{
  "providers": {
    "openai": {
      "apiKey": "$OPENAI_API_KEY"
    },
    "anthropic": {
      "apiKey": "$ANTHROPIC_API_KEY"
    }
  }
}
```

The active `models.json` is machine-local and ignored by Git. Official API users do not need one because Pi already recognizes both standard environment variables. Copy the example only when an explicit local provider file is useful; place any custom endpoints or secret-manager commands exclusively in that ignored local file.

For example, a local `models.json` may resolve a credential through a secret manager:

```json
{
  "apiKey": "!op read 'op://<vault>/<item>/credential'"
}
```

Credential resolution order is `--api-key`, `auth.json`, environment variables, then local `models.json` provider keys. This repository documents `~/.bashrc` exports as the default setup; `/login` remains an optional machine-local alternative.

`models-store.json` is a local, auto-refreshing catalog cache. It is pruned to the same three models on this machine but intentionally remains ignored by Git. The versioned `enabledModels` setting is the durable model scope; a future catalog refresh may repopulate the cache without changing the three-model cycling scope.

## Updating

Pull configuration changes and initialize the pinned submodule:

```bash
cd "$HOME/.pi/agent"
git pull --recurse-submodules
git submodule update --init --recursive
```

The `ncu-report-skill` submodule is intentionally pinned. To update it, select and test an explicit upstream commit or tag, then record the new gitlink in this repository.

`KernelWiki` is vendored as a normal directory because this configuration carries a Pi-specific skill-name adjustment. The current snapshot comes from [`mit-han-lab/KernelWiki`](https://github.com/mit-han-lab/KernelWiki) at commit `2777d18ffb3a3d682d8f25a3e3b8864d925a5ff1`; the local adaptation normalizes the skill manifest name to `kernel-wiki`. Update it by reviewing upstream changes and merging them deliberately.

After changing instructions or skills in a running session, use:

```text
/reload
```

## Security and Local State

The root `.gitignore` uses a deny-by-default policy. Only explicitly listed configuration and resource paths are eligible for tracking.

The following remain local:

```text
models.json
auth.json
sessions/
models-store.json
trust.json
bin/
git/
npm/
```

Before every push:

```bash
git status --short
git diff --cached
```

Never commit API keys, OAuth tokens, private keys, exported sessions, profiler reports containing private paths or data, or generated package caches. If a credential is ever committed, revoke and rotate it immediately; deleting it in a later commit is not sufficient.

## Pi Packages vs. Local Skills

This repository is a complete Pi configuration, not a Pi package. Local skills live directly under `skills/`, while independently maintained upstream repositories can be pinned as Git submodules.

Pi packages are better for third-party repositories that provide a `package.json` Pi manifest or conventional `skills/`, `extensions/`, `prompts/`, and `themes/` directories. Pi installs those under its managed `git/` or `npm/` directories, which are intentionally excluded from this repository.
