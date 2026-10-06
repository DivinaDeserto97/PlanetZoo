#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
BOT_DIR="$PROJECT_ROOT/bot"
SHARE_DIR="$PROJECT_ROOT/share"
ZIP_PATH="$SHARE_DIR/bot.zip"

if [[ ! -d "$BOT_DIR" ]]; then
    echo "ℹ️ Kein bot/-Ordner vorhanden – Bot-ZIP wird übersprungen."
    exit 0
fi

mkdir -p "$SHARE_DIR"
rm -f "$ZIP_PATH"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# .gitignore des Bots beachten. Dadurch bleiben z. B. .env,
# node_modules/ und *.log automatisch draussen.
RSYNC_ARGS=(-a --prune-empty-dirs)
if [[ -f "$BOT_DIR/.gitignore" ]]; then
    RSYNC_ARGS+=(--exclude-from="$BOT_DIR/.gitignore")
fi
RSYNC_ARGS+=(--exclude='.git/' --exclude='*.zip')

mkdir -p "$TMP_DIR/bot"
rsync "${RSYNC_ARGS[@]}" "$BOT_DIR/" "$TMP_DIR/bot/"

if find "$TMP_DIR/bot" -type f \( -name '.env' -o -name '.env.local' -o -name '.env.development' -o -name '.env.production' -o -name '.env.test' \) -print -quit | grep -q .; then
    echo "❌ Sicherheitsabbruch: Eine .env-Datei würde in bot.zip gelangen."
    exit 1
fi

(
    cd "$TMP_DIR"
    zip -qr "$ZIP_PATH" bot
)

echo "✅ Bot-ZIP erstellt: $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"
echo "   bot/.gitignore wurde beim Packen berücksichtigt."
