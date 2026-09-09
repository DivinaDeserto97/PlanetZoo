import { getLanguage } from "../../features/language.js";

const RANG_LABELS = {
  ueberordnung: {
    de: "Überordnung",
    en: "Superorder",
  },

  klasse: {
    de: "Klasse",
    en: "Class",
  },

  unterklasse: {
    de: "Unterklasse",
    en: "Subclass",
  },

  klade: {
    de: "Klade",
    en: "Clade",
  },

  ordnung: {
    de: "Ordnung",
    en: "Order",
  },

  unterordnung: {
    de: "Unterordnung",
    en: "Suborder",
  },

  familie: {
    de: "Familie",
    en: "Family",
  },

  unterfamilie: {
    de: "Unterfamilie",
    en: "Subfamily",
  },

  gattung: {
    de: "Gattung",
    en: "Genus",
  },

  art: {
    de: "Art",
    en: "Species",
  },

  unterart: {
    de: "Unterart",
    en: "Subspecies",
  },

  taxon: {
    de: "Taxon",
    en: "Taxon",
  },
};

const BEZIEHUNGS_LABELS = {
  abstammungslinie: {
    de: "Abstammungslinie",
    en: "Lineage",
  },

  aufspaltung: {
    de: "Aufspaltung",
    en: "Divergence",
  },

  domestikation: {
    de: "Domestikation",
    en: "Domestication",
  },

  wildform: {
    de: "Wildform",
    en: "Wild form",
  },

  naheVerwandtschaft: {
    de: "Nahe Verwandtschaft",
    en: "Close relationship",
  },

  unsichereVerwandtschaft: {
    de: "Unsichere Verwandtschaft",
    en: "Uncertain relationship",
  },

  schwesterart: {
    de: "Schwesterart",
    en: "Sister species",
  },

  naheLebendeVerwandtschaft: {
    de: "Nahe lebende Verwandtschaft",
    en: "Close living relationship",
  },

  pantheraVerwandtschaft: {
    de: "Panthera-Verwandtschaft",
    en: "Panthera relationship",
  },

  engePantheraVerwandtschaft: {
    de: "Enge Panthera-Verwandtschaft",
    en: "Close Panthera relationship",
  },

  afrotheriaVerwandtschaft: {
    de: "Afrotheria-Verwandtschaft",
    en: "Afrotheria relationship",
  },

  afroinsectiphiliaVerwandtschaft: {
    de: "Afroinsectiphilia-Verwandtschaft",
    en: "Afroinsectiphilia relationship",
  },
};

const SPIEL_LABELS = {
  planetZoo2: {
    de: "PZ2",
    en: "PZ2",
  },

  jurassicWorldEvolution1: {
    de: "JWE1",
    en: "JWE1",
  },

  jurassicWorldEvolution2: {
    de: "JWE2",
    en: "JWE2",
  },

  jurassicWorldEvolution3: {
    de: "JWE3",
    en: "JWE3",
  },
};

const SCHUTZSTATUS = {
  leastConcern: "LC",

  nearThreatened: "NT",

  vulnerable: "VU",

  endangered: "EN",

  criticallyEndangered: "CR",

  extinctInTheWild: "EW",

  extinct: "EX",

  LC: "LC",

  NT: "NT",

  VU: "VU",

  EN: "EN",

  CR: "CR",

  EW: "EW",

  EX: "EX",
};

function sprachCode() {
  return getLanguage().startsWith("en") ? "en" : "de";
}

export function getRangLabel(value) {
  const labels = RANG_LABELS[value];

  if (!labels) {
    return humanize(value);
  }

  return labels[sprachCode()] ?? labels.de;
}

export function getBeziehungsLabel(value) {
  const labels = BEZIEHUNGS_LABELS[value];

  if (!labels) {
    return humanize(value);
  }

  return labels[sprachCode()] ?? labels.de;
}

export function getSpielKurz(value) {
  const labels = SPIEL_LABELS[value];

  if (!labels) {
    return String(value ?? "");
  }

  return labels[sprachCode()] ?? labels.de;
}

export function getSchutzstatusKurz(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return SCHUTZSTATUS[value] ?? String(value);
}

export function getLebensstatusKurz(value) {
  if (value === "ausgestorben") {
    return "†";
  }

  if (value === "lebend") {
    return sprachCode() === "en" ? "LIVING" : "LEBEND";
  }

  return "";
}

export function getDomestikationsKurz(value) {
  if (value === "domestiziert") {
    return sprachCode() === "en" ? "DOMESTICATED" : "DOMESTIZIERT";
  }

  if (value === "wildform") {
    return sprachCode() === "en" ? "WILD" : "WILDFORM";
  }

  return "";
}

function humanize(value) {
  return String(value ?? "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
}
