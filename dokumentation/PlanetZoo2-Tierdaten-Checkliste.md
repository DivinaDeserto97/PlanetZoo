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

| Kürzel | Projektbereich | Enthaltene Daten |
|---|---|---|
| `ID` | `id` + `identitaet.namen` | wissenschaftliche ID / Namen in allen Projektsprachen |
| `FIL` | `filter` | Edition, Gehegetyp, Kontinente, Biome, Schutzstatus |
| `TAX` | `daten.taxonomie` | Reich, Stamm, Klasse, Ordnung, Familie, Gattung, Art |
| `MOR` | Körperdaten | Körperlänge, Schulterhöhe, Gewicht, Geschwindigkeit |
| `LEB` | Lebensdaten | Lebensspanne, Schutzstatus, Wildpopulation |
| `REP` | Fortpflanzung | Geschlechtsreife, Tragzeit, Nachwuchs |
| `SOZ` | Verhalten | soziale Struktur, Biome, Aktivität |
| `ERN` | Ernährung | Fressverhalten; **Nahrungsnetz separat** |
| `NN` | `daten.ernaehrung.nahrungsnetz` | Jungtier/Erwachsen, frisst / wird gefressen, Beziehungen |
| `SYS` | `systematik` | nahe Verwandte, Evolution, Knoten, Aufspaltungen, Verbindungen |
| `TXT` | `texte` | Vorkommen, Übersicht, Arterhaltung, Sozialverhalten/Fortpflanzung, Tierfakten, Entwicklungshinweis |
| `MAP` | `karte` | Verbreitungskarte, Datei, URL, Quelle |
| `IMG` | `bilder` | Hauptbild/Varianten, Dateien, Alt-Text, Metadaten |
| `AUD` | `audio` | Lauttypen, Varianten, Audiodateien, Metadaten |
| `VID` | `video` | Doku/Verhaltensvideo, Reihe, Titel, Datei, Dauer, Beschreibung |
| `SRC` | `quellen` | Quellenobjekt und korrekte Quellen-IDs |

## Welche Quelle soll was liefern?

| Quelle | Zuerst prüfen / übernehmen | Nicht erzwingen |
|---|---|---|
| **Planet Zoo 2 Zoopedia** | `ID`, `FIL`, `TAX`, `MOR`, `LEB`, `REP`, `SOZ`, `ERN`, `TXT`, `MAP`, `IMG`, `SRC` – jeweils nur wenn dort vorhanden | `AUD`, `VID`, vollständiges `SYS`/`NN`, Rechner |
| **Tierstimmenarchiv** | `AUD`, Audio-Metadaten, `SRC`; ggf. Lauttyp/Beschreibung | fehlende Biologie nicht aus dem Audiotitel ableiten |
| **Go Wild** | `VID`, Doku-Metadaten, `SRC`; belegte Fakten dürfen zusätzlich in passende Daten-/Textfelder | keine unbelegten Aussagen aus Bildern ableiten |
| **Mission Wildnis** | `VID`, Doku-Metadaten, `SRC`; belegte Fakten dürfen zusätzlich übernommen werden | wie bei Go Wild |
| **Weitere Quellen** | Lücken in `SYS`, `NN`, Daten, Texten, Karte und Medien gezielt schließen | nicht mehrere Quellen vermischen, ohne `quelle` am Eintrag zu setzen |

## 1. Master-Checkliste – Quellenreihenfolge

Diese Tabelle ist deine Hauptliste. Du kannst zuerst die komplette Spalte **Zoopedia** von oben nach unten abarbeiten, danach **Tierstimmenarchiv**, dann **Go Wild** usw.

