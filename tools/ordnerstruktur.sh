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

DOKU_DIR="$PROJECT_ROOT/dokumentation"

OUTPUT="$DOKU_DIR/ordnerstruktur.md"

PROJECT_NAME="$(basename "$PROJECT_ROOT")"


mkdir -p "$DOKU_DIR"


# ============================================================
# GITHUB-FREIGABEN AUS DEN JSON-DATEIEN LESEN
# ============================================================

FREIGABEN_DATEI="$(mktemp)"
trap 'rm -f "$FREIGABEN_DATEI"' EXIT

python3 - "$PROJECT_ROOT" > "$FREIGABEN_DATEI" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
data_dir = root / "assets" / "daten"
media_ext = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".avif",
    ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac", ".wma", ".opus",
    ".mkv", ".mp4", ".mov", ".avi", ".webm", ".m4v", ".ts", ".m2ts",
}

def walk(value):
    if isinstance(value, dict):
        pfad = value.get("pfad")
        if isinstance(pfad, str) and Path(pfad).suffix.lower() in media_ext:
            yield value
        for child in value.values():
            yield from walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk(child)

for json_file in data_dir.rglob("*.json"):
    try:
        data = json.loads(json_file.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Ungültiges JSON: {json_file.relative_to(root)}: {exc}", file=sys.stderr)
        raise SystemExit(1)

    for item in walk(data):
        if item.get("githubFreigabe") is True:
            print(item["pfad"].lstrip("/").replace("\\", "/"))
PY

ist_github_freigegeben() {
    local relativ="$1"
    grep -Fxq -- "$relativ" "$FREIGABEN_DATEI"
}


# ============================================================
# MEDIEN ERKENNEN
# ============================================================

ist_medium() {

    local datei="${1,,}"

    case "$datei" in

        *.jpg|*.jpeg|*.png|*.webp|*.gif|*.bmp|*.tif|*.tiff|*.avif|\
        *.mkv|*.mp4|*.mov|*.avi|*.webm|*.m4v|*.ts|*.m2ts|\
        *.mp3|*.wav|*.flac|*.ogg|*.m4a|*.aac|*.wma|*.opus)

            return 0
            ;;

        *)

            return 1
            ;;
    esac
}


# ============================================================
# ORDNERSTRUKTUR SCHREIBEN
# ============================================================

{

    echo "# Ordnerstruktur"

    echo

    echo "> Diese Datei wird automatisch durch \`tools/ordnerstruktur.sh\` erzeugt."

    echo

    echo "> Bilder, Videos und Audiodateien werden mit ihrem aktuellen"
    echo "> GitHub-/Share-Freigabestatus aus den JSON-Dateien aufgeführt."

    echo

    echo "- \`$PROJECT_NAME/\`"


    while IFS= read -r pfad
    do

        relativ="${pfad#"$PROJECT_ROOT"/}"


        # ----------------------------------------------------
        # NICHT DOKUMENTIEREN
        # ----------------------------------------------------

        case "$relativ" in

            .git|.git/*|share|share/*|*/__pycache__|*/__pycache__/*|__pycache__|__pycache__/*)

                continue
                ;;
        esac


        # ----------------------------------------------------
        # TIEFE BESTIMMEN
        # ----------------------------------------------------

        IFS='/' read -r -a teile <<< "$relativ"

        tiefe="${#teile[@]}"


        einrueckung=""

        for ((i = 0; i < tiefe; i++))
        do

            einrueckung+="  "

        done


        name="$(basename "$pfad")"


        # ----------------------------------------------------
        # ORDNER
        # ----------------------------------------------------

        if [[ -d "$pfad" ]]
        then

            printf '%s- `%s/`\n' \
                "$einrueckung" \
                "$name"

            continue

        fi


        # ----------------------------------------------------
        # MEDIEN
        # ----------------------------------------------------

        if ist_medium "$name"
        then

            if ist_github_freigegeben "$relativ"
            then
                status="Medium – GitHub/Share freigegeben"
            else
                status="Medium – lokal / nicht freigegeben"
            fi

            printf '%s- `%s` *(%s)*\n' \
                "$einrueckung" \
                "$name" \
                "$status"

            continue

        fi


        # ----------------------------------------------------
        # NORMALE DATEI
        # ----------------------------------------------------

        link="../$relativ"


        printf '%s- [%s](<%s>)\n' \
            "$einrueckung" \
            "$name" \
            "$link"


    done < <(

        find "$PROJECT_ROOT" \
            -mindepth 1 \
            \( \
                -path "$PROJECT_ROOT/.git" \
                -o \
                -path "$PROJECT_ROOT/share" \
            \) \
            -prune \
            -o \
            -print |
        LC_ALL=C sort

    )


} > "$OUTPUT"


echo
echo "✅ Ordnerstruktur erstellt:"
echo
echo "$OUTPUT"
echo