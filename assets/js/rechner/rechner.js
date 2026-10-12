/*
 * Gehegerechner: lokale, gemeinsame Tierauswahl und transparente Auswertung.
 * Neue Daten bitte unter planetZoo2.rechner der jeweiligen Tier-JSON pflegen.
 * Vom Nutzer eingetragene Werte bleiben lokal und ändern die Tier-JSON nicht.
 */
import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";
import { getLanguage, getLocalizedValue } from "../features/language.js";
import {
  getTierAuswahl,
  setTierAuswahl,
  setTierAusgewaehlt,
} from "../features/tierAuswahl.js";
import { filterTiere, getTierFilterName } from "../features/tierFilter.js";
import {
  FLAECHEN,
  BEWEGUNGEN,
  getRechnerDaten,
  sozialeGruppen,
  berechneFlaechen,
  analysiereBeziehungen,
  zahlOderNull,
} from "./rechnerBerechnung.js";

const STORAGE_KEY = "planetZoo2-gehegerechner-v1";
const AREA_LABELS = {
  land: "Landfläche",
  wasser: "Wasserfläche",
  tauchflaeche: "Tauchfläche (tiefes Wasser)",
  klettern: "Kletterfläche",
};
const MOVEMENT_LABELS = {
  fliegen: "Fliegt",
  klettern: "Klettert",
  tauchen: "Taucht",
  schwimmen: "Schwimmt",
  landgang: "Kann an Land gehen",
  springen: "Springt über Hindernisse",
};
const RELATION_LABELS = {
  praedation: "Räuber–Beute",
  konkurrenz: "Konkurrenz",
  mutualismus: "Gegenseitiger Nutzen",
  symbiose: "Symbiose",
  kommensalismus: "Einseitiger Nutzen",
  amensalismus: "Einseitige Beeinträchtigung",
  parasitismus: "Parasitismus",
  kleptoparasitismus: "Nahrungsdiebstahl",
};
const WARN_RELATIONS = new Set([
  "praedation",
  "konkurrenz",
  "parasitismus",
  "kleptoparasitismus",
  "amensalismus",
]);
let controller = null;
let tiere = [];
let state = { mengen: {}, daten: {} };
const aufgeklappteTiere = new Set();

function leseZustand() {
  try {
    const gespeichert = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return gespeichert &&
      typeof gespeichert === "object" &&
      !Array.isArray(gespeichert)
      ? { mengen: gespeichert.mengen ?? {}, daten: gespeichert.daten ?? {} }
      : { mengen: {}, daten: {} };
  } catch {
    return { mengen: {}, daten: {} };
  }
}
function speichereZustand() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function text(element, inhalt) {
  if (element) element.textContent = inhalt;
}
function el(tag, classname, inhalt) {
  const element = document.createElement(tag);
  if (classname) element.className = classname;
  if (inhalt !== undefined) element.textContent = inhalt;
  return element;
}
function label(tier) {
  return (
    getLocalizedValue(tier.namen, getLanguage()) ||
    tier.name ||
    tier.wissenschaftlicherName
  );
}
function menge(id) {
  const eintrag = state.mengen[id];
  if (!eintrag) return { maennchen: 1, weibchen: 1, jungtiere: 0 };
  return {
    maennchen: pruefeMenge(eintrag.maennchen),
    weibchen: pruefeMenge(eintrag.weibchen),
    jungtiere: pruefeMenge(eintrag.jungtiere ?? 0),
  };
}
function pruefeMenge(wert) {
  const zahl = Number(wert);
  return Number.isFinite(zahl)
    ? Math.min(9999, Math.max(0, Math.floor(zahl)))
    : 0;
}
function erstelleEintraege() {
  const selected = new Set(getTierAuswahl());
  return tiere
    .filter((tier) => selected.has(tier.id))
    .map((tier) => {
      const m = menge(tier.id);
      return {
        tier,
        name: label(tier),
        maennchen: m.maennchen,
        weibchen: m.weibchen,
        jungtiere: m.jungtiere,
        anzahl: m.maennchen + m.weibchen + m.jungtiere,
        rechner: getRechnerDaten(tier, state.daten[tier.id]),
      };
    });
}
function nummerEingabe(name, wert, attribute, { min = 0, step = 1 } = {}) {
  const field = el("label", "calculator-field");
  field.append(el("span", "", name));
  const input = el("input");
  input.type = "number";
  input.min = String(min);
  input.step = String(step);
  input.inputMode = "decimal";
  input.value = wert === null || wert === undefined ? "" : String(wert);
  input.placeholder = "Keine Daten";
  Object.entries(attribute).forEach(
    ([key, value]) => (input.dataset[key] = value),
  );
  field.append(input);
  return field;
}
function auswahlFeld(name, wert, id, key) {
  const field = el("label", "calculator-field");
  field.append(el("span", "", name));
  const select = el("select");
  select.dataset.calcEdit = key;
  select.dataset.id = id;
  for (const [value, title] of [
    ["?", "Keine Daten"],
    ["ja", "Ja"],
    ["nein", "Nein"],
  ]) {
    const option = el("option", "", title);
    option.value = value;
    select.append(option);
  }
  select.value = wert === true ? "ja" : wert === false ? "nein" : "?";
  field.append(select);
  return field;
}

