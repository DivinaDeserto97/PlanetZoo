import {
  getLanguage,
  getLocalizedValue,
} from "./language.js";


/* ======================================== */
/* STANDARD-FILTER                          */
/* ======================================== */

export const STANDARD_FILTER = {
  suche: "",
  gehegetyp: "",
  kontinent: "",
  biome: "",
  schutzstatus: "",
  edition: "",
  nurAusgewaehlt: false,
};


/* ======================================== */
/* STANDARD-SORTIERUNG                      */
/* ======================================== */

export const STANDARD_SORTIERUNG = {
  sortierenNach: "newest",
  richtung: "desc",
};


/* ======================================== */
/* ARRAY                                    */
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
/* TIERNAME                                 */
/* ======================================== */

export function getTierFilterName(tier) {
  return (
    getLocalizedValue(
      tier.namen,
      getLanguage(),
    ) ??
    tier.wissenschaftlicherName ??
    tier.id ??
    ""
  );
}


/* ======================================== */
/* SUCHTEXT                                 */
/* ======================================== */

function getSuchtext(tier) {
  return [
    ...Object.values(
      tier.namen ?? {},
    ),

    tier.wissenschaftlicherName,

    tier.datenId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}


/* ======================================== */
/* FILTERN                                  */
/* ======================================== */

export function filterTiere(
  tiere,
  filter = {},
) {
  const einstellungen = {
    ...STANDARD_FILTER,
    ...filter,
  };


  const suche =
    String(
      einstellungen.suche ?? "",
    )
      .trim()
      .toLocaleLowerCase();


  const ausgewaehlteIds =
    new Set(
      einstellungen.ausgewaehlteIds ??
      [],
    );


  return tiere.filter(
    (tier) => {
      const tierFilter =
        tier.filter ?? {};


      const passtSuche =
        !suche ||
        getSuchtext(tier)
          .includes(suche);


      const passtGehegetyp =
        !einstellungen.gehegetyp ||
        alsArray(
          tierFilter.gehegetyp,
        ).includes(
          einstellungen.gehegetyp,
        );


      const passtKontinent =
        !einstellungen.kontinent ||
        alsArray(
          tierFilter.kontinente,
        ).includes(
          einstellungen.kontinent,
        );


      const passtBiome =
        !einstellungen.biome ||
        alsArray(
          tierFilter.biome,
        ).includes(
          einstellungen.biome,
        );


      const passtSchutzstatus =
        !einstellungen.schutzstatus ||
        tierFilter.schutzstatus ===
          einstellungen.schutzstatus;


      const passtEdition =
        !einstellungen.edition ||
        tierFilter.edition ===
          einstellungen.edition;


      const passtAuswahl =
        !einstellungen.nurAusgewaehlt ||
        ausgewaehlteIds.has(
          tier.id,
        );


      return (
        passtSuche &&
        passtGehegetyp &&
        passtKontinent &&
        passtBiome &&
        passtSchutzstatus &&
        passtEdition &&
        passtAuswahl
      );
    },
  );
}


/* ======================================== */
/* DATUM                                    */
/* ======================================== */

function holeDatum(tier) {
  if (!tier.veroeffentlichtAm) {
    return null;
  }


  const zeit =
    Date.parse(
      tier.veroeffentlichtAm,
    );


  if (!Number.isFinite(zeit)) {
    return null;
  }


  return zeit;
}


/* ======================================== */
/* SORTIEREN                                */
/* ======================================== */

export function sortiereTiere(
  tiere,
  sortierung = {},
) {
  const einstellungen = {
    ...STANDARD_SORTIERUNG,
    ...sortierung,
  };


  const faktor =
    einstellungen.richtung === "asc"
      ? 1
      : -1;


  return [...tiere].sort(
    (a, b) => {
      let vergleich = 0;


      /* ================================== */
      /* NAME                               */
      /* ================================== */

      if (
        einstellungen.sortierenNach ===
        "name"
      ) {
        vergleich =
          getTierFilterName(a)
            .localeCompare(
              getTierFilterName(b),
              getLanguage(),
            );
      }


      /* ================================== */
      /* WISSENSCHAFTLICHER NAME            */
      /* ================================== */

      else if (
        einstellungen.sortierenNach ===
        "scientificName"
      ) {
        vergleich =
          String(
            a.wissenschaftlicherName ??
            "",
          ).localeCompare(
            String(
              b.wissenschaftlicherName ??
              "",
            ),
          );
      }


      /* ================================== */
      /* NEUESTE                            */
      /* ================================== */

      else {
        const datumA =
          holeDatum(a);

        const datumB =
          holeDatum(b);


        if (
          datumA !== null &&
          datumB !== null
        ) {
          vergleich =
            datumA - datumB;
        }

        else {
          /*
              Noch kein Veröffentlichungsdatum
              vorhanden.

              Dann gilt die Reihenfolge in
              datenImport.js.

              Später hinzugefügte Tiere haben
              höheren importIndex.
          */

          vergleich =
            (a.importIndex ?? 0) -
            (b.importIndex ?? 0);
        }
      }


      return vergleich * faktor;
    },
  );
}


/* ======================================== */
/* FILTERN + SORTIEREN                      */
/* ======================================== */

export function filterUndSortiereTiere(
  tiere,
  {
    filter = {},
    sortierung = {},
  } = {},
) {
  const gefiltert =
    filterTiere(
      tiere,
      filter,
    );


  return sortiereTiere(
    gefiltert,
    sortierung,
  );
}