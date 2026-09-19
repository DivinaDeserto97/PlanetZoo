# Planet Zoo 2 – Tierdaten-Checkliste

**Stand:** 11.09.2026  
**Zoopedia-Bestand:** 104 aktuell bekannte/gelistete Tiere  
**Projektstand:** Der Bereich `planetZoo2.rechner` ist absichtlich **nicht** Teil dieser Checkliste, weil der Rechner noch nicht fertig ist.

> Arbeitsprinzip: **Quelle für Quelle durch alle Tiere**, nicht Tier für Tier durch alle Quellen.  
> Reihenfolge: **1. Zoopedia → 2. Tierstimmenarchiv → 3. Go Wild → 4. Mission Wildnis → 5. weitere Quellen**.

## Statuszeichen

- `[ ]` = noch offen
- `[x]` = erledigt
- `n/a` = für dieses Tier / diese Quelle nicht vorhanden oder nicht sinnvoll
- Bei Unsicherheit **nicht raten**, sondern offen lassen und später mit einer besseren Quelle ergänzen.

## Datenblöcke des Projekts

| Kürzel | Projektbereich                  | Enthaltene Daten                                                                                   |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ID`   | `id` + `identitaet.namen`       | wissenschaftliche ID / Namen in allen Projektsprachen                                              |
| `FIL`  | `filter`                        | Edition, Gehegetyp, Kontinente, Biome, Schutzstatus                                                |
| `TAX`  | `daten.taxonomie`               | Reich, Stamm, Klasse, Ordnung, Familie, Gattung, Art                                               |
| `MOR`  | Körperdaten                     | Körperlänge, Schulterhöhe, Gewicht, Geschwindigkeit                                                |
| `LEB`  | Lebensdaten                     | Lebensspanne, Schutzstatus, Wildpopulation                                                         |
| `REP`  | Fortpflanzung                   | Geschlechtsreife, Tragzeit, Nachwuchs                                                              |
| `SOZ`  | Verhalten                       | soziale Struktur, Biome, Aktivität                                                                 |
| `ERN`  | Ernährung                       | Fressverhalten; **Nahrungsnetz separat**                                                           |
| `NN`   | `daten.ernaehrung.nahrungsnetz` | Jungtier/Erwachsen, frisst / wird gefressen, Beziehungen                                           |
| `SYS`  | `systematik`                    | nahe Verwandte, Evolution, Knoten, Aufspaltungen, Verbindungen                                     |
| `TXT`  | `texte`                         | Vorkommen, Übersicht, Arterhaltung, Sozialverhalten/Fortpflanzung, Tierfakten, Entwicklungshinweis |
| `MAP`  | `karte`                         | Verbreitungskarte, Datei, URL, Quelle                                                              |
| `IMG`  | `bilder`                        | Hauptbild/Varianten, Dateien, Alt-Text, Metadaten                                                  |
| `AUD`  | `audio`                         | Lauttypen, Varianten, Audiodateien, Metadaten                                                      |
| `VID`  | `video`                         | Doku/Verhaltensvideo, Reihe, Titel, Datei, Dauer, Beschreibung                                     |
| `SRC`  | `quellen`                       | Quellenobjekt und korrekte Quellen-IDs                                                             |

## Welche Quelle soll was liefern?

| Quelle                    | Zuerst prüfen / übernehmen                                                                                          | Nicht erzwingen                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Planet Zoo 2 Zoopedia** | `ID`, `FIL`, `TAX`, `MOR`, `LEB`, `REP`, `SOZ`, `ERN`, `TXT`, `MAP`, `IMG`, `SRC` – jeweils nur wenn dort vorhanden | `AUD`, `VID`, vollständiges `SYS`/`NN`, Rechner                      |
| **Tierstimmenarchiv**     | `AUD`, Audio-Metadaten, `SRC`; ggf. Lauttyp/Beschreibung                                                            | fehlende Biologie nicht aus dem Audiotitel ableiten                  |
| **Go Wild**               | `VID`, Doku-Metadaten, `SRC`; belegte Fakten dürfen zusätzlich in passende Daten-/Textfelder                        | keine unbelegten Aussagen aus Bildern ableiten                       |
| **Mission Wildnis**       | `VID`, Doku-Metadaten, `SRC`; belegte Fakten dürfen zusätzlich übernommen werden                                    | wie bei Go Wild                                                      |
| **Weitere Quellen**       | Lücken in `SYS`, `NN`, Daten, Texten, Karte und Medien gezielt schließen                                            | nicht mehrere Quellen vermischen, ohne `quelle` am Eintrag zu setzen |

## 1. Master-Checkliste – Quellenreihenfolge

Diese Tabelle ist deine Hauptliste. Du kannst zuerst die komplette Spalte **Zoopedia** von oben nach unten abarbeiten, danach **Tierstimmenarchiv**, dann **Go Wild** usw.

|   # | Tier (Zoopedia)                 | Gehegetyp                | Edition    | JSON / Projekt-ID        | Zoopedia | Tierstimmenarchiv | Go Wild | Mission Wildnis | SYS | NN  | weitere Quellen | final |
| --: | ------------------------------- | ------------------------ | ---------- | ------------------------ | :------: | :---------------: | :-----: | :-------------: | :-: | :-: | :-------------: | :---: |
|   1 | Aardvark                        | `Landgehege`             | `Standard` | [x] `Orycteropus afer`   |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   2 | Afrikan Leopard                 | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   3 | Afrikan Penguin                 | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   4 | Afrikan Savannah Elephant       | `Landgehege`             | `Standard` | [x] `Loxodonta africana` |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   5 | Afrikan Tigerfish               | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   6 | American Bullfrog               | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   7 | Asian Elephant                  | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   8 | Axolotl                         | `Ausstellung`            | `Deluxe`   | []                       |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|   9 | Black Wildebeest                | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  10 | Blackspotted Puffer             | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  11 | Blacktip Reef Shark             | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  12 | Blue and Gold Fusilier          | `Aquarium + Ausstellung` | `Deluxe`   | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  13 | Blue Wildebeest                 | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  14 | Bluespine Unicornfish           | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  15 | Blunthead Cichlid               | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  16 | Boa Constrictor                 | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  17 | Boeseman's Rainbowfish          | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  18 | Brown Trout                     | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  19 | Cape Buffalo                    | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  20 | Cloudless Sulphur               | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  21 | Clown Loach                     | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  22 | Clown Triggerfish               | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  23 | Common Bluetongue               | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  24 | Common Hippopotamus             | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  25 | Common Rudd                     | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  26 | Danube Crested Newt             | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  27 | Desert Horned Viper             | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  28 | Diamondback Terrapin            | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  29 | Dolphinfish                     | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  30 | Eastern Brown Snake             | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  31 | EurAsienn Beaver                | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  32 | EurAsienn Bittern               | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  33 | EurAsienn Brown Bear            | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  34 | EurAsienn Lynx                  | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  35 | European Bison                  | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  36 | European Peacock                | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  37 | Fire Salamander                 | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  38 | Galápagos Giant Tortoise        | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  39 | Gemsbok                         | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  40 | Gharial                         | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  41 | Giant Malaysian Leaf Insect     | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  42 | Giant Slippery Frog             | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  43 | Giant Tiger Land Snail          | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  44 | Gila Monster                    | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  45 | Golden Eagle                    | `Voliere`                | `Deluxe`   | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  46 | Golden Lion Tamarin             | `Landgehege`             | `Deluxe`   | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  47 | Golden Poison Frog              | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  48 | Golden Trevally                 | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  49 | Goodfellow's Tree-Kangaroo      | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  50 | Great Hammerhead                | `Aquarium`               | `Deluxe`   | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  51 | Great Hornbill                  | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  52 | Grey Wolf                       | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  53 | Hawksbill Turtle                | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  54 | Humphead Wrasse                 | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  55 | Indo-Pacific Leopard Shark      | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  56 | Indo-Pacific Sergeant           | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  57 | Komodo Dragon                   | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  58 | Lehmann's Poison Frog           | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  59 | Lion                            | `Landgehege`             | `Standard` | [x] `Panthera leo`       |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  60 | Long-Eared Owl                  | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  61 | Longfin Batfish                 | `Aquarium`               | `Deluxe`   | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  62 | Malayan Tapir                   | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  63 | Masai Giraffe                   | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  64 | Meerkat                         | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  65 | Menelaus Blue Morpho            | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  66 | Mexican Redknee                 | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  67 | Mountain Hare                   | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  68 | Nile Monitor                    | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  69 | Nyala                           | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  70 | Ocean Sunfish                   | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  71 | Ocellated Eagle Ray             | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  72 | Old World Swallowtail           | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  73 | Pacific Bluefin Tuna            | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  74 | Pacific Sardine                 | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  75 | Palette Surgeonfish             | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  76 | Plains Zebra                    | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  77 | Przewalski's Horse              | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  78 | Red Deer                        | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  79 | Red Lionfish                    | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  80 | Red Panda                       | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  81 | Reticulated Giraffe             | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  82 | Ring-Tailed Lemur               | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  83 | Sable Antelope                  | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  84 | Sailfin Snapper                 | `Aquarium`               | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  85 | Saltwater Crocodile             | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  86 | Schooling Bannerfish            | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  87 | Secretarybird                   | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  88 | Shoebill                        | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  89 | Spotted Hyena                   | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  90 | Springbok                       | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  91 | Sri Lankan Rose                 | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  92 | Sumatran Orangutan              | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  93 | Sumatran Tiger                  | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  94 | Sunda Pangolin                  | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  95 | Thomson's Gazelle               | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  96 | Toco Toucan                     | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  97 | Western Chimpanzee              | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  98 | Western Diamondback Rattlesnake | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
|  99 | Western Lowland Gorilla         | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
| 100 | White-Backed Vulture            | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
| 101 | White-Tailed Sea Eagle          | `Voliere`                | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
| 102 | Wild Boar                       | `Landgehege`             | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
| 103 | Yellow Anaconda                 | `Ausstellung`            | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |
| 104 | Yellow Tang                     | `Aquarium + Ausstellung` | `Standard` | [ ]                      |   [ ]    |        [ ]        |   [ ]   |       [ ]       | [ ] | [ ] |       [ ]       |  [ ]  |

## 2. Zoopedia-Pass – detaillierte Datencheckliste

**Das ist der erste Durchgang.** Pro Tier nur Informationen übernehmen, die tatsächlich in der Planet-Zoo-2-Zoopedia stehen. Wenn ein Feld dort nicht existiert, bleibt es offen und kommt später über eine andere Quelle.

|   # | Tier                            | ID  | FIL | TAX | MOR | LEB | REP | SOZ | ERN | TXT | MAP | IMG | SRC | Zoopedia fertig |
| --: | ------------------------------- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-------------: |
|   1 | Aardvark                        | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   2 | Afrikan Leopard                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   3 | Afrikan Penguin                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   4 | Afrikan Savannah Elephant       | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   5 | Afrikan Tigerfish               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   6 | American Bullfrog               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   7 | Asian Elephant                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   8 | Axolotl                         | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|   9 | Black Wildebeest                | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  10 | Blackspotted Puffer             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  11 | Blacktip Reef Shark             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  12 | Blue and Gold Fusilier          | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  13 | Blue Wildebeest                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  14 | Bluespine Unicornfish           | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  15 | Blunthead Cichlid               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  16 | Boa Constrictor                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  17 | Boeseman's Rainbowfish          | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  18 | Brown Trout                     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  19 | Cape Buffalo                    | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  20 | Cloudless Sulphur               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  21 | Clown Loach                     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  22 | Clown Triggerfish               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  23 | Common Bluetongue               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  24 | Common Hippopotamus             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  25 | Common Rudd                     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  26 | Danube Crested Newt             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  27 | Desert Horned Viper             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  28 | Diamondback Terrapin            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  29 | Dolphinfish                     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  30 | Eastern Brown Snake             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  31 | EurAsienn Beaver                | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  32 | EurAsienn Bittern               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  33 | EurAsienn Brown Bear            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  34 | EurAsienn Lynx                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  35 | European Bison                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  36 | European Peacock                | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  37 | Fire Salamander                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  38 | Galápagos Giant Tortoise        | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  39 | Gemsbok                         | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  40 | Gharial                         | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  41 | Giant Malaysian Leaf Insect     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  42 | Giant Slippery Frog             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  43 | Giant Tiger Land Snail          | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  44 | Gila Monster                    | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  45 | Golden Eagle                    | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  46 | Golden Lion Tamarin             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  47 | Golden Poison Frog              | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  48 | Golden Trevally                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  49 | Goodfellow's Tree-Kangaroo      | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  50 | Great Hammerhead                | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  51 | Great Hornbill                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  52 | Grey Wolf                       | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  53 | Hawksbill Turtle                | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  54 | Humphead Wrasse                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  55 | Indo-Pacific Leopard Shark      | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  56 | Indo-Pacific Sergeant           | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  57 | Komodo Dragon                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  58 | Lehmann's Poison Frog           | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  59 | Lion                            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  60 | Long-Eared Owl                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  61 | Longfin Batfish                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  62 | Malayan Tapir                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  63 | Masai Giraffe                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  64 | Meerkat                         | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  65 | Menelaus Blue Morpho            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  66 | Mexican Redknee                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  67 | Mountain Hare                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  68 | Nile Monitor                    | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  69 | Nyala                           | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  70 | Ocean Sunfish                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  71 | Ocellated Eagle Ray             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  72 | Old World Swallowtail           | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  73 | Pacific Bluefin Tuna            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  74 | Pacific Sardine                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  75 | Palette Surgeonfish             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  76 | Plains Zebra                    | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  77 | Przewalski's Horse              | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  78 | Red Deer                        | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  79 | Red Lionfish                    | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  80 | Red Panda                       | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  81 | Reticulated Giraffe             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  82 | Ring-Tailed Lemur               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  83 | Sable Antelope                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  84 | Sailfin Snapper                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  85 | Saltwater Crocodile             | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  86 | Schooling Bannerfish            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  87 | Secretarybird                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  88 | Shoebill                        | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  89 | Spotted Hyena                   | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  90 | Springbok                       | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  91 | Sri Lankan Rose                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  92 | Sumatran Orangutan              | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  93 | Sumatran Tiger                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  94 | Sunda Pangolin                  | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  95 | Thomson's Gazelle               | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  96 | Toco Toucan                     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  97 | Western Chimpanzee              | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  98 | Western Diamondback Rattlesnake | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
|  99 | Western Lowland Gorilla         | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
| 100 | White-Backed Vulture            | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
| 101 | White-Tailed Sea Eagle          | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
| 102 | Wild Boar                       | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
| 103 | Yellow Anaconda                 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |
| 104 | Yellow Tang                     | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |       [ ]       |

### Zoopedia-Felddefinitionen für einen einzelnen Tierdatensatz

```text
[ ] ID   -> id + identitaet.namen
[ ] FIL  -> edition + gehegetyp + kontinente + biome + schutzstatus
[ ] TAX  -> taxonomie
[ ] MOR  -> koerperlaenge + schulterhoehe + gewicht + geschwindigkeit
[ ] LEB  -> lebensspanne + schutzstatus + wildpopulation
[ ] REP  -> geschlechtsreife + tragzeit + nachwuchs
[ ] SOZ  -> sozialeStruktur + biome + aktivitaet
[ ] ERN  -> ernaehrung.fressverhalten
[ ] TXT  -> vorkommen + uebersicht + arterhaltung +
            sozialverhaltenUndFortpflanzung + tierfakten + entwicklungshinweis
