import {
  TOOL_IDS,
  TOOLS,
} from "./toolRegistry.js";

import {
  getToolEinstellung,
  TOOL_STUFEN,
} from "./toolEinstellungen.js";

import {
  getAudioVarianten,
  getBesteAudioDatei,
  getBesteBildDatei,
  getBesteVideoDatei,
  getBildVarianten,
  getVideoVarianten,
  hatLokalisierterText,
} from "./tierMedien.js";



/* ======================================== */
/* ECHTE LOKALE DATEIEN PRÜFEN              */
/* ======================================== */

/*
    Die bisherige Prüfung hat nur geschaut,
    ob im JSON ein Pfad steht.

    Jetzt wird zusätzlich geprüft, ob die
    Datei über den lokalen Webserver
    tatsächlich erreichbar ist.

    Ergebnis wird gecacht, damit beim
    Seitenwechsel nicht alles erneut
    geladen werden muss.
*/

const DATEI_STATUS =
  new Map();


export async function pruefeLokaleTierDateien(
  tiere,
) {
  const pfade =
    new Set();


  tiere.forEach(
    (tier) => {
      sammleDateiPfade(
        tier,
      ).forEach(
        (pfad) =>
          pfade.add(
            pfad,
          ),
      );
    },
  );


  const offen =
    [...pfade].filter(
      (pfad) =>
        !DATEI_STATUS.has(
          pfad,
        ),
    );


  if (!offen.length) {
    return;
  }


  /*
      Maximal 8 Prüfungen gleichzeitig.
      Das bleibt auch bei vielen Tieren
      übersichtlich für den lokalen Server.
  */

  let index =
    0;


  async function worker() {
    while (
      index <
      offen.length
    ) {
      const pfad =
        offen[
          index++
        ];


      const vorhanden =
        await existiertLokaleDatei(
          pfad,
        );


      DATEI_STATUS.set(
        pfad,
        vorhanden,
      );
    }
  }


  const workerAnzahl =
    Math.min(
      8,
      offen.length,
    );


  await Promise.all(
    Array.from(
      {
        length:
          workerAnzahl,
      },
      () =>
        worker(),
    ),
  );
}


function sammleDateiPfade(
  tier,
) {
  const pfade =
    new Set();


  const karte =
    tier?.originalDaten
      ?.karte ??
    tier?.karte ??
    {};


  const kartenDateien =
    Array.isArray(
      karte?.dateien,
    )
      ? karte.dateien
      : [];


  kartenDateien.forEach(
    (datei) => {
      if (
        String(
          datei?.dateityp ??
          "",
        ).toLowerCase() ===
          "png" &&
        hatText(
          datei?.pfad,
        )
      ) {
        pfade.add(
          datei.pfad,
        );
      }
    },
  );


  if (
    hatText(
      karte?.pfad,
    )
  ) {
    pfade.add(
      karte.pfad,
    );
  }


  getBildVarianten(
    tier,
  ).forEach(
    (entry) => {
      const datei =
        getBesteBildDatei(
          entry.dateien,
        );


      if (
        hatText(
          datei?.pfad,
        )
      ) {
        pfade.add(
          datei.pfad,
        );
      }
    },
  );


  getAudioVarianten(
    tier,
  ).forEach(
    (entry) => {
      const datei =
        getBesteAudioDatei(
          entry.dateien,
        );


      if (
        hatText(
          datei?.pfad,
        )
      ) {
        pfade.add(
          datei.pfad,
        );
      }


      entry.metadaten.forEach(
        (meta) => {
          if (
            hatText(
              meta?.pfad,
            )
          ) {
            pfade.add(
              meta.pfad,
            );
          }
        },
      );
    },
  );


  getVideoVarianten(
    tier,
  ).forEach(
    (entry) => {
      const datei =
        getBesteVideoDatei(
          entry.dateien,
        );


      if (
        hatText(
          datei?.pfad,
        )
      ) {
        pfade.add(
          datei.pfad,
        );
      }
    },
  );


  return [
    ...pfade,
  ];
}


function istDateiVerfuegbar(
  pfad,
) {
  if (
    !hatText(
      pfad,
    )
  ) {
    return false;
  }


  /*
      Falls die Vorprüfung noch nicht
      gelaufen ist, wird ein vorhandener
      Pfad vorläufig akzeptiert.

      Home / Map / Infotafel / tier.html
      warten aber vor dem ersten Rendern
      auf pruefeLokaleTierDateien().
  */

  if (
    !DATEI_STATUS.has(
      pfad,
    )
  ) {
    return true;
  }


  return (
    DATEI_STATUS.get(
      pfad,
    ) ===
    true
  );
}


