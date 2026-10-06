# Bilder, Tierstimmen und Videos einfügen

## Ziel

Diese Anleitung erklärt für Einsteiger, wie Medien zu einem Tier hinzugefügt werden.

## Grundprinzip

Das Projekt bevorzugt **lokale Dateien**. Bei Bildern kann zusätzlich die externe Bildadresse aus der Tier-JSON als Fallback dienen, wenn die lokale Datei nicht vorhanden oder nicht erreichbar ist.

Das bedeutet:

1. lokaler `pfad` wird zuerst versucht;
2. funktioniert er nicht, kann die hinterlegte externe Bild-URL verwendet werden;
3. die Quelle bleibt dokumentiert.

## 1. Passenden Tierordner öffnen

```text
assets/daten/lebewesen/tiere/WISSENSCHAFTLICHER NAME/
```

Dort gibt es je nach Medium Unterordner wie:

```text
bilder/
audio/
videos/
map/
```

## 2. Datei einfügen

Lege die Datei in den passenden Unterordner. Verwende verständliche Dateinamen und ändere bestehende Dateinamen nicht ohne Grund, weil die JSON darauf verweisen kann.

## 3. Eintrag in der Tier-JSON ergänzen

Trage den lokalen Pfad in das dafür vorgesehene Medienobjekt ein. Bei Bildern soll zusätzlich die ursprüngliche externe Adresse bzw. Quelle erhalten bleiben, damit der Fallback und die Herkunft nachvollziehbar sind.

Die exakte aktuelle JSON-Struktur und die Feldnamen findest du in [technische Tier-JSON-Referenz](../dokumentation/ANLEITUNG-TIER-JSON.md) und an bereits vollständig gepflegten Tieren.

## 4. Lizenz und Quelle prüfen

Eine technisch erreichbare Datei darf nicht automatisch frei verwendet oder veröffentlicht werden. Prüfe deshalb die Nutzungs- und Lizenzbedingungen der jeweiligen Quelle. Weitere Hinweise stehen in [technische Medien- und Quellenregeln](../dokumentation/MEDIEN-UND-QUELLEN.md).

## 5. Testen

Öffne `index.html` und kontrolliere das Tier.

Für ein Bild sollte der Test beide Fälle abdecken:

- lokale Datei vorhanden → lokales Bild wird verwendet;
- lokale Datei fehlt → externer Fallback wird verwendet, sofern eine geeignete URL eingetragen ist.

## Kurzfassung für ein Video

1. Tierordner öffnen.
2. Medium in `bilder/`, `audio/` oder `videos/` ablegen.
3. lokalen Pfad in der Tier-JSON eintragen.
4. Quelle und – bei Bildern – externe Fallback-Adresse erhalten/eintragen.
5. Lizenzbedingungen beachten.
6. Anzeige bzw. Wiedergabe testen.

## Wichtig: Du musst kein Browser-Bundle pflegen

Beim Eintragen eines Tieres pflegst du Bilddaten **nur in der Tier-JSON**. Der lokale `pfad` ist die erste Wahl, die externe `url` ist der Fallback. `browser.bundle.js` wird durch die Projektwerkzeuge bzw. nach einem Push automatisch erzeugt und darf nicht von Hand bearbeitet werden.

Wenn `url` fehlt, zeigt die Tierprüfung die Bildvariante als fehlerhaft an.
