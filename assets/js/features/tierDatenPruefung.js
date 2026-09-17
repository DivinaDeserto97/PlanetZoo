import { TOOL_IDS, TOOLS } from "./toolRegistry.js";

import { getToolEinstellung, TOOL_STUFEN } from "./toolEinstellungen.js";
import { pruefeSystematikStruktur } from "./systematikPruefung.js";
import {
  getAudioVarianten,
  getBesteAudioDatei,
  getBesteBildDatei,
  getBesteVideoDatei,
  getBildVarianten,
  getVideoVarianten,
  hatLokalisierterText,
} from "./tierMedien.js";

import {
  getNahrungsnetz,
  NAHRUNGSNETZ_LEBENSPHASEN,
  NAHRUNGSNETZ_TYPEN,
} from "./nahrungsBeziehungen.js";

import {
  OEKOLOGISCHE_BEZIEHUNGEN,
  OEKOLOGISCHE_WIRKUNGEN,
  getErlaubteWirkungen,
  istGueltigeOekologischeBeziehung,
  istGueltigeWirkung,
  istWirkungFuerBeziehungGueltig,
} from "./oekologischeBeziehungen.js";

/* ======================================== */
/* ECHTE LOKALE DATEIEN PRÜFEN              */
/* ======================================== */

const DATEI_STATUS = new Map();

export async function pruefeLokaleTierDateien(tiere) {
  const pfade = new Set();

  tiere.forEach((tier) => {
    sammleDateiPfade(tier).forEach((pfad) => pfade.add(pfad));
  });

  const offen = [...pfade].filter((pfad) => !DATEI_STATUS.has(pfad));

  if (!offen.length) {
    return;
  }

  let index = 0;

  async function worker() {
    while (index < offen.length) {
      const pfad = offen[index++];

      const vorhanden = await existiertLokaleDatei(pfad);

      DATEI_STATUS.set(pfad, vorhanden);
    }
  }

  const workerAnzahl = Math.min(8, offen.length);

  await Promise.all(
    Array.from(
      {
        length: workerAnzahl,
      },
      () => worker(),
    ),
  );
}

function sammleDateiPfade(tier) {
  const pfade = new Set();

  const karte = tier?.originalDaten?.karte ?? tier?.karte ?? {};

  const kartenDateien = Array.isArray(karte?.dateien) ? karte.dateien : [];

  kartenDateien.forEach((datei) => {
    if (
      String(datei?.dateityp ?? "").toLowerCase() === "png" &&
      hatText(datei?.pfad)
    ) {
      pfade.add(datei.pfad);
    }
  });

  if (hatText(karte?.pfad)) {
    pfade.add(karte.pfad);
  }

  getBildVarianten(tier).forEach((entry) => {
    const datei = getBesteBildDatei(entry.dateien);

    if (hatText(datei?.pfad)) {
      pfade.add(datei.pfad);
    }
  });

  getAudioVarianten(tier).forEach((entry) => {
    const datei = getBesteAudioDatei(entry.dateien);

    if (hatText(datei?.pfad)) {
      pfade.add(datei.pfad);
    }

    entry.metadaten.forEach((meta) => {
      if (hatText(meta?.pfad)) {
        pfade.add(meta.pfad);
      }
    });
  });

  getVideoVarianten(tier).forEach((entry) => {
    const datei = getBesteVideoDatei(entry.dateien);

    if (hatText(datei?.pfad)) {
      pfade.add(datei.pfad);
    }
  });

  return [...pfade];
}

function istDateiVerfuegbar(pfad) {
  if (!hatText(pfad)) {
    return false;
  }

  if (!DATEI_STATUS.has(pfad)) {
    return true;
  }

  return DATEI_STATUS.get(pfad) === true;
}

async function existiertLokaleDatei(pfad) {
  try {
    const url = new URL(String(pfad).replace(/^\/+/, ""), document.baseURI);

    const response = await fetch(url, {
      method: "HEAD",

      cache: "no-store",
    });

    if (response.ok) {
      return true;
    }

    if (response.status === 405 || response.status === 501) {
      const fallback = await fetch(url, {
        method: "GET",

        headers: {
          Range: "bytes=0-0",
        },

        cache: "no-store",
      });

      return fallback.ok || fallback.status === 206;
    }

    return false;
  } catch {
    return false;
  }
}

