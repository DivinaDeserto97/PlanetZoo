/* ======================================== */
/* TIER-DATEIEN                             */
/* ======================================== */

const TIER_JSON_DATEIEN = [
  "assets/daten/tiere/Eunectes notaeus/Eunectes notaeus.json",
  "assets/daten/tiere/Equus quagga/Equus quagga.json",
  "assets/daten/tiere/Aquila chrysaetos/Aquila chrysaetos.json",
];

/* ======================================== */
/* ALLE TIERDATEN IMPORTIEREN               */
/* ======================================== */

export async function datenImportieren() {
  const importierteTiere = [];

  for (const jsonPfad of TIER_JSON_DATEIEN) {
    try {
      const antwort = await fetch(jsonPfad);

      if (!antwort.ok) {
        throw new Error(`JSON konnte nicht geladen werden: ${jsonPfad}`);
      }

      const tierdaten = await antwort.json();

      const wissenschaftlicherName =
        tierdaten.id ??
        tierdaten.WissenschaftlicherName ??
        tierdaten.wissenschaftlicherName ??
        "Unbekannte Tierart";

      const namen =
        tierdaten.identitaet?.namen ??
        tierdaten.namen ??
        {};

      const deutscherName = namen.de ?? wissenschaftlicherName;

      const karte = tierdaten.karte ?? tierdaten.Karte ?? null;
      const kartenPfad = karte?.pfad ?? karte?.Pfad ?? null;

      const bilder = tierdaten.bilder ?? tierdaten.tierbilder ?? [];

      const hauptbild =
        bilder.find((bild) => bild.typ === "hauptbild") ??
        bilder[0] ??
        null;

      const hauptbildPfad =
        hauptbild?.pfad ??
        hauptbild?.Pfad ??
        null;

      const filter = tierdaten.filter ?? {};

      const id = wissenschaftlicherName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      importierteTiere.push({
        id,
        name: deutscherName,
        namen,
        wissenschaftlicherName,
        filter: {
          edition: filter.edition ?? "standard",
          gehegetyp: Array.isArray(filter.gehegetyp) ? filter.gehegetyp : [],
          kontinente: Array.isArray(filter.kontinente) ? filter.kontinente : [],
          schutzstatus:
            filter.schutzstatus ??
            tierdaten.daten?.schutzstatus?.werte?.[0]?.wert ??
            null,
        },
        kartenPfad,
        bilder,
        hauptbildPfad,
        originalDaten: tierdaten,
        jsonPfad,
      });
    } catch (fehler) {
      console.error(`Fehler beim Import von ${jsonPfad}`, fehler);
    }
  }

  return importierteTiere;
}