| # | Tier (Zoopedia) | Gehegetyp | Edition | JSON / Projekt-ID | Zoopedia | Tierstimmenarchiv | Go Wild | Mission Wildnis | SYS | NN | weitere Quellen | final |
|---:|---|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Aardvark | `Landgehege` | `standard` | [x] `Orycteropus afer` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | African Leopard | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | African Penguin | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4 | African Savannah Elephant | `Landgehege` | `standard` | [x] `Loxodonta africana` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5 | African Tigerfish | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 6 | American Bullfrog | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 7 | Asian Elephant | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 8 | Axolotl | `Ausstellung` | `deluxe` | [] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 9 | Black Wildebeest | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 10 | Blackspotted Puffer | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 11 | Blacktip Reef Shark | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 12 | Blue and Gold Fusilier | `Aquarium + Ausstellung` | `deluxe` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 13 | Blue Wildebeest | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 14 | Bluespine Unicornfish | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 15 | Blunthead Cichlid | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 16 | Boa Constrictor | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 17 | Boeseman's Rainbowfish | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 18 | Brown Trout | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 19 | Cape Buffalo | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 20 | Cloudless Sulphur | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 21 | Clown Loach | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 22 | Clown Triggerfish | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 23 | Common Bluetongue | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 24 | Common Hippopotamus | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 25 | Common Rudd | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 26 | Danube Crested Newt | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 27 | Desert Horned Viper | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 28 | Diamondback Terrapin | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 29 | Dolphinfish | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 30 | Eastern Brown Snake | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 31 | Eurasian Beaver | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 32 | Eurasian Bittern | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 33 | Eurasian Brown Bear | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 34 | Eurasian Lynx | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 35 | European Bison | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 36 | European Peacock | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 37 | Fire Salamander | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 38 | Galápagos Giant Tortoise | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 39 | Gemsbok | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 40 | Gharial | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 41 | Giant Malaysian Leaf Insect | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 42 | Giant Slippery Frog | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 43 | Giant Tiger Land Snail | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 44 | Gila Monster | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 45 | Golden Eagle | `Voliere` | `deluxe` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 46 | Golden Lion Tamarin | `Landgehege` | `deluxe` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 47 | Golden Poison Frog | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 48 | Golden Trevally | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 49 | Goodfellow's Tree-Kangaroo | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 50 | Great Hammerhead | `Aquarium` | `deluxe` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 51 | Great Hornbill | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 52 | Grey Wolf | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 53 | Hawksbill Turtle | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 54 | Humphead Wrasse | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 55 | Indo-Pacific Leopard Shark | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 56 | Indo-Pacific Sergeant | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 57 | Komodo Dragon | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 58 | Lehmann's Poison Frog | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 59 | Lion | `Landgehege` | `standard` | [x] `Panthera leo` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 60 | Long-Eared Owl | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 61 | Longfin Batfish | `Aquarium` | `deluxe` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 62 | Malayan Tapir | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 63 | Masai Giraffe | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 64 | Meerkat | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 65 | Menelaus Blue Morpho | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 66 | Mexican Redknee | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 67 | Mountain Hare | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 68 | Nile Monitor | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 69 | Nyala | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 70 | Ocean Sunfish | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 71 | Ocellated Eagle Ray | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 72 | Old World Swallowtail | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 73 | Pacific Bluefin Tuna | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 74 | Pacific Sardine | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 75 | Palette Surgeonfish | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 76 | Plains Zebra | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 77 | Przewalski's Horse | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 78 | Red Deer | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 79 | Red Lionfish | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 80 | Red Panda | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 81 | Reticulated Giraffe | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 82 | Ring-Tailed Lemur | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 83 | Sable Antelope | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 84 | Sailfin Snapper | `Aquarium` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 85 | Saltwater Crocodile | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 86 | Schooling Bannerfish | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 87 | Secretarybird | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 88 | Shoebill | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 89 | Spotted Hyena | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 90 | Springbok | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 91 | Sri Lankan Rose | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 92 | Sumatran Orangutan | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 93 | Sumatran Tiger | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 94 | Sunda Pangolin | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 95 | Thomson's Gazelle | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 96 | Toco Toucan | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 97 | Western Chimpanzee | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 98 | Western Diamondback Rattlesnake | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 99 | Western Lowland Gorilla | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 100 | White-Backed Vulture | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 101 | White-Tailed Sea Eagle | `Voliere` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 102 | Wild Boar | `Landgehege` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 103 | Yellow Anaconda | `Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 104 | Yellow Tang | `Aquarium + Ausstellung` | `standard` | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

## 2. Zoopedia-Pass – detaillierte Datencheckliste

**Das ist der erste Durchgang.** Pro Tier nur Informationen übernehmen, die tatsächlich in der Planet-Zoo-2-Zoopedia stehen. Wenn ein Feld dort nicht existiert, bleibt es offen und kommt später über eine andere Quelle.

