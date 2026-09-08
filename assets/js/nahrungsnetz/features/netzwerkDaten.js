import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";

import {
  getAlleNahrungsBeziehungen,
  getLinienTyp,
  getSelbstBedingungen,
  getZielBedingungen,
} from "../../features/nahrungsBeziehungen.js";

import {
  getBeziehungsLabel,
  getWirkungDarstellung,
} from "../../features/oekologischeBeziehungen.js";


/*
    ============================================================
    NAHRUNGSNETZ -> GRAPHDATEN
    ------------------------------------------------------------

    Diese Datei macht nur Schritt 6:

    - alle geladenen Tiere als Knoten anlegen
    - neue Nahrungsnetz-Struktur lesen
    - Ressourcen / Pflanzen / Aas ergänzen
    - Beziehungen als Graph-Kanten erzeugen
    - beziehung, wirkung und Linientyp getrennt weitergeben

    Noch NICHT Aufgabe dieser Datei:

    - Tierfarben                         -> Schritt 7
    - Maus-/Pfeilsteuerung               -> Schritt 8
    - dynamisches Raster                 -> Schritt 9
    - SVG-Marker / endgültiges Routing   -> Schritt 10

    Richtung im JSON:

    selbst = Tier, dessen JSON gelesen wird
    ziel   = Eintrag unter "wert"

    Beispiel Löwe:

    {
      "wert": "Equus quagga",
      "beziehung": "praedation",
      "wirkung": "+/-"
    }

    selbst = Löwe  (+)
    ziel   = Zebra (-)

    Für die AKTUELLE alte Pfeildarstellung wird from/to bereits so
    gewählt, dass ein einzelner positiver Profiteur den Pfeil erhält.
    Schritt 10 ersetzt das später durch die endgültigen Marker.
    ============================================================
*/


/* ======================================== */
/* ALIASE                                   */
/* ======================================== */

const TIER_ALIASES = {
  lion:
    "Panthera leo",

  hyena:
    "Crocuta crocuta",

  leopard:
    "Panthera pardus",

  crocodile:
    "Crocodylus niloticus",

  human:
    "Homo sapiens",
};


/* ======================================== */
/* LABELS FÜR NICHT GELADENE RESSOURCEN     */
/* ======================================== */

const ENTITY_LABELS = {
  aas: {
    de: "Aas",
    en: "Carrion",
  },

  muttermilch: {
    de: "Muttermilch",
    en: "Mother's milk",
  },

  tierischeNahrung: {
    de: "Tierische Nahrung",
    en: "Animal food",
  },

  plantFood: {
    de: "Pflanzliche Nahrung",
    en: "Plant food",
  },

  grass: {
    de: "Gras",
    en: "Grass",
  },

  leaves: {
    de: "Blätter",
    en: "Leaves",
  },

  fruit: {
    de: "Früchte",
    en: "Fruit",
  },

  roots: {
    de: "Wurzeln",
    en: "Roots",
  },

  twigs: {
    de: "Zweige",
    en: "Twigs",
  },

  bark: {
    de: "Rinde",
    en: "Bark",
  },

  shrubs: {
    de: "Sträucher",
    en: "Shrubs",
  },

  ants: {
    de: "Ameisen",
    en: "Ants",
  },

  termites: {
    de: "Termiten",
    en: "Termites",
  },

  insects: {
    de: "Insekten",
    en: "Insects",
  },

  water: {
    de: "Wasser",
    en: "Water",
  },

  mineralien: {
    de: "Mineralien",
    en: "Minerals",
  },
};


