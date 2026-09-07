/* ======================================== */
/* TIER-DATEIEN                             */
/* ======================================== */

const TIER_JSON_DATEIEN = [
  "assets/daten/lebewesen/tiere/Loxodonta africana/Loxodonta africana.json",
  
  "assets/daten/lebewesen/tiere/Orycteropus afer/Orycteropus afer.json",
];


/* ======================================== */
/* HILFSFUNKTIONEN                          */
/* ======================================== */

function alsArray(wert) {
  if (Array.isArray(wert)) {
    return wert;
  }

  if (
    wert === undefined ||
    wert === null ||
    wert === ""
  ) {
    return [];
  }

  return [wert];
}


/* ======================================== */
/* ID ERSTELLEN                             */
/* ======================================== */

function erstelleTierId(name) {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}


/* ======================================== */
/* MEDIEN-PFAD FINDEN                       */
/* ======================================== */

function findeMedienPfad(medium) {
  if (!medium) {
    return null;
  }

  /*
      Altes Schema weiterhin unterstützen.
  */

  const direkterPfad =
    medium.pfad ??
    medium.Pfad ??
    null;

  if (direkterPfad) {
    return direkterPfad;
  }


  /*
      Neues Schema:

      bilder[]
      └── varianten[]
          └── dateien[]
              └── pfad
  */

  const varianten =
    alsArray(medium.varianten);


  for (const variante of varianten) {
    const dateien =
      alsArray(variante?.dateien);


    /*
        Falls mehrere Dateien vorhanden sind:

        1. Wiedergabe
        2. Original
        3. erste Datei
    */

    const datei =
      dateien.find(
        (eintrag) =>
          eintrag?.typ === "wiedergabe" &&
          eintrag?.pfad,
      ) ??
      dateien.find(
        (eintrag) =>
          eintrag?.typ === "original" &&
          eintrag?.pfad,
      ) ??
      dateien.find(
        (eintrag) => eintrag?.pfad,
      );


    if (datei?.pfad) {
      return datei.pfad;
    }
  }


  return null;
}


/* ======================================== */
/* HAUPTBILD FINDEN                         */
/* ======================================== */

function findeHauptbild(bilder) {
  const bildListe =
    alsArray(bilder);

  return (
    bildListe.find(
      (bild) =>
        bild?.typ === "hauptbild",
    ) ??
    bildListe[0] ??
    null
  );
}


/* ======================================== */
/* ALLE TIERDATEN IMPORTIEREN               */
/* ======================================== */

export async function datenImportieren() {
  const importierteTiere = [];


  for (
    let importIndex = 0;
    importIndex < TIER_JSON_DATEIEN.length;
    importIndex++
  ) {
    const jsonPfad =
      TIER_JSON_DATEIEN[importIndex];


    try {
      const antwort =
        await fetch(jsonPfad);


      if (!antwort.ok) {
        throw new Error(
          `JSON konnte nicht geladen werden: ${jsonPfad}`,
        );
      }


      const tierdaten =
        await antwort.json();


      /* ================================== */
      /* IDENTITÄT                          */
      /* ================================== */

      const wissenschaftlicherName =
        tierdaten.id ??
        tierdaten.WissenschaftlicherName ??
        tierdaten.wissenschaftlicherName ??
        "Unbekannte Tierart";


      const namen =
        tierdaten.identitaet?.namen ??
        tierdaten.namen ??
        {};


      const deutscherName =
        namen.de ??
        wissenschaftlicherName;


      const id =
        erstelleTierId(
          wissenschaftlicherName,
        );


      /* ================================== */
      /* KARTE                              */
      /* ================================== */

      const karte =
        tierdaten.karte ??
        tierdaten.Karte ??
        null;


      const kartenPfad =
        karte?.pfad ??
        karte?.Pfad ??
        null;


      /* ================================== */
      /* BILDER                             */
      /* ================================== */

      const bilder =
        alsArray(
          tierdaten.bilder ??
          tierdaten.tierbilder,
        );


      const hauptbild =
        findeHauptbild(bilder);


      const hauptbildPfad =
        findeMedienPfad(
          hauptbild,
        );


      /* ================================== */
      /* FILTER                             */
      /* ================================== */

      const filter =
        tierdaten.filter ??
        {};


      /* ================================== */
      /* IMPORTIERTES TIER                  */
      /* ================================== */

      importierteTiere.push({
        /*
            Interne UI-ID.
        */

        id,


        /*
            Original-ID aus JSON.

            Wichtig später für:
            Systematik / Nahrungsnetz.
        */

        datenId:
          tierdaten.id ??
          wissenschaftlicherName,


        name:
          deutscherName,


        namen,


        wissenschaftlicherName,


        /* ============================== */
        /* FILTER                         */
        /* ============================== */

        filter: {
          edition:
            filter.edition ??
            "standard",

          gehegetyp:
            alsArray(
              filter.gehegetyp,
            ),

          kontinente:
            alsArray(
              filter.kontinente,
            ),

          biome:
            alsArray(
              filter.biome,
            ),

          schutzstatus:
            filter.schutzstatus ??
            tierdaten.daten
              ?.schutzstatus
              ?.werte
              ?.[0]
              ?.wert ??
            null,
        },


        /* ============================== */
        /* MEDIEN                         */
        /* ============================== */

        kartenPfad,

        bilder,

        hauptbildPfad,

        audio:
          alsArray(
            tierdaten.audio,
          ),

        video:
          alsArray(
            tierdaten.video,
          ),


        /* ============================== */
        /* SPÄTERE SEITEN                 */
        /* ============================== */

        systematik:
          tierdaten.systematik ??
          null,

        nahrungsnetz:
          tierdaten.daten
            ?.ernaehrung
            ?.nahrungsnetz ??
          null,


        /* ============================== */
        /* SORTIERUNG                     */
        /* ============================== */

        importIndex,

        veroeffentlichtAm:
          tierdaten.planetZoo2
            ?.veroeffentlichtAm ??
          tierdaten.veroeffentlichtAm ??
          null,


        /* ============================== */
        /* ORIGINAL                       */
        /* ============================== */

        originalDaten:
          tierdaten,

        jsonPfad,
      });
    } catch (fehler) {
      console.error(
        `Fehler beim Import von ${jsonPfad}`,
        fehler,
      );
    }
  }


  return importierteTiere;
}