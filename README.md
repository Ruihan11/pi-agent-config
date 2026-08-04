# pi-agent-config

Personal [Pi coding agent](https://pi.dev) configuration for CUDA, NVIDIA Blackwell/Hopper, and TileLang development.

## Included

- Global workflow and safety instructions in `AGENTS.md`
- Scoped models: `gpt-5.6-sol`, `claude-opus-5`, and `claude-fable-5`
- Default thinking level: `high`
- Eleven reusable GPU, CUDA, profiling, and TileLang skills
- Catppuccin Mocha theme and a compact rainbow status line
- Pinned `ncu-report-skill` submodule and vendored KernelWiki snapshot

## Quick Start

### 1. Install Pi

```bash
curl -fsSL https://pi.dev/install.sh | sh
pi --version
```

Alternatively:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

### 2. Clone

```bash
git clone --recurse-submodules \
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

You can also use `/login`; credentials are stored in the ignored `auth.json` file.

### 4. Use Pi

```bash
pi                    # Start a session
pi -c                 # Continue the latest session for this directory
pi -c --thinking high
```

Useful controls:

```text
/model                 Select a model
/scoped-models         Review the scoped models
/reload                Reload configuration and resources
Shift+Tab              Change thinking effort
/skill:<skill-name>    Load a skill explicitly
```

## Skills

| Skill | Purpose |
|---|---|
| `architecture-diagram` | Create dark-themed architecture diagrams |
| `cuda` | Develop, debug, profile, and optimize CUDA kernels |
| `debugging-tilelang-programs` | Diagnose TileLang compilation, runtime, and correctness failures |
| `kernel-wiki` | Query Blackwell and Hopper optimization knowledge |
| `ncu-report-skill` | Profile B200 kernels and analyze Nsight Compute reports |
| `optimizing-tilelang-programs` | Tune TileLang tiles, pipelines, occupancy, and fusion |
| `profiling-tilelang-programs` | Benchmark TileLang kernels with built-in and NVIDIA profilers |
| `save-for-the-day` | Save a daily work log |
| `save-for-the-week` | Combine daily logs into a weekly summary |
| `torch-profiling-tilelang-programs` | Profile TileLang pipelines with `torch.profiler` |
| `writing-tilelang-kernels` | Implement new TileLang GPU kernels |

Pi advertises these skills to OpenAI and Anthropic models and loads matching instructions on demand.

`ncu-report-skill` is a Git submodule. KernelWiki is vendored from [`mit-han-lab/KernelWiki`](https://github.com/mit-han-lab/KernelWiki) commit `2777d18ffb3a3d682d8f25a3e3b8864d925a5ff1`, with its skill name normalized to `kernel-wiki`.

## Update

```bash
cd "$HOME/.pi/agent"
git pull --recurse-submodules
git submodule update --init --recursive
```

## Local State

`models.json`, `APPEND_SYSTEM.md`, `auth.json`, sessions, caches, and machine-specific configuration are ignored by Git. Never place real API keys or exported sessions in tracked files.