const CONDITION_LABELS = {
  jungtier: {
    de: "Jungtier",
    en: "Young",
  },

  erwachsen: {
    de: "Erwachsen",
    en: "Adult",
  },

  calf: {
    de: "Jungtier",
    en: "Calf",
  },

  bisEtwa3Monate: {
    de: "bis etwa 3 Monate",
    en: "until about 3 months",
  },

  abEtwa3Monaten: {
    de: "ab etwa 3 Monaten",
    en: "from about 3 months",
  },

  bisEtwa6Monate: {
    de: "bis etwa 6 Monate",
    en: "until about 6 months",
  },

  increasingWithAge: {
    de: "mit zunehmendem Alter",
    en: "increasing with age",
  },

  geschwaecht: {
    de: "geschwächt",
    en: "weakened",
  },

  krank: {
    de: "krank",
    en: "sick",
  },

  verletzt: {
    de: "verletzt",
    en: "injured",
  },

  geeigneterZustand: {
    de: "geeigneter Zustand",
    en: "suitable condition",
  },
};


/* ======================================== */
/* ÖFFENTLICHER GRAPH-BUILDER               */
/* ======================================== */

export function buildNahrungsnetzGraph(
  tiere,
  selectedIds = [],
) {
  const alleTiere =
    Array.isArray(
      tiere,
    )
      ? tiere
      : [];


  const selected =
    new Set(
      Array.isArray(
        selectedIds,
      )
        ? selectedIds
        : [],
    );


  const nodes =
    new Map();

  const edges =
    new Map();


  /*
      ====================================
      ALLE GELADENEN TIERE
      ====================================

      Nicht mehr nur die Home-Auswahl.

      Die Auswahl bestimmt hier lediglich
      node.focus. Farbe folgt erst in
      Schritt 7.
  */

  alleTiere.forEach(
    (tier) => {
      addTierNode(
        nodes,
        tier,
        selected.has(
          tier.id,
        ),
      );
    },
  );


  /*
      ====================================
      ALLE GESPEICHERTEN BEZIEHUNGEN
      ====================================

      Jede Beziehung wird nur beim Tier
      gelesen, in dessen JSON sie steht.

      "wirdGefressenVon" wird hier nicht
      mehr gelesen und nicht mehr benötigt.
  */

  alleTiere.forEach(
    (tier) => {
      addTierRelations(
        tier,
        alleTiere,
        nodes,
        edges,
      );
    },
  );


  const focusCount =
    alleTiere.filter(
      (tier) =>
        selected.has(
          tier.id,
        ),
    ).length;


  return {
    nodes:
      [...nodes.values()],

    edges:
      [...edges.values()],

    focusCount,

    animalCount:
      alleTiere.length,
  };
}


/* ======================================== */
/* BEZIEHUNGEN EINES TIERES                 */
/* ======================================== */

