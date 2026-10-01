# Planet Zoo 2 Tools

**Planet Zoo 2 Tools** ist ein Community-Projekt rund um **Planet Zoo 2**. Ziel ist eine gemeinsame Sammlung von Tierdaten und Werkzeugen, die beim Planen, Vergleichen und Nachschlagen helfen.

Das Projekt enthält unter anderem:

- Tierübersicht / Zoopedia
- Filter und Tierauswahl
- Infotafeln für einzelne oder mehrere Tiere
- Karte und Verbreitungsdaten
- Nahrungsnetz
- Systematik
- Gehege-/Tier-Rechner _(noch in Entwicklung)_
- Kino-/Medienbereich
- mehrsprachige Oberfläche

> **Hinweis:** Dieses Projekt ist ein Community-Projekt und keine offizielle Anwendung von Frontier Developments.

---

## Schnellstart

Für die Weboberfläche ist keine klassische Installation mit `npm install` nötig.

### 1. Projekt herunterladen

Entweder das Repository klonen oder eine bereitgestellte Share-ZIP herunterladen und entpacken.

### 2. Lokalen Webserver starten

Die Anwendung lädt HTML-Komponenten und JavaScript-Module dynamisch. Deshalb ist ein kleiner lokaler Webserver zuverlässiger als ein direkter Doppelklick auf `index.html`.

#### Windows

Im Projektordner:

```powershell
py -m http.server 8000
```

#### Linux / macOS

Im Projektordner:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

Zum Beenden des lokalen Servers im Terminal:

```text
Ctrl + C
```

---

## Projektstruktur

Die wichtigsten Bereiche sind:

```text
PlanetZoo2/
├── index.html                  Startpunkt der Webanwendung
├── pages/                      einzelne Werkzeugseiten
├── assets/
│   ├── components/             Header, Footer und gemeinsame Komponenten
│   ├── css/                    Styles
│   ├── js/                     JavaScript und Werkzeuglogik
│   └── daten/                  Tier-, Kino- und Projektdaten
├── dokumentation/              ausführliche Projekt- und Daten-Dokumentation
├── tools/                      Wartungs- und Maintainer-Skripte
├── bot/                        lokaler Discord-Bot-Quellcode in Share-ZIPs
└── README.md
```

---

## Wichtige Funktionen

### Tierübersicht / Zoopedia

Die Startseite lädt die Tierdaten zentral und ermöglicht unter anderem die Suche und Filterung nach verschiedenen Eigenschaften.

Die zentrale Tierdaten-Einbindung befindet sich in:

```text
assets/daten/lebewesen/tiere/datenImport.js
```

Die gemeinsame Tierauswahl liegt in:

```text
assets/js/features/tierAuswahl.js
```

Die Auswahl bleibt beim Wechsel zwischen mehreren Werkzeugen erhalten.

### Infotafel

Die Infotafel kann Daten zu einem oder mehreren ausgewählten Tieren anzeigen. Dazu gehören je nach vorhandenen Daten beispielsweise:

- deutscher und wissenschaftlicher Name
- Gehegetyp
- Region
- Arterhaltungsstatus
- Edition
- Körperdaten
- Vorkommen
- Arterhaltung
- Sozialverhalten und Fortpflanzung
- Tierfakten

Wichtige Dateien:

```text
pages/infotafel.html
assets/js/infotafel/
assets/css/infotafel/
```

### Karte

Die Kartenfunktionen befinden sich unter:

```text
pages/map.html
assets/js/map/
assets/css/map/
```

Verbreitungskarten und andere Mediendateien können aus Lizenz- und Dateigrößen-Gründen lokal fehlen.

### Nahrungsnetz

Das Nahrungsnetz verwendet die in den Tier-JSONs gepflegten Beziehungen.

Wichtige Dateien:

```text
pages/nahrungsnetz.html
assets/js/nahrungsnetz/
assets/css/nahrungsnetz/
```

Für neue Tierdaten muss die aktuelle Nahrungsnetz-Struktur verwendet werden. Details stehen in:

```text
dokumentation/ANLEITUNG-TIER-JSON.md
```

### Systematik

Die Systematik nutzt die in den Tierdaten hinterlegten taxonomischen bzw. systematischen Informationen.

Wichtige Dateien:

```text
pages/systematik.html
assets/js/systematik/
assets/js/features/systematikDaten.js
assets/js/features/systematikSchema.js
```

### Rechner

Der Rechner befindet sich unter:

```text
pages/rechner.html
assets/js/rechner/
assets/css/rechner/
```

Dieser Bereich ist derzeit noch nicht vollständig fertiggestellt. Fehlende Rechnerdaten bei einzelnen Tieren sind deshalb aktuell möglich.

