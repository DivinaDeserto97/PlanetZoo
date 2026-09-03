/* ======================================== */
/* TIER-DATEIEN                             */
/* ======================================== */

const TIER_JSON_DATEIEN = [
  "assets/daten/tiere/Eunectes notaeus/Eunectes notaeus.json",
];

/* ======================================== */
/* ALLE TIERDATEN IMPORTIEREN               */
/* ======================================== */

export async function datenImportieren() {
  const importierteTiere = [];

  for (const jsonPfad of TIER_JSON_DATEIEN) {
    try {
      /* ================================= */
      /* JSON LADEN                        */
      /* ================================= */

      const antwort = await fetch(jsonPfad);

      if (!antwort.ok) {
        throw new Error(`JSON konnte nicht geladen werden: ${jsonPfad}`);
      }

      const tierdaten = await antwort.json();

      /* ================================= */
      /* WISSENSCHAFTLICHER NAME           */
      /* ================================= */

      const wissenschaftlicherName =
        tierdaten.id ??
        tierdaten.WissenschaftlicherName ??
        tierdaten.wissenschaftlicherName ??
        "Unbekannte Tierart";

      /* ================================= */
      /* NAMEN                             */
      /* ================================= */

      const namen = tierdaten.identitaet?.namen ?? {};

      const deutscherName = namen.de ?? wissenschaftlicherName;

      /* ================================= */
      /* KARTE                             */
      /* ================================= */

      const karte = tierdaten.karte ?? tierdaten.Karte ?? null;

      const kartenPfad = karte?.pfad ?? karte?.Pfad ?? null;

      /* ================================= */
      /* BILDER                            */
      /* ================================= */

      const bilder = tierdaten.bilder ?? tierdaten.tierbilder ?? [];

      /* ================================= */
      /* TECHNISCHE ID                     */
      /* ================================= */

      const id = wissenschaftlicherName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      /* ================================= */
      /* TIER SPEICHERN                    */
      /* ================================= */

      importierteTiere.push({
        id,

        name: deutscherName,

        namen,

        wissenschaftlicherName,

        kartenPfad,

        bilder,

        originalDaten: tierdaten,
      });
    } catch (fehler) {
      console.error(`Fehler beim Import von ${jsonPfad}`, fehler);
    }
  }

  return importierteTiere;
}