function addTierRelations(
  tier,
  tiere,
  nodes,
  edges,
) {
  const selbstNodeId =
    getTierNodeId(
      tier,
    );


  const relationen =
    getAlleNahrungsBeziehungen(
      tier,
    );


  relationen.forEach(
    (
      relation,
      index,
    ) => {
      const lebensphase =
        relation.lebensphase;

      const beziehung =
        relation.beziehung;


      if (
        !beziehung ||
        !hasText(
          beziehung.wert,
        )
      ) {
        return;
      }


      const zielNode =
        resolveEntityNode(
          beziehung,
          tiere,
        );


      addNode(
        nodes,
        zielNode,
      );


      const zielNodeId =
        zielNode.id;


      if (
        selbstNodeId ===
        zielNodeId
      ) {
        return;
      }


      const wirkung =
        String(
          beziehung.wirkung ??
          "",
        ).trim();


      const wirkungDarstellung =
        getWirkungDarstellung(
          wirkung,
        );


      const richtung =
        resolveCurrentEdgeDirection({
          selbstNodeId,
          zielNodeId,
          wirkungDarstellung,
        });


      const beziehungsTyp =
        String(
          beziehung.beziehung ??
          "",
        ).trim();


      const beziehungLabel =
        getBeziehungsLabel(
          beziehungsTyp,
          getLanguage(),
        );


      const conditionLabel =
        getConditionLabel(
          beziehung,
          lebensphase,
        );


      addEdge(
        edges,
        {
          id:
            createEdgeId(
              tier.id,
              lebensphase,
              index,
              beziehung,
            ),


          /*
              from/to dienen aktuell noch
              dem bestehenden SVG-Renderer.

              Die semantischen Enden stehen
              zusätzlich separat auf der Kante:

              selbstNodeId
              zielNodeId
          */

          from:
            richtung.from,

          to:
            richtung.to,


          selbstNodeId,
          zielNodeId,


          /*
              Tier, in dessen JSON diese
              Beziehung gepflegt wird.

              Schritt 7 kann genau darüber
              die Tierfarbe bestimmen.
          */

          ownerTierId:
            tier.id,


          lebensphase,


          /*
              WAS ist das Ziel?

              tier / pflanze / nutzung /
              aas / giftig
          */

          zielTyp:
            beziehung.typ ??
            "",


          /*
              WELCHE ökologische Beziehung?
          */

          beziehung:
            beziehungsTyp,

          beziehungLabel,


          /*
              WIRKUNG aus Sicht:

              selbst / ziel

              z. B. +/-
          */

          wirkung,

          wirkungDarstellung,


          /*
              LINIENTYP bleibt unabhängig
              von Wirkung und Tierfarbe.
          */

          type:
            getGraphLineType(
              beziehung,
              lebensphase,
            ),


          /*
              Der bestehende Renderer kann
              nur EIN Label anzeigen.

              Deshalb steht auf der Linie
              jetzt der Beziehungstyp.

              Die Bedingung wird trotzdem
              separat mitgegeben und kann in
              Schritt 10 zusätzlich angezeigt
              oder als Tooltip genutzt werden.
          */

          label:
            beziehungLabel,

          conditionLabel,


          selbstBedingungen:
            getSelbstBedingungen(
              beziehung,
            ),

          zielBedingungen:
            getZielBedingungen(
              beziehung,
            ),


          gift:
            beziehung.gift ??
            null,

          nutzung:
            beziehung.nutzung ??
            null,

          aas:
            beziehung.aas ??
            null,

          hinweis:
            beziehung.hinweis ??
            null,

          quelle:
            beziehung.quelle ??
            "",


          route:
            getEntryRoute(
              beziehung,
            ),
        },
      );
    },
  );
}


/* ======================================== */
/* AKTUELLE PFEILRICHTUNG                   */
/* ======================================== */

function resolveCurrentEdgeDirection({
  selbstNodeId,
  zielNodeId,
  wirkungDarstellung,
}) {
  const richtung =
    wirkungDarstellung
      ?.richtung ??
    "selbst";


  /*
      Ein positiver Profiteur ist "selbst".

      Beispiel:
      Löwe +/- Zebra

      Zebra -> Löwe
  */

  if (
    richtung ===
    "selbst"
  ) {
    return {
      from:
        zielNodeId,

      to:
        selbstNodeId,
    };
  }


  /*
      Positiver Profiteur ist das Ziel.
  */

  if (
    richtung ===
    "ziel"
  ) {
    return {
      from:
        selbstNodeId,

      to:
        zielNodeId,
    };
  }


  /*
      +/+ oder Beziehungen ohne eindeutige
      Richtung bekommen vorläufig eine
      stabile technische Richtung.

      Schritt 10 zeichnet daraus:
      - zwei Pfeile
      - keine Pfeile
      - Spezialmarker
  */

  return {
    from:
      selbstNodeId,

    to:
      zielNodeId,
  };
}


/* ======================================== */
/* LINIENTYP                                */
/* ======================================== */

function getGraphLineType(
  beziehung,
  lebensphase,
) {
  const type =
    getLinienTyp(
      beziehung,
    );


  /*
      Aas und Gift haben Vorrang.
  */

  if (
    type ===
      "carrion" ||
    type ===
      "toxic"
  ) {
    return type;
  }


  /*
      Die Legende lautet weiterhin:

      Bedingung / Jungtier

      Darum wird eine Beziehung, die nur
      im Bereich "jungtier" steht,
      gestrichelt dargestellt, auch wenn
      bedingung.selbst/ziel leer ist.
  */

  if (
    lebensphase ===
    "jungtier"
  ) {
    return "conditional";
  }


  return type;
}


