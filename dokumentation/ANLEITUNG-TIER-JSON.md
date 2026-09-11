# Anleitung: Tier-JSON im Planet-Zoo-2-Projekt ausfüllen

Diese Datei beschreibt die aktuelle Tier-JSON-Struktur des Projekts und soll als Nachschlagewerk beim Eintragen neuer Tiere dienen.

Als Referenz für die **aktuell gültige Struktur** eignen sich besonders:

- `assets/daten/lebewesen/tiere/Loxodonta africana/Loxodonta africana.json`
- `assets/daten/lebewesen/tiere/Orycteropus afer/Orycteropus afer.json`
- `assets/daten/lebewesen/tiere/Panthera leo/Panthera leo.json`

> [!IMPORTANT]
> `assets/daten/lebewesen/tiere/1leeres Tier/leeres Tier.json` enthält beim **Nahrungsnetz noch die alte Struktur** mit `frisst` und `wirdGefressenVon`.
> Der aktuelle Code akzeptiert diese Struktur nicht mehr. Verwende für das Nahrungsnetz die Struktur aus Kapitel **8** dieser Anleitung.

---

## 1. Grundregeln

### JSON-Datentypen

| Schreibweise | Bedeutung | Beispiel |
|---|---|---|
| `"Text"` | Text | `"Löwe"` |
| `123` | Zahl | `415000` |
| `1.5` | Dezimalzahl | `7.6` |
| `true` / `false` | Ja/Nein | `true` |
| `null` | Wert derzeit nicht bekannt / nicht gesetzt | `null` |
| `[]` | Liste | `["africa", "asia"]` |
| `{}` | Objekt mit Unterfeldern | `{ "de": "Text" }` |

### Wichtig

- Zahlen **nicht** in Anführungszeichen schreiben.
- Unbekannte Zahlen als `null` eintragen und nicht als `0`.
- Listen dürfen mehrere Werte enthalten.
- Keine leeren Platzhalter wie `[""]` stehen lassen, wenn der Bereich bereits aktiv verwendet wird.
- `quelle` enthält normalerweise die **Quellen-ID**, nicht den ausgeschriebenen Namen.
- Jede verwendete Quellen-ID sollte unten unter `quellen` definiert sein.
- Interne Auswahlwerte immer exakt schreiben. Gross-/Kleinschreibung ist relevant.

---

# 2. Grundaufbau

```json
{
  "id": "",
  "identitaet": {},
  "filter": {},
  "daten": {},
  "systematik": {},
  "texte": {},
  "karte": {},
  "bilder": [],
  "audio": [],
  "video": [],
  "planetZoo2": {},
  "quellen": {}
}
```

---

# 3. `id` und `identitaet`

## `id`

Die `id` ist der wissenschaftliche Artname.

```json
"id": "Loxodonta africana"
```

Nicht den deutschen Namen verwenden.

## `identitaet.namen`

```json
"identitaet": {
  "namen": {
    "de": "Afrikanischer Savannenelefant",
    "en": "African Savanna Elephant",
    "en-US": "African Savanna Elephant",
    "es": "",
    "fr": "",
    "it": "",
    "pt-BR": "",
    "ja": "",
    "zh-Hans": ""
  }
}
```

### Sprachcodes

| Code | Sprache |
|---|---|
| `de` | Deutsch |
| `en` | Englisch |
| `en-US` | Englisch USA |
| `es` | Spanisch |
| `fr` | Französisch |
| `it` | Italienisch |
| `pt-BR` | Portugiesisch Brasilien |
| `ja` | Japanisch |
| `zh-Hans` | Chinesisch vereinfacht |

---

# 4. `filter`

Die Werte unter `filter` steuern die Filter auf `home.html` und `map.html`.

```json
"filter": {
  "edition": "standard",
  "gehegetyp": [
    "habitatTerrestrial"
  ],
  "kontinente": [
    "africa"
  ],
  "biome": [
    "Grasland",
    "Wüste"
  ],
  "schutzstatus": "endangered"
}
```

## 4.1 `edition`

**Genau einen Wert auswählen.**

| Anzeige | JSON-Wert |
|---|---|
| Basisspiel | `standard` |
| Deluxe | `deluxe` |

Beispiel:

```json
"edition": "standard"
```

---

## 4.2 `gehegetyp`

**Eine oder mehrere Angaben möglich.**

| Anzeige | JSON-Wert |
|---|---|
| Landgehege | `habitatTerrestrial` |
| Aquarium | `habitatAquarium` |
| Voliere | `habitatFlying` |
| Ausstellung | `exhibit` |

