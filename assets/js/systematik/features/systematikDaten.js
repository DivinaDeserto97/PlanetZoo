import { getLanguage, getLocalizedValue } from "../../features/language.js";

import {
  getBeziehungsLabel,
  getDomestikationsKurz,
  getLebensstatusKurz,
  getRangLabel,
  getSchutzstatusKurz,
  getSpielKurz,
} from "./systematikLabels.js";

export function buildSystematikGraph(tiere, selectedIds, filters = {}) {
  const selectedSet = new Set(selectedIds);

  const selectedTiere = tiere.filter((tier) => selectedSet.has(tier.id));

  const context = {
    nodes: new Map(),

    edges: new Map(),

    aliases: new Map(),

    usedSlots: new Set(),

    selectedSet,

    loadedIndex: buildLoadedIndex(tiere),
  };

  /*
      1. Durchgang:
      Nur die Systematik-Pfade der wirklich
      ausgewählten Tiere anlegen.

      Dadurch entstehen keine zusätzlichen
      Tierkarten nur weil sie bei einem anderen
      Tier als nahe Verwandte erwähnt werden.
  */
  selectedTiere.forEach((tier, index) => {
    addTierGrundgeruest(context, tier, index);
  });

  /*
      2. Durchgang:
      Beziehungen und Aufspaltungen erst dann
      ergänzen, wenn alle ausgewählten Tiere
      bereits als eindeutige Knoten existieren.
  */
  selectedTiere.forEach((tier, index) => {
    addTierBeziehungen(context, tier, index);
  });

  const nodes = [...context.nodes.values()].filter((node) =>
    nodePassesFilters(node, filters),
  );

  const visibleIds = new Set(nodes.map((node) => node.id));

  const edges = [...context.edges.values()].filter(
    (edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to),
  );

  return {
    nodes,
    edges,

    focusCount: selectedTiere.length,
  };
}

/* ======================================== */
/* EIN TIER                                 */
/* ======================================== */

function addTierGrundgeruest(context, tier, branchIndex) {
  const systematik = tier?.originalDaten?.systematik ?? tier?.systematik ?? {};

  const evolution = systematik?.evolution ?? {};

  const knoten = Array.isArray(evolution.knoten) ? evolution.knoten : [];

  const baseRow = branchIndex * 4 + 1;

  let previousId = null;

  let focusId = null;

  knoten.forEach((knotenEintrag, index) => {
    const matchesFocus = taxonMatchesTier(knotenEintrag, tier);

    const loadedTier = matchesFocus
      ? tier
      : findLoadedTier(context, [knotenEintrag.id, knotenEintrag.name]);

    const nodeId = ensureTaxonNode(context, {
      ref: knotenEintrag.id ?? knotenEintrag.name,

      data: knotenEintrag,

      loadedTier,

      focus: matchesFocus,

      /*
          Alles ausser dem ausgewählten Tier selbst
          ist Hintergrund / Stammbaum-Gerüst.
      */
      backbone: !matchesFocus,

      position: knotenEintrag.position ?? `${baseRow}.${index + 1}`,
    });

    if (previousId && previousId !== nodeId) {
      addEdge(context, {
        id: `lineage:${previousId}>${nodeId}`,

        from: previousId,

        to: nodeId,

        type: "direct",

        label: "",
      });
    }

    previousId = nodeId;

    if (matchesFocus) {
      focusId = nodeId;
    }
  });

  /*
      Falls der Datensatz nur den Hintergrund
      (z. B. bis zur Gattung) enthält, wird NICHT
      der letzte Hintergrund-Knoten zum Tier gemacht.

      Stattdessen kommt das ausgewählte Tier einmalig
      als eigener Art-Knoten dahinter.
  */
  if (!focusId) {
    const scientificName = getTierScientificName(tier);

    /*
        Wenn gar kein Hintergrund vorhanden ist,
        mindestens die Gattung automatisch ergänzen.
    */
    if (!previousId) {
      const genus = getTierGattung(tier);

      if (genus && normalize(genus) !== normalize(scientificName)) {
        previousId = ensureTaxonNode(context, {
          ref: genus,

          data: {
            id: genus,

            name: genus,

            rang: "gattung",

            quelle: "automatischAusArtname",
          },

          loadedTier: null,

          focus: false,

          backbone: true,

          position: `${baseRow}.1`,
        });
      }
    }

    focusId = ensureTaxonNode(context, {
      ref: scientificName,

      data: {
        id: scientificName,

        name: scientificName,

        rang: "art",

        quelle: "tierDatensatz",
      },

      loadedTier: tier,

      focus: true,

      backbone: false,

      position: `${baseRow}.${Math.max(1, knoten.length + 1)}`,
    });

    if (previousId && previousId !== focusId) {
      addEdge(context, {
        id: `lineage:${previousId}>${focusId}`,

        from: previousId,

        to: focusId,

        type: "direct",

        label: "",
      });
    }
  }
}

