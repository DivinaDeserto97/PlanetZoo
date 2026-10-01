#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

BRANCH="$(git branch --show-current)"
if [[ -z "$BRANCH" || "$BRANCH" == "main" ]]; then
    echo "❌ Starte commit-und-merge.sh auf einem Entwicklungsbranch, nicht auf main."
    exit 1
fi

COMMIT_TITLE="${1:-}"
if (( $# > 0 )); then shift; fi
COMMIT_SUMMARY="$*"

if [[ -z "$COMMIT_TITLE" ]]; then
    read -r -p "Commit-Titel: " COMMIT_TITLE
fi

if [[ -z "$COMMIT_TITLE" ]]; then
    echo "❌ Kein Commit-Titel angegeben."
    exit 1
fi

if [[ -z "$COMMIT_SUMMARY" ]]; then
    read -r -p "Kurze Zusammenfassung für Discord (optional): " COMMIT_SUMMARY
fi

"$SCRIPT_DIR/commit.sh" "$COMMIT_TITLE" "$COMMIT_SUMMARY"
"$SCRIPT_DIR/merge-main.sh" "$COMMIT_SUMMARY"

echo
echo "✅ Schritt 1 + 2 abgeschlossen:"
echo "   1. Entwickler-Commit gepusht -> #entwickler-news"
echo "   2. Branch nach main gemergt -> #updates"