Beispiel:

```json
"gehegetyp": [
  "habitatTerrestrial"
]
```

Tier mit mehreren passenden Typen:

```json
"gehegetyp": [
  "habitatTerrestrial",
  "habitatAquarium"
]
```

---

## 4.3 `kontinente`

**Eine oder mehrere Angaben möglich.**

| Anzeige | JSON-Wert |
|---|---|
| Afrika | `africa` |
| Asien | `asia` |
| Europa | `europe` |
| Nordamerika | `northAmerica` |
| Südamerika | `southAmerica` |
| Ozeanien | `oceania` |

Beispiel:

```json
"kontinente": [
  "africa"
]
```

> Aktuell gibt es im Projektfilter noch keinen Wert für Antarktika.

---

## 4.4 `biome`

**Eine oder mehrere Angaben möglich.**

Hier müssen die Werte exakt so geschrieben werden wie im Filter.

| Biom | JSON-Wert |
|---|---|
| Ästuar | `Ästuar` |
| Feuchtgebiete | `Feuchtgebiete` |
| Gemässigt | `Gemäßigt` |
| Grasland | `Grasland` |
| Mangrove | `Mangrove` |
| Offenes Meer | `Offenes Meer` |
| Riff | `Riff` |
| Seen und Flüsse | `Seen und Flüsse` |
| Taiga | `Taiga` |
| Tropisch | `Tropisch` |
| Tundra | `Tundra` |
| Wüste | `Wüste` |

Beispiel:

```json
"biome": [
  "Feuchtgebiete",
  "Grasland",
  "Wüste"
]
```

> Achtung: `filter.biome` verwendet die **deutschen Filterwerte**. Das ist nicht dasselbe wie `daten.biome.werte[].wert`.

---

## 4.5 `schutzstatus`

**Genau einen Wert auswählen.**

| Anzeige | JSON-Wert |
|---|---|
| Nicht gefährdet | `leastConcern` |
| Potenziell gefährdet | `nearThreatened` |
| Gefährdet | `vulnerable` |
| Stark gefährdet | `endangered` |
| Vom Aussterben bedroht | `criticallyEndangered` |

Beispiel:

```json
"schutzstatus": "endangered"
```

Der gleiche interne Wert kann unter `daten.schutzstatus.werte[].wert` verwendet werden.

---

# 5. Allgemeine biologische Daten unter `daten`

Grundprinzip:

```json
"bereich": {
  "werte": [
    {
      "...": "...",
      "quelle": "quellenId"
    }
  ]
}
```

Mehrere Quellen oder unterschiedliche Angaben können als mehrere Objekte in `werte` eingetragen werden.

---

## 5.1 Taxonomie

```json
"taxonomie": {
  "werte": [
    {
      "reich": "Animalia",
      "stamm": "Chordata",
      "klasse": "Mammalia",
      "ordnung": "Proboscidea",
      "familie": "Elephantidae",
      "gattung": "Loxodonta",
      "art": "Loxodonta africana",
      "quelle": "animalDiversityWeb"
    }
  ]
}
```

Diese Felder sind **freie wissenschaftliche Angaben**, keine feste Auswahlliste.

---

## 5.2 Körperlänge / Schulterhöhe / Gewicht

Schema:

```json
{
  "typ": "weiblich",
  "min": 2.2,
  "max": 2.6,
  "einheit": "m",
  "quelle": "animalDiversityWeb"
}
```

### Im Projekt bereits verwendete `typ`-Werte

Diese Werte sind derzeit **nicht technisch als feste Enum erzwungen**, sollten aber möglichst einheitlich verwendet werden:

- `ausgewachsen`
- `weiblich`
- `maennlich`

### Einheiten

Bisher verwendet:

- Länge/Höhe: `m`
- Gewicht: `kg`

Wenn eine Quelle nur einen Wert nennt, kann je nach Datenbereich entweder `wert` verwendet werden oder `min` und `max` gleich gesetzt werden. Am bestehenden Schema des jeweiligen Bereichs orientieren.

---

## 5.3 Lebensspanne

Beispiele für `typ`:

- `wildbahn`
- `menschenobhut`

Beispiel Bereich:

```json
"lebensspanne": {
  "werte": [
    {
      "typ": "wildbahn",
      "min": 10,
      "max": 18,
      "einheit": "jahr",
      "quelle": "quelleId"
    }
  ]
}
```

Bei einer einzelnen Zahl ist in bestehenden Datensätzen auch `wert` vorhanden.

---

## 5.4 Geschwindigkeit