### Kino

Der Kino-/Medienbereich befindet sich unter:

```text
pages/kino.html
assets/js/kino/
assets/daten/kino/
```

---

## Tierdaten bearbeiten oder ergänzen

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
└── weitere lokale Mediendateien
```

Für das Anlegen und Bearbeiten von Tierdaten bitte zuerst diese Dokumentation verwenden:

```text
dokumentation/ANLEITUNG-TIER-JSON.md
```

Zusätzlich gibt es eine ausführliche Checkliste:

```text
dokumentation/PlanetZoo2-Tierdaten-Checkliste.md
```

---

## Medien und Quellen

Nicht alle Bilder, Karten, Audio- oder Videodateien werden mit dem GitHub-Repository veröffentlicht.

Das hat vor allem zwei Gründe:

1. Lizenz- und Quellenfragen
2. unnötig große Binärdateien im Repository

Viele Medienpfade sind trotzdem bereits in den Tierdaten vorbereitet.

### Typische lokale Medien

Beispiel Tierbild:

```text
assets/daten/lebewesen/tiere/Eunectes notaeus/bilder/Eunectes notaeus.webp
```

Beispiel Verbreitungskarte:

```text
assets/daten/lebewesen/tiere/Eunectes notaeus/Eunectes notaeus map.png
```

Beispiel Weltkarten-Referenz:

```text
assets/daten/Weltkarte/Weltkartenreferenz_map.png
```

Beispiel Audio:

```text
assets/daten/lebewesen/tiere/Eunectes notaeus/audio/ruf.mp3
```

Die Quelle eines Mediums wird in den jeweiligen Daten gepflegt und nicht allein durch den Ordnernamen bestimmt.

Weitere Informationen:

```text
dokumentation/MEDIEN-UND-QUELLEN.md
```

### Veröffentlichbare und lokale Medien

Veröffentlichbare Medien können unter folgendem Bereich liegen:

```text
assets/medien/freigegeben/
```

Lokale oder private Medien bzw. Cache-Dateien gehören dagegen beispielsweise nach:

```text
assets/medien/lokal/
assets/private/
assets/cache/
```

Diese Bereiche werden nicht normal veröffentlicht.

---

## Sprachen

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

Statische Oberflächentexte können direkt im HTML über `data-*`-Attribute gepflegt werden.

Beispiel:

```html
<span data-i18n data-de="Karte" data-en="Map" data-fr="Carte">Karte</span>
```

Tiernamen und dynamische Tiertexte werden in den jeweiligen Tierdaten gepflegt.

---

## Dokumentation

Im Ordner `dokumentation/` liegen ausführlichere Unterlagen:

| Datei                                | Inhalt                                               |
| ------------------------------------ | ---------------------------------------------------- |
| `ANLEITUNG-TIER-JSON.md`             | Aufbau und Pflege der Tierdaten                      |
| `PlanetZoo2-Tierdaten-Checkliste.md` | Checkliste für Tierdaten und Quellen                 |
| `MEDIEN-UND-QUELLEN.md`              | Umgang mit Medien, Quellen und Veröffentlichung      |
| `ordnerstruktur.md`                  | automatisch erzeugte Projektstruktur                 |
| `DISCORD-NEWS.md`                    | technische Maintainer-Dokumentation für Discord-News |

---

## Für Mitwirkende

Wer am Projekt mitarbeiten möchte, kann sich zunächst an folgenden Bereichen orientieren:

### Tierdaten

- vorhandene Tierdaten prüfen
- fehlende Angaben ergänzen
- Quellen dokumentieren
- neue Tiere nach der bestehenden JSON-Struktur anlegen

### Entwicklung

- Fehler beheben
- Werkzeuge verbessern
- Oberfläche und Bedienung weiterentwickeln
- neue Funktionen ergänzen

### Rückmeldung

Auch Fehlermeldungen, Verbesserungsvorschläge und Tests helfen dem Projekt.

> Die im nächsten Abschnitt beschriebenen vier Shell-Befehle sind **nicht** für normale Nutzer oder externe Mitwirkende erforderlich.

---

# Nur für den Projektmaintainer: vier Arbeitsbefehle

Dieser Abschnitt beschreibt den persönlichen Wartungs-Workflow des Projektmaintainers.

## Wichtig

Diese Skripte sind für den aktuellen Maintainer-Workflow gebaut und gelten **nicht als Voraussetzung für die normale Nutzung des Projekts**.

Sie sind für **Linux mit Bash** vorgesehen.

Benötigt werden je nach Befehl unter anderem:

- Linux / Bash
- Git
- Python 3
- `zip`
- die lokale Projektumgebung des Maintainers
- für die automatische Formatierung die passende lokale Prettier-Umgebung

Unter Windows funktionieren diese `.sh`-Befehle nicht ohne eine zusätzliche Bash-Umgebung wie beispielsweise WSL oder Git Bash und sind dort nicht Teil des normalen Projektablaufs.

---

## 1. Nur Share-ZIP erstellen

```bash
./tools/share-zip.sh
```

Erstellt:

```text
share/PlanetZoo2-share.zip
```

Die Share-ZIP enthält die freigegebenen Projektdateien und kann zusätzlich sicheren Bot-Quellcode enthalten.

Nicht eingepackt werden insbesondere:

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

Damit dürfen Bot-Tokens und andere lokale Secrets nicht in der Share-ZIP landen.

---

## 2. Entwicklungsbranch committen und pushen

Dieser Befehl ist ausschließlich für einen Entwicklungsbranch gedacht, beispielsweise `dev`.

```bash
./tools/commit.sh "Commit-Titel" "Kurze Zusammenfassung"
```

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

Dieser Befehl übernimmt den Maintainer-Workflow für einen Merge des aktuellen Entwicklungsbranches nach `main`.

---

## 4. Commit und Merge zusammen

```bash
./tools/commit-und-merge.sh "Commit-Titel" "Kurze Zusammenfassung"
```

Dieser Befehl führt den Entwicklungscommit und anschließend den Merge nach `main` nacheinander aus.

---

# Discord-News: nur Maintainer-Infrastruktur

Im Repository befinden sich GitHub-Actions und Hilfsdateien für automatische Projekt-News auf dem privaten **Planet Zoo 2 Tools Discord-Server**.

Das bedeutet **nicht**, dass eine fremde Kopie des Projekts automatisch Nachrichten auf diesen Discord-Server senden kann.

Für die echte Discord-Anbindung werden private Zugangsdaten und Discord-IDs des Projektmaintainers benötigt. Lokal stehen sie in `bot/.env`:

```text
DISCORD_TOKEN=
GUILD_ID=
WELCOME_CHANNEL_ID=
ENTWICKLER_NEWS_ID=
UPDATES_ID=
```

Die lokale `bot/.env` wird **nicht** auf GitHub hochgeladen und **nicht** in die Share-ZIP gepackt. GitHub Actions kann deshalb diese lokale Datei nicht lesen. Für GitHub Actions werden dieselben Werte separat unter `Settings -> Secrets and variables -> Actions` hinterlegt:

- Secret `DISCORD_BOT_TOKEN` = derselbe Bot-Token wie lokal `DISCORD_TOKEN`
- Variable `GUILD_ID` = Server-ID
- Variable `ENTWICKLER_NEWS_ID` = Kanal-ID von `#entwicklung-news`
- Variable `UPDATES_ID` = Kanal-ID von `#updates`