async function existiertLokaleDatei(
  pfad,
) {
  try {
    const url =
      new URL(
        String(
          pfad,
        ).replace(
          /^\/+/,
          "",
        ),
        document.baseURI,
      );


    /*
        HEAD lädt nicht die komplette
        Bild-/Audio-/Videodatei.
    */

    const response =
      await fetch(
        url,
        {
          method:
            "HEAD",

          cache:
            "no-store",
        },
      );


    if (
      response.ok
    ) {
      return true;
    }


    /*
        Falls ein einfacher lokaler
        Webserver HEAD nicht unterstützt,
        wird nur ein Byte angefordert.
    */

    if (
      response.status ===
        405 ||
      response.status ===
        501
    ) {
      const fallback =
        await fetch(
          url,
          {
            method:
              "GET",

            headers: {
              Range:
                "bytes=0-0",
            },

            cache:
              "no-store",
          },
        );


      return (
        fallback.ok ||
        fallback.status ===
          206
      );
    }


    return false;
  }

  catch {
    return false;
  }
}


function hatText(wert) {
  return (
    typeof wert === "string" &&
    wert.trim().length > 0
  );
}


function hatInhalt(wert) {
  if (
    wert === null ||
    wert === undefined
  ) {
    return false;
  }


  if (
    typeof wert === "string"
  ) {
    return (
      wert.trim().length >
      0
    );
  }


  if (
    typeof wert === "number"
  ) {
    return Number.isFinite(
      wert,
    );
  }


  if (
    typeof wert === "boolean"
  ) {
    /*
        false ist ein gültiger
        ausgefüllter Boolean-Wert.
    */
    return true;
  }


  if (
    Array.isArray(
      wert,
    )
  ) {
    return wert.some(
      (eintrag) =>
        hatInhalt(
          eintrag,
        ),
    );
  }


  if (
    typeof wert ===
    "object"
  ) {
    return Object.values(
      wert,
    ).some(
      (eintrag) =>
        hatInhalt(
          eintrag,
        ),
    );
  }


  return false;
}


function hatArrayInhalt(wert) {
  return (
    Array.isArray(
      wert,
    ) &&
    wert.some(
      (eintrag) =>
        hatInhalt(
          eintrag,
        ),
    )
  );
}



/* ======================================== */
/* STRUKTUR-PRÜFUNG                         */
/* ======================================== */

function istObjekt(
  wert,
) {
  return (
    wert !== null &&
    typeof wert === "object" &&
    !Array.isArray(
      wert,
    )
  );
}


function hatZahl(
  wert,
) {
  return (
    typeof wert === "number" &&
    Number.isFinite(
      wert,
    )
  );
}


function pruefePflichtText(
  fehlt,
  wert,
  meldung,
) {
  if (
    !hatText(
      wert,
    )
  ) {
    fehlt.push(
      meldung,
    );
  }
}


function pruefeOptionalenText(
  fehlt,
  objekt,
  key,
  meldung,
) {
  if (
    Object.prototype.hasOwnProperty.call(
      objekt ?? {},
      key,
    ) &&
    !hatText(
      objekt?.[
        key
      ],
    )
  ) {
    fehlt.push(
      meldung,
    );
  }
}


function pruefeOptionalenLokalisiertenText(
  fehlt,
  objekt,
  key,
  meldung,
) {
  if (
    Object.prototype.hasOwnProperty.call(
      objekt ?? {},
      key,
    ) &&
    !hatLokalisierterText(
      objekt?.[
        key
      ],
    )
  ) {
    fehlt.push(
      meldung,
    );
  }
}


function pruefeNahrungsWert(
  wert,
  {
    bedingungPflicht =
      false,
  } = {},
) {
  const fehlt =
    [];


  pruefePflichtText(
    fehlt,
    wert?.wert,
    "Wert fehlt.",
  );


  pruefePflichtText(
    fehlt,
    wert?.quelle,
    "Quelle fehlt.",
  );


  if (
    bedingungPflicht
  ) {
    pruefePflichtText(
      fehlt,
      wert?.bedingung,
      "Bedingung fehlt.",
    );
  }

  else {
    pruefeOptionalenText(
      fehlt,
      wert,
      "bedingung",
      "Bedingung ist angelegt, aber leer.",
    );
  }


  pruefeOptionalenText(
    fehlt,
    wert,
    "typ",
    "Typ ist angelegt, aber leer.",
  );


  pruefeOptionalenLokalisiertenText(
    fehlt,
    wert,
    "hinweis",
    "Hinweis ist angelegt, aber leer.",
  );


  return fehlt;
}


