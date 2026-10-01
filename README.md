# Planet Zoo 2 Tools

**Planet Zoo 2 Tools** ist ein Open-Source-Community-Projekt rund um **Planet Zoo 2**.

Ziel des Projekts ist es, Tierdaten und verschiedene Werkzeuge an einem Ort zusammenzuführen. Damit sollen Informationen schneller gefunden, Tiere verglichen und eigene Zoo-Projekte besser geplant werden können.

> **Hinweis:** Dieses Projekt ist ein Community-Projekt und keine offizielle Anwendung von Frontier Developments.

---

## Was enthält das Projekt?

Aktuell gehören unter anderem folgende Bereiche zum Projekt:

- Tierübersicht / Zoopedia
- Tierfilter und Tierauswahl
- Infotafeln
- Karte und Verbreitungsdaten
- Nahrungsnetz
- Systematik
- Gehege-/Tier-Rechner _(noch in Entwicklung)_
- Kino-/Medienbereich
- mehrsprachige Oberfläche

Einzelne Funktionen, Tierdaten oder Medien können noch unvollständig sein, da das Projekt aktiv weiterentwickelt wird.

---

## Projekt verwenden

Das Projekt besteht hauptsächlich aus HTML, CSS, JavaScript und JSON-Dateien.

Der Einstiegspunkt der Oberfläche ist:

```text
index.html
```

Die lokale Startmethode wird aktuell noch weiter vereinheitlicht. Eine eigene Startlösung für Windows, Linux und macOS ist als nächster Projektschritt vorgesehen.

Für die normale Nutzung ist der Discord-Bot **nicht erforderlich**.

---

## Projektstruktur

Die wichtigsten Bereiche sind:

```text
PlanetZoo2/
├── index.html                  Startpunkt der Webanwendung
├── pages/                      einzelne Werkzeugseiten
├── assets/
│   ├── components/             gemeinsame UI-Komponenten
│   ├── css/                    Styles
│   ├── js/                     JavaScript und Werkzeuglogik
│   └── daten/                  Tier-, Kino- und Projektdaten
├── dokumentation/              ausführliche Dokumentation
├── tools/                      Maintainer- und Wartungsskripte
├── bot/                        lokaler Discord-Bot-Quellcode in Share-ZIPs
└── README.md
```

---

# Funktionen

## Tierübersicht / Zoopedia

Die Tierübersicht lädt die vorhandenen Tierdaten und bietet unter anderem Suche, Filter und Tierauswahl.

Wichtige Dateien:

```text
assets/daten/lebewesen/tiere/datenImport.js
assets/js/features/tierAuswahl.js
assets/js/features/tierFilter.js
```

Die gemeinsame Tierauswahl kann von mehreren Werkzeugen verwendet werden.

---

## Infotafel

Die Infotafel zeigt Informationen zu einem oder mehreren ausgewählten Tieren.

Je nach vorhandenen Tierdaten können dort beispielsweise angezeigt werden:

- deutscher Name
- wissenschaftlicher Name
- Gehegetyp
- Region
- Schutzstatus
- Edition
- Körperdaten
- Vorkommen
- Sozialverhalten
- Fortpflanzung
- Tierfakten
- Bilder und weitere Medien

Wichtige Dateien:

```text
pages/infotafel.html
assets/js/infotafel/
assets/css/infotafel/
```

---

## Karte

Die Kartenfunktionen befinden sich unter:

```text
pages/map.html
assets/js/map/
assets/css/map/
```

Nicht alle Karten- und Mediendateien werden im öffentlichen Repository mitgeführt. Gründe dafür können Dateigröße, Lizenz oder Quellenlage sein.

---

## Nahrungsnetz

Das Nahrungsnetz verwendet Beziehungen aus den Tierdaten.

Wichtige Dateien:

```text
pages/nahrungsnetz.html
assets/js/nahrungsnetz/
assets/css/nahrungsnetz/
```

Für neue oder geänderte Tierdaten bitte die aktuelle Tierdaten-Dokumentation beachten.

---

## Systematik

