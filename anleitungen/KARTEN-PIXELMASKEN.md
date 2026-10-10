# Karten-Pixelmasken: Doppelklick und Online-Links

## Zweck

Die interaktive Karte zeigt Tierverbreitungen pixelgenau an. Bei mehreren
Tieren werden überlappende Gebiete farbig gestreift; ein Mausklick findet
alle ausgewählten Tiere anhand ihrer Pixelmasken.

Chrome verbietet bei `file://` den Pixelzugriff (`getImageData`) auf manche
lokale Bilder, und bei externen URLs ohne CORS-Freigabe auf Onlinebilder.
Ein sichtbares `<img>` ist **nicht automatisch** mit Canvas auslesbar.

## Saubere Lösung

`tools/build-map-masks.js` verarbeitet die PNGs **beim Erstellen** des
Browser-Bundles: zuerst die Datei unter `karte.dateien[].pfad`, sonst das
Bild unter `karte.url`. Bei URL-Bildern lädt Node.js die PNG nur vorübergehend
in den Arbeitsspeicher und liest die Pixel aus. Node.js ist nicht an Browser-CORS
gebunden. Das Tool erzeugt:

- `assets/js/map/generated/mapMasks.js`: kompakte, verlustfreie 0/1-Masken der
  pinken Gebiete (540×267 Raster), optional mit Rückprojektion aus einem
  Zoopedia-Detailausschnitt.
- Eine Landmaske für den neutralen Weltkartenhintergrund.

**Die Original-PNGs werden nicht in das JavaScript oder ZIP übernommen.**

Danach verwendet die Karte die vorberechneten Masken, auch beim Doppelklick
auf `index.html`. Die normale Überlagerungs- und Punktabfrage-Logik bleibt
bestehen. Fehlende oder neue Masken kann Chrome zur Laufzeit direkt aus
Online-PNGs erzeugen, **aber nur wenn die Bild-URL CORS erlaubt**.

## Einmalig oder nach Änderungen an Karten-URLs

Im Wurzelordner des Projekts:

```bash
npm run build:all
```

Dies führt nacheinander `node tools/build-map-masks.js` und
`node tools/build-browser-bundle.js` aus.

Anschliessend wie gewohnt `index.html` per Doppelklick öffnen.

Das vorhandene `tools/share-zip.sh` erzeugt die Masken vor dem ZIP-Build
**automatisch**: zuerst aus lokalen PNGs, sonst aus den Online-URLs.
Wenn keine Internetverbindung besteht, können bereits vorher erzeugte Masken
mit `PZ_MAPS_OFFLINE=1 ./tools/share-zip.sh` wiederverwendet werden.
Ohne zuvor erzeugte Masken oder Bildzugriff schlägt der Build ausdrücklich
fehl; er darf keine leere Kartenfunktion als fertige Version ausgeben.

## Grenzen

- Ohne eine lokal vorberechnete Maske und ohne CORS-Freigabe des Bildservers
  kann ein direkt via `file://` geöffnetes HTML-Dokument aus dem fremden
  Onlinebild keine Pixel lesen. Das ist eine Browser-Sicherheitsgrenze.
- Kartendaten werden zum Build-Zeitpunkt eingefroren. Nach Bildänderungen
  muss die Maske neu erzeugt werden (sonst ist die gespeicherte unverändert).
- Der PNG-Decoder des Build-Skripts unterstützt übliche nicht-interlaced
  8-Bit-PNGs (RGB, RGBA, Palette, Graustufen). Andere Formate werden mit
  Warnung übersprungen.
- Ein Skript-Build **ersetzt nicht die Klärung der Bild-/Datenrechte** für
  die Veröffentlichung abgeleiteter Kartendaten.

## Reihenfolge und Fehlerfälle

1. Ist eine lokale PNG unter `karte.dateien[].pfad` vorhanden und lesbar,
   wird **sie** für alle Pixelberechnungen verwendet.
2. Fehlt diese PNG oder ist sie beschädigt, verarbeitet der Build automatisch
   die PNG aus `karte.url`. Eine reine Bildanzeige ist kein Ersatz für die Pixelmaske.
3. War eine URL schon einmal erfolgreich verarbeitet worden, werden die
   gespeicherten Pixel beim nächsten Build ohne erneuten Download übernommen.
   Um dieselbe URL bewusst neu einzulesen: `node tools/build-map-masks.js --refresh`
   und anschliessend `npm run build:browser`.

Wenn keine einzige Karte verarbeitet werden kann, bricht der Build ab und
überschreibt vorhandene Pixelmasken nicht.

**Wichtig:** Browser können bei `file://` nicht auf beliebige lokale oder
serverseitig nicht per CORS freigegebene Online-Bilder zugreifen und dann
`getImageData()` verwenden. Ein _neues_ Tier mit einer bislang unbekannten
Online-URL benötigt deshalb auf dem Entwicklerrechner `npm run build:all`.
Für Personen, die die fertige ZIP benutzen, ist nur der Doppelklick nötig.
