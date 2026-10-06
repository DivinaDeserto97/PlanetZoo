# Neues Tier anlegen – Schritt für Schritt

## Ziel

Mit dieser Anleitung legst du ein neues Tier für **Planet Zoo 2 Tools** an. Die Anleitung ist für Einsteiger geschrieben und kann gleichzeitig als Skript für ein Anleitungsvideo verwendet werden.

## Vor dem Start

Du brauchst:

- den entpackten Projektordner;
- einen Texteditor, zum Beispiel VS Code;
- den wissenschaftlichen Namen des Tiers;
- die Tierdaten und die dazugehörigen Quellen;
- optional Bilder, Tierstimmen oder Videos.

> Wichtig: Verwende für Tierordner und Tierdatei den wissenschaftlichen Namen. Die genaue Bedeutung aller JSON-Felder steht in [technische Tier-JSON-Referenz](../dokumentation/ANLEITUNG-TIER-JSON.md).

## 1. Vorlage kopieren

Öffne:

```text
assets/daten/lebewesen/tiere/1leeres Tier/
```

Kopiere den kompletten Vorlagenordner und füge die Kopie unter `assets/daten/lebewesen/tiere/` ein.

## 2. Ordner umbenennen

Benenne den kopierten Ordner nach dem wissenschaftlichen Namen des Tiers.

Beispiel:

```text
Panthera leo
```

## 3. JSON-Datei umbenennen

Benenne auch `leeres Tier.json` nach dem wissenschaftlichen Namen um.

Beispiel:

```text
Panthera leo.json
```

## 4. Tierdaten eintragen

Öffne die JSON-Datei und fülle die vorhandenen Bereiche aus. Arbeite am besten von oben nach unten.

Achte besonders auf:

- `id`;
- Namen und Übersetzungen;
- Filterwerte;
- Tierdaten;
- Systematik;
- Texte;
- Karte;
- Bilder, Audio und Video;
- Planet-Zoo-2-Daten;
- Quellen.

Wenn du bei einem Feld unsicher bist, verwende [technische Tier-JSON-Referenz](../dokumentation/ANLEITUNG-TIER-JSON.md) als Nachschlagewerk.

## 5. Medien einfügen

Bilder, Tierstimmen und Videos kommen in die vorgesehenen Unterordner des Tiers. Wie Pfad, Quelle und externer Fallback eingetragen werden, steht in `MEDIEN-EINFUEGEN.md`.

## 6. Tier in die Importreihenfolge aufnehmen

Das Tier muss in der zentralen Tierliste an der gewünschten Stelle eingetragen werden:

```text
assets/daten/lebewesen/tiere/datenImport.js
```

Die Reihenfolge dort bestimmt die vorgesehene Reihenfolge der Tiere im Projekt. Neue Tiere deshalb nicht einfach ungeprüft ans Ende setzen.

## 7. Projekt testen

Öffne `index.html` und kontrolliere mindestens:

- erscheint das Tier in der Zoopedia/Tierübersicht?
- stimmen Name und wissenschaftlicher Name?
- funktionieren Filter?
- werden vorhandene Bilder angezeigt?
- funktionieren Karte, Infotafel, Systematik und Nahrungsnetz soweit Daten vorhanden sind?
- gibt es sichtbare Fehlermeldungen?

## 8. Abschlusskontrolle

Gehe zum Schluss die `PlanetZoo2-Tierdaten-Checkliste.md` durch. Erst wenn die Daten und Quellen geprüft sind, ist das Tier fertig vorbereitet.

## Kurzfassung für ein Video

1. Vorlage kopieren.
2. Ordner nach wissenschaftlichem Namen benennen.
3. JSON-Datei umbenennen.
4. Tierdaten und Quellen eintragen.
5. Medien ergänzen.
6. Tier in `datenImport.js` an der richtigen Stelle eintragen.
7. `index.html` öffnen und testen.
8. Checkliste durchgehen.
