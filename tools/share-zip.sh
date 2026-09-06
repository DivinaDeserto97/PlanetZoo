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
# ORDNERSTRUKTUR AKTUALISIEREN
# ============================================================

echo
echo "============================================================"
echo "1. Ordnerstruktur aktualisieren"
echo "============================================================"
echo

"$SCRIPT_DIR/ordnerstruktur.sh"


# ============================================================
# DATEINAME
# ============================================================

ZEITSTEMPEL="$(date '+%Y%m%d-%H%M%S')"

ZIP_PATH="$SHARE_DIR/${PROJECT_NAME}-share-${ZEITSTEMPEL}.zip"


# ============================================================
# DATEILISTE ERSTELLEN
# ============================================================

cd "$PROJECT_ROOT"


DATEILISTE="$(mktemp)"

trap 'rm -f "$DATEILISTE"' EXIT


find . \
    -path './.git' -prune -o \
    -path './share' -prune -o \
    -type f \
    ! -iname '*.jpg' \
    ! -iname '*.jpeg' \
    ! -iname '*.png' \
    ! -iname '*.webp' \
    ! -iname '*.gif' \
    ! -iname '*.bmp' \
    ! -iname '*.tif' \
    ! -iname '*.tiff' \
    ! -iname '*.avif' \
    ! -iname '*.mkv' \
    ! -iname '*.mp4' \
    ! -iname '*.mov' \
    ! -iname '*.avi' \
    ! -iname '*.webm' \
    ! -iname '*.m4v' \
    ! -iname '*.ts' \
    ! -iname '*.m2ts' \
    ! -iname '*.mp3' \
    ! -iname '*.wav' \
    ! -iname '*.flac' \
    ! -iname '*.ogg' \
    ! -iname '*.m4a' \
    ! -iname '*.aac' \
    ! -iname '*.wma' \
    ! -iname '*.opus' \
    ! -iname '*.zip' \
    ! -iname '*.7z' \
    ! -iname '*.rar' \
    > "$DATEILISTE"


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
echo "- Bilder"
echo "- Videos"
echo "- Audio"
echo "- andere ZIP-Dateien"
echo "- 7z / RAR"
echo "- .git"
echo "- share/"
echo
echo "Die Mediennamen und Medienpfade stehen weiterhin in:"
echo
echo "dokumentation/ordnerstruktur.md"
echo