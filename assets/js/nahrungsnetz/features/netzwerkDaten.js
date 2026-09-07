import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";


/*
    Alte Begriffe aus bestehenden
    Tier-JSONs werden auf echte Arten
    abgebildet, sobald diese als
    Datensatz geladen sind.

    Dadurch wird z. B. "lion" nicht
    als eigener Ressourcenknoten
    angezeigt, wenn Panthera leo
    vorhanden ist.
*/

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
    de: "zunehmend mit dem Alter",
    en: "increasing with age",
  },
};


/* ======================================== */
/* GRAPH AUS TIERDATEN BAUEN                */
/* ======================================== */

export function buildNahrungsnetzGraph(
  tiere,
  selectedIds,
) {
  const selected =
    new Set(
      selectedIds,
    );


  const focusTiere =
    tiere.filter(
      (tier) =>
        selected.has(
          tier.id,
        ),
    );


  const nodes =
    new Map();

  const edges =
    new Map();


  focusTiere.forEach(
    (tier) => {
      addTierNode(
        nodes,
        tier,
        true,
      );
    },
  );


  focusTiere.forEach(
    (tier) => {
      addClassicFoodWeb(
        tier,
        tiere,
        nodes,
        edges,
      );


      addGenericEcosystemNetwork(
        tier,
        tiere,
        nodes,
        edges,
      );
    },
  );


  return {
    nodes:
      [...nodes.values()],

    edges:
      [...edges.values()],

    focusCount:
      focusTiere.length,
  };
}


/* ======================================== */
/* BESTEHENDES NAHRUNGSNETZ                 */
/* ======================================== */

function addClassicFoodWeb(
  tier,
  tiere,
  nodes,
  edges,
) {
  const netz =
    tier.originalDaten
      ?.daten
      ?.ernaehrung
      ?.nahrungsnetz ??
    tier.nahrungsnetz;


  if (
    !netz ||
    typeof netz !==
      "object"
  ) {
    return;
  }


  const tierNodeId =
    getTierNodeId(
      tier,
    );


  [
    [
      "jungtier",
      netz
        ?.frisst
        ?.jungtier
        ?.werte,
      "frisst.jungtier",
    ],

    [
      "erwachsen",
      netz
        ?.frisst
        ?.erwachsen
        ?.werte,
      "frisst.erwachsen",
    ],
  ].forEach(
    (
      [
        alter,
        werte,
        relationKey,
      ],
    ) => {
      if (
        !Array.isArray(
          werte,
        )
      ) {
        return;
      }


      werte.forEach(
        (
          entry,
          index,
        ) => {
          if (
            !hasText(
              entry?.wert,
            )
          ) {
            return;
          }


          const foodNode =
            resolveEntityNode(
              entry,
              tiere,
            );


          addNode(
            nodes,
            foodNode,
          );


          addEdge(
            edges,
            {
              id:
                createEdgeId(
                  foodNode.id,
                  tierNodeId,
                  `${tier.id}:${relationKey}:${index}`,
                ),

              from:
                foodNode.id,

              to:
                tierNodeId,

              type:
                getEdgeType(
                  entry,
                  alter,
                ),

              label:
                getConditionLabel(
                  entry,
                  alter,
                ),

              route:
                getEntryRoute(
                  entry,
                ),
            },
          );
        },
      );
    },
  );


  [
    [
      "jungtier",
      netz
        ?.wirdGefressenVon
        ?.jungtier
        ?.werte,
      "wirdGefressenVon.jungtier",
    ],

    [
      "erwachsen",
      netz
        ?.wirdGefressenVon
        ?.erwachsen
        ?.werte,
      "wirdGefressenVon.erwachsen",
    ],
  ].forEach(
    (
      [
        alter,
        werte,
        relationKey,
      ],
    ) => {
      if (
        !Array.isArray(
          werte,
        )
      ) {
        return;
      }


      werte.forEach(
        (
          entry,
          index,
        ) => {
          if (
            !hasText(
              entry?.wert,
            )
          ) {
            return;
          }


          const predatorNode =
            resolveEntityNode(
              entry,
              tiere,
            );


          addNode(
            nodes,
            predatorNode,
          );


          addEdge(
            edges,
            {
              id:
                createEdgeId(
                  tierNodeId,
                  predatorNode.id,
                  `${tier.id}:${relationKey}:${index}`,
                ),

              from:
                tierNodeId,

              to:
                predatorNode.id,

              type:
                getEdgeType(
                  entry,
                  alter,
                ),

              label:
                getConditionLabel(
                  entry,
                  alter,
                ),

              route:
                getEntryRoute(
                  entry,
                ),
            },
          );
        },
      );
    },
  );
}