function filterState() {
  const filter = {
    suche: document.querySelector("[data-calculator-search]")?.value ?? "",
  };
  for (const feld of [
    "gehegetyp",
    "kontinent",
    "biome",
    "schutzstatus",
    "edition",
  ]) {
    filter[feld] =
      document.querySelector(`[data-calculator-filter="${feld}"]`)?.value ?? "";
  }
  filter.nurAusgewaehlt =
    document.querySelector("[data-calculator-selected-only]")?.value === "1";
  filter.ausgewaehlteIds = getTierAuswahl();
  return filter;
}
function baueFilter() {
  const felder = {
    gehegetyp: "gehegetyp",
    kontinent: "kontinente",
    biome: "biome",
    schutzstatus: "schutzstatus",
    edition: "edition",
  };
  for (const [feld, jsonKey] of Object.entries(felder)) {
    const select = document.querySelector(`[data-calculator-filter="${feld}"]`);
    if (!select) continue;
    const werte = new Set();
    tiere.forEach((tier) => {
      const value = tier.filter?.[jsonKey];
      (Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .forEach((eintrag) => werte.add(eintrag));
    });
    [...werte]
      .sort((a, b) => a.localeCompare(b, "de"))
      .forEach((wert) => {
        const option = el("option", "", wert);
        option.value = wert;
        select.append(option);
      });
  }
}

function renderAuswahl() {
  const liste = document.querySelector("[data-calculator-pick-list]");
  if (!liste) return;
  const selected = new Set(getTierAuswahl());
  const gefiltert = filterTiere(tiere, filterState()).sort((a, b) =>
    getTierFilterName(a).localeCompare(getTierFilterName(b), getLanguage()),
  );
  liste.replaceChildren();
  text(
    document.querySelector("[data-calculator-count]"),
    `${gefiltert.length} von ${tiere.length}`,
  );
  if (!gefiltert.length)
    liste.append(el("p", "calculator-muted", "Keine Tiere gefunden."));
  for (const tier of gefiltert) {
    const eintrag = el("label", "calculator-choice");
    const check = el("input");
    check.type = "checkbox";
    check.checked = selected.has(tier.id);
    check.dataset.calcSelect = tier.id;
    eintrag.append(check, el("span", "", label(tier)));
    liste.append(eintrag);
  }
}

function gruppenPruefung(e) {
  const gruppe = sozialeGruppen(e.tier, e.rechner);
  // Gruppengrenzen beschreiben vorläufig erwachsene Tiere;
  // Jungtiere zählen jedoch stets bei den Flächen mit.
  const erwachsene = e.maennchen + e.weibchen;
  return {
    gruppe,
    erwachsene,
    zuWenig: gruppe.min !== null && erwachsene < gruppe.min,
    zuViele: gruppe.max !== null && erwachsene > gruppe.max,
  };
}

function aktualisiereGruppenStatus(e) {
  const { gruppe, erwachsene, zuWenig, zuViele } = gruppenPruefung(e);
  const grund = [
    `Gruppe: ${gruppe.min ?? "?"} – ${gruppe.max ?? "?"}`,
    `${erwachsene} Erwachsene + ${e.jungtiere} Jungtiere`,
    zuWenig ? `Noch ${gruppe.min - erwachsene} Erwachsene bis zum Minimum` : "",
    zuViele ? `${erwachsene - gruppe.max} Erwachsene über dem Maximum` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const status = document.querySelector(
    `[data-calculator-group-status="${e.tier.id}"]`,
  );
  text(status, grund);
  status?.classList.toggle("calculator-danger-text", zuWenig || zuViele);
  const card = document.querySelector(
    `[data-calculator-species-id="${e.tier.id}"]`,
  );
  card?.classList.toggle("calculator-has-problem", zuWenig || zuViele);
  text(
    document.querySelector(`[data-calculator-group-source="${e.tier.id}"]`),
    gruppe.quelle,
  );
}

function renderTiere(eintraege) {
  const liste = document.querySelector("[data-calculator-animal-list]");
  if (!liste) return;
  liste.replaceChildren();
  text(
    document.querySelector("[data-calculator-selected-count]"),
    `${eintraege.length} Arten`,
  );
  if (!eintraege.length) {
    liste.append(
      el(
        "p",
        "calculator-muted",
        "Noch keine Tierart ausgewählt. Wähle links eine oder mehrere Arten.",
      ),
    );
    return;
  }
  for (const e of eintraege) {
    const { gruppe } = gruppenPruefung(e);
    const card = el("article", "calculator-species-card");
    card.dataset.calculatorSpeciesId = e.tier.id;
    const header = el("div", "calculator-species-title");
    const title = el("div", "calculator-species-name");
    title.append(
      el("strong", "", e.name),
      el("small", "calculator-muted", e.tier.datenId ?? ""),
    );
    const toolbar = el("div", "calculator-species-buttons");
    for (const [art, wert] of [
      ["min", gruppe.min],
      ["max", gruppe.max],
    ]) {
      const button = el(
        "button",
        "calculator-limit-button",
        art === "min" ? "Min" : "Max",
      );
      button.type = "button";
      button.disabled = wert === null;
      button.dataset.calcLimit = art;
      button.dataset.id = e.tier.id;
      button.title =
        wert === null
          ? "Keine Gruppengrenze vorhanden"
          : `${wert} Erwachsene einstellen (${gruppe.quelle})`;
      toolbar.append(button);
    }
    const remove = el("button", "calculator-button-subtle", "Entfernen ×");
    remove.type = "button";
    remove.dataset.calcRemove = e.tier.id;
    const toggle = el(
      "button",
      "calculator-toggle-button",
      aufgeklappteTiere.has(e.tier.id) ? "Zuklappen ▲" : "Aufklappen ▼",
    );
    toggle.type = "button";
    toggle.dataset.calcToggle = e.tier.id;
    toggle.setAttribute(
      "aria-expanded",
      String(aufgeklappteTiere.has(e.tier.id)),
    );
    toggle.setAttribute("aria-controls", `rechner-details-${e.tier.id}`);
    toolbar.append(remove, toggle);
    header.append(title, toolbar);
    const status = el("div", "calculator-group-status");
    status.dataset.calculatorGroupStatus = e.tier.id;
    const details = el("div", "calculator-species-body");
    details.id = `rechner-details-${e.tier.id}`;
    details.hidden = !aufgeklappteTiere.has(e.tier.id);
    const zeile = el("div", "calculator-group-controls");
    zeile.append(
      nummerEingabe("♂ Männchen", e.maennchen, {
        calcSex: "maennchen",
        id: e.tier.id,
      }),
      nummerEingabe("♀ Weibchen", e.weibchen, {
        calcSex: "weibchen",
        id: e.tier.id,
      }),
      nummerEingabe("Jungtiere", e.jungtiere, {
        calcSex: "jungtiere",
        id: e.tier.id,
      }),
    );
    const quelle = el("small", "calculator-muted", gruppe.quelle);
    quelle.dataset.calculatorGroupSource = e.tier.id;
    details.append(zeile, quelle);
    const edit = el("details", "calculator-edit");
    edit.append(
      el("summary", "", "Flächen, Fähigkeiten & Besuchersicherheit eintragen"),
    );
    const fields = el("div", "calculator-edit-grid");
    for (const typ of FLAECHEN) {
      fields.append(
        nummerEingabe(
          `${AREA_LABELS[typ]}: Grundfläche (m²)`,
          e.rechner.flaechen[typ].basis,
          { calcEdit: `${typ}.basis`, id: e.tier.id },
          { step: "0.1" },
        ),
        nummerEingabe(
          `${AREA_LABELS[typ]}: je weiterem Tier (m²)`,
          e.rechner.flaechen[typ].jeWeiteresTier,
          { calcEdit: `${typ}.jeWeiteresTier`, id: e.tier.id },
          { step: "0.1" },
        ),
        nummerEingabe(
          `${AREA_LABELS[typ]}: je Jungtier (m², optional)`,
          e.rechner.flaechen[typ].jeJungtier,
          { calcEdit: `${typ}.jeJungtier`, id: e.tier.id },
          { step: "0.1" },
        ),
      );
    }
    for (const art of BEWEGUNGEN)
      fields.append(
        auswahlFeld(
          MOVEMENT_LABELS[art],
          e.rechner.fortbewegung[art],
          e.tier.id,
          `fortbewegung.${art}`,
        ),
      );
    fields.append(
      nummerEingabe(
        "Maximale Sprunghöhe (m)",
        e.rechner.sprungHoeheMeter,
        { calcEdit: "sprungHoeheMeter", id: e.tier.id },
        { step: "0.1" },
      ),
      auswahlFeld(
        "Gehege für Besucher betretbar",
        e.rechner.besucherBetretbar,
        e.tier.id,
        "besucherBetretbar",
      ),
      nummerEingabe("Gruppenminimum (Spielwert)", e.rechner.gruppe.min, {
        calcEdit: "gruppe.min",
        id: e.tier.id,
      }),
      nummerEingabe("Gruppenmaximum (Spielwert)", e.rechner.gruppe.max, {
        calcEdit: "gruppe.max",
        id: e.tier.id,
      }),
    );
    edit.append(
      fields,
      el(
        "p",
        "calculator-muted",
        "Manuelle Werte bleiben lokal gespeichert. Fehlende Planet-Zoo-2-Werte sind keine bestätigten Spielanforderungen.",
      ),
    );
    details.append(edit);
    card.append(header, status, details);
    liste.append(card);
    aktualisiereGruppenStatus(e);
  }
}

function renderFlaechen(eintraege) {
  const liste = document.querySelector("[data-calculator-areas]");
  if (!liste) return;
  liste.replaceChildren();
  const berechnung = berechneFlaechen(eintraege);
  for (const [key, resultat] of Object.entries(berechnung)) {
    const card = el("div", "calculator-stat");
    card.append(
      el("span", "calculator-muted", AREA_LABELS[key]),
      el(
        "strong",
        "",
        resultat.wert === null
          ? "Keine Daten"
          : `${resultat.wert.toLocaleString(getLanguage())} m²`,
      ),
      el(
        "small",
        "calculator-muted",
        resultat.tier
          ? `Massgebend: ${resultat.tier}`
          : "Keine vollständigen Werte",
      ),
    );
    if (resultat.unvollstaendig)
      card.append(
        el(
          "small",
          "calculator-warning-text",
          `Unvollständig: ${resultat.fehlende.join(", ")}`,
        ),
      );
    liste.append(card);
  }
  text(
    document.querySelector("[data-calculator-areas-notice]"),
    !eintraege.length
      ? "Erst Tierarten auswählen."
      : Object.values(berechnung).some((area) => area.unvollstaendig)
        ? "Es fehlen Flächenangaben. Angezeigte Zahlen sind nur Untergrenzen aus den bekannten Arten – kein sicherer Gesamtbedarf."
        : "Die Flächenarten sind voneinander getrennt. Nicht addieren: pro Fläche gilt die grösste Artenanforderung.",
  );
}

function renderBeziehungen(eintraege) {
  const liste = document.querySelector("[data-calculator-relations]");
  if (!liste) return;
  liste.replaceChildren();
  const paare = analysiereBeziehungen(eintraege);
  if (!paare.length) {
    liste.append(
      el(
        "p",
        "calculator-muted",
        "Wähle mindestens zwei Arten mit einer Tierzahl grösser als null.",
      ),
    );
    return;
  }
  const bekannte = paare.filter((pair) => pair.beziehungen.length);
  const unbekannte = paare.filter((pair) => !pair.beziehungen.length);
  const risiken = bekannte.filter((pair) =>
    pair.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ)),
  );
  text(
    document.querySelector("[data-calculator-relation-count]"),
    `${risiken.length} Risikopaare · ${bekannte.length} dokumentiert`,
  );
  if (!bekannte.length)
    liste.append(
      el(
        "p",
        "calculator-muted",
        "Keine erfasste Beziehung zwischen den aktuell anwesenden Arten. Das bestätigt keine Verträglichkeit.",
      ),
    );
  for (const pair of bekannte.sort(
    (a, b) =>
      Number(b.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ))) -
      Number(a.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ))),
  )) {
    const risiko = pair.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ));
    const row = el(
      "div",
      risiko
        ? "calculator-relation calculator-has-problem"
        : "calculator-relation",
    );
    row.append(
      el(
        "strong",
        risiko ? "calculator-danger-text" : "",
        `${risiko ? "⚠ " : ""}${pair.a} ↔ ${pair.b}`,
      ),
    );
    for (const rel of pair.beziehungen) {
      const art = el(
        "span",
        WARN_RELATIONS.has(rel.typ)
          ? "calculator-danger-text"
          : "calculator-good-text",
      );
      const lebensphasen = rel.zielLebensphase.length
        ? ` · Ziel: ${rel.zielLebensphase.join(", ")}`
        : "";
      art.textContent = `${RELATION_LABELS[rel.typ] ?? rel.typ}: ${rel.von} → ${rel.zu} (${rel.lebensphase}${lebensphasen})`;
      row.append(art, el("small", "calculator-muted", `Quelle: ${rel.quelle}`));
    }
    liste.append(row);
  }
  if (unbekannte.length) {
    const details = el("details", "calculator-unknown-relations");
    details.append(
      el(
        "summary",
        "",
        `${unbekannte.length} Tierpaare ohne erfasste Beziehung anzeigen`,
      ),
    );
    const content = el("div");
    for (const pair of unbekannte) {
      const row = el("div", "calculator-relation");
      row.append(
        el("strong", "", `${pair.a} ↔ ${pair.b}`),
        el(
          "span",
          "calculator-muted",
          "Keine Beziehung erfasst – Verträglichkeit unbekannt",
        ),
      );
      content.append(row);
    }
    details.append(content);
    liste.append(details);
  }
}

