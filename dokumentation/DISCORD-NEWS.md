# Discord-News über GitHub Actions und den Discord-Bot

Die Discord-News werden von **GitHub Actions** ausgelöst. Der eigene Bot muss dafür nicht dauerhaft auf einem PC oder Heimserver laufen.

GitHub Actions verwendet beim jeweiligen Push kurz den Bot-Token, sendet die Nachricht über die Discord-API als **Server Bot** und beendet sich danach wieder.

## Lokale Bot-Konfiguration

Der lokale Bot verwendet `bot/.env`:

```text
DISCORD_TOKEN=
GUILD_ID=
WELCOME_CHANNEL_ID=
ENTWICKLER_NEWS_ID=
UPDATES_ID=
```

Wichtig: `bot/.env` bleibt lokal. Sie wird weder committed noch in die Share-ZIP gepackt.

## GitHub Actions kann `bot/.env` nicht lesen

Ein GitHub-Runner läuft auf einem GitHub-Rechner und erhält nur Repository-Dateien sowie GitHub-Secrets/-Variables. Deshalb werden die Werte für den Workflow einmal in GitHub hinterlegt:

`Settings -> Secrets and variables -> Actions`

### Secret

- `DISCORD_BOT_TOKEN` = derselbe Wert wie lokal `DISCORD_TOKEN`

### Repository Variables

- `GUILD_ID` = derselbe Wert wie lokal `GUILD_ID`
- `ENTWICKLER_NEWS_ID` = derselbe Wert wie lokal `ENTWICKLER_NEWS_ID`
- `UPDATES_ID` = derselbe Wert wie lokal `UPDATES_ID`

Die Kanal-IDs sind keine Geheimnisse und gehören deshalb in **Variables**, nicht in Secrets.

## Schreibweise der Variablen

Bitte genau diese Namen verwenden:

```text
ENTWICKLER_NEWS_ID
UPDATES_ID
```

Nicht `ENTWIKLER-NEWS_ID`: Das enthält einen Schreibfehler und einen Bindestrich.

## Discord-Rechte des Bots

In `#entwicklung-news` und `#updates` benötigt der Bot mindestens:

- Kanal ansehen
- Nachrichten senden
- Links einbetten

Wenn ein Kanal privat ist, muss die Bot-Rolle bzw. der Bot ausdrücklich Zugriff erhalten. Discord kann sonst auch mit `404 Unknown Channel` antworten, obwohl die ID existiert.

## Lokaler Verbindungstest

Mit der lokalen `bot/.env` kann die Discord-Verbindung getestet werden, ohne zuerst einen Commit zu machen:

```bash
node tools/discord-news.mjs developer "Lokaler Test Entwicklung"
```

Für `#updates`:

```bash
node tools/discord-news.mjs main "Lokaler Test Updates"
```

Das Skript liest dafür automatisch `bot/.env`.

## Die vier Arbeitsbefehle

### 1. Nur Share-ZIP erstellen

```bash
./tools/share-zip.sh
```

### 2. Entwicklungsbranch committen und pushen

```bash
./tools/commit.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Danach startet `.github/workflows/discord-news.yml` und sendet nach `#entwicklung-news`.

### 3. Entwicklungsbranch nach `main` mergen

```bash
./tools/merge-main.sh
```

Danach startet der Workflow für `main` und sendet nach `#updates`.

### 4. Commit + Merge

```bash
./tools/commit-und-merge.sh "Commit-Titel" "Kurze Zusammenfassung"
```

## Share-ZIP und `bot/`

`bot/` bleibt vollständig von Git ausgeschlossen. `tools/share-zip.sh` nimmt den lokalen Bot trotzdem als sichere Kopie in das Share-ZIP auf.

Nicht im ZIP:

- `bot/.env`
- andere lokale `.env`-Secretvarianten
- `bot/node_modules/`
- Logs und Cache
- `bot/server-scan.json`
- Schlüsseldateien (`*.pem`, `*.key`)

## Fehlerdiagnose

GitHub: `Repository -> Actions`

Typische Fehler:

- `DISCORD_BOT_TOKEN fehlt` -> GitHub-Secret fehlt.
- `ENTWICKLER_NEWS_ID fehlt` -> GitHub-Variable fehlt.
- `UPDATES_ID fehlt` -> GitHub-Variable fehlt.
- HTTP `401` -> Bot-Token ungültig oder zurückgesetzt.
- HTTP `403` -> Bot darf den Kanal sehen, aber nicht schreiben.
- HTTP `404 Unknown Channel` -> Kanal-ID falsch **oder** Bot darf den Kanal nicht sehen.

## Interne Commits ohne Discord-Nachricht

Ein Commit mit `[intern]` in der Commit-Nachricht wird vom Discord-News-Job übersprungen.

Beispiel:

```bash
git commit -m "Interne Wartung [intern]"
```

Für eine Sicherungs-ZIP plus internen Commit gibt es:

```bash
./tools/zip-intern.sh "Beschreibung"
```

Normale Commits und normale Merges bleiben öffentlich und senden weiterhin die vorgesehenen Discord-News.
