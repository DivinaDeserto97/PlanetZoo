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
  if (!eintrag) return { maennchen: 1, weibchen: 1 };
  return {
    maennchen: pruefeMenge(eintrag.maennchen),
    weibchen: pruefeMenge(eintrag.weibchen),
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
        anzahl: m.maennchen + m.weibchen,
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
    const card = el("article", "calculator-species-card");
    const heading = el("div", "calculator-species-title");
    const title = el("div");
    title.append(
      el("strong", "", e.name),
      el("small", "calculator-muted", e.tier.datenId ?? ""),
    );
    const remove = el("button", "calculator-button-subtle", "Entfernen ×");
    remove.type = "button";
    remove.dataset.calcRemove = e.tier.id;
    heading.append(title, remove);
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
    );
    const gruppe = sozialeGruppen(e.tier, e.rechner);
    const groupText = [
      `Gruppe: ${gruppe.min === null ? "?" : gruppe.min} – ${gruppe.max === null ? "?" : gruppe.max}`,
      `Aktuell: ${e.anzahl}`,
      gruppe.min !== null && e.anzahl < gruppe.min
        ? `Noch ${gruppe.min - e.anzahl} bis zum Minimum`
        : "",
      gruppe.max !== null && e.anzahl > gruppe.max
        ? `${e.anzahl - gruppe.max} über dem Maximum`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const status = el("div", "calculator-group-status", groupText);
    status.dataset.calculatorGroupStatus = e.tier.id;
    const quelle = el("small", "calculator-muted", gruppe.quelle);
    quelle.dataset.calculatorGroupSource = e.tier.id;
    const edit = el("details", "calculator-edit");
    const sum = el(
      "summary",
      "",
      "Flächen, Fähigkeiten & Besuchersicherheit eintragen",
    );
    edit.append(sum);
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
    );
    fields.append(
      nummerEingabe("Gruppenminimum (Spielwert)", e.rechner.gruppe.min, {
        calcEdit: "gruppe.min",
        id: e.tier.id,
      }),
      nummerEingabe("Gruppenmaximum (Spielwert)", e.rechner.gruppe.max, {
        calcEdit: "gruppe.max",
        id: e.tier.id,
      }),
    );
    const footer = el(
      "p",
      "calculator-muted",
      "Manuelle Werte werden lokal im Browser gespeichert. Für eine dauerhafte Projektangabe planetZoo2.rechner in der Tier-JSON ausfüllen.",
    );
    edit.append(fields, footer);
    card.append(heading, zeile, status, quelle, edit);
    liste.append(card);
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
  for (const pair of paare) {
    const row = el("div", "calculator-relation");
    row.append(el("strong", "", `${pair.a} ↔ ${pair.b}`));
    if (!pair.beziehungen.length) {
      row.append(
        el(
          "span",
          "calculator-muted",
          "Keine Beziehung erfasst (nicht automatisch verträglich)",
        ),
      );
    } else {
      for (const rel of pair.beziehungen) {
        const art = el(
          "span",
          WARN_RELATIONS.has(rel.typ)
            ? "calculator-warning-text"
            : "calculator-good-text",
        );
        const lebensphasen = rel.zielLebensphase.length
          ? ` · Ziel: ${rel.zielLebensphase.join(", ")}`
          : "";
        art.textContent = `${RELATION_LABELS[rel.typ] ?? rel.typ}: ${rel.von} → ${rel.zu} (${rel.lebensphase}${lebensphasen})`;
        row.append(
          art,
          el("small", "calculator-muted", `Quelle: ${rel.quelle}`),
        );
      }
    }
    liste.append(row);
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
    const card = el("div", "calculator-barrier-item");
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
    for (const hint of hints) ul.append(el("li", "", hint));
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
        "calculator-warning-text",
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
        "calculator-warning-text",
        "Betretbarkeit des gemeinsamen Geheges nicht bestätigt. Alle Arten müssen dafür ausdrücklich als betretbar erfasst sein.",
      ),
    );
  }
}

function renderBerechnungen() {
  if (!document.querySelector("[data-calculator-page]")) return;
  const eintraege = erstelleEintraege();
  // Eingabefelder nicht bei jeder Änderung neu erzeugen: sonst kann der
  // Browser beim Entfernen des aktiven Feldes einen Blur-Fehler auslösen.
  for (const e of eintraege) {
    const gruppe = sozialeGruppen(e.tier, e.rechner);
    const grund = [
      `Gruppe: ${gruppe.min === null ? "?" : gruppe.min} – ${gruppe.max === null ? "?" : gruppe.max}`,
      `Aktuell: ${e.anzahl}`,
      gruppe.min !== null && e.anzahl < gruppe.min
        ? `Noch ${gruppe.min - e.anzahl} bis zum Minimum`
        : "",
      gruppe.max !== null && e.anzahl > gruppe.max
        ? `${e.anzahl - gruppe.max} über dem Maximum`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    text(
      document.querySelector(`[data-calculator-group-status="${e.tier.id}"]`),
      grund,
    );
    text(
      document.querySelector(`[data-calculator-group-source="${e.tier.id}"]`),
      gruppe.quelle,
    );
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