function addTierBeziehungen(context, tier, branchIndex) {
  const systematik = tier?.originalDaten?.systematik ?? tier?.systematik ?? {};

  const evolution = systematik?.evolution ?? {};

  const knoten = Array.isArray(evolution.knoten) ? evolution.knoten : [];

  const baseRow = branchIndex * 4 + 1;

  const focusId = findAlias(context, [tier.id, getTierScientificName(tier)]);

  if (!focusId) {
    return;
  }

  addNaheVerwandte(context, systematik, focusId);

  addExplicitConnections(context, evolution);

  addAufspaltungen(context, evolution, baseRow, knoten.length);
}

/* ======================================== */
/* NAHE VERWANDTE                           */
/* ======================================== */

function addNaheVerwandte(context, systematik, focusId) {
  const verwandt = Array.isArray(systematik?.naheVerwandte)
    ? systematik.naheVerwandte
    : [];

  verwandt.forEach((eintrag) => {
    /*
        Wichtig:
        Hier wird KEIN neuer Tier-Knoten erzeugt.

        Eine nahe verwandte Art erscheint erst dann,
        wenn sie selbst ausgewählt wurde und deshalb
        bereits aus ihrem eigenen Datensatz im Graph
        vorhanden ist.
    */
    const nodeId = findAlias(context, [eintrag.id]);

    if (!nodeId) {
      return;
    }

    const node = context.nodes.get(nodeId);

    if (
      !node?.tierId ||
      !context.selectedSet.has(node.tierId) ||
      nodeId === focusId
    ) {
      return;
    }

    const pairId = [focusId, nodeId].sort().join("<>");

    addEdge(context, {
      /*
          Nahe Verwandtschaft ist hier ungerichtet.
          Darum bekommt dasselbe Tierpaar immer dieselbe
          ID - auch wenn beide JSON-Dateien die Beziehung
          gegenseitig eintragen.
      */
      id: `related:${pairId}`,

      from: focusId,

      to: nodeId,

      type: "direct",

      /*
          0/0 wird hier nur benutzt,
          damit der gemeinsame SVG-Renderer
          KEINEN Pfeil zeichnet.

          Es ist keine ökologische Wirkung.
      */
      wirkung: "0/0",

      label: getBeziehungsLabel(eintrag.beziehung),
    });
  });
}

/* ======================================== */
/* EXPLIZITE VERBINDUNGEN                   */
/* ======================================== */

function addExplicitConnections(context, evolution) {
  const verbindungen = Array.isArray(evolution?.verbindungen)
    ? evolution.verbindungen
    : [];

  verbindungen.forEach((verbindung, index) => {
    /*
        Explizite Verbindungen dürfen nur bereits
        vorhandene Hintergrund- oder Auswahlknoten
        verbinden. Sie legen keine weiteren Arten an.
    */
    const from = findAlias(context, [verbindung.von]);

    const to = findAlias(context, [verbindung.nach]);

    if (!from || !to || from === to) {
      return;
    }

    const darstellung = getConnectionStyle(verbindung.typ);

    addEdge(context, {
      id: `explicit:${verbindung.typ}:${from}>${to}:${index}`,

      from,
      to,

      type: darstellung.type,

      wirkung: darstellung.neutral ? "0/0" : undefined,

      label: getBeziehungsLabel(verbindung.typ),
    });
  });
}

