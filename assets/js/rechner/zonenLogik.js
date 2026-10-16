/*
 * Zonenplaner: Zoopedia-Angaben ≠ bestätigte Wegfindung.
 * Dreiwertige Logik: sicher erreichbar / möglicherweise erreichbar / nicht erreichbar.
 * Ein unbekannter Wert wird NIE als "nein" interpretiert.
 */
import {
  berechneFlaechen,
  analysiereBeziehungen,
} from "./rechnerBerechnung.js";

export const ZONEN_TYPEN = {
  land: "Land",
  ufer: "Ufer / Trinken",
  flachwasser: "Flachwasser / Waten",
  schwimmwasser: "Schwimmwasser",
  tiefwasser: "Tiefwasser / Tauchen",
  luft: "Flugbereich",
  kletter: "Kletterbereich",
  rueckzug: "Rückzugsbereich",
  besucher: "Besucherbereich",
};
export const UEBERGANGS_TYPEN = {
  offen: "Offener Weg",
  klettern: "Kletterübergang",
  springen: "Sprung / Höhenunterschied",
  fliegen: "Flugübergang",
  flattern: "Flatterübergang",
  schwimmen: "Schwimmverbindung",
  tauchen: "Unterwasserverbindung",
  spalt: "Schmaler Durchgang",
  gesperrt: "Vollständige Abtrennung",
};
const RISKANT = new Set([
  "praedation",
  "parasitismus",
  "konkurrenz",
  "amensalismus",
  "kleptoparasitismus",
]);
const FLAECHEN_NACH_ZONE = {
  land: "land",
  ufer: "land",
  flachwasser: "wasser",
  schwimmwasser: "wasser",
  tiefwasser: "tauchflaeche",
  luft: "flug",
  kletter: "klettern",
  rueckzug: "schutz",
  besucher: "land",
};
const METHODEN = {
  offen: "landgang",
  klettern: "klettern",
  springen: "springen",
  fliegen: "fliegen",
  flattern: "flattern",
  schwimmen: "schwimmen",
  tauchen: "tauchen",
  spalt: "durchschlupf",
};
export function profilAusZoopedia(e) {
  const r = e.rechner;
  const fb = r.fortbewegung || {};
  const daten = r.flaechen || {};
  const faehigkeiten = {};
  const beschreibung = {};
  const setzen = (key, wert, quelle) => {
    faehigkeiten[key] = wert;
    beschreibung[key] = quelle;
  };
  for (const key of [
    "landgang",
    "klettern",
    "fliegen",
    "flattern",
    "springen",
    "schwimmen",
    "tauchen",
    "waten",
    "durchschlupf",
  ]) {
    if (fb[key] === true || fb[key] === false)
      setzen(key, fb[key], "Tierdaten / manueller Wert");
    else setzen(key, null, "In der Zoopedia nicht ausreichend belegt");
  }
  const bedarf = (typ) => daten[typ]?.basis ?? null;
  if (faehigkeiten.landgang === null && bedarf("land") > 0)
    setzen(
      "landgang",
      true,
      "Abgeleitet: Landflächenbedarf (keine Wegegarantie)",
    );
  if (faehigkeiten.klettern === null && bedarf("klettern") > 0)
    setzen(
      "klettern",
      true,
      "Abgeleitet: Kletterflächenbedarf (keine Kletterhöhe belegt)",
    );
  if (faehigkeiten.fliegen === null && bedarf("flug") > 0)
    setzen(
      "fliegen",
      true,
      "Abgeleitet: Flugflächenbedarf (keine Flugstrecke belegt)",
    );
  if (r.art === "aquarium" && bedarf("tauchflaeche") > 0) {
    if (faehigkeiten.schwimmen === null)
      setzen("schwimmen", true, "Abgeleitet: Aquarium mit Tiefwasserbedarf");
    if (faehigkeiten.tauchen === null)
      setzen(
        "tauchen",
        true,
        "Abgeleitet: Aquarium mit Tiefwasserbedarf (keine Tauchtiefe belegt)",
      );
  }
  return { faehigkeiten, beschreibung };
}
function logischeFaehigkeit(profil, key) {
  return profil.faehigkeiten[key] === true
    ? 2
    : profil.faehigkeiten[key] === false
      ? 0
      : 1;
}
function zonePassend(profil, typ) {
  if (typ === "land" || typ === "besucher")
    return logischeFaehigkeit(profil, "landgang");
  if (typ === "kletter") return logischeFaehigkeit(profil, "klettern");
  if (typ === "rueckzug") return logischeFaehigkeit(profil, "landgang");
  if (typ === "ufer")
    return Math.max(
      logischeFaehigkeit(profil, "landgang"),
      logischeFaehigkeit(profil, "waten"),
    );
  if (typ === "flachwasser")
    return Math.max(
      logischeFaehigkeit(profil, "waten"),
      logischeFaehigkeit(profil, "schwimmen"),
    );
  if (typ === "schwimmwasser") return logischeFaehigkeit(profil, "schwimmen");
  if (typ === "tiefwasser") return logischeFaehigkeit(profil, "tauchen");
  if (typ === "luft")
    return Math.max(
      logischeFaehigkeit(profil, "fliegen"),
      logischeFaehigkeit(profil, "flattern"),
    );
  return 1;
}
function uebersetzterWeg(profil, verbindung) {
  if (verbindung.art === "gesperrt") return 0;
  const key = METHODEN[verbindung.art];
  if (!key) return 1;
  return logischeFaehigkeit(profil, key);
}
// Ausgabe pro Tier und Zone: 2 = bestätigt durch Tierprofil + manuell validierte Übergänge;
// 1 = möglich/ungeprüft; 0 = kein ermittelbarer Pfad.
export function erreichbareZonen(e, zonen, uebergaenge) {
  const profil = profilAusZoopedia(e);
  const ergebnis = Object.fromEntries(zonen.map((zone) => [zone.id, 0]));
  const start = zonen.filter((z) => z.startArten?.includes(e.tier.id));
  for (const zone of start) ergebnis[zone.id] = zonePassend(profil, zone.typ);
  let geaendert = true;
  let runden = 0;
  while (geaendert && runden++ <= zonen.length) {
    geaendert = false;
    for (const verbindung of uebergaenge) {
      const von = zonen.find((z) => z.id === verbindung.von);
      const nach = zonen.find((z) => z.id === verbindung.nach);
      if (!von || !nach || von.id === nach.id) continue;
      const pruefen = (a, b) => {
        const faehigkeit = uebersetzterWeg(profil, verbindung);
        if (faehigkeit === 0 || ergebnis[a.id] === 0) return;
        // Selbst bei bestätigter Fähigkeit nur dann grün, wenn der Übergang im Spiel getestet wurde.
        const bestaetigt = verbindung.getestet === true ? 2 : 1;
        const erreichbarkeit = Math.min(
          ergebnis[a.id],
          faehigkeit,
          zonePassend(profil, b.typ),
          bestaetigt,
        );
        if (erreichbarkeit > ergebnis[b.id]) {
          ergebnis[b.id] = erreichbarkeit;
          geaendert = true;
        }
      };
      pruefen(von, nach);
      if (verbindung.beidseitig !== false) pruefen(nach, von);
    }
  }
  return { profil, zonen: ergebnis };
}
function ids(tier) {
  return [tier.tier.id, tier.tier.datenId, tier.tier.wissenschaftlicherName]
    .filter(Boolean)
    .map((x) => String(x).toLowerCase());
}
export function paarStatus(a, b, vorhandene = []) {
  const hit = vorhandene.find(
    (p) =>
      (p.a === a.name && p.b === b.name) || (p.a === b.name && p.b === a.name),
  );
  const nahrungsRisiko =
    hit?.beziehungen.filter((r) => RISKANT.has(r.typ)) ?? [];
  if (nahrungsRisiko.length)
    return {
      status: "gefahr",
      grund: `Dokumentiert: ${nahrungsRisiko.map((r) => r.typ).join(", ")}`,
    };
  const ab = ids(b);
  const aa = ids(a);
  const deklarationen = [
    [a.rechner.zoopediaBeziehungen, b],
    [b.rechner.zoopediaBeziehungen, a],
  ];
  for (const [rel, ziel] of deklarationen) {
    for (const [typ, werte] of Object.entries(rel ?? {})) {
      if (!Array.isArray(werte)) continue;
      if (werte.some((v) => ids(ziel).includes(String(v).toLowerCase())))
        return { status: typ, grund: "Explizite Zoopedia-Beziehung" };
    }
  }
  if (hit?.beziehungen.length)
    return {
      status: "oekologisch",
      grund: "Nahrungsnetz: " + hit.beziehungen.map((r) => r.typ).join(", "),
    };
  return {
    status: "unbekannt",
    grund: "Keine dokumentierte Verträglichkeitsaussage",
  };
}
export function pruefeZonen(eintraege, zonen, uebergaenge) {
  const aktiv = eintraege.filter((e) => e.anzahl > 0);
  const bewegung = Object.fromEntries(
    aktiv.map((e) => [e.tier.id, erreichbareZonen(e, zonen, uebergaenge)]),
  );
  const relationen = analysiereBeziehungen(aktiv);
  const paare = [];
  for (let i = 0; i < aktiv.length; i++)
    for (let j = i + 1; j < aktiv.length; j++) {
      const a = aktiv[i],
        b = aktiv[j];
      const status = paarStatus(a, b, relationen);
      const kontakt = zonen.filter((z) => {
        const typ = z.typ;
        // "Trinken" am Ufer darf keinen Tiefwasserkontakt erzeugen.
        return (
          bewegung[a.tier.id].zonen[z.id] > 0 &&
          bewegung[b.tier.id].zonen[z.id] > 0 &&
          typ !== "luft"
        );
      });
      const sichererKontakt = kontakt.some(
        (z) =>
          bewegung[a.tier.id].zonen[z.id] === 2 &&
          bewegung[b.tier.id].zonen[z.id] === 2,
      );
      paare.push({
        a: a.name,
        b: b.name,
        ...status,
        kontakt: kontakt.map((z) => z.name),
        kontaktMoeglich: kontakt.length > 0,
        kontaktBestaetigt: sichererKontakt,
      });
    }
  const besucher = zonen
    .filter((z) => z.typ === "besucher")
    .map((z) => ({
      zone: z.name,
      verboten: aktiv
        .filter(
          (e) =>
            bewegung[e.tier.id].zonen[z.id] > 0 &&
            e.rechner.besucherBetretbar === false,
        )
        .map((e) => e.name),
      ungeprueft: aktiv
        .filter(
          (e) =>
            bewegung[e.tier.id].zonen[z.id] > 0 &&
            e.rechner.besucherBetretbar !== true,
        )
        .map((e) => e.name),
      erlaubt: aktiv
        .filter(
          (e) =>
            bewegung[e.tier.id].zonen[z.id] > 0 &&
            e.rechner.besucherBetretbar === true,
        )
        .map((e) => e.name),
    }));
  return { bewegung, paare, besucher };
}

