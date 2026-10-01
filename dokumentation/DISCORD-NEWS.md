# Discord-News über GitHub Actions und den Discord-Bot

Die Discord-News werden von **GitHub Actions** ausgelöst. Der eigene Bot muss dafür
nicht dauerhaft auf einem PC oder Heimserver laufen.

GitHub Actions verwendet beim jeweiligen Push kurz den Bot-Token, sendet die
Nachricht über die Discord-API als **Server Bot** und beendet sich danach wieder.

## Discord-Kanäle

- `#entwickler-news`
  - Kanal-ID: `1555332539982417991`
  - für Commits auf allen Branches ausser `main`
- `#updates`
  - Kanal-ID: `1555169124487929977`
  - für Aktualisierungen von `main`

Die Kanal-IDs sind nicht geheim und stehen deshalb direkt in den Workflows.

## Ein einziges GitHub-Secret

Im GitHub-Repository:

`Settings -> Secrets and variables -> Actions -> New repository secret`

anlegen:

- Name: `DISCORD_BOT_TOKEN`
- Wert: Token des Discord-Bots

Der Bot-Token darf niemals in eine Projektdatei, einen Commit oder die Share-ZIP
geschrieben werden.

GitHub übergibt den Token nur während des Workflow-Laufs als Umgebungsvariable.

## Discord-Rechte des Bots

In `#entwickler-news` und `#updates` benötigt der Bot mindestens:

- Kanal ansehen
- Nachrichten senden
- Links einbetten

`#entwickler-news` ist privat. Deshalb muss dort die Bot-Rolle bzw. der Bot
ausdrücklich Zugriff erhalten. Sonst antwortet Discord mit `403 Missing Access`.

## Die vier Arbeitsbefehle

### 1. Nur Share-ZIP erstellen

```bash
./tools/share-zip.sh
```

Erstellt bzw. ersetzt:

`share/PlanetZoo2-share.zip`

Der lokale `bot/`-Quellcode kommt mit in die ZIP. Geheimnisse wie `bot/.env`,
`node_modules`, Logs und Scan-Dateien bleiben ausgeschlossen.

### 2. Entwicklungsbranch committen und pushen

Auf einem Branch ausser `main`:

```bash
./tools/commit.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Das Skript erstellt die Dokumentation und Share-ZIP, formatiert das Projekt,
committet und pusht den aktuellen Entwicklungsbranch.

Danach startet `.github/workflows/discord-entwickler-news.yml`.

Der **Server Bot** schreibt in `#entwickler-news`:

- Branch
- Entwickler
- Commit-SHA
- Commit-Titel
- Zusammenfassung
- Link zum Commit

### 3. Entwicklungsbranch nach `main` mergen

Auf dem Entwicklungsbranch:

```bash
./tools/merge-main.sh
```

Optional:

```bash
./tools/merge-main.sh "Kurze Zusammenfassung für das öffentliche Update"
```

Das Skript pusht den Entwicklungsbranch, aktualisiert `main`, merged mit
`--no-ff`, pusht `main` und wechselt zurück.

Danach startet `.github/workflows/discord-main-update.yml`.

Der **Server Bot** schreibt in `#updates`:

- gemergter Branch
- wer den Push/Merge veranlasst hat
- enthaltene Commit-Titel
- Link zur Änderung

### 4. Commit + Merge in einem Befehl

```bash
./tools/commit-und-merge.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Das führt Befehl 2 und 3 direkt nacheinander aus:

1. Entwicklungscommit -> `#entwickler-news`
2. Merge nach `main` -> `#updates`

## Share-ZIP und `bot/`

`bot/` bleibt vollständig von Git ausgeschlossen.

`tools/share-zip.sh` nimmt den lokalen Bot trotzdem als sichere Kopie in das
Share-ZIP auf.

Nicht im ZIP:

- `bot/.env`
- andere lokale `.env`-Secretvarianten
- `bot/node_modules/`
- Logs und Cache
- `bot/server-scan.json`
- Schlüsseldateien (`*.pem`, `*.key`)

## Fehlerdiagnose

GitHub:

`Repository -> Actions`

Dort den fehlgeschlagenen Workflow öffnen.

Typische Fehler:

- `DISCORD_BOT_TOKEN fehlt`
  - GitHub-Secret noch nicht angelegt.
- HTTP `401`
  - Bot-Token ungültig oder zurückgesetzt.
- HTTP `403`
  - Bot hat im Zielkanal keinen Zugriff oder keine Schreibberechtigung.
- HTTP `404`
  - Kanal-ID stimmt nicht mehr.
