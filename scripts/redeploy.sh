#!/usr/bin/env bash
set -euo pipefail

# Rebuild the Go server and dashboard, copy to /opt/happyplant, and restart the service.
# Run from anywhere in the repo: sudo bash scripts/redeploy.sh

INSTALL_DIR="/opt/happyplant"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"

[[ $EUID -eq 0 ]] || { echo "Run with sudo"; exit 1; }

echo "Building Go server..."
cd "$REPO_DIR/Happy_Plant_Server"
/usr/local/go/bin/go build -o happyplant-server .

echo "Building dashboard..."
cd "$REPO_DIR/Happy_Plant_Dashboard"
npm install --silent
npm run build --silent

echo "Deploying..."
systemctl stop happyplant
cp "$REPO_DIR/Happy_Plant_Server/happyplant-server" "$INSTALL_DIR/"
cp -r "$REPO_DIR/Happy_Plant_Dashboard/out/." "$INSTALL_DIR/static/"
chown -R happyplant:happyplant "$INSTALL_DIR"

echo "Restarting service..."
systemctl restart happyplant

echo "Done. Status:"
systemctl status happyplant --no-pager -l