function renderAbtrennung(eintraege) {
  const liste = document.querySelector("[data-calculator-barriers]");
  if (!liste) return;
  liste.replaceChildren();
  if (!eintraege.length) {
    liste.append(
      el("p", "calculator-muted", "Wähle Tiere für die Abtrennungsprüfung."),
    );
    return;
  }
  for (const e of eintraege.filter((e) => e.anzahl > 0)) {
    const card = el(
      "div",
      e.rechner.besucherBetretbar === false
        ? "calculator-barrier-item calculator-has-problem"
        : "calculator-barrier-item",
    );
    card.append(el("strong", "", e.name));
    const hints = [];
    const f = e.rechner.fortbewegung;
    if (f.fliegen === true)
      hints.push(
        "Flugfähig: Gehege gegen Überfliegen sichern (z. B. vollständige Übernetzung).",
      );
    if (f.klettern === true)
      hints.push(
        "Kletterfähig: Bäume, Kletterhilfen und überhängende Strukturen am Rand berücksichtigen.",
      );
    if (f.tauchen === true)
      hints.push(
        "Taucht: Unterwasserwege und Wassergrenzen ebenfalls sichern.",
      );
    if (f.schwimmen === true)
      hints.push(
        "Schwimmfähig: Wassergräben nicht ohne weitere Prüfung als Barriere verwenden.",
      );
    if (f.landgang === true)
      hints.push(
        "Kann an Land gehen: Der Beckenrand allein hält das Tier nicht zurück.",
      );
    if (f.springen === true)
      hints.push(
        e.rechner.sprungHoeheMeter === null
          ? "Springfähig: Maximale Sprunghöhe noch nicht eingetragen. Keine verlässliche Zaunhöhe berechenbar."
          : `Springt bis ${e.rechner.sprungHoeheMeter} m laut eingetragenem Wert: Barriere muss darüber liegen; Sicherheitsreserve nicht festgelegt.`,
      );
    const unknown = BEWEGUNGEN.filter((key) => f[key] === null);
    if (unknown.length)
      hints.push(
        `Nicht geprüft: ${unknown.map((key) => MOVEMENT_LABELS[key]).join(", ")}.`,
      );
    if (!hints.length)
      hints.push(
        "Keine besondere Fortbewegungsart erfasst. Trotzdem ist keine Barriere automatisch ausbruchssicher.",
      );
    hints.push(
      e.rechner.besucherBetretbar === true
        ? "Besucherzugang laut Daten zulässig; Schutzmassnahmen separat prüfen."
        : e.rechner.besucherBetretbar === false
          ? "Nicht für ein betretbares Gehege gekennzeichnet."
          : "Besucherzugang nicht bekannt – kein begehbares Gehege als sicher annehmen.",
    );
    const ul = el("ul");
    for (const hint of hints)
      ul.append(
        el(
          "li",
          /Nicht für ein betretbares Gehege|Flugfähig|Kletterfähig|Schwimmfähig|Springt bis|Springfähig|Taucht:|Kann an Land gehen/.test(
            hint,
          )
            ? "calculator-danger-text"
            : "",
          hint,
        ),
      );
    card.append(ul);
    liste.append(card);
  }
  const candidates = eintraege.filter((e) => e.anzahl > 0);
  const kategorien = candidates.map(
    (e) =>
      new Set(
        (e.tier.filter?.gehegetyp ?? []).map((typ) => {
          if (/aquarium/i.test(typ)) return "Aquarium";
          if (/vivarium|ausstellung/i.test(typ)) return "Vivarium";
          if (/fliegend|voliere/i.test(typ)) return "Fluggehege";
          return "Landgehege";
        }),
      ),
  );
  if (
    kategorien.length > 1 &&
    ![...kategorien[0]].some((typ) => kategorien.every((set) => set.has(typ)))
  ) {
    liste.prepend(
      el(
        "p",
        "calculator-danger-text",
        "Unterschiedliche Gehegetypen in der Auswahl: Prüfe, ob diese Tierarten überhaupt in derselben Anlage gehalten werden können.",
      ),
    );
  }
  if (
    candidates.length &&
    candidates.every((e) => e.rechner.besucherBetretbar === true)
  ) {
    liste.prepend(
      el(
        "p",
        "calculator-good-text",
        "Alle ausgewählten Arten sind als betretbar erfasst. Zusätzliche Sicherheitsregeln beachten.",
      ),
    );
  } else {
    liste.prepend(
      el(
        "p",
        candidates.some((e) => e.rechner.besucherBetretbar === false)
          ? "calculator-danger-text"
          : "calculator-warning-text",
        "Betretbarkeit des gemeinsamen Geheges nicht bestätigt. Alle Arten müssen dafür ausdrücklich als betretbar erfasst sein.",
      ),
    );
  }
}