| # | Tier | ID | FIL | TAX | MOR | LEB | REP | SOZ | ERN | TXT | MAP | IMG | SRC | Zoopedia fertig |
|---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Aardvark | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | African Leopard | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | African Penguin | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4 | African Savannah Elephant | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5 | African Tigerfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 6 | American Bullfrog | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 7 | Asian Elephant | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 8 | Axolotl | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 9 | Black Wildebeest | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 10 | Blackspotted Puffer | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 11 | Blacktip Reef Shark | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 12 | Blue and Gold Fusilier | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 13 | Blue Wildebeest | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 14 | Bluespine Unicornfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 15 | Blunthead Cichlid | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 16 | Boa Constrictor | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 17 | Boeseman's Rainbowfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 18 | Brown Trout | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 19 | Cape Buffalo | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 20 | Cloudless Sulphur | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 21 | Clown Loach | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 22 | Clown Triggerfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 23 | Common Bluetongue | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 24 | Common Hippopotamus | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 25 | Common Rudd | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 26 | Danube Crested Newt | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 27 | Desert Horned Viper | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 28 | Diamondback Terrapin | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 29 | Dolphinfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 30 | Eastern Brown Snake | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 31 | Eurasian Beaver | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 32 | Eurasian Bittern | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 33 | Eurasian Brown Bear | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 34 | Eurasian Lynx | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 35 | European Bison | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 36 | European Peacock | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 37 | Fire Salamander | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 38 | Galápagos Giant Tortoise | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 39 | Gemsbok | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 40 | Gharial | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 41 | Giant Malaysian Leaf Insect | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 42 | Giant Slippery Frog | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 43 | Giant Tiger Land Snail | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 44 | Gila Monster | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 45 | Golden Eagle | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 46 | Golden Lion Tamarin | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 47 | Golden Poison Frog | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 48 | Golden Trevally | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 49 | Goodfellow's Tree-Kangaroo | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 50 | Great Hammerhead | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 51 | Great Hornbill | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 52 | Grey Wolf | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 53 | Hawksbill Turtle | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 54 | Humphead Wrasse | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 55 | Indo-Pacific Leopard Shark | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 56 | Indo-Pacific Sergeant | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 57 | Komodo Dragon | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 58 | Lehmann's Poison Frog | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 59 | Lion | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 60 | Long-Eared Owl | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 61 | Longfin Batfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 62 | Malayan Tapir | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 63 | Masai Giraffe | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 64 | Meerkat | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 65 | Menelaus Blue Morpho | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 66 | Mexican Redknee | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 67 | Mountain Hare | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 68 | Nile Monitor | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 69 | Nyala | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 70 | Ocean Sunfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 71 | Ocellated Eagle Ray | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 72 | Old World Swallowtail | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 73 | Pacific Bluefin Tuna | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 74 | Pacific Sardine | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 75 | Palette Surgeonfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 76 | Plains Zebra | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 77 | Przewalski's Horse | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 78 | Red Deer | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 79 | Red Lionfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 80 | Red Panda | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 81 | Reticulated Giraffe | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 82 | Ring-Tailed Lemur | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 83 | Sable Antelope | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 84 | Sailfin Snapper | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 85 | Saltwater Crocodile | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 86 | Schooling Bannerfish | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 87 | Secretarybird | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 88 | Shoebill | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 89 | Spotted Hyena | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 90 | Springbok | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 91 | Sri Lankan Rose | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 92 | Sumatran Orangutan | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 93 | Sumatran Tiger | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 94 | Sunda Pangolin | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 95 | Thomson's Gazelle | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 96 | Toco Toucan | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 97 | Western Chimpanzee | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 98 | Western Diamondback Rattlesnake | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 99 | Western Lowland Gorilla | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 100 | White-Backed Vulture | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 101 | White-Tailed Sea Eagle | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 102 | Wild Boar | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 103 | Yellow Anaconda | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| 104 | Yellow Tang | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

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

| # | Tier | Gehegetyp | Edition | Datum entdeckt | in Master übernommen | in Zoopedia-Pass übernommen |
|---:|---|---|---|---|:---:|:---:|
| 105 |  |  |  |  | [ ] | [ ] |
| 106 |  |  |  |  | [ ] | [ ] |
| 107 |  |  |  |  | [ ] | [ ] |
| 108 |  |  |  |  | [ ] | [ ] |
| 109 |  |  |  |  | [ ] | [ ] |
| 110 |  |  |  |  | [ ] | [ ] |
| 111 |  |  |  |  | [ ] | [ ] |
| 112 |  |  |  |  | [ ] | [ ] |
| 113 |  |  |  |  | [ ] | [ ] |
| 114 |  |  |  |  | [ ] | [ ] |

## Quellen für den aktuellen Zoopedia-Bestand

- Offizielle Planet Zoo 2 Zoopedia: https://www.planetzoogame.com/2/zoopedia
- Offizielle Planet-Zoo-2-Ankündigungen / Zoopedia-Updates: https://steamcommunity.com/app/3219030/announcements/
- Aktuelle Vergleichsliste (Stand 10.09.2026): https://insider-gaming.com/planet-zoo-2-all-animals-complete-zoopedia/
- Vergleichsliste vom 04.09.2026: https://www.gamewatcher.com/planet-zoo-2/animals

### Hinweis zur Zahl 104

Die aktuelle Vergleichsseite vom 10.09.2026 nennt **104 Arten**, listet in ihrer sichtbaren Tabelle jedoch nur 103 Zeilen. Dort fehlt **Diamondback Terrapin**, obwohl diese Art bereits zuvor in der offiziellen Zoopedia-Aktualisierung genannt wurde und in der älteren Zoopedia-Liste enthalten war. Deshalb enthält diese Checkliste **104 Tiere inklusive Diamondback Terrapin**.

### Bereits im gelieferten Projekt vorhanden

- `Orycteropus afer` – Aardvark
- `Loxodonta africana` – African Savannah Elephant
- `Panthera leo` – Lion

Diese drei vorhandenen JSON-Dateien bedeuten **nicht**, dass ihr Zoopedia-Pass schon vollständig erledigt ist; deshalb bleiben die Zoopedia-Checkboxen zunächst offen.