#!/usr/bin/env bash

set -euo pipefail


# ============================================================
# PROJEKTPFADE
# ============================================================

SCRIPT_DIR="$(
    cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &&
    pwd
)"

PROJECT_ROOT="$(
    cd -- "$SCRIPT_DIR/.." &&
    pwd
)"

PROJECT_NAME="$(basename "$PROJECT_ROOT")"

SHARE_DIR="$PROJECT_ROOT/share"


mkdir -p "$SHARE_DIR"


# ============================================================
# DATEINAME
# ============================================================

ZIP_PATH="$SHARE_DIR/${PROJECT_NAME}-share.zip"


# ============================================================
# ALTE SHARE-ZIP LÖSCHEN
# ============================================================

if [[ -f "$ZIP_PATH" ]]
then

    rm "$ZIP_PATH"

fi


# ============================================================
# DATEILISTE ERSTELLEN
# .gitignore wurde vorher aus den JSON-Freigaben erzeugt.
# githubFreigabe:true => Medium darf mit in die Share-ZIP.
# ============================================================

cd "$PROJECT_ROOT"
DATEILISTE="$(mktemp)"
trap 'rm -f "$DATEILISTE"' EXIT

while IFS= read -r -d '' datei
do
    # Git-interne Daten und Share-Ausgabe nie einpacken.
    case "$datei" in
        ./.git/*|./share/*) continue ;;
    esac

    # Alles, was die generierte .gitignore ignoriert, bleibt auch aus der Share-ZIP.
    if git check-ignore -q -- "$datei" 2>/dev/null
    then
        continue
    fi

    printf '%s\n' "$datei" >> "$DATEILISTE"
done < <(find . -type f -print0)

sort -u -o "$DATEILISTE" "$DATEILISTE"

# ============================================================
# SICHERHEITSPRÜFUNG
# ============================================================

echo
echo "============================================================"
echo "2. Prüfe grosse Dateien"
echo "============================================================"
echo


GROSSE_DATEIEN=""

while IFS= read -r datei
do

    if [[ -f "$datei" ]]
    then

        groesse="$(
            stat -c '%s' "$datei"
        )"


        if (( groesse > 52428800 ))
        then

            GROSSE_DATEIEN+="$datei"$'\n'

        fi

    fi

done < "$DATEILISTE"


if [[ -n "$GROSSE_DATEIEN" ]]
then

    echo "❌ ZIP wurde nicht erstellt."
    echo
    echo "Diese Dateien wären trotz Medienfilter grösser als 50 MB:"
    echo
    printf '%s' "$GROSSE_DATEIEN"
    echo
    echo "Bitte prüfen."

    exit 1

fi


echo "✅ Keine unerwartet grossen Dateien gefunden."


# ============================================================
# ZIP ERSTELLEN
# ============================================================

echo
echo "============================================================"
echo "3. Share-ZIP erstellen"
echo "============================================================"
echo


zip \
    -q \
    "$ZIP_PATH" \
    -@ \
    < "$DATEILISTE"


# ============================================================
# ERGEBNIS
# ============================================================

ZIP_GROESSE="$(
    du -h "$ZIP_PATH" |
    cut -f1
)"


echo
echo "============================================================"
echo "✅ Share-ZIP erstellt"
echo "============================================================"
echo
echo "Datei:"
echo "$ZIP_PATH"
echo
echo "Grösse:"
echo "$ZIP_GROESSE"
echo
echo "Nicht enthalten:"
echo "- nicht freigegebene Bilder"
echo "- nicht freigegebene Videos"
echo "- nicht freigegebenes Audio"
echo "- andere ZIP-Dateien"
echo "- 7z / RAR"
echo "- .git"
echo "- share/"
echo
echo "Medien mit githubFreigabe: true in den JSON-Dateien sind enthalten."
echo
echo "Die übrigen Mediennamen und Medienpfade stehen weiterhin in:"
echo
echo "dokumentation/ordnerstruktur.md"
echo