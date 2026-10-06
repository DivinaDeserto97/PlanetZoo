#!/usr/bin/env bash

# Erstellt nur die Share-ZIP und legt danach einen internen Git-Commit an.
# Der Zusatz [intern] sorgt dafür, dass der Discord-News-Workflow keine
# Nachricht für diesen Commit sendet.
#
# Verwendung:
#   ./tools/zip-intern.sh
#   ./tools/zip-intern.sh "ZIP vor Umbau erstellt"

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
    echo "❌ Kein aktiver Git-Branch erkannt."
    exit 1
fi

# Absichtlich kein Formatieren, kein Merge und keine sonstige Projektpflege.
# share-zip.sh aktualisiert lediglich das für die Doppelklick-Version nötige
# Browser-Bundle und erstellt danach die Share-ZIP.
echo
echo "============================================================"
echo "1. Share-ZIP erstellen"
echo "============================================================"
"$SCRIPT_DIR/share-zip.sh"

# Die ZIP selbst liegt in share/ und ist durch .gitignore ausgeschlossen.
# Der Commit nimmt nur tatsächlich geänderte, von Git verwaltbare Dateien auf.
echo
echo "============================================================"
echo "2. Änderungen für internen Commit vormerken"
echo "============================================================"
git add -A

if git diff --cached --quiet; then
    echo "ℹ️ ZIP wurde erstellt, aber es gibt keine Änderungen für einen Git-Commit."
    echo "   Die ZIP selbst wird absichtlich nicht committed."
    exit 0
fi

COMMIT_TEXT="${*:-Share-ZIP erstellt}"

# Falls der Benutzer [intern] bereits angegeben hat, nicht doppelt anhängen.
if [[ "$COMMIT_TEXT" != *"[intern]"* ]]; then
    COMMIT_TEXT+=" [intern]"
fi

echo
echo "============================================================"
echo "3. Interner Commit"
echo "============================================================"
echo "Branch:  $BRANCH"
echo "Commit:  $COMMIT_TEXT"
git commit -m "$COMMIT_TEXT"

echo
echo "============================================================"
echo "4. Internen Commit pushen"
echo "============================================================"
git push -u origin "$BRANCH"

echo
echo "============================================================"
echo "✅ ZIP + interner Commit abgeschlossen"
echo "============================================================"
echo "ZIP:     $PROJECT_ROOT/share/"
echo "Branch:  $BRANCH"
echo "Discord: keine Nachricht, weil der Commit [intern] enthält."