/* ======================================== */
/* ALLGEMEINE HELFER                        */
/* ======================================== */

function pruefeNutzungsHaeufigkeit(wert) {
  const fehler = [];

  if (!hatText(wert)) {
    fehler.push("nutzung.haeufigkeit fehlt.");

    return fehler;
  }

  /*
      Festes Format:

      Menge: ...
      |
      Häufigkeit: ...
      |
      Zeitraum: ...

      Beispiel:

      Menge: 2-4 l/Fütterung |
      Häufigkeit: 8-12x/Tag |
      Zeitraum: bis etwa 6 Monate
  */

  const teile = wert
    .split("|")
    .map((teil) => teil.trim())
    .filter(Boolean);

  if (teile.length !== 3) {
    fehler.push(
      "nutzung.haeufigkeit muss aus genau 3 Teilen bestehen: Menge | Häufigkeit | Zeitraum.",
    );

    return fehler;
  }

  const [menge, haeufigkeit, zeitraum] = teile;

  if (!menge.startsWith("Menge:") || !hatText(menge.slice("Menge:".length))) {
    fehler.push("Der erste Teil muss „Menge: ...“ enthalten.");
  }

  if (
    !haeufigkeit.startsWith("Häufigkeit:") ||
    !hatText(haeufigkeit.slice("Häufigkeit:".length))
  ) {
    fehler.push("Der zweite Teil muss „Häufigkeit: ...“ enthalten.");
  }

  if (
    !zeitraum.startsWith("Zeitraum:") ||
    !hatText(zeitraum.slice("Zeitraum:".length))
  ) {
    fehler.push("Der dritte Teil muss „Zeitraum: ...“ enthalten.");
  }

  return fehler;
}

function hatText(wert) {
  return typeof wert === "string" && wert.trim().length > 0;
}

function hatInhalt(wert) {
  if (wert === null || wert === undefined) {
    return false;
  }

  if (typeof wert === "string") {
    return wert.trim().length > 0;
  }

  if (typeof wert === "number") {
    return Number.isFinite(wert);
  }

  if (typeof wert === "boolean") {
    return true;
  }

  if (Array.isArray(wert)) {
    return wert.some((eintrag) => hatInhalt(eintrag));
  }

  if (typeof wert === "object") {
    return Object.values(wert).some((eintrag) => hatInhalt(eintrag));
  }

  return false;
}

function hatArrayInhalt(wert) {
  return Array.isArray(wert) && wert.some((eintrag) => hatInhalt(eintrag));
}

function istObjekt(wert) {
  return wert !== null && typeof wert === "object" && !Array.isArray(wert);
}

function hatZahl(wert) {
  return typeof wert === "number" && Number.isFinite(wert);
}

function pruefePflichtText(fehlt, wert, meldung) {
  if (!hatText(wert)) {
    fehlt.push(meldung);
  }
}

function pruefeOptionalenText(fehlt, objekt, key, meldung) {
  if (
    Object.prototype.hasOwnProperty.call(objekt ?? {}, key) &&
    !hatText(objekt?.[key])
  ) {
    fehlt.push(meldung);
  }
}

function pruefeOptionalenLokalisiertenText(fehlt, objekt, key, meldung) {
  if (
    Object.prototype.hasOwnProperty.call(objekt ?? {}, key) &&
    !hatLokalisierterText(objekt?.[key])
  ) {
    fehlt.push(meldung);
  }
}

/* ======================================== */
/* NAHRUNGSBEZIEHUNG PRÜFEN                 */
/* ======================================== */

