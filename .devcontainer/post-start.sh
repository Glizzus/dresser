#!/bin/bash
set -euo pipefail

sudo chown -R vscode:vscode \
    /home/vscode/.claude

# We put .claude.json into .claude/ so that we can keep it in our cached volume.
# We just symlink ~/.claude.json (where Claude looks for it)
if [ ! -f /home/vscode/.claude/.claude.json ]; then
    echo "{}" > /home/vscode/.claude/.claude.json
fi

ln -sf /home/vscode/.claude/.claude.json /home/vscode/.claude.json

lefthook install

npm install