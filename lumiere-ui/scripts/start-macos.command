#!/bin/zsh
set -e
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo 'Install Node.js 22 or newer first.'; exit 1; }
command -v ollama >/dev/null || { echo 'Install Ollama for macOS from https://ollama.com/download/mac first.'; exit 1; }
mkdir -p .runtime
export OLLAMA_HOST=127.0.0.1:11434
export OLLAMA_MODELS="$PWD/.models"
export OLLAMA_NUM_PARALLEL=1
if ! curl -fsS http://127.0.0.1:11434/api/tags >/dev/null; then
  nohup ollama serve >.runtime/ollama-macos.log 2>&1 &
  sleep 3
fi
ollama pull qwen3:8b
if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv
  .venv/bin/python -m pip install -r vision/requirements.txt
fi
if ! curl -fsS http://127.0.0.1:4173/api/bootstrap >/dev/null; then
  nohup node server.cjs >.runtime/app-macos.log 2>&1 &
  sleep 2
fi
open http://localhost:4173