Im Projekt verwendet:

```json
{
  "typ": "hoechstgeschwindigkeit",
  "wert": 60,
  "einheit": "km/h",
  "quelle": "quelleId"
}
```

Falls kein belastbarer Wert vorhanden ist:

```json
{
  "typ": "hoechstgeschwindigkeit",
  "wert": null,
  "einheit": "km/h",
  "hinweis": {
    "de": "Für eine belastbare Höchstgeschwindigkeit wurde noch kein geeigneter Wert gefunden.",
    "en": "No reliable maximum-speed value has yet been found."
  },
  "quelle": ""
}
```

---

## 5.5 Schutzstatus als biologische Daten

```json
"schutzstatus": {
  "werte": [
    {
      "wert": "endangered",
      "system": "IUCN",
      "quelle": "iucn"
    }
  ]
}
```

Für `wert` möglichst dieselben internen Werte wie beim Filter verwenden:

- `leastConcern`
- `nearThreatened`
- `vulnerable`
- `endangered`
- `criticallyEndangered`

---

## 5.6 Wildpopulation

Mögliche Form mit Einzelwert:

```json
{
  "wert": 415000,
  "einheit": "individuum",
  "giltFuer": [
    "Loxodonta africana",
    "Loxodonta cyclotis"
  ],
  "jahrDerGrundlage": 2016,
  "hinweis": {
    "de": "...",
    "en": "..."
  },
  "quelle": "iucn"
}
```

Mögliche Form mit Bereich:

```json
{
  "wert": null,
  "min": 23000,
  "max": 39000,
  "einheit": "adultesIndividuum",
  "populationstrend": "decreasing",
  "jahrDerGrundlage": 2025,
  "hinweis": {
    "de": "...",
    "en": "..."
  },
  "quelle": "iucn"
}
```

Bisher verwendete `populationstrend`-Werte:

- `decreasing`
- `unknown`

Diese sind momentan keine technisch fest erzwungene Auswahlliste.

---

## 5.7 Geschlechtsreife

```json
"geschlechtsreife": {
  "werte": [
    {
      "typ": "weiblich",
      "wert": 11,
      "einheit": "jahr",
      "quelle": "quelleId"
    },
    {
      "typ": "maennlich",
      "wert": 20,
      "einheit": "jahr",
      "quelle": "quelleId"
    }
  ]
}
```

Übliche `typ`-Werte:

- `weiblich`
- `maennlich`

---

## 5.8 Tragzeit

Mehrere Einheiten dürfen als mehrere Einträge vorhanden sein.

```json
"tragzeit": {
  "werte": [
    {
      "wert": 7,
      "einheit": "monat",
      "quelle": "quelleId"
    },
    {
      "wert": 225,
      "einheit": "tag",
      "quelle": "quelleId"
    }
  ]
}
```

Bisher verwendete Einheiten:

- `monat`
- `tag`

---

## 5.9 Nachwuchs

```json
"nachwuchs": {
  "werte": [
    {
      "typ": "proGeburt",
      "min": 1,
      "max": 2,
      "durchschnitt": 1,
      "quelle": "quelleId"
    }
  ]
}
```

Bisher verwendeter `typ`:

- `proGeburt`

---

## 5.10 Soziale Struktur

```json
{
  "typ": "weibchenUndJungtiere",
  "wert": "matriarchalFamilyHerd",
  "minGruppengroesse": 6,
  "maxGruppengroesse": 70,
  "quelle": "quelleId"
}
```

`typ` und `wert` sind hier momentan **freie interne Bezeichnungen**. Neue Werte sollten camelCase geschrieben werden, wenn sie als interne Kennung gedacht sind.

Beispiele aus dem Projekt:

### `typ`

- `weibchenUndJungtiere`
- `adulteMaennchen`
- `erwachsene`
- `mutterMitJungtier`
- `rudel`
- `maennchen`

### `wert`

- `matriarchalFamilyHerd`
- `solitaryOrBachelorGroup`
- `solitary`
- `temporaryMotherYoungUnit`
- `pride`
- `maleCoalition`

---

## 5.11 Biome als reale biologische Daten

Nicht mit `filter.biome` verwechseln.

```json
"biome": {
  "werte": [
    {
      "wert": "savanna",
      "quelle": "quelleId"
    },
    {
      "wert": "grassland",
      "quelle": "quelleId"
    }
  ]
}
```

Bisher im Projekt verwendet:

- `savanna`
- `grassland`
- `woodland`
- `openWoodland`
- `forest`
- `floodplain`
- `desert`
- `semiArid`
- `dryThornForest`