function item(
  label,
  pfad,
  ok,
  fehlt = [],
) {
  return {
    label,
    pfad,
    ok:
      Boolean(ok),
    fehlt:
      fehlt.filter(Boolean),
  };
}


function basisChecks(tier) {
  const namen =
    tier?.originalDaten
      ?.identitaet
      ?.namen ??
    tier?.namen;


  return [
    item(
      "Name",
      "identitaet.namen",
      hatLokalisierterText(
        namen,
      ),
      [
        !hatLokalisierterText(
          namen,
        )
          ? "Mindestens ein Tiername fehlt."
          : null,
      ],
    ),

    item(
      "Wissenschaftlicher Name",
      "id",
      hatText(
        tier?.originalDaten
          ?.id,
      ) ||
        hatText(
          tier?.wissenschaftlicherName,
        ),
      [
        !(
          hatText(
            tier?.originalDaten
              ?.id,
          ) ||
          hatText(
            tier?.wissenschaftlicherName,
          )
        )
          ? "Wissenschaftlicher Name fehlt."
          : null,
      ],
    ),
  ];
}


function pruefeMap(tier) {
  const checks =
    basisChecks(tier);


  const karte =
    tier?.originalDaten
      ?.karte ??
    tier?.karte ??
    {};


  const dateien =
    Array.isArray(
      karte?.dateien,
    )
      ? karte.dateien
      : [];


  const png =
    dateien.find(
      (datei) =>
        String(
          datei?.dateityp ??
            "",
        ).toLowerCase() ===
          "png" &&
        hatText(
          datei?.pfad,
        ),
    );


  const legacyPfad =
    hatText(
      karte?.pfad,
    );


  const kartenPfad =
    png?.pfad ??
    (
      legacyPfad
        ? karte.pfad
        : null
    );


  const kartenDateiVorhanden =
    istDateiVerfuegbar(
      kartenPfad,
    );


  checks.push(
    item(
      "Kartenbild",
      "karte.dateien[].pfad",
      hatText(
        kartenPfad,
      ) &&
        kartenDateiVorhanden,
      [
        !hatText(
          kartenPfad,
        )
          ? "PNG-Kartenpfad fehlt."
          : null,

        hatText(
          kartenPfad,
        ) &&
        !kartenDateiVorhanden
          ? `PNG-Kartendatei nicht gefunden: ${kartenPfad}`
          : null,
      ],
    ),
  );


  return checks;
}


