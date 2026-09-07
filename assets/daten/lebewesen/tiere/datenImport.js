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

function alsArray(
  wert,
) {
  if (
    Array.isArray(
      wert,
    )
  ) {
    return wert;
  }


  if (
    wert ===
      undefined ||
    wert ===
      null ||
    wert ===
      ""
  ) {
    return [];
  }


  return [
    wert,
  ];
}


/* ======================================== */
/* ID ERSTELLEN                             */
/* ======================================== */

function erstelleTierId(
  name,
) {
  return String(
    name,
  )
    .toLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}


/* ======================================== */
/* MEDIEN-PFAD FINDEN                       */
/* ======================================== */

function findeMedienPfad(
  medium,
) {
  if (!medium) {
    return null;
  }


  const direkterPfad =
    medium.pfad ??
    medium.Pfad ??
    null;


  if (direkterPfad) {
    return direkterPfad;
  }


  const varianten =
    alsArray(
      medium.varianten,
    );


  for (
    const variante of
    varianten
  ) {
    const dateien =
      alsArray(
        variante
          ?.dateien,
      );


    const datei =
      dateien.find(
        (eintrag) =>
          eintrag?.typ ===
            "wiedergabe" &&
          eintrag?.pfad,
      ) ??
      dateien.find(
        (eintrag) =>
          eintrag?.typ ===
            "original" &&
          eintrag?.pfad,
      ) ??
      dateien.find(
        (eintrag) =>
          eintrag?.pfad,
      );


    if (
      datei?.pfad
    ) {
      return datei.pfad;
    }
  }


  return null;
}


/* ======================================== */
/* HAUPTBILD FINDEN                         */
/* ======================================== */

function findeHauptbild(
  bilder,
) {
  const bildListe =
    alsArray(
      bilder,
    );


  return (
    bildListe.find(
      (bild) =>
        bild?.typ ===
        "hauptbild",
    ) ??
    bildListe[0] ??
    null
  );
}


/* ======================================== */
/* KARTEN-DATEIEN                           */
/* ======================================== */

function findeKartenPngPfad(
  karte,
) {
  if (!karte) {
    return null;
  }


  const dateien =
    alsArray(
      karte.dateien,
    );


  /*
      Neue Struktur:

      PNG ist Quelle und Standard.

      Ein Laie muss also nur die PNG
      eintragen / lokal speichern.
  */

  return (
    dateien.find(
      (datei) =>
        datei?.typ ===
          "original" &&
        String(
          datei?.dateityp ??
          "",
        ).toLowerCase() ===
          "png" &&
        datei?.pfad,
    )?.pfad ??

    dateien.find(
      (datei) =>
        String(
          datei?.dateityp ??
          "",
        ).toLowerCase() ===
          "png" &&
        datei?.pfad,
    )?.pfad ??

    /*
        Altes Schema weiterhin
        unterstützen.
    */

    karte.pfad ??
    karte.Pfad ??
    null
  );
}


function findeKartenSvgPfad(
  karte,
) {
  const dateien =
    alsArray(
      karte?.dateien,
    );


  return (
    dateien.find(
      (datei) =>
        datei?.typ ===
          "wiedergabe" &&
        String(
          datei?.dateityp ??
          "",
        ).toLowerCase() ===
          "svg" &&
        datei?.pfad,
    )?.pfad ??

    dateien.find(
      (datei) =>
        String(
          datei?.dateityp ??
          "",
        ).toLowerCase() ===
          "svg" &&
        datei?.pfad,
    )?.pfad ??

    null
  );
}


/* ======================================== */
/* ALLE TIERDATEN IMPORTIEREN               */
/* ======================================== */

export async function datenImportieren() {
  const importierteTiere =
    [];


  for (
    let importIndex = 0;
    importIndex <
    TIER_JSON_DATEIEN.length;
    importIndex++
  ) {
    const jsonPfad =
      TIER_JSON_DATEIEN[
        importIndex
      ];


    try {
      const antwort =
        await fetch(
          jsonPfad,
        );


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
        tierdaten
          .identitaet
          ?.namen ??
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


      /*
          Wichtig:

          kartenPfad = PNG
          kartenSvgPfad = optional

          Damit funktioniert die Map
          immer mit der Quelldatei PNG.
      */

      const kartenPfad =
        findeKartenPngPfad(
          karte,
        );


      const kartenSvgPfad =
        findeKartenSvgPfad(
          karte,
        );


      /* ================================== */
      /* BILDER                             */
      /* ================================== */

      const bilder =
        alsArray(
          tierdaten.bilder ??
          tierdaten.tierbilder,
        );


      const hauptbild =
        findeHauptbild(
          bilder,
        );


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
        id,

        datenId:
          tierdaten.id ??
          wissenschaftlicherName,

        name:
          deutscherName,

        namen,

        wissenschaftlicherName,


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
        /* KARTE                          */
        /* ============================== */

        karte,

        kartenPfad,

        kartenSvgPfad,

        kartenDateien:
          alsArray(
            karte?.dateien,
          ),


        /* ============================== */
        /* MEDIEN                         */
        /* ============================== */

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
          tierdaten
            .planetZoo2
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
    }

    catch (fehler) {
      console.error(
        `Fehler beim Import von ${jsonPfad}`,
        fehler,
      );
    }
  }


  return importierteTiere;
}
