/* ======================================== */
/* KINO-DATEIEN                             */
/* ======================================== */

const KINO_JSON_DATEIEN = [
  "assets/daten/kino/werbung/werbung.json",
  "assets/daten/kino/naturschutz/naturschutz.json",
  "assets/daten/kino/aufklaerung/aufklaerung.json",
  "assets/daten/kino/allgemeine-tierinfos/allgemeine-tierinfos.json",
];


/* ======================================== */
/* HILFSFUNKTIONEN                          */
/* ======================================== */

function alsArray(wert) {
  if (Array.isArray(wert)) {
    return wert;
  }

  if (wert === undefined || wert === null || wert === "") {
    return [];
  }

  return [wert];
}


/* ======================================== */
/* ALLE KINO-DATEN IMPORTIEREN              */
/* ======================================== */

export async function kinoDatenImportieren() {
  const kategorien = [];

  for (let importIndex = 0; importIndex < KINO_JSON_DATEIEN.length; importIndex++) {
    const jsonPfad = KINO_JSON_DATEIEN[importIndex];

    try {
      const antwort = await fetch(jsonPfad);

      if (!antwort.ok) {
        throw new Error(`Kino-JSON konnte nicht geladen werden: ${jsonPfad}`);
      }

      const daten = await antwort.json();
      const kategorie = daten.kategorie ?? daten.id ?? `kino-${importIndex + 1}`;

      kategorien.push({
        id: daten.id ?? kategorie,
        kategorie,
        name: daten.name ?? {},
        beitraege: alsArray(daten.beitraege).map((beitrag, beitragIndex) => ({
          ...beitrag,
          id: beitrag?.id ?? `${kategorie}-${beitragIndex + 1}`,
          kategorie,
          aktiv: beitrag?.aktiv !== false,
          importIndex: beitragIndex,
          jsonPfad,
        })),
        importIndex,
        jsonPfad,
        originalDaten: daten,
      });
    } catch (fehler) {
      console.error(`Fehler beim Import von ${jsonPfad}`, fehler);
    }
  }

  return kategorien;
}


export async function kinoBeitraegeImportieren() {
  const kategorien = await kinoDatenImportieren();

  return kategorien.flatMap((kategorie) =>
    kategorie.beitraege.map((beitrag) => ({
      ...beitrag,
      kategorieName: kategorie.name,
    })),
  );
}
