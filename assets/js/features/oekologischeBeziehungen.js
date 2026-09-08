/* ============================================================
   ÖKOLOGISCHE BEZIEHUNGEN
   ------------------------------------------------------------
   Diese Datei beschreibt zwei voneinander getrennte Dinge:

   1. beziehung
      Welche ökologische Beziehung liegt vor?

   2. wirkung
      Welche Wirkung hat die Beziehung auf:
      - selbst = Tier, dessen JSON wir gerade lesen
      - ziel   = Eintrag unter "wert"

   Beispiel Löwe -> Zebra:

   "beziehung": "praedation",
   "wirkung": "+/-"

   bedeutet:
   selbst (Löwe) = +
   ziel (Zebra)  = -

   Die spätere Grafik kann die Wirkung ausschließlich aus
   "wirkung" ableiten. Farbe und Linientyp bleiben davon getrennt.
   ============================================================ */

export const OEKOLOGISCHE_BEZIEHUNGEN = [
  "nutzung",
  "praedation",
  "herbivorie",
  "parasitismus",
  "parasitoidismus",
  "konkurrenz",
  "mutualismus",
  "symbiose",
  "kommensalismus",
  "amensalismus",
  "neutralismus",
  "nekrophagie",
  "detritivorie",
  "kleptoparasitismus",
  "toxischeWirkung",
];

export const OEKOLOGISCHE_WIRKUNGEN = [
  "+/-",
  "-/+",
  "-/-",
  "+/+",
  "+/0",
  "0/+",
  "-/0",
  "0/-",
  "0/0",
];

/*
   Zulässige Wirkungen je Beziehung.

   Manche Beziehungen dürfen gespiegelt gespeichert werden.
   Beispiel Kommensalismus:
   +/0 = aktuelles Tier profitiert
   0/+ = Ziel profitiert
*/
const WIRKUNGEN_PRO_BEZIEHUNG = {
  nutzung: ["+/0", "0/+"],

  praedation: ["+/-", "-/+"],
  herbivorie: ["+/-", "-/+"],
  parasitismus: ["+/-", "-/+"],
  parasitoidismus: ["+/-", "-/+"],

  konkurrenz: ["-/-"],
  mutualismus: ["+/+"],
  symbiose: ["+/+"],

  kommensalismus: ["+/0", "0/+"],
  amensalismus: ["-/0", "0/-"],
  neutralismus: ["0/0"],

  nekrophagie: ["+/0", "0/+"],
  detritivorie: ["+/0", "0/+"],

  kleptoparasitismus: ["+/-", "-/+"],

  toxischeWirkung: ["-/0", "0/-"],
};

/*
   Semantische Darstellung für Schritt 10.
   Noch KEIN CSS und KEINE SVG-Marker hier.

   Wichtig:
   Die Farbe wird später vom Tier bestimmt und NICHT von der Wirkung.
*/
export const WIRKUNG_DARSTELLUNG = {
  "+/-": {
    art: "profitPfeil",
    richtung: "selbst",
  },

  "-/+": {
    art: "profitPfeil",
    richtung: "ziel",
  },

  "-/-": {
    art: "verbindung",
    richtung: "keine",
  },

  "+/+": {
    art: "profitPfeilBeidseitig",
    richtung: "beide",
  },

  "+/0": {
    art: "neutralProfitPfeil",
    richtung: "selbst",
  },

  "0/+": {
    art: "neutralProfitPfeil",
    richtung: "ziel",
  },

  "-/0": {
    art: "negativMarker",
    richtung: "selbst",
  },

  "0/-": {
    art: "negativMarker",
    richtung: "ziel",
  },

  "0/0": {
    art: "neutral",
    richtung: "keine",
  },
};

const BEZIEHUNGS_LABELS = {
  nutzung: {
    de: "Nutzung",
    en: "Use",
  },

  praedation: {
    de: "Prädation / Räuber–Beute",
    en: "Predation / predator-prey",
  },

  herbivorie: {
    de: "Herbivorie",
    en: "Herbivory",
  },

  parasitismus: {
    de: "Parasitismus",
    en: "Parasitism",
  },

  parasitoidismus: {
    de: "Parasitoidismus",
    en: "Parasitoidism",
  },

  konkurrenz: {
    de: "Konkurrenz",
    en: "Competition",
  },

  mutualismus: {
    de: "Mutualismus",
    en: "Mutualism",
  },

  symbiose: {
    de: "Symbiose",
    en: "Symbiosis",
  },

  kommensalismus: {
    de: "Kommensalismus",
    en: "Commensalism",
  },

  amensalismus: {
    de: "Amensalismus",
    en: "Amensalism",
  },

  neutralismus: {
    de: "Neutralismus",
    en: "Neutralism",
  },

  nekrophagie: {
    de: "Aas- / Nekrophagie",
    en: "Scavenging / necrophagy",
  },

  detritivorie: {
    de: "Detritivorie",
    en: "Detritivory",
  },

  kleptoparasitismus: {
    de: "Kleptoparasitismus",
    en: "Kleptoparasitism",
  },

  toxischeWirkung: {
    de: "Toxische Wirkung",
    en: "Toxic effect",
  },
};

export function istGueltigeOekologischeBeziehung(value) {
  return (
    typeof value === "string" &&
    OEKOLOGISCHE_BEZIEHUNGEN.includes(value)
  );
}

export function istGueltigeWirkung(value) {
  return (
    typeof value === "string" &&
    OEKOLOGISCHE_WIRKUNGEN.includes(value)
  );
}

export function istWirkungFuerBeziehungGueltig(beziehung, wirkung) {
  if (!istGueltigeOekologischeBeziehung(beziehung)) {
    return false;
  }

  if (!istGueltigeWirkung(wirkung)) {
    return false;
  }

  const erlaubt = WIRKUNGEN_PRO_BEZIEHUNG[beziehung];

  return Array.isArray(erlaubt) && erlaubt.includes(wirkung);
}

export function getErlaubteWirkungen(beziehung) {
  const erlaubt = WIRKUNGEN_PRO_BEZIEHUNG[beziehung];

  return Array.isArray(erlaubt) ? [...erlaubt] : [];
}

export function parseWirkung(value) {
  if (!istGueltigeWirkung(value)) {
    return null;
  }

  const [selbst, ziel] = value.split("/");

  return {
    wert: value,
    selbst,
    ziel,
  };
}

export function getWirkungDarstellung(value) {
  if (!istGueltigeWirkung(value)) {
    return null;
  }

  return {
    wirkung: value,
    ...WIRKUNG_DARSTELLUNG[value],
  };
}

export function getBeziehungsLabel(value, language = "de") {
  const labels = BEZIEHUNGS_LABELS[value];

  if (!labels) {
    return value ?? "";
  }

  const base = String(language).startsWith("en") ? "en" : "de";

  return labels[base] ?? labels.de ?? value;
}