/* ======================================== */
/* TIER-KNOTEN                              */
/* ======================================== */

function addTierNode(
  nodes,
  tier,
  focus,
) {
  addNode(
    nodes,
    {
      id:
        getTierNodeId(
          tier,
        ),

      label:
        getTierName(
          tier,
        ),

      subtitle:
        tier.wissenschaftlicherName ??
        tier.datenId ??
        "",

      kind:
        "animal",

      kindLabel:
        getKindLabel(
          "animal",
        ),

      tierId:
        tier.id,

      focus:
        Boolean(
          focus,
        ),

      position:
        getTierPosition(
          tier,
        ),
    },
  );
}


function getTierNodeId(
  tier,
) {
  return `tier:${tier.id}`;
}


/* ======================================== */
/* EINTRAG -> KNOTEN                        */
/* ======================================== */

function resolveEntityNode(
  entry,
  tiere,
) {
  const value =
    entry.wert;


  const loadedTier =
    findTier(
      tiere,
      value,
    );


  if (loadedTier) {
    return {
      id:
        getTierNodeId(
          loadedTier,
        ),

      label:
        getTierName(
          loadedTier,
        ),

      subtitle:
        loadedTier.wissenschaftlicherName ??
        loadedTier.datenId ??
        "",

      kind:
        "animal",

      kindLabel:
        getKindLabel(
          "animal",
        ),

      tierId:
        loadedTier.id,

      /*
          Der echte focus-Wert wird beim
          initialen Anlegen aller Tiere
          gesetzt und von addNode erhalten.
      */

      focus:
        false,

      position:
        getTierPosition(
          loadedTier,
        ),
    };
  }


  const kind =
    inferKind(
      value,
      entry?.typ,
    );


  return {
    id:
      `entity:${slug(value)}`,

    label:
      getEntityLabel(
        value,
      ),

    subtitle:
      looksScientificName(
        value,
      )
        ? value
        : "",

    kind,

    kindLabel:
      getKindLabel(
        kind,
      ),

    focus:
      false,

    position:
      normalizeSlot(
        entry?.darstellung
          ?.position ??
        entry?.position,
      ),
  };
}


/* ======================================== */
/* KNOTEN                                   */
/* ======================================== */

function addNode(
  nodes,
  node,
) {
  const existing =
    nodes.get(
      node.id,
    );


  if (existing) {
    /*
        Ausgewählte Tierknoten verlieren
        ihren focus nicht, wenn sie später
        nochmals als Ziel auftauchen.
    */

    if (node.focus) {
      existing.focus =
        true;
    }


    if (
      !existing.position &&
      node.position
    ) {
      existing.position =
        node.position;
    }


    return existing;
  }


  nodes.set(
    node.id,
    node,
  );


  return node;
}


/* ======================================== */
/* KANTEN                                   */
/* ======================================== */

function addEdge(
  edges,
  edge,
) {
  if (
    edge.from ===
    edge.to
  ) {
    return;
  }


  /*
      Keine automatische Zusammenfassung
      verschiedener Lebensphasen.

      Eine Jungtier- und eine Erwachsenen-
      Beziehung dürfen fachlich verschieden
      sein und müssen als getrennte Kanten
      erhalten bleiben.

      Nur exakt dieselbe erzeugte ID wird
      nicht doppelt eingetragen.
  */

  if (
    edges.has(
      edge.id,
    )
  ) {
    return;
  }


  edges.set(
    edge.id,
    edge,
  );
}


/* ======================================== */
/* POSITION AUS JSON                        */
/* ======================================== */

function getTierPosition(
  tier,
) {
  return normalizeSlot(
    tier.originalDaten
      ?.darstellung
      ?.nahrungsnetz
      ?.position,
  );
}


/* ======================================== */
/* OPTIONALE ROUTE AUS JSON                 */
/* ======================================== */