Die Systematik verwendet die in den Tierdaten hinterlegten taxonomischen Informationen.

Wichtige Dateien:

```text
pages/systematik.html
assets/js/systematik/
assets/js/features/systematikDaten.js
assets/js/features/systematikSchema.js
```

---

## Rechner

Der Rechner befindet sich unter:

```text
pages/rechner.html
assets/js/rechner/
assets/css/rechner/
```

Dieser Bereich befindet sich noch in Entwicklung.

---

## Kino / Medien

Der Kino- und Medienbereich befindet sich unter:

```text
pages/kino.html
assets/js/kino/
assets/daten/kino/
```

---

# Tierdaten

Jede Tierart besitzt einen eigenen Ordner unter:

```text
assets/daten/lebewesen/tiere/
```

Beispiel:

```text
assets/daten/lebewesen/tiere/Eunectes notaeus/
├── Eunectes notaeus.json
├── bilder/
├── audio/
└── weitere Mediendateien
```

Für das Bearbeiten oder Ergänzen von Tierdaten zuerst diese Dokumentation lesen:

```text
dokumentation/ANLEITUNG-TIER-JSON.md
```

Zusätzlich gibt es eine Checkliste:

```text
dokumentation/PlanetZoo2-Tierdaten-Checkliste.md
```

---

# Medien und Quellen

Nicht alle Bilder, Karten, Audio- oder Videodateien werden über GitHub veröffentlicht.

Hauptgründe sind:

1. Lizenz- und Quellenfragen
2. unnötig große Binärdateien im Repository

Weitere Informationen stehen in:

```text
dokumentation/MEDIEN-UND-QUELLEN.md
```

Veröffentlichbare Medien können beispielsweise unter folgendem Bereich liegen:

```text
assets/medien/freigegeben/
```

Lokale oder nicht öffentlich vorgesehene Dateien gehören beispielsweise nach:

```text
assets/medien/lokal/
assets/private/
assets/cache/
```

---

# Sprachen

Die Oberfläche unterstützt derzeit folgende Sprachcodes:

```text
de
en
en-US
es
fr
it
pt-BR
ja
zh-Hans
```

Die gemeinsame Sprachlogik befindet sich in:

```text
assets/js/features/language.js
```

Statische Oberflächentexte können beispielsweise über `data-*`-Attribute gepflegt werden:

```html
<span data-i18n data-de="Karte" data-en="Map" data-fr="Carte">Karte</span>
```

Tiernamen und dynamische Tiertexte werden in den jeweiligen Tierdaten gepflegt.

---

# Dokumentation

Im Ordner `dokumentation/` liegen ausführlichere Unterlagen:

| Datei                                | Inhalt                                               |
| ------------------------------------ | ---------------------------------------------------- |
| `ANLEITUNG-TIER-JSON.md`             | Aufbau und Pflege der Tierdaten                      |
| `PlanetZoo2-Tierdaten-Checkliste.md` | Checkliste für Tierdaten und Quellen                 |
| `MEDIEN-UND-QUELLEN.md`              | Medien, Quellen und Veröffentlichung                 |
| `ordnerstruktur.md`                  | automatisch erzeugte Projektstruktur                 |
| `DISCORD-NEWS.md`                    | technische Maintainer-Dokumentation für Discord-News |

---

# Mitwirken

Mitarbeit ist ausdrücklich erwünscht.

## Tierdaten

Mögliche Aufgaben:

- vorhandene Tierdaten prüfen
- fehlende Angaben ergänzen
- Quellen ergänzen
- neue Tiere nach der bestehenden JSON-Struktur anlegen

## Entwicklung

Mögliche Aufgaben:

- Fehler beheben
- Werkzeuge verbessern
- Bedienung und Oberfläche weiterentwickeln
- neue Funktionen ergänzen

## Feedback und Tests

Auch ohne Programmiererfahrung kann geholfen werden, zum Beispiel durch:

- Fehlermeldungen
- Verbesserungsvorschläge
- Tests
- Rückmeldungen zur Bedienung

---

# Nur für den Projektmaintainer

