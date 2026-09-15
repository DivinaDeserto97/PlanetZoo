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
