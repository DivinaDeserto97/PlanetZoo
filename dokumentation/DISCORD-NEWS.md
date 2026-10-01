# Discord-News über GitHub Actions

Die Discord-News funktionieren **ohne dauerhaft laufenden Bot**.

GitHub löst die Nachrichten aus, sobald ein Push im Online-Repository ankommt.
Der eigene Discord-Bot kann unabhängig davon offline sein.

## Benötigte Discord-Kanäle

- `#entwickler-news` für Commits auf allen Branches ausser `main`
- `#updates` für Aktualisierungen von `main`

Für beide Kanäle wird je ein Discord-Webhook benötigt.

## Benötigte GitHub-Secrets

Im GitHub-Repository unter:

`Settings -> Secrets and variables -> Actions -> New repository secret`

anlegen:

- `DISCORD_DEV_WEBHOOK_URL`
  - Webhook von `#entwickler-news`
- `DISCORD_UPDATES_WEBHOOK_URL`
  - Webhook von `#updates`

Die Webhook-URLs dürfen niemals in Dateien, Commits oder GitHub-Code gespeichert werden.

## Arbeitsablauf 1 – Entwicklungscommit

Auf einem beliebigen Branch **ausser `main`**:

```bash
./tools/commit.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Oder ohne Parameter starten; das Skript fragt Titel und Zusammenfassung ab.

Nach dem Push führt GitHub automatisch `.github/workflows/discord-entwickler-news.yml` aus.

Die Discord-Nachricht enthält:

- Branch
- Entwickler
- Commit-SHA
- Commit-Titel
- kurze Zusammenfassung
- Link zum Commit

Wenn keine Zusammenfassung angegeben wurde, werden ersatzweise geänderte Dateien zusammengefasst.

## Arbeitsablauf 2 – Branch nach main mergen

Auf dem Entwicklungsbranch bleiben und ausführen:

```bash
./tools/merge-main.sh
```

Optional kann eine eigene Zusammenfassung mitgegeben werden:

```bash
./tools/merge-main.sh "Tierdaten und Kartenfilter für das nächste Update überarbeitet"
```

Das Skript:

1. pusht den aktuellen Entwicklungsbranch,
2. wechselt auf `main`,
3. aktualisiert `main`,
4. merged den Entwicklungsbranch mit `--no-ff`,
5. pusht `main`,
6. wechselt zurück auf den Entwicklungsbranch.

Danach führt GitHub automatisch `.github/workflows/discord-main-update.yml` aus.

Die Nachricht in `#updates` enthält unter anderem:

- gemergten Branch
- wer den Push/Merge auf GitHub veranlasst hat
- enthaltene Commit-Titel
- Link zum GitHub-Vergleich

## Arbeitsablauf 3 – Commit und Merge zusammen

```bash
./tools/commit-und-merge.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Das führt Arbeitsablauf 1 und 2 direkt nacheinander aus:

1. Entwicklungscommit -> `#entwickler-news`
2. Merge nach `main` -> `#updates`

## Share-ZIP und bot/

`bot/` ist absichtlich vollständig von Git ausgeschlossen.

`tools/share-zip.sh` nimmt den lokalen Bot trotzdem in das automatisch erzeugte Share-ZIP auf, mit Sicherheitsausnahmen:

Nicht im ZIP:

- `bot/.env`
- andere lokale `.env`-Secretvarianten
- `bot/node_modules/`
- Logs und Cache
- `bot/server-scan.json`
- Schlüsseldateien (`*.pem`, `*.key`)

Dadurch kann der Bot mit einer Share-ZIP weitergegeben oder gesichert werden, ohne dass Token oder installierte Abhängigkeiten mitkopiert werden.