[ ] MAP  -> karte
[ ] IMG  -> bilder
[ ] SRC  -> quellen.planetZoo2 + quelle="planetZoo2" an übernommenen Einträgen
```

## 3. Tierstimmenarchiv-Pass – Schema

Wenn der Zoopedia-Pass komplett ist, wird die **Master-Spalte Tierstimmenarchiv** von Tier 1 bis 104 abgearbeitet.

Pro Tier:

- [ ] Suche im Tierstimmenarchiv durchgeführt
- [ ] Treffer fachlich dem richtigen Tier zugeordnet
- [ ] Lauttyp(e) angelegt
- [ ] Varianten angelegt
- [ ] Audiodatei(en) gespeichert/eingetragen
- [ ] Metadaten-Datei(en) eingetragen
- [ ] `quellen.Tierstimmenarchiv` ergänzt
- [ ] Wenn kein brauchbarer Treffer existiert: Master-Zelle auf `n/a` setzen

## 4. Go-Wild-Pass – Schema

- [ ] Tier in vorhandenem Go-Wild-Material gesucht
- [ ] Folge / Titel eindeutig erfasst
- [ ] Videodatei / Pfad eingetragen
- [ ] Dauer und Beschreibung eingetragen
- [ ] `quelle: "goWild"` gesetzt
- [ ] `quellen.goWild` vorhanden
- [ ] Zusätzliche belegte Fakten nur mit eigener Quellenangabe in passende Daten-/Textfelder übernommen
- [ ] Kein Material vorhanden → `n/a`

## 5. Mission-Wildnis-Pass – Schema

- [ ] Tier in vorhandenem Mission-Wildnis-Material gesucht
- [ ] Folge / Titel eindeutig erfasst
- [ ] Videodatei / Pfad eingetragen
- [ ] Dauer und Beschreibung eingetragen
- [ ] eigene Quellen-ID für Mission Wildnis gesetzt
- [ ] Quellenobjekt ergänzt
- [ ] Zusätzliche belegte Fakten mit Quellenangabe übernommen
- [ ] Kein Material vorhanden → `n/a`

## 6. Weitere Quellen – Lücken schließen

Erst nach den vier festen Quellen gezielt ergänzen:

- [ ] `SYS` vollständig
- [ ] `NN` vollständig
- [ ] fehlende Körper-/Lebens-/Fortpflanzungsdaten
- [ ] fehlende Texte
- [ ] Verbreitungskarte
- [ ] fehlende Bilder / Medien
- [ ] Schutzstatus / Wildpopulation mit belastbarer aktueller Quelle
- [ ] jede Aussage / jeder Wert besitzt die passende `quelle`
- [ ] keine widersprüchlichen Werte ohne Typ/Hinweis nebeneinander

## 7. Neue Zoopedia-Tiere nach dem 11.09.2026

Die Zoopedia wird vor Release weiterhin erweitert. Neue Tiere hier zuerst eintragen und danach in beide Tabellen oben übernehmen.

|   # | Tier | Gehegetyp | Edition | Datum entdeckt | in Master übernommen | in Zoopedia-Pass übernommen |
| --: | ---- | --------- | ------- | -------------- | :------------------: | :-------------------------: |
| 105 |      |           |         |                |         [ ]          |             [ ]             |
| 106 |      |           |         |                |         [ ]          |             [ ]             |
| 107 |      |           |         |                |         [ ]          |             [ ]             |
| 108 |      |           |         |                |         [ ]          |             [ ]             |
| 109 |      |           |         |                |         [ ]          |             [ ]             |
| 110 |      |           |         |                |         [ ]          |             [ ]             |
| 111 |      |           |         |                |         [ ]          |             [ ]             |
| 112 |      |           |         |                |         [ ]          |             [ ]             |
| 113 |      |           |         |                |         [ ]          |             [ ]             |
| 114 |      |           |         |                |         [ ]          |             [ ]             |

## Quellen für den aktuellen Zoopedia-Bestand

- Offizielle Planet Zoo 2 Zoopedia: https://www.planetzoogame.com/2/zoopedia
- Offizielle Planet-Zoo-2-Ankündigungen / Zoopedia-Updates: https://steamcommunity.com/app/3219030/announcements/
- Aktuelle Vergleichsliste (Stand 10.09.2026): https://insider-gaming.com/planet-zoo-2-all-animals-complete-zoopedia/
- Vergleichsliste vom 04.09.2026: https://www.gamewatcher.com/planet-zoo-2/animals

### Hinweis zur Zahl 104

Die aktuelle Vergleichsseite vom 10.09.2026 nennt **104 Arten**, listet in ihrer sichtbaren Tabelle jedoch nur 103 Zeilen. Dort fehlt **Diamondback Terrapin**, obwohl diese Art bereits zuvor in der offiziellen Zoopedia-Aktualisierung genannt wurde und in der älteren Zoopedia-Liste enthalten war. Deshalb enthält diese Checkliste **104 Tiere inklusive Diamondback Terrapin**.

### Bereits im gelieferten Projekt vorhanden

- `Orycteropus afer` – Aardvark
- `Loxodonta africana` – Afrikan Savannah Elephant
- `Panthera leo` – Lion

Diese drei vorhandenen JSON-Dateien bedeuten **nicht**, dass ihr Zoopedia-Pass schon vollständig erledigt ist; deshalb bleiben die Zoopedia-Checkboxen zunächst offen.
