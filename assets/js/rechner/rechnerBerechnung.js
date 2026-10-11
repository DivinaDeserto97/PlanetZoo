/*
 * Gehegerechner: zentrale, testbare Auswertung. Keine externen Datenquellen.
 * Flächen verschiedener Arten werden ausdrücklich NICHT addiert.
 */
import {
  getAlleNahrungsBeziehungen,
  getTierIds,
} from "../features/nahrungsBeziehungen.js";

export const FLAECHEN = ["land", "wasser", "klettern"];
export const BEWEGUNGEN = [
  "fliegen",
  "klettern",
  "tauchen",
  "schwimmen",
  "landgang",
  "springen",
];

export function zahlOderNull(wert) {
  if (wert === "" || wert === null || wert === undefined) return null;
  const zahl = Number(wert);
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : null;
}

export function getRechnerDaten(tier, overrides = {}) {
  const original = tier?.originalDaten?.planetZoo2?.rechner;
  const daten =
    original && typeof original === "object" && !Array.isArray(original)
      ? original
      : {};
  const f = daten.flaechen ?? {};
  const ff = overrides.flaechen ?? {};
  const flaechen = Object.fromEntries(
    FLAECHEN.map((key) => [
      key,
      {
        basis: zahlOderNull(ff[key]?.basis ?? f[key]?.basis),
        jeWeiteresTier: zahlOderNull(
          ff[key]?.jeWeiteresTier ?? f[key]?.jeWeiteresTier,
        ),
      },
    ]),
  );
  const bewegung = {
    ...(daten.fortbewegung ?? {}),
    ...(overrides.fortbewegung ?? {}),
  };
  const gruppe = { ...(daten.gruppe ?? {}), ...(overrides.gruppe ?? {}) };
  return {
    flaechen,
    fortbewegung: Object.fromEntries(
      BEWEGUNGEN.map((key) => [
        key,
        [true, false].includes(bewegung[key]) ? bewegung[key] : null,
      ]),
    ),
    sprungHoeheMeter: zahlOderNull(
      overrides.sprungHoeheMeter ?? daten.sprungHoeheMeter,
    ),
    besucherBetretbar: [true, false].includes(overrides.besucherBetretbar)
      ? overrides.besucherBetretbar
      : [true, false].includes(daten.besucherBetretbar)
        ? daten.besucherBetretbar
        : null,
    gruppe: { min: zahlOderNull(gruppe.min), max: zahlOderNull(gruppe.max) },
  };
}

export function sozialeGruppen(tier, rechner) {
  if (rechner.gruppe.min !== null || rechner.gruppe.max !== null) {
    return {
      min: rechner.gruppe.min,
      max: rechner.gruppe.max,
      quelle: "Rechnerwert",
    };
  }
  const werte = tier?.originalDaten?.daten?.sozialeStruktur?.werte ?? [];
  const mins = werte
    .map((wert) => zahlOderNull(wert.minGruppengroesse))
    .filter((n) => n !== null);
  const maxs = werte
    .map((wert) => zahlOderNull(wert.maxGruppengroesse))
    .filter((n) => n !== null);
  return {
    min: mins.length ? Math.min(...mins) : null,
    max: maxs.length ? Math.max(...maxs) : null,
    quelle: "Biologische Sozialstruktur (nicht zwingend Spielgrenze)",
  };
}

export function berechneFlaechen(eintraege) {
  return Object.fromEntries(
    FLAECHEN.map((typ) => {
      const proArt = eintraege
        .filter((e) => e.anzahl > 0)
        .map((e) => {
          const v = e.rechner.flaechen[typ];
          if (v.basis === null || (e.anzahl > 1 && v.jeWeiteresTier === null)) {
            return { id: e.tier.id, name: e.name, wert: null };
          }
          return {
            id: e.tier.id,
            name: e.name,
            wert: v.basis + Math.max(0, e.anzahl - 1) * (v.jeWeiteresTier ?? 0),
          };
        });
      const bekannt = proArt.filter((e) => e.wert !== null);
      const groesstes = bekannt.sort((a, b) => b.wert - a.wert)[0] ?? null;
      return [
        typ,
        {
          wert: groesstes?.wert ?? null,
          tier: groesstes?.name ?? null,
          unvollstaendig: bekannt.length !== proArt.length,
          fehlende: proArt.filter((e) => e.wert === null).map((e) => e.name),
        },
      ];
    }),
  );
}

const INTERESSANTE_BEZIEHUNGEN = new Set([
  "praedation",
  "konkurrenz",
  "mutualismus",
  "symbiose",
  "kommensalismus",
  "amensalismus",
  "parasitismus",
  "kleptoparasitismus",
]);

function kenntTier(zielId, tier) {
  const normalized = String(zielId ?? "")
    .trim()
    .toLowerCase();
  return [...getTierIds(tier)].some((id) => id.toLowerCase() === normalized);
}

export function analysiereBeziehungen(eintraege) {
  const aktive = eintraege.filter((e) => e.anzahl > 0);
  const ergebnisse = [];
  for (let i = 0; i < aktive.length; i++) {
    for (let j = i + 1; j < aktive.length; j++) {
      const a = aktive[i],
        b = aktive[j];
      const beziehungen = [];
      for (const [quelle, ziel] of [
        [a, b],
        [b, a],
      ]) {
        for (const eintrag of getAlleNahrungsBeziehungen(quelle.tier)) {
          const beziehung = eintrag.beziehung;
          const typ =
            beziehung.beziehung ||
            (beziehung.typ === "tier" ? "praedation" : "");
          if (
            !INTERESSANTE_BEZIEHUNGEN.has(typ) ||
            !kenntTier(beziehung.wert, ziel.tier)
          )
            continue;
          const key = [
            quelle.tier.id,
            ziel.tier.id,
            typ,
            eintrag.lebensphase,
            JSON.stringify(beziehung.bedingung ?? {}),
          ].join("|");
          if (!beziehungen.some((b) => b.key === key)) {
            beziehungen.push({
              key,
              typ,
              von: quelle.name,
              zu: ziel.name,
              lebensphase: eintrag.lebensphase,
              zielLebensphase: beziehung.bedingung?.ziel ?? [],
              quelle: beziehung.quelle ?? "Tierdaten",
            });
          }
        }
      }
      ergebnisse.push({ a: a.name, b: b.name, beziehungen });
    }
  }
  return ergebnisse;
}