function getEntryRoute(
  entry,
) {
  const route =
    entry?.darstellung
      ?.route ??
    entry?.darstellung
      ?.linienRoute ??
    entry?.layout
      ?.route ??
    null;


  if (
    !Array.isArray(
      route,
    ) ||
    !route.length
  ) {
    return null;
  }


  const normalized =
    route
      .map(
        (step) => {
          if (
            typeof step ===
            "string"
          ) {
            if (
              !/^L\d+\.\d+$/i.test(
                step,
              )
            ) {
              return null;
            }


            return {
              bereich:
                step,

              spur:
                null,
            };
          }


          if (
            !step ||
            typeof step !==
              "object"
          ) {
            return null;
          }


          const bereich =
            step.bereich ??
            step.korridor ??
            "";


          if (
            !/^L\d+\.\d+$/i.test(
              bereich,
            )
          ) {
            return null;
          }


          const spur =
            Number(
              step.spur,
            );


          return {
            bereich,

            spur:
              Number.isInteger(
                spur,
              ) &&
              spur >
                0
                ? spur
                : null,
          };
        },
      )
      .filter(
        Boolean,
      );


  return normalized.length
    ? normalized
    : null;
}


/* ======================================== */
/* SLOT NORMALISIEREN                       */
/* ======================================== */

function normalizeSlot(
  value,
) {
  if (
    typeof value ===
      "string" &&
    /^\d+\.\d+$/.test(
      value.trim(),
    )
  ) {
    return value.trim();
  }


  if (
    value &&
    typeof value ===
      "object"
  ) {
    const row =
      Number(
        value.zeile ??
        value.row,
      );

    const column =
      Number(
        value.spalte ??
        value.column,
      );


    if (
      Number.isInteger(
        row,
      ) &&
      row >
        0 &&
      Number.isInteger(
        column,
      ) &&
      column >
        0
    ) {
      return `${row}.${column}`;
    }
  }


  return null;
}


/* ======================================== */
/* ART DES KNOTENS                          */
/* ======================================== */

function inferKind(
  value,
  typ,
) {
  const normalizedTyp =
    String(
      typ ??
      "",
    )
      .trim()
      .toLowerCase();


  if (
    normalizedTyp ===
      "aas" ||
    value ===
      "aas"
  ) {
    return "carrion";
  }


  if (
    normalizedTyp ===
    "pflanze"
  ) {
    return "plant";
  }


  if (
    normalizedTyp ===
    "tier"
  ) {
    return "animal";
  }


  /*
      "giftig" beschreibt in unserem
      Nahrungsnetz die Gefahrenbeziehung.

      Der Knotentyp wird deshalb soweit
      möglich aus dem Wert abgeleitet.
  */

  if (
    looksScientificName(
      value,
    )
  ) {
    return "animal";
  }


  if (
    [
      "ants",
      "termites",
      "insects",
    ].includes(
      value,
    )
  ) {
    return "animal";
  }


  if (
    [
      "plantFood",
      "grass",
      "leaves",
      "fruit",
      "roots",
      "twigs",
      "bark",
      "shrubs",
    ].includes(
      value,
    )
  ) {
    return "plant";
  }


  if (
    value ===
    "water"
  ) {
    return "water";
  }


  if (
    value ===
    "mineralien"
  ) {
    return "mineral";
  }


  return "resource";
}


/* ======================================== */
/* KNOTENART BESCHRIFTEN                    */
/* ======================================== */

function getKindLabel(
  kind,
) {
  const language =
    getLanguage();


  const labels = {
    animal: {
      de: "Tier",
      en: "Animal",
    },

    plant: {
      de: "Pflanze",
      en: "Plant",
    },

    carrion: {
      de: "Aas",
      en: "Carrion",
    },

    water: {
      de: "Wasser",
      en: "Water",
    },

    mineral: {
      de: "Mineral",
      en: "Mineral",
    },

    resource: {
      de: "Ressource",
      en: "Resource",
    },
  };


  return (
    labels[
      kind
    ]?.[
      language
    ] ??
    labels[
      kind
    ]?.de ??
    kind
  );
}


