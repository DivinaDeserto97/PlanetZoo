/* ============================================================
   NAHRUNGSBEZIEHUNGEN
   ------------------------------------------------------------
   Diese Datei kennt die Struktur von:

   daten.ernaehrung.nahrungsnetz

   Ziel:
   - Nahrungsbeziehungen zentral auslesen
   - Fressfeinde automatisch berechnen
   - keine doppelte Pflege mit "wirdGefressenVon"
   - Linienart zentral bestimmen

   Aktuelle JSON-Struktur:

   "nahrungsnetz": {
     "jungtier": {
       "werte": []
     },

     "erwachsen": {
       "werte": []
     }
   }
   ============================================================ */

/* ============================================================
   KONSTANTEN
   ============================================================ */

export const NAHRUNGSNETZ_LEBENSPHASEN = ["jungtier", "erwachsen"];

export const NAHRUNGSNETZ_TYPEN = [
  "tier",
  "pflanze",
  "nutzung",
  "aas",
  "giftig",
];

export const NAHRUNGSNETZ_LINIEN = {
  DIREKT: "direct",

  BEDINGUNG: "conditional",

  AAS: "carrion",

  GIFTIG: "toxic",
};

/* ============================================================
   NAHRUNGSNETZ HOLEN
   ============================================================ */

export function getNahrungsnetz(tier) {
  if (!tier) {
    return null;
  }

  /*
      Rohes JSON:

      tier.daten.ernaehrung.nahrungsnetz
  */

  const direkt = tier?.daten?.ernaehrung?.nahrungsnetz;

  if (direkt) {
    return direkt;
  }

  /*
      Importiertes Tier:

      tier.originalDaten.daten...
  */

  const original = tier?.originalDaten?.daten?.ernaehrung?.nahrungsnetz;

  if (original) {
    return original;
  }

  return null;
}

/* ============================================================
   BEZIEHUNGEN EINER LEBENSPHASE
   ============================================================ */

export function getNahrungsBeziehungen(tier, lebensphase) {
  if (!NAHRUNGSNETZ_LEBENSPHASEN.includes(lebensphase)) {
    return [];
  }

  const netz = getNahrungsnetz(tier);

  const werte = netz?.[lebensphase]?.werte;

  if (!Array.isArray(werte)) {
    return [];
  }

  return werte.filter(istGueltigeBeziehung);
}

/* ============================================================
   ALLE BEZIEHUNGEN EINES TIERES
   ============================================================ */

export function getAlleNahrungsBeziehungen(tier) {
  const result = [];

  NAHRUNGSNETZ_LEBENSPHASEN.forEach((lebensphase) => {
    const beziehungen = getNahrungsBeziehungen(tier, lebensphase);

    beziehungen.forEach((beziehung) => {
      result.push({
        lebensphase,

        beziehung,
      });
    });
  });

  return result;
}

/* ============================================================
   FRESSFEINDE AUTOMATISCH BERECHNEN
   ============================================================ */

export function getFressfeinde(alleTiere, zielTier, zielLebensphase = null) {
  if (!Array.isArray(alleTiere) || !zielTier) {
    return [];
  }

  const zielIds = getTierIds(zielTier);

  if (zielIds.size === 0) {
    return [];
  }

  const result = [];

  alleTiere.forEach((fressfeind) => {
    /*
            Ein Tier wird nicht
            mit sich selbst verglichen.
        */

    if (istGleichesTier(fressfeind, zielTier)) {
      return;
    }

    const beziehungen = getAlleNahrungsBeziehungen(fressfeind);

    beziehungen.forEach((eintrag) => {
      const { lebensphase, beziehung } = eintrag;

      if (!beziehungTrifftZiel(beziehung, zielIds)) {
        return;
      }

      if (!beziehungGiltFuerZielLebensphase(beziehung, zielLebensphase)) {
        return;
      }

      result.push({
        fressfeind,

        fressfeindId: getHauptTierId(fressfeind),

        lebensphase,

        zielLebensphase,

        beziehung,

        linienTyp: getLinienTyp(beziehung),
      });
    });
  });

  return result;
}

/* ============================================================
   LINIENTYP
   ============================================================ */

export function getLinienTyp(beziehung) {
  if (!beziehung) {
    return NAHRUNGSNETZ_LINIEN.DIREKT;
  }

  const typ = String(beziehung.typ ?? "")
    .trim()
    .toLowerCase();

  /*
      WICHTIG:

      gift.relevant = true

      bedeutet NICHT automatisch
      Gift-Linie.

      Nur:

      typ = "giftig"

      ergibt die Gift-Linie.
  */

  if (typ === "giftig") {
    return NAHRUNGSNETZ_LINIEN.GIFTIG;
  }

  if (typ === "aas") {
    return NAHRUNGSNETZ_LINIEN.AAS;
  }

  /*
      Nutzung wird gestrichelt.

      Ebenso jede Beziehung,
      die eine Bedingung besitzt.
  */

  if (typ === "nutzung" || hatBedingung(beziehung)) {
    return NAHRUNGSNETZ_LINIEN.BEDINGUNG;
  }

  return NAHRUNGSNETZ_LINIEN.DIREKT;
}