/* ======================================== */
/* AUFSPALTUNGEN                            */
/* ======================================== */

function addAufspaltungen(context, evolution, baseRow, pathLength) {
  const aufspaltungen = Array.isArray(evolution?.aufspaltungen)
    ? evolution.aufspaltungen
    : [];

  aufspaltungen.forEach((aufspaltung, index) => {
    /*
        Auch eine Aufspaltung erzeugt keine fehlende
        Tierart mehr. Der Split wird erst gezeigt, wenn
        beide referenzierten Linien bereits im Graph
        vorhanden sind.

        Beispiel:
        Löwe ausgewählt, Leopard nicht ausgewählt
        -> kein zusätzlicher Leopard-Knoten.

        Löwe UND Leopard ausgewählt
        -> vorhandene Knoten werden über die
           Aufspaltung miteinander verknüpft.
    */
    const a = findAlias(context, [aufspaltung.linieA]);

    const b = findAlias(context, [aufspaltung.linieB]);

    if (!a || !b || a === b) {
      return;
    }

    const splitPairId = [a, b].sort().join("<>");

    /*
        Auch der Split wird pro Linienpaar nur einmal
        angelegt. So entstehen beim späteren Ergänzen
        weiterer Tier-JSONs keine doppelten Aufspaltungen.
    */
    const splitId = `split:${safeId(splitPairId)}`;

    if (!context.nodes.has(splitId)) {
      const time = Number.isFinite(aufspaltung.zeitVorHeuteMioJahre)
        ? `≈ ${aufspaltung.zeitVorHeuteMioJahre} Mio. Jahre`
        : "";

      const position = claimSlot(
        context,
        `${baseRow + 2 + index}.${Math.max(1, pathLength - 1)}`,
      );

      context.nodes.set(splitId, {
        id: splitId,

        label: "Aufspaltung",

        subtitle: time,

        kind: "split",

        kindLabel: "DIVERGENZ",

        focus: false,

        position,

        backbone: true,

        systematikMeta: {},
      });
    }

    const type = String(aufspaltung.typ ?? "")
      .toLowerCase()
      .includes("ungefaehr")
      ? "conditional"
      : "direct";

    addEdge(context, {
      id: `split-a:${splitId}>${a}`,

      from: splitId,

      to: a,

      type,

      label: "",
    });

    addEdge(context, {
      id: `split-b:${splitId}>${b}`,

      from: splitId,

      to: b,

      type,

      label: "",
    });
  });
}

/* ======================================== */
/* KNOTEN ERSTELLEN                         */
/* ======================================== */

function ensureTaxonNode(
  context,
  {
    ref,
    data = {},
    loadedTier = null,
    focus = false,
    backbone = false,
    position,
  },
) {
  const aliases = [
    ref,
    data.id,
    data.name,
    loadedTier ? getTierScientificName(loadedTier) : null,
    loadedTier?.id,
  ].filter(Boolean);

  const existingId = findAlias(context, aliases);

  const meta = createMeta(data, loadedTier);

  if (existingId) {
    const node = context.nodes.get(existingId);

    if (node) {
      node.focus = node.focus || focus;

      if (loadedTier && !node.tierId) {
        node.tierId = loadedTier.id;
      }

      if (node.tierId) {
        node.selected = context.selectedSet.has(node.tierId);
      }

      node.backbone = node.backbone && backbone;

      mergeMeta(node.systematikMeta, meta);

      refreshNodeStyle(node, data.rang);
    }

    registerAliases(context, existingId, aliases);

    return existingId;
  }

  const canonical = data.id ?? data.name ?? ref ?? "taxon";

  let nodeId = `taxon:${safeId(canonical)}`;

  let suffix = 2;

  while (context.nodes.has(nodeId)) {
    nodeId = `taxon:${safeId(canonical)}-${suffix++}`;
  }

  const scientificName = loadedTier
    ? getTierScientificName(loadedTier)
    : (data.name ?? ref ?? data.id);

  const commonName = loadedTier
    ? getTierName(loadedTier)
    : getOptionalName(data.deutscherName);

  const label = commonName || scientificName || canonical;

  const subtitle =
    commonName && scientificName !== commonName ? scientificName : "";

  const node = {
    id: nodeId,

    label,

    subtitle,

    kind: "taxon",

    kindLabel: "",

    focus,

    position: claimSlot(context, position ?? "1.1"),

    backbone,

    systematikMeta: meta,
  };

  if (loadedTier) {
    node.tierId = loadedTier.id;

    node.selected = context.selectedSet.has(loadedTier.id);
  }

  refreshNodeStyle(node, data.rang);

  context.nodes.set(nodeId, node);

  registerAliases(context, nodeId, aliases);

  return nodeId;
}