Diese Liste ist **erweiterbar** und keine feste technische Auswahl.

---

## 5.12 Aktivität

```json
"aktivitaet": {
  "werte": [
    {
      "wert": "nocturnal",
      "beschreibung": {
        "de": "Nachtaktiv.",
        "en": "Nocturnal."
      },
      "quelle": "quelleId"
    }
  ]
}
```

Bisher verwendet:

- `nocturnal` = nachtaktiv
- `crepuscular` = dämmerungsaktiv
- `cathemeral` = über Tag und Nacht verteilt aktiv

Diese Werte sind momentan nicht technisch fest begrenzt.

---

# 6. Ernährung: `fressverhalten`

```json
"fressverhalten": {
  "werte": [
    {
      "wert": "herbivore",
      "quelle": "quelleId"
    }
  ]
}
```

Bisher verwendet:

- `herbivore`
- `carnivore`
- `insectivore`
- `myrmecophagous`
- `grazerAndBrowser`

Diese Liste ist erweiterbar.

---

# 7. Nahrungsnetz: wichtige feste Auswahlen

Das Nahrungsnetz hat mehrere **technisch geprüfte Auswahllisten**.

## 7.1 Aktuelle Grundstruktur

```json
"nahrungsnetz": {
  "jungtier": {
    "werte": []
  },
  "erwachsen": {
    "werte": []
  }
}
```

**Nicht mehr verwenden:**

```json
"frisst": {}
```

und

```json
"wirdGefressenVon": {}
```

Fressfeinde werden automatisch aus den anderen Tier-JSONs berechnet.

---

## 7.2 `typ`

Erlaubte Werte:

| Bedeutung | JSON-Wert |
|---|---|
| Tierische Nahrung / Beute | `tier` |
| Pflanzliche Nahrung | `pflanze` |
| Nutzung, z. B. Muttermilch | `nutzung` |
| Aas | `aas` |
| Giftige/toxische Beziehung | `giftig` |

---

## 7.3 Ökologische `beziehung`

Erlaubte Werte:

| Beziehung | JSON-Wert |
|---|---|
| Nutzung | `nutzung` |
| Prädation / Räuber–Beute | `praedation` |
| Herbivorie | `herbivorie` |
| Parasitismus | `parasitismus` |
| Parasitoidismus | `parasitoidismus` |
| Konkurrenz | `konkurrenz` |
| Mutualismus | `mutualismus` |
| Symbiose | `symbiose` |
| Kommensalismus | `kommensalismus` |
| Amensalismus | `amensalismus` |
| Neutralismus | `neutralismus` |
| Aas-/Nekrophagie | `nekrophagie` |
| Detritivorie | `detritivorie` |
| Kleptoparasitismus | `kleptoparasitismus` |
| Toxische Wirkung | `toxischeWirkung` |

---

## 7.4 `wirkung`

Die erste Position bezieht sich auf das **aktuelle Tier**, die zweite auf das **Ziel unter `wert`**.

Beispiel Löwe → Zebra:

```json
"wirkung": "+/-"
```

Der Löwe profitiert `+`, das Zebra wird geschädigt `-`.

Erlaubte Werte insgesamt:

- `+/-`
- `-/+`
- `-/-`
- `+/+`
- `+/0`
- `0/+`
- `-/0`
- `0/-`
- `0/0`

### Welche Wirkung passt zu welcher Beziehung?

| Beziehung | Erlaubte Wirkung |
|---|---|
| `nutzung` | `+/0`, `0/+` |
| `praedation` | `+/-`, `-/+` |
| `herbivorie` | `+/-`, `-/+` |
| `parasitismus` | `+/-`, `-/+` |
| `parasitoidismus` | `+/-`, `-/+` |
| `konkurrenz` | `-/-` |
| `mutualismus` | `+/+` |
| `symbiose` | `+/+` |
| `kommensalismus` | `+/0`, `0/+` |
| `amensalismus` | `-/0`, `0/-` |
| `neutralismus` | `0/0` |
| `nekrophagie` | `+/0`, `0/+` |
| `detritivorie` | `+/0`, `0/+` |
| `kleptoparasitismus` | `+/-`, `-/+` |
| `toxischeWirkung` | `-/0`, `0/-` |

---

## 7.5 `bedingung`

`bedingung.selbst` und `bedingung.ziel` müssen **immer Arrays** sein.

Keine Bedingung:

```json
"bedingung": {
  "selbst": [],
  "ziel": []
}
```

Mit Bedingung:

