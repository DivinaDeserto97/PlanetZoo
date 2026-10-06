# Discord-Bot – Betrieb und Server-Scan

Der Ordner `bot/` enthält den lokalen Discord-Bot. Er ist absichtlich vom Git-Repository ausgeschlossen, wird aber von der Share-ZIP-Funktion als sichere Kopie mitgenommen.

## Start

```bash
cd bot
npm install
npm start
```

Die Zugangsdaten liegen ausschließlich in `bot/.env`. Diese Datei darf weder committed noch in eine Share-ZIP aufgenommen werden.

Beim Start kann der Bot den aktuellen Discord-Serverzustand protokollieren. Lokale Scan-Dateien wie `server-scan.json` und `server-scans/` bleiben ebenfalls außerhalb der veröffentlichten Archive bzw. Git-Historie.

## Bot-Rechte

Für normale Nachrichten nur die tatsächlich benötigten Rechte vergeben. Verwaltungsrechte sollten nur vorübergehend verwendet werden, wenn eine ausdrücklich dafür vorgesehene Server-Konfiguration angewendet wird.

## GitHub-Discord-News

Die Commit-/Merge-News werden nicht durch einen dauerhaft laufenden lokalen Bot ausgelöst, sondern über GitHub Actions. Details: `anleitungen/DISCORD-NEWS.md`.