/* ============================================================
   BEDINGUNGEN
   ============================================================ */

export function hatBedingung(beziehung) {
  const bedingung = beziehung?.bedingung;

  if (!bedingung) {
    return false;
  }

  /*
      Neue Struktur:

      "bedingung": {
        "selbst": [],
        "ziel": []
      }
  */

  if (typeof bedingung === "object" && !Array.isArray(bedingung)) {
    return hatArrayWerte(bedingung.selbst) || hatArrayWerte(bedingung.ziel);
  }

  /*
      Übergangsweise auch
      alte String-Werte erkennen.
  */

  if (typeof bedingung === "string") {
    return Boolean(bedingung.trim());
  }

  return false;
}

/* ============================================================
   ZIEL-LEBENSPHASE PRÜFEN
   ============================================================ */

export function beziehungGiltFuerZielLebensphase(beziehung, zielLebensphase) {
  /*
      Wenn keine Lebensphase angefragt
      wurde, gilt die Beziehung allgemein
      für die Suche.
  */

  if (!zielLebensphase) {
    return true;
  }

  const zielBedingungen = getZielBedingungen(beziehung);

  /*
      Keine Zielbedingung:

      Beziehung kann für beide
      Lebensphasen gelten.
  */

  if (zielBedingungen.length === 0) {
    return true;
  }

  const hatJungtier = zielBedingungen.includes("jungtier");

  const hatErwachsen = zielBedingungen.includes("erwachsen");

  /*
      Nur Bedingungen wie:

      geschwaecht
      krank
      verletzt

      sagen nichts über das Alter aus.

      Dann wird hier nicht gefiltert.
  */

  if (!hatJungtier && !hatErwachsen) {
    return true;
  }

  if (zielLebensphase === "jungtier") {
    return hatJungtier;
  }

  if (zielLebensphase === "erwachsen") {
    return hatErwachsen;
  }

  return true;
}

/* ============================================================
   BEDINGUNGEN AUSLESEN
   ============================================================ */

export function getSelbstBedingungen(beziehung) {
  return normalisiereBedingungsArray(beziehung?.bedingung?.selbst);
}

export function getZielBedingungen(beziehung) {
  return normalisiereBedingungsArray(beziehung?.bedingung?.ziel);
}

/* ============================================================
   GIFT-INFORMATIONEN
   ============================================================ */

export function hatGiftInformation(beziehung) {
  return Boolean(beziehung?.gift?.relevant);
}

export function istGiftBeziehung(beziehung) {
  return (
    String(beziehung?.typ ?? "")
      .trim()
      .toLowerCase() === "giftig"
  );
}

/* ============================================================
   AAS
   ============================================================ */

export function istAasBeziehung(beziehung) {
  return (
    String(beziehung?.typ ?? "")
      .trim()
      .toLowerCase() === "aas"
  );
}

/* ============================================================
   NUTZUNG
   ============================================================ */

export function istNutzungsBeziehung(beziehung) {
  return (
    String(beziehung?.typ ?? "")
      .trim()
      .toLowerCase() === "nutzung"
  );
}

/* ============================================================
   ZIEL PRÜFEN
   ============================================================ */

function beziehungTrifftZiel(beziehung, zielIds) {
  const wert = String(beziehung?.wert ?? "").trim();

  if (!wert) {
    return false;
  }

  return zielIds.has(wert);
}

/* ============================================================
   TIER-IDS
   ============================================================ */

export function getTierIds(tier) {
  const ids = new Set();

  [
    tier?.id,

    tier?.datenId,

    tier?.wissenschaftlicherName,

    tier?.originalDaten?.id,

    tier?.daten?.taxonomie?.werte?.[0]?.art,

    tier?.originalDaten?.daten?.taxonomie?.werte?.[0]?.art,
  ]
    .filter((value) => typeof value === "string" && value.trim())
    .forEach((value) => {
      ids.add(value.trim());
    });

  return ids;
}

export function getHauptTierId(tier) {
  return (
    tier?.id ??
    tier?.datenId ??
    tier?.wissenschaftlicherName ??
    tier?.originalDaten?.id ??
    null
  );
}

/* ============================================================
   GLEICHES TIER?
   ============================================================ */

function istGleichesTier(tierA, tierB) {
  const idsA = getTierIds(tierA);

  const idsB = getTierIds(tierB);

  for (const id of idsA) {
    if (idsB.has(id)) {
      return true;
    }
  }

  return false;
}

/* ============================================================
   BEZIEHUNG VALIDIEREN
   ============================================================ */

function istGueltigeBeziehung(beziehung) {
  if (!beziehung || typeof beziehung !== "object") {
    return false;
  }

  if (typeof beziehung.wert !== "string" || !beziehung.wert.trim()) {
    return false;
  }

  return true;
}

/* ============================================================
   ARRAY-HELFER
   ============================================================ */

function hatArrayWerte(value) {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && item.trim())
  );
}

function normalisiereBedingungsArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim());
}