```json
"bedingung": {
  "selbst": [
    "bisEtwa3Monate"
  ],
  "ziel": []
}
```

Diese Bedingungen sind freie interne Kennungen.

Bisher verwendet wurden z. B.:

- `calf`
- `bisEtwa3Monate`
- `abEtwa3Monaten`
- `bisEtwa6Monate`
- `increasingWithAge`
- `jungtier`

---

## 7.6 Beispiel Tier / Beute

```json
{
  "wert": "Orycteropus afer",
  "typ": "tier",
  "beziehung": "praedation",
  "wirkung": "+/-",
  "bedingung": {
    "selbst": [],
    "ziel": []
  },
  "quelle": "quelleId"
}
```

Wenn das Ziel ein Tier aus dem Projekt ist, bei `wert` möglichst dessen wissenschaftliche `id` verwenden.

---

## 7.7 Beispiel Pflanze

```json
{
  "wert": "grass",
  "typ": "pflanze",
  "beziehung": "herbivorie",
  "wirkung": "+/-",
  "bedingung": {
    "selbst": [],
    "ziel": []
  },
  "quelle": "quelleId"
}
```

---

## 7.8 `typ: "nutzung"`

Bei `nutzung` ist zusätzlich ein `nutzung`-Objekt Pflicht.

```json
{
  "wert": "muttermilch",
  "typ": "nutzung",
  "beziehung": "nutzung",
  "wirkung": "+/0",
  "bedingung": {
    "selbst": [
      "calf"
    ],
    "ziel": []
  },
  "nutzung": {
    "art": "nahrung",
    "haeufigkeit": "Menge: keine genaue Angabe | Häufigkeit: keine genaue Angabe | Zeitraum: Jungtierphase"
  },
  "quelle": "quelleId"
}
```

### `nutzung.haeufigkeit` hat ein festes Textformat

```text
Menge: ... | Häufigkeit: ... | Zeitraum: ...
```

Es müssen genau diese drei Teile vorhanden sein.

Beispiel:

```text
Menge: 2-4 l/Fütterung | Häufigkeit: 8-12x/Tag | Zeitraum: bis etwa 6 Monate
```

`nutzung.art` ist momentan freier Text. Bisher verwendet: `nahrung`.

---

## 7.9 `typ: "aas"`

Bei Aas ist zusätzlich `aas.zustand` Pflicht.

```json
{
  "wert": "aas",
  "typ": "aas",
  "beziehung": "nekrophagie",
  "wirkung": "+/0",
  "bedingung": {
    "selbst": [],
    "ziel": []
  },
  "aas": {
    "zustand": "frisch bis etwa 2 Wochen alt"
  },
  "quelle": "quelleId"
}
```

`aas.zustand` ist freier Text.

---

## 7.10 Gift

Bei `typ: "giftig"` gilt:

- `gift.relevant` muss `true` sein.
- `gift.giftweg` muss mindestens einen Eintrag enthalten.

Grundschema:

```json
"gift": {
  "relevant": true,
  "giftweg": [
    "aufnahme"
  ],
  "toleranz": "",
  "umgang": {
    "aktion": "",
    "zeitpunkt": ""
  },
  "nachUmgangNutzbar": null,
  "hinweis": {
    "de": "",
    "en": ""
  }
}
```

### `gift.relevant`

Erlaubt:

- `true`
- `false`

Bei `typ: "giftig"` muss es `true` sein.

### `gift.nachUmgangNutzbar`

Erlaubt:

- `true`
- `false`
- `null`

`giftweg`, `toleranz`, `aktion` und `zeitpunkt` haben derzeit keine feste technische Auswahlliste.

---

# 8. Systematik und Evolution

## 8.1 `naheVerwandte`

```json
"naheVerwandte": [
  {
    "id": "Loxodonta cyclotis",
    "beziehung": "schwesterart",
    "deutscherName": "Afrikanischer Waldelefant",
    "quelle": "quelleId"
  }
]
```

`beziehung` ist hier momentan freier interner Text.

Bisher verwendet wurden unter anderem:

- `schwesterart`
- `naheLebendeVerwandtschaft`
- `ausgestorbenerElephantide`
- `pantheraVerwandtschaft`
- `engePantheraVerwandtschaft`
- `afrotheriaVerwandtschaft`
- `afroinsectiphiliaVerwandtschaft`

---

## 8.2 Evolutions-Knoten

Mindestens ein Knoten ist für das Systematik-Werkzeug erforderlich.

Pflichtfelder eines Knotens:

- `id`
- `rang`
- `name`
- `quelle`

Beispiel:

