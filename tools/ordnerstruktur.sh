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

    echo "> Bilder, Videos und Audiodateien werden hier aufgeführt,"
    echo "> auch wenn sie in der Share-ZIP nicht enthalten sind."

    echo

    echo "- \`$PROJECT_NAME/\`"


    while IFS= read -r pfad
    do

        relativ="${pfad#"$PROJECT_ROOT"/}"


        # ----------------------------------------------------
        # NICHT DOKUMENTIEREN
        # ----------------------------------------------------

        case "$relativ" in

            .git|.git/*|share|share/*)

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

            printf '%s- `%s` *(Medium – nicht in Share-ZIP)*\n' \
                "$einrueckung" \
                "$name"

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