/* ======================================== */
/* RESSOURCEN BESCHRIFTEN                   */
/* ======================================== */

function getEntityLabel(
  value,
) {
  const language =
    getLanguage();

  const labels =
    ENTITY_LABELS[
      value
    ];


  return (
    labels?.[
      language
    ] ??
    labels?.de ??
    value
  );
}


/* ======================================== */
/* BEDINGUNGEN BESCHRIFTEN                  */
/* ======================================== */

function getConditionLabel(
  entry,
  lebensphase,
) {
  const teile =
    [];


  /*
      Der obere JSON-Bereich beschreibt die
      Lebensphase von "selbst".
  */

  if (
    lebensphase ===
    "jungtier"
  ) {
    teile.push(
      `${getRoleLabel("self")}: ${localizedCondition("jungtier")}`,
    );
  }


  const selbst =
    getSelbstBedingungen(
      entry,
    );


  if (
    selbst.length
  ) {
    teile.push(
      `${getRoleLabel("self")}: ${selbst
        .map(localizedCondition)
        .join(", ")}`,
    );
  }


  const ziel =
    getZielBedingungen(
      entry,
    );


  if (
    ziel.length
  ) {
    teile.push(
      `${getRoleLabel("target")}: ${ziel
        .map(localizedCondition)
        .join(", ")}`,
    );
  }


  return [
    ...new Set(
      teile.filter(
        Boolean,
      ),
    ),
  ].join(
    " · ",
  );
}


function getRoleLabel(
  role,
) {
  const english =
    String(
      getLanguage(),
    ).startsWith(
      "en",
    );


  if (
    role ===
    "target"
  ) {
    return english
      ? "Target"
      : "Ziel";
  }


  return english
    ? "Self"
    : "Selbst";
}


function localizedCondition(
  value,
) {
  if (
    !hasText(
      value,
    )
  ) {
    return "";
  }


  const language =
    getLanguage();

  const labels =
    CONDITION_LABELS[
      value
    ];


  return (
    labels?.[
      language
    ] ??
    labels?.de ??
    value
  );
}


/* ======================================== */
/* TIER FINDEN / ALIASE                     */
/* ======================================== */

function findTier(
  tiere,
  value,
) {
  const alias =
    TIER_ALIASES[
      value
    ];


  const candidates =
    [
      value,
      alias,
    ]
      .filter(
        Boolean,
      )
      .map(
        (item) =>
          String(
            item,
          ).trim(),
      );


  return (
    tiere.find(
      (tier) =>
        candidates.includes(
          String(
            tier.id ??
            "",
          ).trim(),
        ) ||
        candidates.includes(
          String(
            tier.datenId ??
            "",
          ).trim(),
        ) ||
        candidates.includes(
          String(
            tier.wissenschaftlicherName ??
            "",
          ).trim(),
        ) ||
        candidates.includes(
          String(
            tier.originalDaten
              ?.id ??
            "",
          ).trim(),
        ),
    ) ??
    null
  );
}


function getTierName(
  tier,
) {
  return (
    getLocalizedValue(
      tier.namen,
      getLanguage(),
    ) ??
    tier.wissenschaftlicherName ??
    tier.id
  );
}


/* ======================================== */
/* HELFER                                   */
/* ======================================== */

function createEdgeId(
  tierId,
  lebensphase,
  index,
  beziehung,
) {
  return [
    "foodweb",
    tierId,
    lebensphase,
    index,
    beziehung?.beziehung ??
      "",
    beziehung?.wirkung ??
      "",
    beziehung?.wert ??
      "",
  ].join(
    "|",
  );
}


function hasText(
  value,
) {
  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  );
}


function looksScientificName(
  value,
) {
  return (
    typeof value ===
      "string" &&
    /^[A-Z][a-z-]+\s+[a-z][a-z-]+/.test(
      value,
    )
  );
}


function slug(
  value,
) {
  return String(
    value,
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
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}