Der Bot-Token wird **nicht** im Repository und **nicht** in der Share-ZIP veröffentlicht.

Auch wenn eine Share-ZIP sicheren Bot-Quellcode enthält, fehlen einem fremden Nutzer:

- der echte Bot-Token
- die privaten Discord-Berechtigungen
- der Zugriff auf den verwendeten Discord-Bot
- die GitHub-Secrets des Maintainers

Deshalb gilt für heruntergeladene oder geforkte Kopien:

```text
Die Webanwendung funktioniert unabhängig vom Discord-Bot.
Die automatische Discord-News-Funktion des Maintainers funktioniert dort nicht automatisch.
```

Die GitHub-Actions unter `.github/workflows/` sind Teil der Maintainer-Infrastruktur. Ohne eigene passende Discord-Konfiguration schlagen diese News-Schritte erwartungsgemäß fehl bzw. können keine Nachricht an den privaten Projektserver senden.

Weitere technische Informationen für den Maintainer stehen in:

```text
dokumentation/DISCORD-NEWS.md
```

---

## Sicherheit

Folgende Daten dürfen niemals veröffentlicht oder committed werden:

- Discord-Bot-Tokens
- `.env`-Dateien mit echten Zugangsdaten
- API-Schlüssel
- private Schlüsseldateien
- Passwörter

Der lokale Ordner `bot/` ist im normalen Git-Workflow bewusst ausgeschlossen. Das Share-Skript darf nur die dafür vorgesehenen sicheren Dateien übernehmen.

---

## Projektstatus

Das Projekt befindet sich weiterhin in Entwicklung. Einzelne Werkzeuge, Tierdaten oder Medien können unvollständig sein oder sich noch ändern.

Wenn etwas nicht funktioniert oder Daten fehlen, ist das nicht automatisch ein Fehler im Browser: Prüfe zuerst, ob die benötigten lokalen Medien vorhanden sind und ob der lokale Webserver läuft.

test