/* ======================================== */
/* SPÄTERES ALLGEMEINES ÖKOSYSTEMNETZ       */
/* ======================================== */

function addGenericEcosystemNetwork(
  tier,
  tiere,
  nodes,
  edges,
) {
  const netz =
    tier.originalDaten
      ?.oekosystemNetz ??
    tier.originalDaten
      ?.daten
      ?.oekosystemNetz ??
    null;


  if (
    !netz ||
    typeof netz !==
      "object"
  ) {
    return;
  }


  const extraNodes =
    Array.isArray(
      netz.knoten,
    )
      ? netz.knoten
      : [];


  extraNodes.forEach(
    (entry) => {
      if (
        !hasText(
          entry?.id,
        )
      ) {
        return;
      }


      const loadedTier =
        findTier(
          tiere,
          entry.id,
        );


      if (loadedTier) {
        addTierNode(
          nodes,
          loadedTier,
          false,
        );

        return;
      }


      addNode(
        nodes,
        {
          id:
            `eco:${slug(entry.id)}`,

          label:
            getLocalizedValue(
              entry.name,
              getLanguage(),
            ) ??
            entry.id,

          subtitle:
            entry.wissenschaftlicherName ??
            "",

          kind:
            normalizeKind(
              entry.typ,
            ),

          kindLabel:
            getKindLabel(
              normalizeKind(
                entry.typ,
              ),
            ),

          focus:
            false,

          position:
            normalizePosition(
              entry.position ??
              entry.darstellung
                ?.position,
            ),
        },
      );
    },
  );


  const verbindungen =
    Array.isArray(
      netz.verbindungen,
    )
      ? netz.verbindungen
      : [];


  verbindungen.forEach(
    (
      entry,
      index,
    ) => {
      if (
        !hasText(
          entry?.von,
        ) ||
        !hasText(
          entry?.zu,
        )
      ) {
        return;
      }


      const from =
        resolveGenericNodeId(
          entry.von,
          tiere,
          nodes,
        );

      const to =
        resolveGenericNodeId(
          entry.zu,
          tiere,
          nodes,
        );


      addEdge(
        edges,
        {
          id:
            createEdgeId(
              from,
              to,
              `eco:${tier.id}:${index}`,
            ),

          from,
          to,

          type:
            getGenericEdgeType(
              entry,
            ),

          label:
            localizedCondition(
              entry.bedingung,
            ),

          route:
            getEntryRoute(
              entry,
            ),
        },
      );
    },
  );
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

      focus,

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
/* EINTRAG ZU KNOTEN                        */
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
        loadedTier.wissenschaftlicherName,

      kind:
        "animal",

      kindLabel:
        getKindLabel(
          "animal",
        ),

      tierId:
        loadedTier.id,

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
      normalizePosition(
        entry?.darstellung
          ?.position ??
        entry?.position,
      ),
  };
}


/* ======================================== */
/* GENERISCHEN KNOTEN FINDEN                */
/* ======================================== */

function resolveGenericNodeId(
  value,
  tiere,
  nodes,
) {
  const loadedTier =
    findTier(
      tiere,
      value,
    );


  if (loadedTier) {
    addTierNode(
      nodes,
      loadedTier,
      false,
    );

    return getTierNodeId(
      loadedTier,
    );
  }


  const existing =
    [...nodes.values()].find(
      (node) =>
        node.id ===
          value ||
        node.label ===
          value ||
        node.subtitle ===
          value ||
        node.id ===
          `eco:${slug(value)}` ||
        node.id ===
          `entity:${slug(value)}`,
    );


  if (existing) {
    return existing.id;
  }


  const kind =
    inferKind(
      value,
      "",
    );


  const node = {
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
  };


  addNode(
    nodes,
    node,
  );


  return node.id;
}


/* ======================================== */
/* KNOTEN / VERBINDUNGEN                    */
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
    if (
      node.focus
    ) {
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


    return;
  }


  nodes.set(
    node.id,
    node,
  );
}


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
      Gleicher Stofffluss wird nicht
      doppelt gezeichnet, nur weil die
      Beziehung in beiden Tier-JSONs
      beschrieben ist.
  */

  const duplicate =
    [...edges.values()].find(
      (existing) =>
        existing.from ===
          edge.from &&
        existing.to ===
          edge.to &&
        existing.type ===
          edge.type &&
        existing.label ===
          edge.label,
    );


  if (duplicate) {
    if (
      !duplicate.route &&
      edge.route
    ) {
      duplicate.route =
        edge.route;
    }

    return;
  }


  edges.set(
    edge.id,
    edge,
  );
}