// Pro Zone nur die Arten berücksichtigen, die diese Zone erreichen können.
// Verteilt nicht automatisch Quadratmeter: eine Tierart kann mehrere Zonen nutzen.
// Flächen pro Zone sind Nutzerangaben und werden mit der Gesamtanforderung verglichen.
export function zonenFlaechenPruefung(eintraege, zonen, analyse) {
  const ausgabe = [];
  for (const zone of zonen) {
    const arten = eintraege.filter(
      (e) => e.anzahl > 0 && analyse.bewegung[e.tier.id]?.zonen[zone.id] > 0,
    );
    const key = FLAECHEN_NACH_ZONE[zone.typ];
    const berechnung = berechneFlaechen(arten)[key];
    ausgabe.push({
      zone: zone.name,
      typ: zone.typ,
      art: key,
      anzahl: arten.length,
      geplant:
        typeof zone.flaeche === "number" && zone.flaeche >= 0
          ? zone.flaeche
          : null,
      // Nur bei einer einzigen erreichbaren Zone dieser Flächenart ist ihr gesamter Artbedarf lokal anwendbar.
      bedarf: berechnung,
      hinweis:
        "Vergleich nur als Orientierung; eine Art kann den Gesamtbedarf auf mehrere verbundene Zonen verteilen.",
    });
  }
  return ausgabe;
}
export function optimalesKlima(eintraege) {
  const arten = eintraege.filter(
    (e) =>
      e.anzahl > 0 &&
      Number.isFinite(e.rechner.temperaturC?.min) &&
      Number.isFinite(e.rechner.temperaturC?.max),
  );
  const kandidaten = [
    ...new Set(
      arten.flatMap((e) => [
        e.rechner.temperaturC.min,
        e.rechner.temperaturC.max,
      ]),
    ),
  ];
  const ergebnisse = kandidaten
    .map((grad) => {
      const zufrieden = arten.filter(
        (e) =>
          e.rechner.temperaturC.min <= grad &&
          e.rechner.temperaturC.max >= grad,
      );
      return {
        grad,
        tiere: zufrieden.reduce((s, e) => s + e.anzahl, 0),
        arten: zufrieden.length,
        zufrieden: zufrieden.map((e) => e.name),
        abweichend: arten
          .filter((e) => !zufrieden.includes(e))
          .map((e) => e.name),
      };
    })
    .sort((a, b) => b.tiere - a.tiere || b.arten - a.arten);
  const bester = ergebnisse[0] ?? null;
  return {
    bester,
    fehlend: eintraege.filter((e) => !arten.includes(e)).map((e) => e.name),
    hinweis:
      "Nur eine Vergleichsoption. Arten ausserhalb ihres geeigneten Temperaturbereichs benötigen eine passende separate Klimazone.",
  };
}

