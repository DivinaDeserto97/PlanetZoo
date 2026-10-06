# Entwickler-Einstieg für Anfänger

Diese Anleitung erklärt, wo Änderungen in **Planet Zoo 2 Tools** normalerweise hingehören. Sie ist bewusst als Einstieg gedacht; die Kommentare im Quellcode erklären die einzelnen Bereiche zusätzlich.

## Wichtigste Ordner

- `assets/daten/lebewesen/tiere/` – Tier-JSONs und lokale Tiermedien.
- `assets/js/` – Programmlogik der Webseite.
- `assets/css/` – Aussehen und Layout.
- `pages/` – einzelne Werkzeugseiten.
- `tools/` – Build-, ZIP-, Git- und Wartungsskripte.
- `bot/` – lokaler Discord-Bot; wird nicht ins Git-Repository committed.
- `anleitungen/` – dauerhafte Anleitungen und Projektdokumentation.

## Browser-Bundle

`assets/js/browser.bundle.js` wird automatisch erzeugt. Diese Datei **nicht von Hand bearbeiten**. Nach Änderungen am Quellcode wird sie über die vorhandenen Build-/ZIP-/Commit-Skripte neu erstellt.

## Bilder: lokal zuerst, URL als Fallback

Eine Bildvariante kann zum Beispiel so aussehen:

```json
{
  "url": "https://example.org/tierbild.webp",
  "dateien": [
    {
      "typ": "original",
      "dateityp": "webp",
      "pfad": "assets/daten/lebewesen/tiere/Beispiel/bilder/Beispiel 1.webp"
    }
  ]
}
```

Die Anwendung versucht zuerst `pfad`. Kann die lokale Datei nicht geladen werden, versucht sie automatisch `url`. Erst wenn beides nicht funktioniert, wird der normale Bild-Platzhalter gezeigt.

Die URL bleibt zugleich die nachvollziehbare externe Quelle. Nutzungs- und Lizenzbedingungen der Quelle müssen weiterhin beachtet werden.

## Git-/Discord-Ablauf

Öffentliche Entwicklungsänderungen werden mit den normalen Commit-/Merge-Skripten veröffentlicht und können Discord-News auslösen. Interne Sicherungscommits verwenden `[intern]`; der Discord-News-Workflow überspringt solche Commits.

Vor grösseren Änderungen kann `./tools/zip-intern.sh "Beschreibung"` eine Share-ZIP erstellen und einen internen Sicherungscommit anlegen.