/* ======================================== */
/* VERBINDUNGS-TYP                          */
/* ======================================== */

function getEdgeType(
  entry,
  alter,
) {
  if (
    entry?.typ ===
      "aas" ||
    entry?.wert ===
      "aas"
  ) {
    return "carrion";
  }


  if (
    alter ===
      "jungtier" ||
    hasText(
      entry?.bedingung,
    )
  ) {
    return "conditional";
  }


  return "direct";
}


function getGenericEdgeType(
  entry,
) {
  if (
    entry?.darstellung ===
      "gepunktet" ||
    entry?.darstellung
      ?.linie ===
      "gepunktet" ||
    entry?.typ ===
      "aas"
  ) {
    return "carrion";
  }


  if (
    entry?.darstellung ===
      "gestrichelt" ||
    entry?.darstellung
      ?.linie ===
      "gestrichelt" ||
    hasText(
      entry?.bedingung,
    )
  ) {
    return "conditional";
  }


  if (
    entry?.typ ===
      "abhaengigkeit"
  ) {
    return "dependency";
  }


  return "direct";
}


/* ======================================== */
/* JSON-DARSTELLUNG                         */
/* ======================================== */

function getTierPosition(
  tier,
) {
  return normalizePosition(
    tier.originalDaten
      ?.darstellung
      ?.nahrungsnetz
      ?.position,
  );
}


function getEntryRoute(
  entry,
) {
  const points =
    entry?.darstellung
      ?.punkte ??
    entry?.layout
      ?.punkte ??
    null;


  if (
    !Array.isArray(
      points,
    )
  ) {
    return null;
  }


  const normalized =
    points
      .map(
        normalizePosition,
      )
      .filter(
        Boolean,
      );


  return normalized.length
    ? normalized
    : null;
}


function normalizePosition(
  value,
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }


  const x =
    Number(
      value.x,
    );

  const y =
    Number(
      value.y,
    );


  if (
    !Number.isFinite(
      x,
    ) ||
    !Number.isFinite(
      y,
    )
  ) {
    return null;
  }


  return {
    x,
    y,
  };
}


/* ======================================== */
/* ART / LABELS                             */
/* ======================================== */

function inferKind(
  value,
  typ,
) {
  if (
    typ ===
      "aas" ||
    value ===
      "aas"
  ) {
    return "carrion";
  }


  if (
    typ ===
      "pflanze" ||
    typ ===
      "frucht"
  ) {
    return "plant";
  }


  if (
    typ ===
      "wasser" ||
    value ===
      "water"
  ) {
    return "water";
  }


  if (
    typ ===
      "mineral" ||
    value ===
      "mineralien"
  ) {
    return "mineral";
  }


  if (
    typ ===
      "tier" ||
    looksScientificName(
      value,
    ) ||
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


  return "resource";
}


function normalizeKind(
  kind,
) {
  const map = {
    tier:
      "animal",

    animal:
      "animal",

    pflanze:
      "plant",

    plant:
      "plant",

    aas:
      "carrion",

    carrion:
      "carrion",

    wasser:
      "water",

    water:
      "water",

    mineral:
      "mineral",

    mineralien:
      "mineral",

    resource:
      "resource",

    ressource:
      "resource",
  };


  return (
    map[
      kind
    ] ??
    "resource"
  );
}


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


function getConditionLabel(
  entry,
  alter,
) {
  const parts =
    [];


  if (
    alter ===
    "jungtier"
  ) {
    parts.push(
      localizedCondition(
        "jungtier",
      ),
    );
  }


  if (
    hasText(
      entry?.bedingung,
    ) &&
    entry.bedingung !==
      "jungtier" &&
    entry.bedingung !==
      "calf"
  ) {
    parts.push(
      localizedCondition(
        entry.bedingung,
      ),
    );
  }


  return [
    ...new Set(
      parts.filter(
        Boolean,
      ),
    ),
  ].join(
    " · ",
  );
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
    ].filter(
      Boolean,
    );


  return (
    tiere.find(
      (tier) =>
        candidates.includes(
          tier.id,
        ) ||
        candidates.includes(
          tier.datenId,
        ) ||
        candidates.includes(
          tier.wissenschaftlicherName,
        ) ||
        candidates.includes(
          tier.originalDaten?.id,
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
  from,
  to,
  source,
) {
  return [
    from,
    to,
    source,
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
    value.trim()
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
