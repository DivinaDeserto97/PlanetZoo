# Medien und Quellen

Das Projekt trennt veröffentlichbare Medien von lokalen bzw. privaten Dateien.

## Freigegebene Medien

Dateien, für die eine Weitergabe erlaubt ist, kommen nach:

```text
assets/medien/freigegeben/
```

Diese Dateien dürfen von Git erfasst und im Share-ZIP mitgeliefert werden. Im jeweiligen Datensatz sollten Quelle, Urheber und Lizenz bzw. Freigabe dokumentiert werden.

## Lokale Medien

Dateien, die nur lokal verwendet werden sollen, kommen nach:

```text
assets/medien/lokal/
```

Dieser Ordner wird durch `.gitignore` nicht auf GitHub hochgeladen.

## Cache und private Medien

```text
assets/cache/
assets/private/
```

Auch diese Ordner werden nicht veröffentlicht. Sie sind für lokal gespeicherte Kopien, Qualitätssicherung oder eigene Medien vorgesehen.

## Remote- und Embed-Quellen

Wenn eine Datei nicht weitergegeben werden darf, sollte im Datensatz nur die Originalquelle bzw. ein zulässiger Embed hinterlegt werden. Eine Quellenangabe allein ist keine Erlaubnis zur Weiterverteilung einer Datei.

## Empfohlene Angaben pro Medium

```json
{
  "quelle": "Original-URL",
  "urheber": "Name oder Organisation",
  "lizenz": "z. B. CC BY 4.0",
  "verwendung": "freigegeben"
}
```

Mögliche Werte für `verwendung` sind beispielsweise `freigegeben`, `remote`, `embed`, `privat` oder `pruefen`.

## GitHub-Freigabe direkt im JSON

Ob eine **lokale Mediendatei** auf GitHub und in der Share-ZIP mitgeliefert werden darf, wird direkt beim jeweiligen `dateien`-Eintrag gespeichert:

```json
{
  "typ": "original",
  "dateityp": "png",
  "pfad": "assets/daten/lebewesen/tiere/Beispiel/map/Beispiel map.png",
  "githubFreigabe": false
}
```

- `"githubFreigabe": true` = Datei darf von diesem Projekt auf GitHub und in der Share-ZIP mitgeliefert werden.
- `"githubFreigabe": false` = Datei bleibt lokal und wird automatisch durch `.gitignore` ausgeschlossen.
- Nur auf `true` setzen, wenn die konkrete Datei tatsächlich weiterverbreitet werden darf.
- `quelle` und `url` bleiben unabhängig davon erhalten. Eine Quellenangabe allein ist **keine** Freigabe.

`tools/gitignore-aus-json.py` erzeugt beim Commit die `.gitignore` automatisch aus diesen Angaben plus den festen Standardregeln.
