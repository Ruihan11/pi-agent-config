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

## Update

```bash
cd "$HOME/.pi/agent"
git pull --recurse-submodules
git submodule update --init --recursive
```

## Local State

`models.json`, `APPEND_SYSTEM.md`, `auth.json`, sessions, caches, and machine-specific configuration are ignored by Git. Never place real API keys or exported sessions in tracked files.