```json
{
  "id": "elephantidae",
  "rang": "familie",
  "name": "Elephantidae",
  "quelle": "animalDiversityWeb"
}
```

### `rang`

Der Rang ist derzeit technisch nur als nicht-leerer Text geprüft.

Im Projekt wurden bisher verwendet:

- `ueberordnung`
- `ordnung`
- `klade`
- `familie`
- `unterfamilie`
- `gattung`
- `art`

---

## 8.3 `lebensstatus`

Falls das Feld vorhanden ist, sind nur diese Werte erlaubt:

- `lebend`
- `ausgestorben`
- `null`

Beispiel:

```json
"lebensstatus": "ausgestorben"
```

---

## 8.4 `domestikationsstatus`

Falls vorhanden:

- `wildform`
- `domestiziert`
- `null`

---

## 8.5 `spiele`

Erlaubte Werte:

- `planetZoo2`
- `jurassicWorldEvolution1`
- `jurassicWorldEvolution2`
- `jurassicWorldEvolution3`

Beispiel:

```json
"spiele": [
  "planetZoo2"
]
```

---

## 8.6 `position`

Optional.

Muss als Text im Format `Zahl.Zahl` geschrieben werden.

Gültig:

```json
"position": "2.4"
```

Ungültig:

```json
"position": 2.4
```

oder

```json
"position": "2"
```

---

## 8.7 Aufspaltungen

```json
{
  "linieA": "Loxodonta",
  "linieB": "Elephas + Mammuthus",
  "zeitVorHeuteMioJahre": 7.6,
  "typ": "ungefaehreDivergenz",
  "quelle": "quelleId"
}
```

`typ` ist bei Aufspaltungen aktuell freier Text. Im Projekt wird `ungefaehreDivergenz` verwendet.

---

## 8.8 Explizite Verbindungen

Für `systematik.evolution.verbindungen[].typ` gibt es eine feste Auswahl:

- `abstammungslinie`
- `aufspaltung`
- `domestikation`
- `wildform`
- `naheVerwandtschaft`
- `unsichereVerwandtschaft`

Beispiel:

```json
{
  "von": "knoten-a",
  "nach": "knoten-b",
  "typ": "naheVerwandtschaft",
  "hinweis": {
    "de": "",
    "en": ""
  },
  "quelle": "quelleId"
}
```

---

# 9. Texte

Die Hauptbereiche sind:

- `vorkommen`
- `uebersicht`
- `arterhaltung`
- `sozialverhaltenUndFortpflanzung`
- `tierfakten`
- `entwicklungshinweis`

Beispiel:

```json
"uebersicht": {
  "de": [
    {
      "inhalt": "Deutscher Text ...",
      "quelle": "quelleId",
      "uebersetzung": "ChatGPT"
    }
  ],
  "en": [
    {
      "inhalt": "English text ...",
      "quelle": "quelleId"
    }
  ]
}
```

### Regeln

- Pro Sprache steht eine Liste `[]`.
- Mehrere getrennte Aussagen/Quellen können mehrere Einträge bekommen.
- `inhalt` = eigentlicher Text.
- `quelle` = Quellen-ID.
- `uebersetzung` = nur nötig, wenn der Text übersetzt wurde bzw. die Herkunft der Übersetzung festgehalten werden soll.
- Bei Originalsprache Englisch ist `uebersetzung` normalerweise nicht nötig.

Für Infotafel-Prüfung werden insbesondere diese Bereiche erwartet:

- `uebersicht`
- `vorkommen`
- `arterhaltung`
- `sozialverhaltenUndFortpflanzung`
- `tierfakten`

---

# 10. Karte

```json
"karte": {
  "url": "https://...",
  "dateien": [
    {
      "typ": "original",
      "dateityp": "png",
      "pfad": "assets/daten/lebewesen/tiere/.../map/...png"
    },
    {
      "typ": "wiedergabe",
      "dateityp": "svg",
      "pfad": "assets/daten/lebewesen/tiere/.../map/...svg"
    }
  ],
  "quelle": "planetZoo2"
}
```

### Wichtig für die Map

Die Prüfung sucht eine **PNG-Datei mit Pfad**.

Empfohlene `typ`-Werte für Dateien:

- `original`
- `wiedergabe`

Aktuell:

- PNG = Quelle/Standard
- SVG = optionale Wiedergabevariante

---

# 11. Bilder

Beispiel:

```json
"bilder": [
  {
    "typ": "hauptbild",
    "varianten": [
      {
        "variante": 1,
        "quelle": "planetZoo2",
        "url": "https://...",
        "alt": {
          "de": "Afrikanischer Savannenelefant",
          "en": "African savanna elephant"
        },
        "beschreibung": {
          "de": "...",
          "en": "..."
        },
        "metadaten": [],
        "dateien": [
          {
            "typ": "original",
            "dateityp": "webp",
            "pfad": "assets/.../bild.webp"
          }
        ]
      }
    ]
  }
]
```

Im Projekt bisher verwendete Bildgruppen:

- `hauptbild`
- `echtbild`

Diese Gruppen sind momentan keine feste Enum und können bei Bedarf erweitert werden.

`variante` ist eine laufende Zahl: `1`, `2`, `3`, ...

---

# 12. Audio

```json
"audio": [
  {
    "typ": "Grollen",
    "varianten": [
      {
        "variante": 1,
        "quelle": "Tierstimmenarchiv",
        "metadaten": [
          {
            "typ": "quelle",
            "format": "animalSoundArchive",
            "pfad": "assets/.../animal_sound_archive.json"
          }
        ],
        "dateien": [
          {
            "typ": "original",
            "dateityp": "flac",
            "pfad": "assets/.../aufnahme.flac"
          },
          {
            "typ": "wiedergabe",
            "dateityp": "mp3",
            "pfad": "assets/.../aufnahme.mp3"
          }
        ]
      }
    ]
  }
]
```

### `audio[].typ`

Freie Bezeichnung des Lauttyps, z. B.:

- `Grollen`
- `Trompetenruf`

### Dateitypen

Das Projekt sucht eine abspielbare Datei und priorisiert geeignete Wiedergabedateien.

Empfohlene Datei-`typ`-Werte:

- `original`
- `wiedergabe`

Bisher verwendete Audioformate:

- `flac`
- `wav`
- `mp3`

Für den Browser ist `mp3` als `wiedergabe` besonders geeignet.

### Tierstimmenarchiv-Metadaten

Aktuell verwendet:

```json
{
  "typ": "quelle",
  "format": "animalSoundArchive",
  "pfad": ".../animal_sound_archive.json"
}
```

---

# 13. Video / Kino

```json
"video": [
  {
    "typ": "dokumentation",
    "varianten": [
      {
        "variante": 1,
        "reihe": "Go Wild",
        "titel": {
          "de": "Go Wild – Afrikanischer Savannenelefant",
          "en": "Go Wild – African Savanna Elephant"
        },
        "quelle": "goWild",
        "url": "",
        "metadaten": [],
        "dateien": [
          {
            "typ": "original",
            "dateityp": "mkv",
            "pfad": "assets/.../1.mkv"
          },
          {
            "typ": "wiedergabe",
            "dateityp": "mp4",
            "pfad": "assets/.../1.mp4"
          }
        ],
        "dauerSekunden": null,
        "beschreibung": {
          "de": "...",
          "en": "..."
        }
      }
    ]
  }
]
```

Im Projekt verwendete Videogruppen:

- `dokumentation`
- `verhaltensarchiv`

Diese Gruppen sind derzeit frei erweiterbar.

Empfohlene Datei-`typ`-Werte:

- `original`
- `wiedergabe`

Beispiel:

- MKV = `original`
- MP4 = `wiedergabe`

`dauerSekunden`:

- Zahl, wenn bekannt
- `null`, wenn noch unbekannt

---

# 14. `planetZoo2.rechner`

Solange die Rechnerdaten noch nicht vorhanden sind:

```json
"planetZoo2": {
  "rechner": null
}
```

Die Rechnerprüfung zeigt das Tier dann absichtlich als noch unvollständig an.

---

# 15. Quellen

Jede Quelle bekommt eine **eindeutige Quellen-ID**.

Beispiel:

```json
"quellen": {
  "iucn": {
    "name": "IUCN – African Savanna Elephant",
    "seiten": {
      "en": "https://..."
    }
  },
  "Tierstimmenarchiv": {
    "name": "Tierstimmenarchiv – Museum für Naturkunde Berlin",
    "seiten": {
      "de": "https://..."
    }
  }
}
```

Dann wird in den eigentlichen Daten nur die ID verwendet:

```json
"quelle": "iucn"
```

### Quellen-ID-Regel

Gut:

```json
"animalDiversityWeb"
```

```json
"sanDiegoZoo"
```

```json
"planetZoo2"
```

Nicht nötig:

```json
"quelle": "https://komplette-url..."
```

Die URL gehört unter `quellen -> Quellen-ID -> seiten`.

### Mögliche Quellen-Metadaten

