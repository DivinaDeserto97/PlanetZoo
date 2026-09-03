Lokale Medien einfügen

Aus Lizenzgründen sind Bilder, Kartenbilder und Audiodateien nicht im GitHub-Repository enthalten.

Nach dem Klonen des Projekts müssen diese Dateien lokal ergänzt werden.

Die benötigte Ordnerstruktur ist bereits im Repository vorhanden.

1. Tierbilder

Tierbilder gehören in den jeweiligen bilder-Ordner des Tieres.

Beispiel:

assets/
└── daten/
    └── tiere/
        └── Eunectes notaeus/
            └── bilder/
                └── Eunectes notaeus.webp

Für die Gelbe Anakonda lautet der erwartete Pfad:

assets/daten/tiere/Eunectes notaeus/bilder/Eunectes notaeus.webp

Der Dateiname muss mit dem Pfad in der jeweiligen Tier-JSON übereinstimmen.

Beispiel:

"bilder": [
    {
        "typ": "hauptbild",
        "pfad": "assets/daten/tiere/Eunectes notaeus/bilder/Eunectes notaeus.webp",
        "quelle": "planetZoo2"
    }
]

2. Verbreitungskarten der Tiere

Die Verbreitungskarte eines Tieres liegt direkt im Tierordner.

Beispiel:

assets/
└── daten/
    └── tiere/
        └── Eunectes notaeus/
            ├── Eunectes notaeus.json
            └── Eunectes notaeus map.png

Für die Gelbe Anakonda lautet der erwartete Pfad:

assets/daten/tiere/Eunectes notaeus/Eunectes notaeus map.png

In der JSON-Datei muss derselbe Pfad eingetragen sein:

"karte": {
    "pfad": "assets/daten/tiere/Eunectes notaeus/Eunectes notaeus map.png",
    "quelle": "planetZoo2"
}

3. Weltkarten-Referenz

Die gemeinsame Weltkarte benötigt eine lokale Referenzdatei.

Diese gehört nach:

assets/
└── daten/
    └── Weltkarte/
        └── Weltkartenreferenz_map.png

Der vollständige Pfad lautet:

assets/daten/Weltkarte/Weltkartenreferenz_map.png

Diese Datei wird vom Karten-Renderer als Basis für die Weltkarte verwendet.

4. Audiodateien

Audiodateien gehören in einen eigenen audio-Ordner innerhalb des jeweiligen Tierordners.

Beispiel:

assets/
└── daten/
    └── tiere/
        └── Eunectes notaeus/
            └── audio/
                └── ruf.mp3

Beispiel für den JSON-Eintrag:

"audio": [
    {
        "typ": "ruf",
        "pfad": "assets/daten/tiere/Eunectes notaeus/audio/ruf.mp3",
        "quelle": "tierstimmenarchiv"
    }
]

Falls noch kein audio-Ordner vorhanden ist, kann er einfach erstellt werden.

5. Neue Tierart hinzufügen

Für jede neue Tierart wird ein eigener Ordner erstellt.

Beispiel:

assets/daten/tiere/Asio otus/

Empfohlene Struktur:

Asio otus/
├── bilder/
│   └── Asio otus.webp
│
├── audio/
│   └── ruf.mp3
│
├── Asio otus map.png
└── Asio otus.json

Danach muss die JSON-Datei in datenImport.js eingetragen werden.

Beispiel:

const TIER_JSON_DATEIEN = [
    "assets/daten/tiere/Eunectes notaeus/Eunectes notaeus.json",
    "assets/daten/tiere/Asio otus/Asio otus.json"
];

6. Quellen

Die Quelle eines Mediums wird nicht über den Ordnernamen festgelegt, sondern direkt in der Tier-JSON gespeichert.

Beispiel Bild:

{
    "pfad": "assets/daten/tiere/Eunectes notaeus/bilder/Eunectes notaeus.webp",
    "quelle": "planetZoo2"
}

Beispiel Audio:

{
    "pfad": "assets/daten/tiere/Eunectes notaeus/audio/ruf.mp3",
    "quelle": "tierstimmenarchiv"
}

Damit können Bilder und Audiodateien aus verschiedenen Quellen gemeinsam verwendet werden.

7. GitHub

Die Mediendateien sind absichtlich über .gitignore ausgeschlossen.

Nicht hochgeladen werden unter anderem:

.png
.jpg
.jpeg
.webp
.gif
.mp3
.wav
.ogg
.flac
.m4a
.aac

Die Dateien bleiben daher nur lokal auf dem eigenen Rechner.

Die .gitkeep-Dateien sorgen dafür, dass wichtige leere Ordner trotzdem auf GitHub vorhanden bleiben.

Beispiel: Gelbe Anakonda vollständig

Nach dem Einfügen der lokalen Medien sollte der Ordner so aussehen:

assets/
└── daten/
    ├── tiere/
    │   └── Eunectes notaeus/
    │       ├── bilder/
    │       │   ├── .gitkeep
    │       │   └── Eunectes notaeus.webp
    │       │
    │       ├── audio/
    │       │   └── ruf.mp3
    │       │
    │       ├── Eunectes notaeus map.png
    │       └── Eunectes notaeus.json
    │
    └── Weltkarte/
        ├── .gitkeep
        └── Weltkartenreferenz_map.png

Die JSON- und JavaScript-Dateien befinden sich im Repository.

Die Bilder, Karten und Audiodateien müssen lokal ergänzt werden.
---

## 8. Zentrale Tierauswahl

Die Tierauswahl wird nicht pro Seite separat verwaltet.

Sie liegt zentral in:

```text
assets/js/features/tierAuswahl.js
```

Gespeichert werden nur die internen Tier-IDs in `localStorage` unter:

```text
planetZoo2-tierAuswahl
```

Dadurch bleibt dieselbe Auswahl beim Wechsel zwischen diesen Seiten erhalten:

- Home / Zoopedia
- Karte
- Infotafel
- Rechner

Die Fußnavigation liegt in:

```text
assets/components/footer/
├── footer.html
├── footer.css
└── footer.js
```

Die Auswahl wird bereits beim Anklicken eines Tieres gespeichert. Beim anschließenden Wechsel über die Fußnavigation ist daher keine zusätzliche Übergabe per URL notwendig.

## 9. Aktuelle Test-Tiere

Für den Aufbau sind momentan drei Tierarten in `datenImport.js` eingetragen:

```text
Eunectes notaeus   = Gelbe Anakonda
Equus quagga       = Steppenzebra
Aquila chrysaetos  = Steinadler
```

Die Gelbe Anakonda besitzt im lokalen Projekt bereits ein Tierbild und eine Verbreitungskarte.

Für Steppenzebra und Steinadler sind die JSON-Daten angelegt. Lokale Bilder und Verbreitungskarten können später ergänzt werden. Die Oberfläche zeigt bis dahin automatisch einen Platzhalter und die Auswahl funktioniert trotzdem.

## 10. Home / Zoopedia

`pages/home.html` ist die zentrale Tierauswahl.

Die Daten kommen ausschließlich über:

```text
assets/daten/tiere/datenImport.js
```

Aktuell verfügbare Filter:

- Suche nach Tiername oder wissenschaftlichem Namen
- Gehegetyp
- Region
- Arterhaltungsstatus
- Inhalt / Edition

Mehrere Tiere können gleichzeitig ausgewählt werden.

## 11. Infotafel

Die Infotafel befindet sich in:

```text
pages/infotafel.html
assets/js/infotafel/infotafel.js
assets/css/infotafel/infotafel.css
```

Für jedes ausgewählte Tier wird eine eigene Tafel erzeugt. Bei mehreren Tieren werden die Tafeln als Vergleich nebeneinander dargestellt, soweit die Bildschirmbreite dies erlaubt.

Angezeigt werden derzeit:

- Name und wissenschaftlicher Name
- Gehegetyp
- Region
- Arterhaltungsstatus
- Edition
- Körperlänge
- Gewicht
- Übersicht
- Vorkommen
- Arterhaltung
- Sozialverhalten und Fortpflanzung
- Tierfakten

## 12. Übersetzungen

Statische Oberflächentexte werden direkt im HTML über `data-*`-Attribute gepflegt.

Beispiel:

```html
<span
  data-i18n
  data-de="Karte"
  data-en="Map"
  data-fr="Carte"
>
  Karte
</span>
```

Dynamische Tiernamen und Tiertexte bleiben in der jeweiligen Tier-JSON.

Die gemeinsame Sprachlogik liegt in:

```text
assets/js/features/language.js
```

Unterstützte Sprachcodes:

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

Für vereinfachtes Chinesisch wird im Projekt einheitlich `zh-Hans` verwendet.
