# Vorhandenes Tier bearbeiten

## Ziel

Diese Anleitung zeigt, wie du Daten eines bereits vorhandenen Tiers änderst, ohne ein neues Tier anzulegen.

## 1. Tierordner finden

Öffne:

```text
assets/daten/lebewesen/tiere/
```

Suche dort den Ordner mit dem wissenschaftlichen Namen des Tiers.

## 2. JSON-Datei öffnen

Im Tierordner befindet sich die gleichnamige JSON-Datei. Dort werden die Tierdaten gepflegt.

## 3. Nur den benötigten Bereich ändern

Ändere nur die Felder, die du tatsächlich korrigieren oder ergänzen möchtest. Die Erklärung der einzelnen Bereiche findest du in [technische Tier-JSON-Referenz](../dokumentation/ANLEITUNG-TIER-JSON.md).

Wenn du Informationen aus einer neuen Quelle übernimmst, ergänze auch die zugehörige Quellenangabe.

## 4. Medien getrennt behandeln

Für neue oder geänderte Bilder, Tierstimmen und Videos verwende `MEDIEN-EINFUEGEN.md`. Lösche einen funktionierenden lokalen Pfad nicht nur deshalb, weil zusätzlich eine externe Quelle vorhanden ist.

## 5. Testen

Öffne `index.html`, rufe das Tier auf und kontrolliere die geänderten Angaben. Prüfe auch die betroffenen Werkzeuge, zum Beispiel Filter, Infotafel, Karte, Systematik oder Nahrungsnetz.

## Kurzfassung für ein Video

1. Tierordner öffnen.
2. JSON-Datei öffnen.
3. Gewünschte Daten ändern.
4. Quelle ergänzen oder korrigieren.
5. Bei Medien die Medien-Anleitung verwenden.
6. Änderung in `index.html` testen.
