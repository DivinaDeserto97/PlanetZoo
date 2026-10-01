#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ Dieser Ordner ist kein Git-Repository."
    exit 1
fi

BRANCH="$(git branch --show-current)"

if [[ -z "$BRANCH" ]]; then
    echo "❌ Kein aktiver Branch erkannt."
    exit 1
fi

if [[ "$BRANCH" == "main" ]]; then
    echo
    echo "❌ commit.sh ist für Entwicklungsbranches gedacht, nicht für main."
    echo "   Nutze für main: tools/merge-main.sh"
    echo "   Oder für Commit + Merge: tools/commit-und-merge.sh"
    exit 1
fi

ORIGINAL_ARGC=$#
COMMIT_TITLE="${1:-}"
if (( $# > 0 )); then shift; fi
COMMIT_SUMMARY="$*"

if [[ -z "$COMMIT_TITLE" ]]; then
    echo
    read -r -p "Commit-Titel: " COMMIT_TITLE
fi

if [[ -z "$COMMIT_TITLE" ]]; then
    echo "❌ Kein Commit-Titel angegeben."
    exit 1
fi

if [[ -z "$COMMIT_SUMMARY" && "$ORIGINAL_ARGC" -lt 2 ]]; then
    echo
    read -r -p "Kurze Zusammenfassung für Discord (optional): " COMMIT_SUMMARY
fi

echo
echo "============================================================"
echo "PlanetZoo2 Commit"
echo "============================================================"
echo "Branch: $BRANCH"
echo "Titel:  $COMMIT_TITLE"
if [[ -n "$COMMIT_SUMMARY" ]]; then
    echo "Kurz:   $COMMIT_SUMMARY"
fi

# 1. Doku
echo
echo "============================================================"
echo "1. Automatische MD erstellen"
echo "============================================================"
"$SCRIPT_DIR/ordnerstruktur.sh"

# 2. .gitignore
echo
echo "============================================================"
echo "2. .gitignore gemäss JSON + Standard erstellen"
echo "============================================================"
python3 "$SCRIPT_DIR/gitignore-aus-json.py"

# Sicherheitscheck: bot/ darf nicht auf GitHub getrackt werden.
if [[ -n "$(git ls-files -- bot 2>/dev/null)" ]]; then
    echo
    echo "❌ bot/ enthält bereits von Git getrackte Dateien."
    echo "   Diese müssen einmalig aus dem Git-Index entfernt werden:"
    echo "   git rm -r --cached bot"
    echo "   Danach committen. Die lokalen Dateien bleiben erhalten."
    exit 1
fi

# 3. Formatieren
echo
echo "============================================================"
echo "3. Gesamtes Projekt mit Prettier formatieren"
echo "============================================================"
"$SCRIPT_DIR/format.sh"

# 4. Share ZIP
echo
echo "============================================================"
echo "4. Share-ZIP erstellen"
echo "============================================================"
"$SCRIPT_DIR/share-zip.sh"

# 5. Status
echo
echo "============================================================"
echo "5. Git-Status"
echo "============================================================"
git status --short

# 6. Add
echo
echo "============================================================"
echo "6. Git add"
echo "============================================================"
git add -A

if git diff --cached --quiet; then
    echo "ℹ️ Keine Änderungen für einen Commit vorhanden."
    exit 0
fi

# 7. Commit
echo
echo "============================================================"
echo "7. Git commit"
echo "============================================================"
if [[ -n "$COMMIT_SUMMARY" ]]; then
    git commit -m "$COMMIT_TITLE" -m "$COMMIT_SUMMARY"
else
    git commit -m "$COMMIT_TITLE"
fi

# 8. Push
echo
echo "============================================================"
echo "8. Git push"
echo "============================================================"
git push -u origin "$BRANCH"

echo
echo "============================================================"
echo "✅ Entwicklungs-Commit abgeschlossen"
echo "============================================================"
echo "Branch: $BRANCH"
echo "GitHub Actions sendet jetzt automatisch eine Nachricht an #entwickler-news."
echo "Share-ZIP: share/"