```json
{
  "name": "...",
  "typ": "...",
  "seiten": {
    "de": "...",
    "en": "..."
  },
  "status": "..."
}
```

`typ` ist bei Quellen derzeit frei. Im Projekt kommen z. B. vor:

- `spielreferenz`
- `buch`
- `fachpublikation`
- `wissenschaftlichePublikation`
- `projektintern`
- `dokumentation`

---

# 16. Schnellreferenz: feste Auswahllisten

## Filter

### `filter.edition`

```text
standard
deluxe
```

### `filter.gehegetyp[]`

```text
habitatTerrestrial
habitatAquarium
habitatFlying
exhibit
```

### `filter.kontinente[]`

```text
africa
asia
europe
northAmerica
southAmerica
oceania
```

### `filter.biome[]`

```text
Ästuar
Feuchtgebiete
Gemäßigt
Grasland
Mangrove
Offenes Meer
Riff
Seen und Flüsse
Taiga
Tropisch
Tundra
Wüste
```

### `filter.schutzstatus`

```text
leastConcern
nearThreatened
vulnerable
endangered
criticallyEndangered
```

---

## Nahrungsnetz

### `typ`

```text
tier
pflanze
nutzung
aas
giftig
```

### `beziehung`

```text
nutzung
praedation
herbivorie
parasitismus
parasitoidismus
konkurrenz
mutualismus
symbiose
kommensalismus
amensalismus
neutralismus
nekrophagie
detritivorie
kleptoparasitismus
toxischeWirkung
```

### `wirkung`

```text
+/-
-/+
-/-
+/+
+/0
0/+
-/0
0/-
0/0
```

---

## Systematik

### `lebensstatus`

```text
lebend
ausgestorben
```

### `domestikationsstatus`

```text
wildform
domestiziert
```

### `spiele[]`

```text
planetZoo2
jurassicWorldEvolution1
jurassicWorldEvolution2
jurassicWorldEvolution3
```

### `verbindungen[].typ`

```text
abstammungslinie
aufspaltung
domestikation
wildform
naheVerwandtschaft
unsichereVerwandtschaft
```

---

# 17. Minimaler Arbeitsablauf pro neuem Tier

1. Ordner mit wissenschaftlichem Namen anlegen.
2. JSON-Datei ebenfalls mit wissenschaftlichem Namen benennen.
3. `id` eintragen.
4. Tiernamen unter `identitaet.namen` eintragen.
5. Alle `filter`-Werte anhand der festen Tabellen auswählen.
6. Zuerst Daten aus der aktuell bearbeiteten Quelle eintragen.
7. Bei jedem Dateneintrag die passende `quelle` setzen.
8. Quelle unten unter `quellen` definieren.
9. Nahrungsnetz nur mit der **neuen Struktur `jungtier` / `erwachsen`** pflegen.
10. Karte/Bilder/Audio/Video ergänzen, sobald die jeweilige Quelle bearbeitet wird.
11. `planetZoo2.rechner` darf bis zu den Spielwerten `null` bleiben.
12. Tier zusätzlich in `assets/daten/lebewesen/tiere/datenImport.js` eintragen, damit es geladen wird.

---

# 18. Beispiel: Start eines neuen Tieres

```json
{
  "id": "Panthera leo",
  "identitaet": {
    "namen": {
      "de": "Löwe",
      "en": "Lion",
      "en-US": "Lion",
      "es": "",
      "fr": "",
      "it": "",
      "pt-BR": "",
      "ja": "",
      "zh-Hans": ""
    }
  },
  "filter": {
    "edition": "standard",
    "gehegetyp": [
      "habitatTerrestrial"
    ],
    "kontinente": [
      "africa"
    ],
    "biome": [
      "Grasland",
      "Wüste"
    ],
    "schutzstatus": "vulnerable"
  },
  "daten": {
    "ernaehrung": {
      "nahrungsnetz": {
        "jungtier": {
          "werte": []
        },
        "erwachsen": {
          "werte": []
        }
      }
    }
  },
  "planetZoo2": {
    "rechner": null
  },
  "quellen": {}
}
```

Dieses Beispiel ist absichtlich nur ein Startgerüst. Für ein fertiges Tier werden die übrigen Datenbereiche ergänzt.

---

# 19. Merksatz

Wenn ein Feld eine **feste Auswahl** hat, verwende exakt den internen Wert aus dieser Anleitung.

Wenn ein Feld **frei** ist, verwende möglichst bereits bestehende Schreibweisen des Projekts, damit später nicht mehrere Bezeichnungen für dieselbe Sache entstehen.