function renderBerechnungen() {
  if (!document.querySelector("[data-calculator-page]")) return;
  const eintraege = erstelleEintraege();
  // Eingabefelder bei Änderungen nicht neu erzeugen: Fokus und Aufklappzustand bleiben erhalten.
  for (const e of eintraege) {
    aktualisiereGruppenStatus(e);
    const gruppe = sozialeGruppen(e.tier, e.rechner);
    for (const art of ["min", "max"]) {
      const button = document.querySelector(
        `[data-calc-limit="${art}"][data-id="${e.tier.id}"]`,
      );
      if (!button) continue;
      button.disabled = gruppe[art] === null;
      button.title =
        gruppe[art] === null
          ? "Keine Gruppengrenze vorhanden"
          : `${gruppe[art]} Erwachsene einstellen (${gruppe.quelle})`;
    }
  }
  const risiken = analysiereBeziehungen(eintraege).filter((pair) =>
    pair.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ)),
  );
  const betroffene = new Set(risiken.flatMap((pair) => [pair.a, pair.b]));
  for (const e of eintraege) {
    const card = document.querySelector(
      `[data-calculator-species-id="${e.tier.id}"]`,
    );
    if (!card) continue;
    const gruppenfehler = gruppenPruefung(e);
    card.classList.toggle(
      "calculator-has-problem",
      gruppenfehler.zuWenig || gruppenfehler.zuViele || betroffene.has(e.name),
    );
    let note = card.querySelector("[data-calculator-relation-warning]");
    if (betroffene.has(e.name)) {
      if (!note) {
        note = el(
          "p",
          "calculator-danger-text calculator-relation-note",
          "⚠ Problematische Beziehung zu einer weiteren ausgewählten Art",
        );
        note.dataset.calculatorRelationWarning = "1";
        card.append(note);
      }
    } else note?.remove();
  }
  renderFlaechen(eintraege);
  renderBeziehungen(eintraege);
  renderAbtrennung(eintraege);
}

