# Technische Projektdokumentation

Dieser Ordner enthält die **technische Dokumentation für Entwickler und Maintainer** von Planet Zoo 2 Tools.

Im Gegensatz zu `anleitungen/` geht es hier nicht primär um einfache Bedienungsabläufe, sondern um Aufbau, Wartung und Weiterentwicklung des Projekts.

## Inhalt

| Datei                                | Zweck                                                        |
| ------------------------------------ | ------------------------------------------------------------ |
| `ENTWICKLER-EINSTIEG.md`             | technischer Einstieg in Projekt, Quellcode und Arbeitsablauf |
| `ANLEITUNG-TIER-JSON.md`             | technische Referenz der Tier-JSON-Struktur                   |
| `PlanetZoo2-Tierdaten-Checkliste.md` | technische Daten- und Quellenkontrolle                       |
| `MEDIEN-UND-QUELLEN.md`              | technische Regeln für Medien, Quellen und Freigaben          |
| `BOT.md`                             | lokaler Discord-Bot, Server-Scan und Bot-Konfiguration       |
| `DISCORD-NEWS.md`                    | GitHub-Actions-/Discord-News-Workflow                        |
| `ordnerstruktur.md`                  | automatisch erzeugte aktuelle Projektstruktur                |

## Abgrenzung zu `anleitungen/`

`anleitungen/` ist für Nutzer und neue Mitwirkende gedacht und enthält leicht verständliche Schritt-für-Schritt-Abläufe, die auch als Grundlage für YouTube-Anleitungsvideos dienen können.

Technische Details, interne Abläufe und Entwicklerwissen gehören dagegen hier nach `dokumentation/`.

## Automatisch erzeugte Dateien

`ordnerstruktur.md` wird durch

```bash
./tools/ordnerstruktur.sh
```

automatisch erzeugt und sollte nicht von Hand gepflegt werden.
