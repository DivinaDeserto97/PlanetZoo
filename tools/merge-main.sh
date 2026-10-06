#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ Dieser Ordner ist kein Git-Repository."
    exit 1
fi

SOURCE_BRANCH="$(git branch --show-current)"

if [[ -z "$SOURCE_BRANCH" || "$SOURCE_BRANCH" == "main" ]]; then
    echo "❌ Starte merge-main.sh auf dem Branch, der nach main gemergt werden soll."
    exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
    echo "❌ Es gibt uncommittete Änderungen."
    echo "   Zuerst committen, danach erneut merge-main.sh starten."
    exit 1
fi

MERGE_SUMMARY="$*"

# Aktuellen Entwicklungsbranch sicher pushen.
echo "📤 Push $SOURCE_BRANCH ..."
git push origin "$SOURCE_BRANCH"

# main aktualisieren.
echo "🔄 Wechsle zu main und aktualisiere ihn ..."
git switch main
git pull --ff-only origin main

AHEAD_COUNT="$(git rev-list --count "main..$SOURCE_BRANCH")"
if [[ "$AHEAD_COUNT" == "0" ]]; then
    echo "ℹ️ $SOURCE_BRANCH enthält keine neuen Commits gegenüber main."
    git switch "$SOURCE_BRANCH"
    exit 0
fi

if [[ -z "$MERGE_SUMMARY" ]]; then
    MERGE_SUMMARY="$(git log -n 8 --format='• %s' "main..$SOURCE_BRANCH")"
fi

MERGE_TITLE="Merge $SOURCE_BRANCH into main"
MERGE_MESSAGE="$MERGE_TITLE"
if [[ -n "$MERGE_SUMMARY" ]]; then
    MERGE_MESSAGE+=$'\n\n'
    MERGE_MESSAGE+="$MERGE_SUMMARY"
fi
MERGE_MESSAGE+=$'\n\n'
MERGE_MESSAGE+="Source-Branch: $SOURCE_BRANCH"

echo "🔀 Merge $SOURCE_BRANCH -> main ..."
git merge --no-ff -m "$MERGE_MESSAGE" "$SOURCE_BRANCH"

echo "📤 Push main ..."
git push origin main

echo "↩️ Zurück zu $SOURCE_BRANCH ..."
git switch "$SOURCE_BRANCH"

echo
echo "📦 Share-ZIP und Bot-ZIP aktualisieren ..."
"$SCRIPT_DIR/share-zip.sh"

echo
echo "✅ Merge nach main abgeschlossen."
echo "GitHub Actions sendet jetzt automatisch eine Nachricht an #updates."