function pruefeInfotafel(tier) {
  const checks =
    basisChecks(tier);


  const bilder =
    getBildVarianten(
      tier,
    );


  if (!bilder.length) {
    checks.push(
      item(
        "Bilder",
        "bilder",
        false,
        [
          "Keine Bildvariante vorhanden.",
        ],
      ),
    );
  }


  bilder.forEach(
    (entry) => {
      const nummer =
        entry.variante
          ?.variante ??
        entry.variantenIndex +
          1;

      const gruppe =
        entry.gruppe?.typ ||
        "Bild";

      const fehlt = [];


      if (
        !hatText(
          entry.gruppe?.typ,
        )
      ) {
        fehlt.push(
          "Bildtyp fehlt.",
        );
      }


      if (
        !hatText(
          entry.variante
            ?.quelle,
        )
      ) {
        fehlt.push(
          "Quelle fehlt.",
        );
      }


      if (
        !hatLokalisierterText(
          entry.variante
            ?.alt,
        )
      ) {
        fehlt.push(
          "Alt-Text fehlt.",
        );
      }


      const beschreibung =
        entry.variante
          ?.beschreibung ??
        entry.gruppe
          ?.beschreibung;


      if (
        !hatLokalisierterText(
          beschreibung,
        )
      ) {
        fehlt.push(
          "Beschreibung fehlt.",
        );
      }


      const bildDatei =
        getBesteBildDatei(
          entry.dateien,
        );


      if (!bildDatei) {
        fehlt.push(
          "Bilddatei / Dateipfad fehlt.",
        );
      }

      else if (
        !istDateiVerfuegbar(
          bildDatei.pfad,
        )
      ) {
        fehlt.push(
          `Bilddatei nicht gefunden: ${bildDatei.pfad}`,
        );
      }


      checks.push(
        item(
          `${gruppe} – Variante ${nummer}`,
          `bilder[${entry.gruppenIndex}].varianten[${entry.variantenIndex}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );


  const texte =
    tier?.originalDaten
      ?.texte ??
    {};


  const textBereiche = [
    [
      "uebersicht",
      "Übersicht",
    ],
    [
      "vorkommen",
      "Vorkommen",
    ],
    [
      "arterhaltung",
      "Arterhaltung",
    ],
    [
      "sozialverhaltenUndFortpflanzung",
      "Sozialverhalten & Fortpflanzung",
    ],
    [
      "tierfakten",
      "Tierfakten",
    ],
  ];


  textBereiche.forEach(
    ([key, label]) => {
      const sprachObjekt =
        texte?.[key];


      const vorhanden =
        sprachObjekt &&
        typeof sprachObjekt ===
          "object" &&
        Object.values(
          sprachObjekt,
        ).some(
          (eintraege) =>
            Array.isArray(
              eintraege,
            ) &&
            eintraege.some(
              (eintrag) =>
                hatText(
                  eintrag?.inhalt,
                ),
            ),
        );


      checks.push(
        item(
          label,
          `texte.${key}`,
          vorhanden,
          [
            !vorhanden
              ? `${label}-Text fehlt.`
              : null,
          ],
        ),
      );
    },
  );


  const daten =
    tier?.originalDaten
      ?.daten ??
    {};


  const steckbrief = [
    [
      "Biome",
      "daten.biome.werte",
      daten?.biome?.werte,
    ],
    [
      "Schutzstatus",
      "daten.schutzstatus.werte",
      daten?.schutzstatus
        ?.werte,
    ],
    [
      "Soziale Struktur",
      "daten.sozialeStruktur.werte",
      daten?.sozialeStruktur
        ?.werte,
    ],
    [
      "Aktivität",
      "daten.aktivitaet.werte",
      daten?.aktivitaet
        ?.werte,
    ],
    [
      "Fressverhalten",
      "daten.ernaehrung.fressverhalten.werte",
      daten?.ernaehrung
        ?.fressverhalten
        ?.werte,
    ],
  ];


  steckbrief.forEach(
    ([label, pfad, wert]) => {
      checks.push(
        item(
          label,
          pfad,
          hatArrayInhalt(
            wert,
          ),
          [
            !hatArrayInhalt(
              wert,
            )
              ? `${label} fehlt.`
              : null,
          ],
        ),
      );
    },
  );


  return checks;
}


function pruefeAudio(tier) {
  const checks =
    basisChecks(tier);


  const audio =
    getAudioVarianten(
      tier,
    );


  if (!audio.length) {
    checks.push(
      item(
        "Audio",
        "audio",
        false,
        [
          "Keine Audio-Variante vorhanden.",
        ],
      ),
    );

    return checks;
  }


  audio.forEach(
    (entry) => {
      const nummer =
        entry.variante
          ?.variante ??
        entry.variantenIndex +
          1;

      const typ =
        entry.gruppe?.typ ||
        "Audio";

      const fehlt = [];


      if (
        !hatText(
          entry.gruppe?.typ,
        )
      ) {
        fehlt.push(
          "Audio-Typ fehlt."
        );
      }


      if (
        !hatText(
          entry.variante
            ?.quelle,
        )
      ) {
        fehlt.push(
          "Quelle fehlt.",
        );
      }


      const audioDatei =
        getBesteAudioDatei(
          entry.dateien,
        );


      if (!audioDatei) {
        fehlt.push(
          "Abspielbare Audiodatei / Dateipfad fehlt.",
        );
      }

      else if (
        !istDateiVerfuegbar(
          audioDatei.pfad,
        )
      ) {
        fehlt.push(
          `Audiodatei nicht gefunden: ${audioDatei.pfad}`,
        );
      }


      const metadata =
        entry.metadaten.find(
          (meta) =>
            hatText(
              meta?.pfad,
            ),
        );


      if (!metadata) {
        fehlt.push(
          "Metadaten-Pfad / Beschreibung fehlt.",
        );
      }

      else if (
        !istDateiVerfuegbar(
          metadata.pfad,
        )
      ) {
        fehlt.push(
          `Audio-Metadatendatei nicht gefunden: ${metadata.pfad}`,
        );
      }


      checks.push(
        item(
          `${typ} – Variante ${nummer}`,
          `audio[${entry.gruppenIndex}].varianten[${entry.variantenIndex}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );


  return checks;
}


function pruefeVideo(tier) {
  const checks =
    basisChecks(tier);


  const videos =
    getVideoVarianten(
      tier,
    );


  if (!videos.length) {
    checks.push(
      item(
        "Video",
        "video",
        false,
        [
          "Keine Video-Variante vorhanden.",
        ],
      ),
    );

    return checks;
  }


  videos.forEach(
    (entry) => {
      const nummer =
        entry.variante
          ?.variante ??
        entry.variantenIndex +
          1;

      const typ =
        entry.gruppe?.typ ||
        "Video";

      const fehlt = [];


      if (
        !hatText(
          entry.gruppe?.typ,
        )
      ) {
        fehlt.push(
          "Video-Typ fehlt.",
        );
      }


      if (
        !hatLokalisierterText(
          entry.variante
            ?.titel,
        )
      ) {
        fehlt.push(
          "Titel fehlt.",
        );
      }


      if (
        !hatText(
          entry.variante
            ?.quelle,
        )
      ) {
        fehlt.push(
          "Quelle fehlt.",
        );
      }


      if (
        !hatLokalisierterText(
          entry.variante
            ?.beschreibung,
        )
      ) {
        fehlt.push(
          "Beschreibung fehlt.",
        );
      }


      const videoDatei =
        getBesteVideoDatei(
          entry.dateien,
        );


      if (!videoDatei) {
        fehlt.push(
          "Videodatei / Dateipfad fehlt.",
        );
      }

      else if (
        !istDateiVerfuegbar(
          videoDatei.pfad,
        )
      ) {
        fehlt.push(
          `Videodatei nicht gefunden: ${videoDatei.pfad}`,
        );
      }


      checks.push(
        item(
          `${typ} – Variante ${nummer}`,
          `video[${entry.gruppenIndex}].varianten[${entry.variantenIndex}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );


  return checks;
}


function pruefeSystematik(tier) {
  const checks =
    basisChecks(
      tier,
    );


  const systematik =
    tier?.originalDaten
      ?.systematik ??
    tier?.systematik;


  if (
    !istObjekt(
      systematik,
    )
  ) {
    checks.push(
      item(
        "Systematik",
        "systematik",
        false,
        [
          "Systematik-Struktur fehlt.",
        ],
      ),
    );


    return checks;
  }


  /* ==================================== */
  /* OPTIONALER GESAMT-HINWEIS            */
  /* ==================================== */

  if (
    Object.prototype.hasOwnProperty.call(
      systematik,
      "hinweis",
    )
  ) {
    checks.push(
      item(
        "Systematik – Hinweis",
        "systematik.hinweis",
        hatLokalisierterText(
          systematik.hinweis,
        ),
        [
          !hatLokalisierterText(
            systematik.hinweis,
          )
            ? "Hinweis ist angelegt, aber leer."
            : null,
        ],
      ),
    );
  }


  /* ==================================== */
  /* NAHE VERWANDTE                       */
  /* ==================================== */

  const naheVerwandte =
    Array.isArray(
      systematik.naheVerwandte,
    )
      ? systematik.naheVerwandte
      : [];


  if (
    !naheVerwandte.length
  ) {
    checks.push(
      item(
        "Nahe Verwandte",
        "systematik.naheVerwandte",
        false,
        [
          "Mindestens ein Eintrag für nahe Verwandte fehlt.",
        ],
      ),
    );
  }


  naheVerwandte.forEach(
    (
      verwandter,
      index,
    ) => {
      const fehlt =
        [];


      pruefePflichtText(
        fehlt,
        verwandter?.id,
        "Wissenschaftliche ID / Art fehlt.",
      );


      pruefePflichtText(
        fehlt,
        verwandter?.beziehung,
        "Beziehung fehlt.",
      );


      pruefePflichtText(
        fehlt,
        verwandter?.deutscherName,
        "Deutscher Name fehlt.",
      );


      pruefePflichtText(
        fehlt,
        verwandter?.quelle,
        "Quelle fehlt.",
      );


      checks.push(
        item(
          `Nahe Verwandte – Eintrag ${index + 1}`,
          `systematik.naheVerwandte[${index}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );


  /* ==================================== */
  /* EVOLUTION                            */
  /* ==================================== */

  const evolution =
    systematik.evolution;


  if (
    !istObjekt(
      evolution,
    )
  ) {
    checks.push(
      item(
        "Evolution",
        "systematik.evolution",
        false,
        [
          "Evolution-Struktur fehlt.",
        ],
      ),
    );


    return checks;
  }


  checks.push(
    item(
      "Evolution – Hinweis",
      "systematik.evolution.hinweis",
      hatLokalisierterText(
        evolution.hinweis,
      ),
      [
        !hatLokalisierterText(
          evolution.hinweis,
        )
          ? "Evolution-Hinweis fehlt."
          : null,
      ],
    ),
  );


  /* ==================================== */
  /* EVOLUTIONS-KNOTEN                    */
  /* ==================================== */

  const knoten =
    Array.isArray(
      evolution.knoten,
    )
      ? evolution.knoten
      : [];


  if (
    !knoten.length
  ) {
    checks.push(
      item(
        "Evolution – Knoten",
        "systematik.evolution.knoten",
        false,
        [
          "Mindestens ein Evolutions-Knoten fehlt.",
        ],
      ),
    );
  }


  knoten.forEach(
    (
      knotenEintrag,
      index,
    ) => {
      const fehlt =
        [];


      pruefePflichtText(
        fehlt,
        knotenEintrag?.id,
        "ID fehlt.",
      );


      pruefePflichtText(
        fehlt,
        knotenEintrag?.rang,
        "Rang fehlt.",
      );


      pruefePflichtText(
        fehlt,
        knotenEintrag?.name,
        "Name fehlt.",
      );


      pruefePflichtText(
        fehlt,
        knotenEintrag?.quelle,
        "Quelle fehlt.",
      );


      checks.push(
        item(
          `Evolution – Knoten ${index + 1}`,
          `systematik.evolution.knoten[${index}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );


  /* ==================================== */
  /* AUFSPALTUNGEN                        */
  /* ==================================== */

  const aufspaltungen =
    Array.isArray(
      evolution.aufspaltungen,
    )
      ? evolution.aufspaltungen
      : [];


  if (
    !aufspaltungen.length
  ) {
    checks.push(
      item(
        "Evolution – Aufspaltungen",
        "systematik.evolution.aufspaltungen",
        false,
        [
          "Mindestens eine Aufspaltung fehlt.",
        ],
      ),
    );
  }


  aufspaltungen.forEach(
    (
      aufspaltung,
      index,
    ) => {
      const fehlt =
        [];


      pruefePflichtText(
        fehlt,
        aufspaltung?.linieA,
        "Linie A fehlt.",
      );


      pruefePflichtText(
        fehlt,
        aufspaltung?.linieB,
        "Linie B fehlt.",
      );


      if (
        !hatZahl(
          aufspaltung
            ?.zeitVorHeuteMioJahre,
        )
      ) {
        fehlt.push(
          "Zeit vor heute in Mio. Jahren fehlt oder ist keine Zahl.",
        );
      }


      pruefePflichtText(
        fehlt,
        aufspaltung?.typ,
        "Typ der Aufspaltung fehlt.",
      );


      pruefePflichtText(
        fehlt,
        aufspaltung?.quelle,
        "Quelle fehlt.",
      );


      checks.push(
        item(
          `Evolution – Aufspaltung ${index + 1}`,
          `systematik.evolution.aufspaltungen[${index}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );


  return checks;
}

function pruefeNahrungsnetz(tier) {
  const checks =
    basisChecks(
      tier,
    );


  const nahrungsnetz =
    tier?.originalDaten
      ?.daten
      ?.ernaehrung
      ?.nahrungsnetz ??
    tier?.nahrungsnetz;


  if (
    !istObjekt(
      nahrungsnetz,
    )
  ) {
    checks.push(
      item(
        "Nahrungsnetz",
        "daten.ernaehrung.nahrungsnetz",
        false,
        [
          "Nahrungsnetz-Struktur fehlt.",
        ],
      ),
    );


    return checks;
  }


  /* ==================================== */
  /* FRISST                               */
  /* ==================================== */

  const frisst =
    nahrungsnetz.frisst;


  if (
    !istObjekt(
      frisst,
    )
  ) {
    checks.push(
      item(
        "Frisst",
        "daten.ernaehrung.nahrungsnetz.frisst",
        false,
        [
          "Bereich „frisst“ fehlt.",
        ],
      ),
    );
  }

  else {
    pruefeFutterAltersklasse(
      checks,
      frisst.jungtier,
      {
        label:
          "Frisst – Jungtier",

        pfad:
          "daten.ernaehrung.nahrungsnetz.frisst.jungtier",

        bedingungPflicht:
          true,

        hinweisAlsAlternative:
          false,
      },
    );


    pruefeFutterAltersklasse(
      checks,
      frisst.erwachsen,
      {
        label:
          "Frisst – Erwachsen",

        pfad:
          "daten.ernaehrung.nahrungsnetz.frisst.erwachsen",

        bedingungPflicht:
          false,

        hinweisAlsAlternative:
          false,
      },
    );
  }


  /* ==================================== */
  /* WIRD GEFRESSEN VON                   */
  /* ==================================== */

  const gefressen =
    nahrungsnetz
      .wirdGefressenVon;


  if (
    !istObjekt(
      gefressen,
    )
  ) {
    checks.push(
      item(
        "Wird gefressen von",
        "daten.ernaehrung.nahrungsnetz.wirdGefressenVon",
        false,
        [
          "Bereich „wirdGefressenVon“ fehlt.",
        ],
      ),
    );


    return checks;
  }


  pruefeFressfeindAltersklasse(
    checks,
    gefressen.jungtier,
    {
      label:
        "Wird gefressen von – Jungtier",

      pfad:
        "daten.ernaehrung.nahrungsnetz.wirdGefressenVon.jungtier",

      erlaubtHinweisOhneWerte:
        true,

      erlaubtKeineFressfeinde:
        false,
    },
  );


  pruefeFressfeindAltersklasse(
    checks,
    gefressen.erwachsen,
    {
      label:
        "Wird gefressen von – Erwachsen",

      pfad:
        "daten.ernaehrung.nahrungsnetz.wirdGefressenVon.erwachsen",

      erlaubtHinweisOhneWerte:
        false,

      erlaubtKeineFressfeinde:
        true,
    },
  );


  return checks;
}


/* ======================================== */
/* NAHRUNGSNETZ – FUTTER                    */
/* ======================================== */

function pruefeFutterAltersklasse(
  checks,
  bereich,
  {
    label,
    pfad,
    bedingungPflicht,
    hinweisAlsAlternative,
  },
) {
  if (
    !istObjekt(
      bereich,
    )
  ) {
    checks.push(
      item(
        label,
        pfad,
        false,
        [
          "Altersklasse fehlt.",
        ],
      ),
    );

    return;
  }


  const werte =
    Array.isArray(
      bereich.werte,
    )
      ? bereich.werte
      : [];


  if (
    !werte.length
  ) {
    const hinweisOk =
      hinweisAlsAlternative &&
      hatLokalisierterText(
        bereich.hinweis,
      );


    checks.push(
      item(
        label,
        `${pfad}.werte`,
        hinweisOk,
        [
          !hinweisOk
            ? "Mindestens ein Nahrungswert fehlt."
            : null,
        ],
      ),
    );


    return;
  }


  werte.forEach(
    (
      wert,
      index,
    ) => {
      const fehlt =
        pruefeNahrungsWert(
          wert,
          {
            bedingungPflicht,
          },
        );


      checks.push(
        item(
          `${label} – Eintrag ${index + 1}`,
          `${pfad}.werte[${index}]`,
          fehlt.length ===
            0,
          fehlt,
        ),
      );
    },
  );
}


/* ======================================== */
/* NAHRUNGSNETZ – FRESSFEINDE               */
/* ======================================== */

function pruefeFressfeindAltersklasse(
  checks,
  bereich,
  {
    label,
    pfad,
    erlaubtHinweisOhneWerte,
    erlaubtKeineFressfeinde,
  },
) {
  if (
    !istObjekt(
      bereich,
    )
  ) {
    checks.push(
      item(
        label,
        pfad,
        false,
        [
          "Altersklasse fehlt.",
        ],
      ),
    );

    return;
  }


  const werte =
    Array.isArray(
      bereich.werte,
    )
      ? bereich.werte
      : [];


  if (
    werte.length
  ) {
    werte.forEach(
      (
        wert,
        index,
      ) => {
        const fehlt =
          pruefeNahrungsWert(
            wert,
          );


        checks.push(
          item(
            `${label} – Eintrag ${index + 1}`,
            `${pfad}.werte[${index}]`,
            fehlt.length ===
              0,
            fehlt,
          ),
        );
      },
    );


    /*
        Wenn zusätzlich ein Hinweis
        angelegt wurde, muss er auch
        ausgefüllt sein.
    */

    if (
      Object.prototype.hasOwnProperty.call(
        bereich,
        "hinweis",
      )
    ) {
      checks.push(
        item(
          `${label} – Hinweis`,
          `${pfad}.hinweis`,
          hatLokalisierterText(
            bereich.hinweis,
          ),
          [
            !hatLokalisierterText(
              bereich.hinweis,
            )
              ? "Hinweis ist angelegt, aber leer."
              : null,
          ],
        ),
      );
    }


    return;
  }


  /* ==================================== */
  /* KEINE REGELMÄSSIGEN FRESSFEINDE      */
  /* ==================================== */

  if (
    erlaubtKeineFressfeinde &&
    bereich
      .keineRegelmaessigenNatuerlichenFressfeinde ===
      true
  ) {
    const fehlt =
      [];


    if (
      !hatLokalisierterText(
        bereich.hinweis,
      )
    ) {
      fehlt.push(
        "Hinweis zu den fehlenden regelmäßigen Fressfeinden fehlt.",
      );
    }


    if (
      !hatText(
        bereich.quelle,
      )
    ) {
      fehlt.push(
        "Quelle fehlt.",
      );
    }


    checks.push(
      item(
        `${label} – keine regelmäßigen Fressfeinde`,
        pfad,
        fehlt.length ===
          0,
        fehlt,
      ),
    );


    return;
  }


  /* ==================================== */
  /* KEINE GETRENNTE LISTE / HINWEIS      */
  /* ==================================== */

  if (
    erlaubtHinweisOhneWerte &&
    hatLokalisierterText(
      bereich.hinweis,
    )
  ) {
    checks.push(
      item(
        `${label} – Hinweis`,
        `${pfad}.hinweis`,
        true,
        [],
      ),
    );


    return;
  }


  checks.push(
    item(
      label,
      `${pfad}.werte`,
      false,
      [
        erlaubtKeineFressfeinde
          ? "Fressfeinde fehlen. Alternativ muss „keineRegelmaessigenNatuerlichenFressfeinde“ auf true stehen und Hinweis + Quelle ausgefüllt sein."
          : "Fressfeinde oder ein erklärender Hinweis fehlen.",
      ],
    ),
  );
}

function pruefeRechner(tier) {
  const checks =
    basisChecks(tier);


  const rechner =
    tier?.originalDaten
      ?.planetZoo2
      ?.rechner;


  const ok =
    hatInhalt(
      rechner,
    );


  checks.push(
    item(
      "Rechnerwerte",
      "planetZoo2.rechner",
      ok,
      [
        !ok
          ? "Rechnerwerte fehlen."
          : null,
      ],
    ),
  );


  return checks;
}


function pruefeTool(
  tier,
  toolId,
) {
  switch (toolId) {
    case TOOL_IDS.MAP:
      return pruefeMap(tier);

    case TOOL_IDS.INFOTAFEL:
      return pruefeInfotafel(tier);

    case TOOL_IDS.AUDIO:
      return pruefeAudio(tier);

    case TOOL_IDS.KINO:
      return pruefeVideo(tier);

    case TOOL_IDS.SYSTEMATIK:
      return pruefeSystematik(tier);

    case TOOL_IDS.NAHRUNGSNETZ:
      return pruefeNahrungsnetz(tier);

    case TOOL_IDS.RECHNER:
      return pruefeRechner(tier);

    default:
      return [];
  }
}


export function pruefeTierDaten(
  tier,
) {
  return TOOLS.map(
    (tool) => {
      const checks =
        pruefeTool(
          tier,
          tool.id,
        );


      return {
        toolId:
          tool.id,
        tool,
        stufe:
          getToolEinstellung(
            tool.id,
          ),
        vollstaendig:
          checks.length >
            0 &&
          checks.every(
            (check) =>
              check.ok,
          ),
        checks,
      };
    },
  );
}


export function getToolPruefung(
  tier,
  toolId,
) {
  return (
    pruefeTierDaten(
      tier,
    ).find(
      (pruefung) =>
        pruefung.toolId ===
        toolId,
    ) ??
    null
  );
}


export function getTierMarkierungsStatus(
  tier,
) {
  const fehler =
    pruefeTierDaten(
      tier,
    ).filter(
      (pruefung) =>
        !pruefung.vollstaendig,
    );


  if (
    fehler.some(
      (pruefung) =>
        pruefung.stufe ===
        TOOL_STUFEN.WICHTIG,
    )
  ) {
    return "error";
  }


  if (
    fehler.some(
      (pruefung) =>
        pruefung.stufe ===
        TOOL_STUFEN.NICHT_WICHTIG,
    )
  ) {
    return "warning";
  }


  return "ok";
}