export function umweltUeberschneidung(eintraege) {
  const aktive = eintraege.filter((e) => e.anzahl > 0);
  const temperatur = aktive
    .map((e) => ({ name: e.name, ...e.rechner.temperaturC }))
    .filter((v) => Number.isFinite(v.min) && Number.isFinite(v.max));
  const tMin = temperatur.length
    ? Math.max(...temperatur.map((v) => v.min))
    : null;
  const tMax = temperatur.length
    ? Math.min(...temperatur.map((v) => v.max))
    : null;
  const bodenArten = aktive.filter(
    (e) => e.rechner.gelaende && Object.keys(e.rechner.gelaende).length,
  );
  const sorten = [
    ...new Set(bodenArten.flatMap((e) => Object.keys(e.rechner.gelaende))),
  ];
  const gelaende = sorten.map((typ) => {
    const gebiete = bodenArten
      .map((e) => ({ name: e.name, werte: e.rechner.gelaende[typ] }))
      .filter((p) => Array.isArray(p.werte));
    const min = Math.max(...gebiete.map((g) => g.werte[0]));
    const max = Math.min(...gebiete.map((g) => g.werte[1]));
    return {
      typ,
      min,
      max,
      konflikt: min > max,
      beteiligte: gebiete.map((g) => g.name),
      vollstaendig: gebiete.length === bodenArten.length,
    };
  });
  const gemeinsameSorten = gelaende.filter(
    (g) => g.vollstaendig && !g.konflikt,
  );
  const summeMin = gemeinsameSorten.reduce((s, g) => s + g.min, 0);
  const summeMax = gemeinsameSorten.reduce((s, g) => s + g.max, 0);
  return {
    temperatur: {
      min: tMin,
      max: tMax,
      konflikt: tMin !== null && tMin > tMax,
      fehlend: aktive.filter((e) => !e.rechner.temperaturC).map((e) => e.name),
    },
    gelaende,
    prozentPruefung: {
      vollstaendig:
        bodenArten.length === aktive.length &&
        gelaende.every((g) => g.vollstaendig),
      konflikt: gelaende.some((g) => g.konflikt),
      summeMin,
      summeMax,
      hinweis:
        "Die Prozentsätze aller Bodenarten müssen zusammen 100 % ergeben. Unvollständige Daten erlauben keine Gesamtfreigabe.",
    },
  };
}