function renderErgebnisse() {
  if (!document.querySelector("[data-calculator-page]")) return;
  renderTiere(erstelleEintraege());
  renderBerechnungen();
}

function speichereEdit(input) {
  const id = input.dataset.id;
  const key = input.dataset.calcEdit;
  if (!id || !key) return;
  const daten = state.daten[id] ?? (state.daten[id] = {});
  const val =
    input.tagName === "SELECT"
      ? input.value === "ja"
        ? true
        : input.value === "nein"
          ? false
          : null
      : zahlOderNull(input.value);
  if (key.includes(".")) {
    const [bereich, feld] = key.split(".");
    const ziel =
      bereich === "fortbewegung"
        ? "fortbewegung"
        : bereich === "gruppe"
          ? "gruppe"
          : "flaechen";
    if (ziel === "flaechen") {
      daten.flaechen ??= {};
      daten.flaechen[bereich] ??= {};
      daten.flaechen[bereich][feld] = val;
    } else if (ziel === "fortbewegung") {
      daten.fortbewegung ??= {};
      daten.fortbewegung[feld] = val;
    } else if (ziel === "gruppe") {
      daten.gruppe ??= {};
      daten.gruppe[feld] = val;
    }
  } else daten[key] = val;
  speichereZustand();
  renderBerechnungen();
}