function pruefeNahrungsBeziehung(wert, optionen = {}) {
  const fehlt = [];

  /*
      Beziehung + Wirkung sind ausschließlich für das
      Nahrungsnetz-Werkzeug Pflicht. Die Infotafel benutzt
      dieselben Ernährungsdaten, soll aber durch diese zwei
      Darstellungsfelder nicht auf unvollständig springen.
  */
  const pruefeOekologie = optionen.pruefeOekologie === true;

  if (!istObjekt(wert)) {
    return ["Eintrag ist kein Objekt."];
  }

  /* ==================================== */
  /* PFLICHTFELDER                        */
  /* ==================================== */

  pruefePflichtText(fehlt, wert?.wert, "Wert fehlt.");

  pruefePflichtText(fehlt, wert?.typ, "Typ fehlt.");

  if (hatText(wert?.typ) && !NAHRUNGSNETZ_TYPEN.includes(wert.typ)) {
    fehlt.push(
      `Unbekannter Typ „${wert.typ}“. Erlaubt: ${NAHRUNGSNETZ_TYPEN.join(", ")}.`,
    );
  }

  pruefePflichtText(fehlt, wert?.quelle, "Quelle fehlt.");

  /* ==================================== */
  /* ÖKOLOGISCHE BEZIEHUNG + WIRKUNG      */
  /* nur für das Nahrungsnetz-Werkzeug    */
  /* ==================================== */

  if (pruefeOekologie) {
    pruefePflichtText(fehlt, wert?.beziehung, "Ökologische Beziehung fehlt.");

    if (
      hatText(wert?.beziehung) &&
      !istGueltigeOekologischeBeziehung(wert.beziehung)
    ) {
      fehlt.push(
        `Unbekannte ökologische Beziehung „${wert.beziehung}“. Erlaubt: ${OEKOLOGISCHE_BEZIEHUNGEN.join(", ")}.`,
      );
    }

    pruefePflichtText(
      fehlt,
      wert?.wirkung,
      "Wirkung fehlt. Erwartet wird z. B. +/-, -/-, +/+, +/0 oder 0/0.",
    );

    if (hatText(wert?.wirkung) && !istGueltigeWirkung(wert.wirkung)) {
      fehlt.push(
        `Unbekannte Wirkung „${wert.wirkung}“. Erlaubt: ${OEKOLOGISCHE_WIRKUNGEN.join(", ")}.`,
      );
    }

    if (
      istGueltigeOekologischeBeziehung(wert?.beziehung) &&
      istGueltigeWirkung(wert?.wirkung) &&
      !istWirkungFuerBeziehungGueltig(wert.beziehung, wert.wirkung)
    ) {
      const erlaubt = getErlaubteWirkungen(wert.beziehung);

      fehlt.push(
        `Wirkung „${wert.wirkung}“ passt nicht zur Beziehung „${wert.beziehung}“. Erlaubt: ${erlaubt.join(", ")}.`,
      );
    }
  }

  /* ==================================== */
  /* BEDINGUNG                            */
  /* ==================================== */

  if (!istObjekt(wert?.bedingung)) {
    fehlt.push("Bedingung fehlt oder ist kein Objekt.");
  } else {
    if (!Array.isArray(wert.bedingung.selbst)) {
      fehlt.push("bedingung.selbst muss ein Array sein.");
    } else if (wert.bedingung.selbst.some((eintrag) => !hatText(eintrag))) {
      fehlt.push("bedingung.selbst enthält einen leeren oder ungültigen Wert.");
    }

    if (!Array.isArray(wert.bedingung.ziel)) {
      fehlt.push("bedingung.ziel muss ein Array sein.");
    } else if (wert.bedingung.ziel.some((eintrag) => !hatText(eintrag))) {
      fehlt.push("bedingung.ziel enthält einen leeren oder ungültigen Wert.");
    }
  }

  /* ==================================== */
  /* ALLGEMEINER HINWEIS                  */
  /* ==================================== */

  pruefeOptionalenLokalisiertenText(
    fehlt,
    wert,
    "hinweis",
    "Hinweis ist angelegt, aber leer.",
  );

  /* ==================================== */
  /* NUTZUNG                              */
  /* ==================================== */

  if (wert?.typ === "nutzung") {
    if (!istObjekt(wert?.nutzung)) {
      fehlt.push("Bei typ „nutzung“ fehlt das Objekt nutzung.");
    } else {
      pruefePflichtText(
        fehlt,
        wert.nutzung.art,
        "Bei typ „nutzung“ fehlt nutzung.art.",
      );

      fehlt.push(...pruefeNutzungsHaeufigkeit(wert.nutzung.haeufigkeit));

      pruefeOptionalenLokalisiertenText(
        fehlt,
        wert.nutzung,
        "hinweis",
        "nutzung.hinweis ist angelegt, aber leer.",
      );
    }
  } else if (
    Object.prototype.hasOwnProperty.call(wert, "nutzung") &&
    !istObjekt(wert.nutzung)
  ) {
    fehlt.push("nutzung ist angelegt, aber kein Objekt.");
  }

  /* ==================================== */
  /* AAS                                  */
  /* ==================================== */

  if (wert?.typ === "aas") {
    if (!istObjekt(wert?.aas)) {
      fehlt.push("Bei typ „aas“ fehlt das Objekt aas.");
    } else {
      pruefePflichtText(
        fehlt,
        wert.aas.zustand,
        "Bei typ „aas“ fehlt aas.zustand.",
      );

      pruefeOptionalenLokalisiertenText(
        fehlt,
        wert.aas,
        "hinweis",
        "aas.hinweis ist angelegt, aber leer.",
      );
    }
  } else if (
    Object.prototype.hasOwnProperty.call(wert, "aas") &&
    !istObjekt(wert.aas)
  ) {
    fehlt.push("aas ist angelegt, aber kein Objekt.");
  }

  /* ==================================== */
  /* GIFTIG                               */
  /* ==================================== */

  if (wert?.typ === "giftig") {
    if (!istObjekt(wert?.gift)) {
      fehlt.push("Bei typ „giftig“ fehlt das Objekt gift.");
    } else {
      if (wert.gift.relevant !== true) {
        fehlt.push("Bei typ „giftig“ muss gift.relevant true sein.");
      }

      if (
        !Array.isArray(wert.gift.giftweg) ||
        !wert.gift.giftweg.some((eintrag) => hatText(eintrag))
      ) {
        fehlt.push(
          "Bei typ „giftig“ muss mindestens ein gift.giftweg eingetragen sein.",
        );
      }
    }
  }

  /* ==================================== */
  /* GIFT-ZUSATZDATEN                     */
  /* ==================================== */

  if (Object.prototype.hasOwnProperty.call(wert, "gift")) {
    if (!istObjekt(wert.gift)) {
      fehlt.push("gift ist angelegt, aber kein Objekt.");
    } else {
      if (typeof wert.gift.relevant !== "boolean") {
        fehlt.push("gift.relevant muss true oder false sein.");
      }

      if (!Array.isArray(wert.gift.giftweg)) {
        fehlt.push("gift.giftweg muss ein Array sein.");
      } else if (wert.gift.giftweg.some((eintrag) => !hatText(eintrag))) {
        fehlt.push("gift.giftweg enthält einen leeren oder ungültigen Wert.");
      }

      pruefeOptionalenText(
        fehlt,
        wert.gift,
        "toleranz",
        "gift.toleranz ist angelegt, aber leer.",
      );

      if (Object.prototype.hasOwnProperty.call(wert.gift, "umgang")) {
        if (!istObjekt(wert.gift.umgang)) {
          fehlt.push("gift.umgang ist angelegt, aber kein Objekt.");
        } else {
          pruefeOptionalenText(
            fehlt,
            wert.gift.umgang,
            "aktion",
            "gift.umgang.aktion ist angelegt, aber leer.",
          );

          pruefeOptionalenText(
            fehlt,
            wert.gift.umgang,
            "zeitpunkt",
            "gift.umgang.zeitpunkt ist angelegt, aber leer.",
          );
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(wert.gift, "nachUmgangNutzbar") &&
        wert.gift.nachUmgangNutzbar !== null &&
        typeof wert.gift.nachUmgangNutzbar !== "boolean"
      ) {
        fehlt.push("gift.nachUmgangNutzbar muss true, false oder null sein.");
      }

      pruefeOptionalenLokalisiertenText(
        fehlt,
        wert.gift,
        "hinweis",
        "gift.hinweis ist angelegt, aber leer.",
      );
    }
  }

  return fehlt;
}

/* ======================================== */
/* CHECK-OBJEKT                             */
/* ======================================== */

function item(label, pfad, ok, fehlt = []) {
  return {
    label,

    pfad,

    ok: Boolean(ok),

    fehlt: fehlt.filter(Boolean),
  };
}

/* ======================================== */
/* BASIS                                    */
/* ======================================== */

function basisChecks(tier) {
  const namen = tier?.originalDaten?.identitaet?.namen ?? tier?.namen;

  return [
    item(
      "Name",
      "identitaet.namen",

      hatLokalisierterText(namen),

      [!hatLokalisierterText(namen) ? "Mindestens ein Tiername fehlt." : null],
    ),

    item(
      "Wissenschaftlicher Name",
      "id",

      hatText(tier?.originalDaten?.id) || hatText(tier?.wissenschaftlicherName),

      [
        !(
          hatText(tier?.originalDaten?.id) ||
          hatText(tier?.wissenschaftlicherName)
        )
          ? "Wissenschaftlicher Name fehlt."
          : null,
      ],
    ),
  ];
}

/* ======================================== */
/* MAP                                      */
/* ======================================== */

function pruefeMap(tier) {
  const checks = basisChecks(tier);

  const karte = tier?.originalDaten?.karte ?? tier?.karte ?? {};

  const dateien = Array.isArray(karte?.dateien) ? karte.dateien : [];

  const png = dateien.find(
    (datei) =>
      String(datei?.dateityp ?? "").toLowerCase() === "png" &&
      hatText(datei?.pfad),
  );

  const legacyPfad = hatText(karte?.pfad);

  const kartenPfad = png?.pfad ?? (legacyPfad ? karte.pfad : null);

  const kartenDateiVorhanden = istDateiVerfuegbar(kartenPfad);

  checks.push(
    item(
      "Kartenbild",
      "karte.dateien[].pfad",

      hatText(kartenPfad) && kartenDateiVorhanden,

      [
        !hatText(kartenPfad) ? "PNG-Kartenpfad fehlt." : null,

        hatText(kartenPfad) && !kartenDateiVorhanden
          ? `PNG-Kartendatei nicht gefunden: ${kartenPfad}`
          : null,
      ],
    ),
  );

  return checks;
}

/* ======================================== */
/* INFOTAFEL                                */
/* ======================================== */

function pruefeInfotafel(tier) {
  const checks = basisChecks(tier);

  const bilder = getBildVarianten(tier);

  if (!bilder.length) {
    checks.push(
      item("Bilder", "bilder", false, ["Keine Bildvariante vorhanden."]),
    );
  }

  bilder.forEach((entry) => {
    const nummer = entry.variante?.variante ?? entry.variantenIndex + 1;

    const gruppe = entry.gruppe?.typ || "Bild";

    const fehlt = [];

    if (!hatText(entry.gruppe?.typ)) {
      fehlt.push("Bildtyp fehlt.");
    }

    if (!hatText(entry.variante?.quelle)) {
      fehlt.push("Quelle fehlt.");
    }

    if (!hatLokalisierterText(entry.variante?.alt)) {
      fehlt.push("Alt-Text fehlt.");
    }

    const beschreibung =
      entry.variante?.beschreibung ?? entry.gruppe?.beschreibung;

    if (!hatLokalisierterText(beschreibung)) {
      fehlt.push("Beschreibung fehlt.");
    }

    const bildDatei = getBesteBildDatei(entry.dateien);

    if (!bildDatei) {
      fehlt.push("Bilddatei / Dateipfad fehlt.");
    } else if (!istDateiVerfuegbar(bildDatei.pfad)) {
      fehlt.push(`Bilddatei nicht gefunden: ${bildDatei.pfad}`);
    }

    checks.push(
      item(
        `${gruppe} – Variante ${nummer}`,

        `bilder[${entry.gruppenIndex}].varianten[${entry.variantenIndex}]`,

        fehlt.length === 0,

        fehlt,
      ),
    );
  });

  const texte = tier?.originalDaten?.texte ?? {};

  const textBereiche = [
    ["uebersicht", "Übersicht"],

    ["vorkommen", "Vorkommen"],

    ["arterhaltung", "Arterhaltung"],

    ["sozialverhaltenUndFortpflanzung", "Sozialverhalten & Fortpflanzung"],

    ["tierfakten", "Tierfakten"],
  ];

  textBereiche.forEach(([key, label]) => {
    const sprachObjekt = texte?.[key];

    const vorhanden =
      sprachObjekt &&
      typeof sprachObjekt === "object" &&
      Object.values(sprachObjekt).some(
        (eintraege) =>
          Array.isArray(eintraege) &&
          eintraege.some((eintrag) => hatText(eintrag?.inhalt)),
      );

    checks.push(
      item(
        label,

        `texte.${key}`,

        vorhanden,

        [!vorhanden ? `${label}-Text fehlt.` : null],
      ),
    );
  });

  const daten = tier?.originalDaten?.daten ?? {};

  const steckbrief = [
    ["Biome", "daten.biome.werte", daten?.biome?.werte],

    ["Schutzstatus", "daten.schutzstatus.werte", daten?.schutzstatus?.werte],

    [
      "Soziale Struktur",
      "daten.sozialeStruktur.werte",
      daten?.sozialeStruktur?.werte,
    ],

    ["Aktivität", "daten.aktivitaet.werte", daten?.aktivitaet?.werte],

    [
      "Fressverhalten",
      "daten.ernaehrung.fressverhalten.werte",
      daten?.ernaehrung?.fressverhalten?.werte,
    ],
  ];

  steckbrief.forEach(([label, pfad, wert]) => {
    checks.push(
      item(
        label,

        pfad,

        hatArrayInhalt(wert),

        [!hatArrayInhalt(wert) ? `${label} fehlt.` : null],
      ),
    );
  });

  /* ======================================== */
  /* FRESSVERHALTEN – EINTRÄGE PRÜFEN         */
  /* ======================================== */

  const fressverhaltenWerte = daten?.ernaehrung?.fressverhalten?.werte;

  if (Array.isArray(fressverhaltenWerte)) {
    fressverhaltenWerte.forEach((eintrag, index) => {
      const fehlt = [];

      if (!istObjekt(eintrag)) {
        fehlt.push("Eintrag ist kein Objekt.");
      } else {
        pruefePflichtText(fehlt, eintrag.wert, "Wert fehlt.");
        pruefePflichtText(fehlt, eintrag.quelle, "Quelle fehlt.");
      }

      checks.push(
        item(
          `Fressverhalten – Eintrag ${index + 1}`,
          `daten.ernaehrung.fressverhalten.werte[${index}]`,
          fehlt.length === 0,
          fehlt,
        ),
      );
    });
  }

  /* ======================================== */
  /* NAHRUNGSNETZ AUCH FÜR INFOTAFEL          */
  /* ======================================== */

  const nahrungsnetzChecks = pruefeNahrungsnetz(tier, {
    pruefeOekologie: false,
  }).filter(
    (check) => check.pfad !== "identitaet.namen" && check.pfad !== "id",
  );

  checks.push(...nahrungsnetzChecks);

  return checks;
}

/* ======================================== */
/* AUDIO                                    */
/* ======================================== */

function pruefeAudio(tier) {
  const checks = basisChecks(tier);

  const audio = getAudioVarianten(tier);

  if (!audio.length) {
    checks.push(
      item("Audio", "audio", false, ["Keine Audio-Variante vorhanden."]),
    );

    return checks;
  }

  audio.forEach((entry) => {
    const nummer = entry.variante?.variante ?? entry.variantenIndex + 1;

    const typ = entry.gruppe?.typ || "Audio";

    const fehlt = [];

    if (!hatText(entry.gruppe?.typ)) {
      fehlt.push("Audio-Typ fehlt.");
    }

    if (!hatText(entry.variante?.quelle)) {
      fehlt.push("Quelle fehlt.");
    }

    const audioDatei = getBesteAudioDatei(entry.dateien);

    if (!audioDatei) {
      fehlt.push("Abspielbare Audiodatei / Dateipfad fehlt.");
    } else if (!istDateiVerfuegbar(audioDatei.pfad)) {
      fehlt.push(`Audiodatei nicht gefunden: ${audioDatei.pfad}`);
    }

    const metadata = entry.metadaten.find((meta) => hatText(meta?.pfad));

    if (!metadata) {
      fehlt.push("Metadaten-Pfad / Beschreibung fehlt.");
    } else if (!istDateiVerfuegbar(metadata.pfad)) {
      fehlt.push(`Audio-Metadatendatei nicht gefunden: ${metadata.pfad}`);
    }

    checks.push(
      item(
        `${typ} – Variante ${nummer}`,

        `audio[${entry.gruppenIndex}].varianten[${entry.variantenIndex}]`,

        fehlt.length === 0,

        fehlt,
      ),
    );
  });

  return checks;
}

/* ======================================== */
/* VIDEO / KINO                             */
/* ======================================== */

function pruefeVideo(tier) {
  const checks = basisChecks(tier);

  const videos = getVideoVarianten(tier);

  if (!videos.length) {
    checks.push(
      item("Video", "video", false, ["Keine Video-Variante vorhanden."]),
    );

    return checks;
  }

  videos.forEach((entry) => {
    const nummer = entry.variante?.variante ?? entry.variantenIndex + 1;

    const typ = entry.gruppe?.typ || "Video";

    const fehlt = [];

    if (!hatText(entry.gruppe?.typ)) {
      fehlt.push("Video-Typ fehlt.");
    }

    if (!hatLokalisierterText(entry.variante?.titel)) {
      fehlt.push("Titel fehlt.");
    }

    if (!hatText(entry.variante?.quelle)) {
      fehlt.push("Quelle fehlt.");
    }

    if (!hatLokalisierterText(entry.variante?.beschreibung)) {
      fehlt.push("Beschreibung fehlt.");
    }

    const videoDatei = getBesteVideoDatei(entry.dateien);

    if (!videoDatei) {
      fehlt.push("Videodatei / Dateipfad fehlt.");
    } else if (!istDateiVerfuegbar(videoDatei.pfad)) {
      fehlt.push(`Videodatei nicht gefunden: ${videoDatei.pfad}`);
    }

    checks.push(
      item(
        `${typ} – Variante ${nummer}`,

        `video[${entry.gruppenIndex}].varianten[${entry.variantenIndex}]`,

        fehlt.length === 0,

        fehlt,
      ),
    );
  });

  return checks;
}

/* ======================================== */
/* SYSTEMATIK                               */
/* ======================================== */

function pruefeSystematik(tier) {
  const checks = basisChecks(tier);

  const systematik = tier?.originalDaten?.systematik ?? tier?.systematik;

  checks.push(...pruefeSystematikStruktur(systematik));

  return checks;
}

/* ======================================== */
/* NAHRUNGSNETZ                             */
/* ======================================== */

function pruefeNahrungsnetz(tier, optionen = {}) {
  const checks = basisChecks(tier);

  /*
      Standard für das Nahrungsnetz-Werkzeug: Beziehung und
      Wirkung sind Pflicht. Andere Verbraucher (Infotafel)
      können diese Zusatzprüfung bewusst abschalten.
  */
  const pruefeOekologie = optionen.pruefeOekologie !== false;

  const nahrungsnetz = getNahrungsnetz(tier);

  if (!istObjekt(nahrungsnetz)) {
    checks.push(
      item("Nahrungsnetz", "daten.ernaehrung.nahrungsnetz", false, [
        "Nahrungsnetz-Struktur fehlt.",
      ]),
    );

    return checks;
  }

  if (Object.prototype.hasOwnProperty.call(nahrungsnetz, "frisst")) {
    checks.push(
      item(
        "Nahrungsnetz – alte Struktur „frisst“",
        "daten.ernaehrung.nahrungsnetz.frisst",
        false,
        [
          "Der Bereich „frisst“ gehört zur alten Struktur und muss entfernt werden. Jungtier und Erwachsen liegen jetzt direkt unter nahrungsnetz.",
        ],
      ),
    );
  }

  if (Object.prototype.hasOwnProperty.call(nahrungsnetz, "wirdGefressenVon")) {
    checks.push(
      item(
        "Nahrungsnetz – doppelte Pflege „wirdGefressenVon“",
        "daten.ernaehrung.nahrungsnetz.wirdGefressenVon",
        false,
        [
          "„wirdGefressenVon“ darf nicht mehr im Tier-JSON gepflegt werden. Fressfeinde werden aus den Nahrungsbeziehungen der anderen Tiere berechnet.",
        ],
      ),
    );
  }

  NAHRUNGSNETZ_LEBENSPHASEN.forEach((lebensphase) => {
    const bereich = nahrungsnetz[lebensphase];

    const label =
      lebensphase === "jungtier"
        ? "Nahrungsnetz – Jungtier"
        : "Nahrungsnetz – Erwachsen";

    const pfad = `daten.ernaehrung.nahrungsnetz.${lebensphase}`;

    if (!istObjekt(bereich)) {
      checks.push(
        item(label, pfad, false, ["Lebensphase fehlt oder ist kein Objekt."]),
      );

      return;
    }

    if (!Array.isArray(bereich.werte)) {
      checks.push(
        item(label, `${pfad}.werte`, false, ["werte muss ein Array sein."]),
      );

      return;
    }

    if (bereich.werte.length === 0) {
      checks.push(item(label, `${pfad}.werte`, true, []));

      return;
    }

    bereich.werte.forEach((wert, index) => {
      const fehlt = pruefeNahrungsBeziehung(wert, { pruefeOekologie });

      checks.push(
        item(
          `${label} – Eintrag ${index + 1}`,
          `${pfad}.werte[${index}]`,
          fehlt.length === 0,
          fehlt,
        ),
      );
    });
  });

  return checks;
}

/* ======================================== */
/* RECHNER                                  */
/* ======================================== */

function pruefeRechner(tier) {
  const checks = basisChecks(tier);

  const rechner = tier?.originalDaten?.planetZoo2?.rechner;

  const ok = hatInhalt(rechner);

  checks.push(
    item("Rechnerwerte", "planetZoo2.rechner", ok, [
      !ok ? "Rechnerwerte fehlen." : null,
    ]),
  );

  return checks;
}

/* ======================================== */
/* TOOL AUSWÄHLEN                           */
/* ======================================== */

function pruefeTool(tier, toolId) {
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
      return pruefeNahrungsnetz(tier, { pruefeOekologie: true });

    case TOOL_IDS.RECHNER:
      return pruefeRechner(tier);

    default:
      return [];
  }
}

/* ======================================== */
/* ÖFFENTLICHE FUNKTIONEN                   */
/* ======================================== */

export function pruefeTierDaten(tier) {
  return TOOLS.map((tool) => {
    const checks = pruefeTool(tier, tool.id);

    return {
      toolId: tool.id,
      tool,
      stufe: getToolEinstellung(tool.id),

      vollstaendig: checks.length > 0 && checks.every((check) => check.ok),

      checks,
    };
  });
}

export function getToolPruefung(tier, toolId) {
  return (
    pruefeTierDaten(tier).find((pruefung) => pruefung.toolId === toolId) ?? null
  );
}

export function getTierMarkierungsStatus(tier) {
  const fehler = pruefeTierDaten(tier).filter(
    (pruefung) => !pruefung.vollstaendig,
  );

  if (fehler.some((pruefung) => pruefung.stufe === TOOL_STUFEN.WICHTIG)) {
    return "error";
  }

  if (fehler.some((pruefung) => pruefung.stufe === TOOL_STUFEN.NICHT_WICHTIG)) {
    return "warning";
  }

  return "ok";
}