const FLAECHENTYP_ZONEN = {
  land: ["land", "ufer", "besucher"],
  wasser: ["flachwasser", "schwimmwasser", "tiefwasser"],
  tauchflaeche: ["tiefwasser"],
  klettern: ["kletter"],
  flug: ["luft"],
  schutz: ["rueckzug"],
};
// Flächen werden NUR pro tierindividuell über tatsächlich erreichbare Zonen
// einer Flächenart summiert. Mehrere Arten dürfen dieselbe Fläche nutzen;
// niemals die Artenbedarfe blind addieren.
export function pruefeZonenKapazitaet(eintraege, zonen, uebergaenge) {
  const pruefung = pruefeZonen(eintraege, zonen, uebergaenge);
  const result = [];
  for (const tier of eintraege.filter((e) => e.anzahl > 0)) {
    const bedarfe = berechneFlaechen([tier]);
    for (const [typ, bedarfsinfo] of Object.entries(bedarfe)) {
      const bedarf = bedarfsinfo.wert;
      if (bedarf === 0) continue;
      const erreichbarkeit = pruefung.bewegung[tier.tier.id].zonen;
      const passende = zonen.filter(
        (z) =>
          (FLAECHENTYP_ZONEN[typ] ?? []).includes(z.typ) &&
          erreichbarkeit[z.id] > 0 &&
          !(z.typ === "besucher" && tier.rechner.besucherBetretbar !== true),
      );
      const geprueft = passende.filter((z) => erreichbarkeit[z.id] === 2);
      const bekannt = passende.every(
        (z) => typeof z.flaeche === "number" && z.flaeche >= 0,
      );
      const sicherFlaeche = geprueft.reduce(
        (sum, z) => sum + (Number.isFinite(z.flaeche) ? z.flaeche : 0),
        0,
      );
      const moeglichFlaeche = passende.reduce(
        (sum, z) => sum + (Number.isFinite(z.flaeche) ? z.flaeche : 0),
        0,
      );
      const status =
        bedarf === null
          ? "daten-fehlen"
          : !passende.length
            ? "zone-fehlt"
            : !bekannt
              ? "flaeche-fehlt"
              : moeglichFlaeche < bedarf
                ? "zu-klein"
                : sicherFlaeche >= bedarf
                  ? "rechnerisch-ausreichend"
                  : "weg-ungeprueft";
      result.push({
        name: tier.name,
        art: typ,
        bedarf,
        sicherFlaeche,
        moeglichFlaeche,
        status,
        zonen: passende.map((z) => z.name),
      });
    }
  }
  return result;
}