Die folgenden vier Befehle gehören zum **persönlichen Arbeitsablauf des Projektmaintainers**.

Sie werden für die normale Nutzung des Projekts **nicht benötigt**.

## Voraussetzungen

Diese Skripte sind aktuell für **Linux mit Bash** gebaut.

Benötigt werden je nach Befehl unter anderem:

- Linux
- Bash
- Git
- Python 3
- `zip`
- die lokale Maintainer-Umgebung
- die lokal verwendete Prettier-Installation

Unter Windows funktionieren die `.sh`-Dateien nicht ohne zusätzliche Bash-Umgebung wie WSL oder Git Bash.

---

## 1. Nur Share-ZIP erstellen

```bash
./tools/share-zip.sh
```

Erstellt:

```text
share/PlanetZoo2-share.zip
```

Die Share-ZIP enthält die freigegebenen Projektdateien und darf zusätzlich sicheren Bot-Quellcode enthalten.

Nicht enthalten sind insbesondere:

```text
bot/.env
bot/node_modules/
Bot-Logs
Bot-Cache
server-scan.json
.git/
share/
private bzw. nicht freigegebene Medien
```

---

## 2. Entwicklungsbranch committen und pushen

```bash
./tools/commit.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Dieser Befehl ist für Entwicklungsbranches wie `dev` vorgesehen.

Er führt den persönlichen Maintainer-Ablauf aus:

```text
Dokumentation aktualisieren
→ .gitignore erzeugen
→ Projekt formatieren
→ Share-ZIP erstellen
→ git add
→ git commit
→ git push
```

Auf `main` bricht das Skript absichtlich ab.

---

## 3. Entwicklungsbranch nach `main` mergen

```bash
./tools/merge-main.sh
```

Dieser Befehl übernimmt den Maintainer-Workflow für den Merge des aktuellen Entwicklungsbranches nach `main`.

---

## 4. Commit und Merge zusammen

```bash
./tools/commit-und-merge.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Dieser Befehl führt nacheinander aus:

```text
Entwicklungscommit
→ Push des Entwicklungsbranches
→ Merge nach main
→ Push von main
```

---

# Discord-News und Bot

Das Projekt enthält Hilfsdateien für automatische Nachrichten auf dem privaten **Planet Zoo 2 Tools Discord-Server**.

Diese Funktion gehört zur **Maintainer-Infrastruktur**.

Ein fremder Nutzer oder ein Fork des Projekts kann damit nicht automatisch Nachrichten auf den originalen Discord-Server senden.

Dafür fehlen insbesondere:

- der echte Discord-Bot-Token
- die GitHub-Secrets des Maintainers
- die Discord-Berechtigungen des Bots
- der Zugriff auf die verwendeten Discord-Kanäle

Der echte Bot-Token wird niemals veröffentlicht.

Insbesondere wird folgende Datei nicht in GitHub oder in Share-ZIPs aufgenommen:

```text
bot/.env
```

Auch wenn sicherer Bot-Quellcode in einer Share-ZIP enthalten ist, funktioniert die automatische Discord-News-Funktion bei fremden Kopien deshalb **nicht automatisch**.

Für die Webanwendung selbst wird der Discord-Bot nicht benötigt.

Weitere technische Informationen für den Maintainer:

```text
dokumentation/DISCORD-NEWS.md
```

---

# Sicherheit

Folgende Daten dürfen niemals veröffentlicht oder committed werden:

- Discord-Bot-Tokens
- `.env`-Dateien mit echten Zugangsdaten
- API-Schlüssel
- private Schlüsseldateien
- Passwörter

Der lokale Ordner `bot/` ist bewusst aus dem normalen Git-Workflow ausgeschlossen. Das Share-Skript übernimmt nur die dafür vorgesehenen sicheren Dateien.

---

# Projektstatus

Das Projekt befindet sich aktiv in Entwicklung.

Einzelne Werkzeuge, Tierdaten, Übersetzungen oder Medien können noch fehlen oder sich ändern.

Fehlerberichte, Tests und Verbesserungsvorschläge sind willkommen.