/* ======================================== */
/* META                                     */
/* ======================================== */

function createMeta(data, loadedTier) {
  const spiele = Array.isArray(data?.spiele) ? [...data.spiele] : [];

  /*
      Geladene Planet-Zoo-2-Tiere bekommen
      automatisch PZ2 als Herkunft, falls ihr
      Datensatz tatsächlich einen PZ2-Bereich hat.
  */

  if (
    loadedTier &&
    (loadedTier?.originalDaten?.planetZoo2 ||
      loadedTier?.originalDaten?.quellen?.planetZoo2) &&
    !spiele.includes("planetZoo2")
  ) {
    spiele.push("planetZoo2");
  }

  return {
    rang: data?.rang ?? "",

    lebensstatus: data?.lebensstatus ?? (loadedTier ? "lebend" : ""),

    domestikationsstatus: data?.domestikationsstatus ?? "",

    schutzstatus: data?.schutzstatus ?? loadedTier?.filter?.schutzstatus ?? "",

    spiele: [...new Set(spiele)],
  };
}

function mergeMeta(target, source) {
  if (!target || !source) {
    return;
  }

  ["rang", "lebensstatus", "domestikationsstatus", "schutzstatus"].forEach(
    (key) => {
      if (!target[key] && source[key]) {
        target[key] = source[key];
      }
    },
  );

  target.spiele = [
    ...new Set([...(target.spiele ?? []), ...(source.spiele ?? [])]),
  ];
}

/* ======================================== */
/* KNOTEN-DARSTELLUNG                       */
/* ======================================== */

function refreshNodeStyle(node, rang) {
  const meta = node.systematikMeta ?? {};

  const parts = [];

  const rangLabel = getRangLabel(rang ?? meta.rang ?? "taxon");

  if (rangLabel) {
    parts.push(rangLabel);
  }

  const life = getLebensstatusKurz(meta.lebensstatus);

  if (life) {
    parts.push(life);
  }

  const domestication = getDomestikationsKurz(meta.domestikationsstatus);

  if (domestication) {
    parts.push(domestication);
  }

  const protection = getSchutzstatusKurz(meta.schutzstatus);

  if (protection) {
    parts.push(protection);
  }

  (meta.spiele ?? []).forEach((game) => {
    parts.push(getSpielKurz(game));
  });

  node.kindLabel = parts.join(" · ");

  if (meta.lebensstatus === "ausgestorben") {
    node.kind = "extinct";

    return;
  }

  if (meta.domestikationsstatus === "domestiziert") {
    node.kind = "domesticated";

    return;
  }

  if (meta.domestikationsstatus === "wildform") {
    node.kind = "wild";

    return;
  }

  node.kind = "taxon";
}

/* ======================================== */
/* FILTER                                   */
/* ======================================== */

function nodePassesFilters(node, filters) {
  if (node.kind === "split" || node.backbone) {
    return true;
  }

  const meta = node.systematikMeta ?? {};

  if (meta.lebensstatus === "lebend" && filters.lebend === false) {
    return false;
  }

  if (meta.lebensstatus === "ausgestorben" && filters.ausgestorben === false) {
    return false;
  }

  if (meta.domestikationsstatus === "wildform" && filters.wildform === false) {
    return false;
  }

  if (
    meta.domestikationsstatus === "domestiziert" &&
    filters.domestiziert === false
  ) {
    return false;
  }

  if (Array.isArray(meta.spiele) && meta.spiele.length) {
    const visibleGame = meta.spiele.some((game) => filters[game] !== false);

    if (!visibleGame) {
      return false;
    }
  }

  return true;
}