export async function init() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  state = leseZustand();
  aufgeklappteTiere.clear();
  tiere = await datenImportieren();
  if (signal.aborted || !document.querySelector("[data-calculator-page]"))
    return;
  baueFilter();
  document.querySelector("[data-calculator-page]")?.addEventListener(
    "input",
    (event) => {
      if (event.target.matches("[data-calculator-search]")) renderAuswahl();
    },
    { signal },
  );
  document.querySelector("[data-calculator-page]")?.addEventListener(
    "change",
    (event) => {
      const target = event.target;
      if (target.dataset.calcSelect) {
        setTierAusgewaehlt(target.dataset.calcSelect, target.checked);
      } else if (target.dataset.calcSex) {
        const id = target.dataset.id;
        state.mengen[id] = {
          ...menge(id),
          [target.dataset.calcSex]: pruefeMenge(target.value),
        };
        speichereZustand();
        renderBerechnungen();
      } else if (target.dataset.calcEdit) {
        speichereEdit(target);
      } else if (
        target.matches(
          "[data-calculator-filter], [data-calculator-selected-only]",
        )
      ) {
        renderAuswahl();
      }
    },
    { signal },
  );
  document.querySelector("[data-calculator-page]")?.addEventListener(
    "click",
    (event) => {
      const toggle = event.target.closest("[data-calc-toggle]");
      if (toggle) {
        const id = toggle.dataset.calcToggle;
        const body = document.getElementById(`rechner-details-${id}`);
        if (body) {
          body.hidden = !body.hidden;
          if (body.hidden) aufgeklappteTiere.delete(id);
          else aufgeklappteTiere.add(id);
          toggle.textContent = body.hidden ? "Aufklappen ▼" : "Zuklappen ▲";
          toggle.setAttribute("aria-expanded", String(!body.hidden));
        }
      }
      const limit = event.target.closest("[data-calc-limit]");
      if (limit) {
        const tier = tiere.find((entry) => entry.id === limit.dataset.id);
        if (tier) {
          const grenze = sozialeGruppen(
            tier,
            getRechnerDaten(tier, state.daten[tier.id]),
          );
          const wert = grenze[limit.dataset.calcLimit];
          if (wert !== null) {
            const alt = menge(tier.id);
            const maennchen = Math.min(alt.maennchen, wert);
            state.mengen[tier.id] = {
              ...alt,
              maennchen,
              weibchen: Math.max(0, wert - maennchen),
            };
            speichereZustand();
            renderErgebnisse();
          }
        }
      }
      const remove = event.target.closest("[data-calc-remove]");
      if (remove) setTierAusgewaehlt(remove.dataset.calcRemove, false);
      if (event.target.closest("[data-calculator-clear]")) setTierAuswahl([]);
      if (event.target.closest("[data-calculator-select-visible]")) {
        const neu = filterTiere(tiere, filterState()).map((tier) => tier.id);
        setTierAuswahl([...getTierAuswahl(), ...neu]);
      }
    },
    { signal },
  );
  document.addEventListener(
    "tierAuswahlChanged",
    () => {
      renderAuswahl();
      renderErgebnisse();
    },
    { signal },
  );
  document.addEventListener(
    "languageChanged",
    () => {
      renderAuswahl();
      renderErgebnisse();
    },
    { signal },
  );
  renderAuswahl();
  renderErgebnisse();
}
