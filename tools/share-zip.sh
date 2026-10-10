#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
SHARE_DIR="$PROJECT_ROOT/share"

mkdir -p "$SHARE_DIR"
ZIP_PATH="$SHARE_DIR/${PROJECT_NAME}-share.zip"

[[ -f "$ZIP_PATH" ]] && rm "$ZIP_PATH"

cd "$PROJECT_ROOT"

# ============================================================
# 1. Doppelklick-Browser-Bundle aktualisieren
#    Normale Nutzer brauchen dafür später kein Node.js.
# ============================================================
echo
echo "============================================================"
echo "1. Doppelklick-Browser-Bundle erstellen"
echo "============================================================"

if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js wurde nicht gefunden. Das Browser-Bundle kann nicht erstellt werden."
    exit 1
fi

# Zuerst lokale PNGs, sonst die in der Tier-JSON eingetragene Online-URL.
# Nur die kompakten Pixelmasken landen im Browser-Bundle, keine PNG-Dateien.
# Für Builds ohne Internet ist PZ_MAPS_OFFLINE=1 möglich; bereits erzeugte
# Masken werden dann wiederverwendet.
if [[ "${PZ_MAPS_OFFLINE:-0}" == "1" ]]; then
    node "$SCRIPT_DIR/build-map-masks.js" --offline
else
    node "$SCRIPT_DIR/build-map-masks.js"
fi
node "$SCRIPT_DIR/build-browser-bundle.js"

DATEILISTE="$(mktemp)"
trap 'rm -f "$DATEILISTE"' EXIT

# ============================================================
# 1. Normale Projektdateien
#    Alles, was Git ignoriert, bleibt grundsätzlich draussen.
# ============================================================
while IFS= read -r -d '' datei
do
    case "$datei" in
        ./.git/*|./share/*|./bot/*) continue ;;
    esac

    if git check-ignore -q -- "$datei" 2>/dev/null; then
        continue
    fi

    printf '%s\n' "$datei" >> "$DATEILISTE"
done < <(find . -type f -print0)

# ============================================================
# 2. Lokalen bot/ zusätzlich aufnehmen
#    bot/ ist absichtlich komplett in .gitignore, soll aber in
#    der Share-ZIP als Quellcode/Konfiguration mitgeliefert werden.
#
#    NIEMALS aufnehmen:
#    - .env / lokale Secret-Dateien
#    - node_modules
#    - Logs / Cache
#    - lokale Scan-Ausgaben
# ============================================================
if [[ -d ./bot ]]; then
    while IFS= read -r -d '' datei
    do
        basis="$(basename "$datei")"

        case "$datei" in
            ./bot/node_modules/*|\
            ./bot/.git/*|\
            ./bot/logs/*|\
            ./bot/cache/*|\
            ./bot/.cache/*|\
            ./bot/server-scan.json|\
            ./bot/*.log)
                continue
                ;;
        esac

        case "$basis" in
            .env|.env.local|.env.development|.env.production|.env.test|*.pem|*.key)
                continue
                ;;
        esac

        printf '%s\n' "$datei" >> "$DATEILISTE"
    done < <(find ./bot -type f -print0)
fi

sort -u -o "$DATEILISTE" "$DATEILISTE"

# ============================================================
# SICHERHEITSPRÜFUNG
# ============================================================
echo
echo "============================================================"
echo "2. Share-ZIP prüfen"
echo "============================================================"

GROSSE_DATEIEN=""
while IFS= read -r datei
do
    [[ -f "$datei" ]] || continue
    groesse="$(stat -c '%s' "$datei")"
    if (( groesse > 52428800 )); then
        GROSSE_DATEIEN+="$datei"$'\n'
    fi
done < "$DATEILISTE"

if [[ -n "$GROSSE_DATEIEN" ]]; then
    echo "❌ ZIP wurde nicht erstellt."
    echo "Diese Dateien wären grösser als 50 MB:"
    printf '%s' "$GROSSE_DATEIEN"
    exit 1
fi

echo "✅ Keine unerwartet grossen Dateien gefunden."

# Zusätzliche harte Secret-Prüfung: bot/.env darf nie in der Liste stehen.
if grep -Eq '^\./bot/\.env($|\.local$|\.development$|\.production$|\.test$|\..*\.local$)' "$DATEILISTE"; then
    echo "❌ Sicherheitsabbruch: Eine bot/.env-Datei würde ins ZIP gelangen."
    exit 1
fi

# ============================================================
# ZIP ERSTELLEN
# ============================================================
echo
echo "============================================================"
echo "3. Share-ZIP erstellen"
echo "============================================================"

zip -q "$ZIP_PATH" -@ < "$DATEILISTE"

ZIP_GROESSE="$(du -h "$ZIP_PATH" | cut -f1)"

echo
echo "============================================================"
echo "✅ Share-ZIP erstellt"
echo "============================================================"
echo "Datei:  $ZIP_PATH"
echo "Grösse: $ZIP_GROESSE"
echo
echo "Enthalten:"
echo "- normale freigegebene Projektdateien"
echo "- bot/ Quellcode und sichere Bot-Konfiguration"
echo
echo "Nicht enthalten:"
echo "- bot/.env und andere lokale Secret-Dateien"
echo "- bot/node_modules/"
echo "- bot Logs/Cache/server-scan.json"
echo "- nicht freigegebene Medien"
echo "- andere Archive"
echo "- .git"
echo "- share/"