/* ======================================== */
/* VERBINDUNG                               */
/* ======================================== */

function addEdge(context, edge) {
  if (!edge?.from || !edge?.to || edge.from === edge.to) {
    return;
  }

  if (context.edges.has(edge.id)) {
    return;
  }

  context.edges.set(edge.id, edge);
}

function getConnectionStyle(type) {
  switch (type) {
    case "domestikation":
      return {
        type: "dependency",

        neutral: false,
      };

    case "naheVerwandtschaft":
    case "wildform":
      return {
        type: "direct",

        neutral: true,
      };

    case "unsichereVerwandtschaft":
      return {
        type: "conditional",

        neutral: true,
      };

    case "aufspaltung":
      return {
        type: "direct",

        neutral: false,
      };

    case "abstammungslinie":
    default:
      return {
        type: "direct",

        neutral: false,
      };
  }
}

/* ======================================== */
/* GELADENE TIERE                           */
/* ======================================== */

function buildLoadedIndex(tiere) {
  const map = new Map();

  tiere.forEach((tier) => {
    [
      tier.id,

      tier?.wissenschaftlicherName,

      tier?.originalDaten?.id,

      tier?.originalDaten?.daten?.taxonomie?.werte?.[0]?.art,
    ]
      .filter(Boolean)
      .forEach((key) => {
        map.set(normalize(key), tier);
      });
  });

  return map;
}

function findLoadedTier(context, aliases) {
  for (const alias of aliases) {
    const tier = context.loadedIndex.get(normalize(alias));

    /*
        Ein geladener Datensatz wird im Systematik-Graph
        nur dann als echtes Tier behandelt, wenn dieses
        Tier auch ausgewählt ist.
    */
    if (tier && context.selectedSet.has(tier.id)) {
      return tier;
    }
  }

  return null;
}

/* ======================================== */
/* ALIASE                                   */
/* ======================================== */

function findAlias(context, aliases) {
  for (const alias of aliases) {
    const id = context.aliases.get(normalize(alias));

    if (id) {
      return id;
    }
  }

  return null;
}

function registerAliases(context, nodeId, aliases) {
  aliases.forEach((alias) => {
    const key = normalize(alias);

    if (key) {
      context.aliases.set(key, nodeId);
    }
  });
}

/* ======================================== */
/* SLOT NICHT DOPPELT                       */
/* ======================================== */

function claimSlot(context, preferred) {
  const match = String(preferred ?? "").match(/^(\d+)\.(\d+)$/);

  let row = match ? Number(match[1]) : 1;

  const column = match ? Number(match[2]) : 1;

  let slot = `${row}.${column}`;

  while (context.usedSlots.has(slot)) {
    row++;

    slot = `${row}.${column}`;
  }

  context.usedSlots.add(slot);

  return slot;
}

/* ======================================== */
/* TIER-NAMEN                               */
/* ======================================== */

function taxonMatchesTier(knoten, tier) {
  const scientific = normalize(getTierScientificName(tier));

  return [knoten?.id, knoten?.name]
    .filter(Boolean)
    .some((value) => normalize(value) === scientific);
}

function getTierScientificName(tier) {
  return (
    tier?.wissenschaftlicherName ?? tier?.originalDaten?.id ?? tier?.id ?? ""
  );
}

function getTierGattung(tier) {
  const scientificName = getTierScientificName(tier).trim();

  if (!scientificName) {
    return "";
  }

  return scientificName.split(/\s+/)[0] ?? "";
}

function getTierName(tier) {
  return (
    getLocalizedValue(
      tier?.namen ?? tier?.originalDaten?.identitaet?.namen ?? {},

      getLanguage(),
    ) ?? getTierScientificName(tier)
  );
}

function getOptionalName(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return getLocalizedValue(value, getLanguage()) ?? "";
  }

  return "";
}

/* ======================================== */
/* IDS                                      */
/* ======================================== */

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function safeId(value) {
  return (
    String(value ?? "taxon")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "taxon"
  );
}
