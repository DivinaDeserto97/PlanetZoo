#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Suche den in VS Code installierten Prettier-Formatter ..."

PRETTIER_CLI=""
for base in "$HOME/.vscode/extensions" "$HOME/.vscode-oss/extensions" "$HOME/.var/app/com.visualstudio.code/data/vscode/extensions"; do
    [[ -d "$base" ]] || continue
    candidate="$(find "$base" -maxdepth 5 -type f \
        \( -path '*/esbenp.prettier-vscode-*/node_modules/prettier/bin/prettier.cjs' \
        -o -path '*/esbenp.prettier-vscode-*/node_modules/prettier/bin-prettier.js' \) \
        2>/dev/null | sort -V | tail -n 1)"
    if [[ -n "$candidate" ]]; then
        PRETTIER_CLI="$candidate"
        break
    fi
done

if [[ -z "$PRETTIER_CLI" ]]; then
    echo
    echo "❌ Prettier aus der VS-Code-Erweiterung wurde nicht gefunden."
    echo "   In VS Code ist 'Prettier - Code formatter' ausgewählt,"
    echo "   aber commit.sh braucht dessen lokale Erweiterungsdatei."
    echo "   Es wird KEIN npm und KEIN package.json benötigt."
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js wurde nicht gefunden. VS Codes Prettier-CLI kann daher nicht gestartet werden."
    exit 1
fi

echo "Formatter: $PRETTIER_CLI"
echo

mapfile -d '' FILES < <(
    find . \
        -path './.git' -prune -o \
        -path './share' -prune -o \
        -path './assets/cache' -prune -o \
        -path './assets/private' -prune -o \
        -type f \
        \( -iname '*.html' -o -iname '*.css' -o -iname '*.js' -o -iname '*.json' -o -iname '*.md' \) \
        -print0
)

if (( ${#FILES[@]} == 0 )); then
    echo "ℹ️ Keine formatierbaren Dateien gefunden."
    exit 0
fi

echo "Formatiere ${#FILES[@]} Dateien ..."
node "$PRETTIER_CLI" --write --ignore-unknown "${FILES[@]}"
echo "✅ Projekt formatiert."
