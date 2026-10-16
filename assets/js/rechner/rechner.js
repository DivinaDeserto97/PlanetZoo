/*
 * Gehegerechner: lokale, gemeinsame Tierauswahl und transparente Auswertung.
 * Neue Daten bitte unter planetZoo2.rechner der jeweiligen Tier-JSON pflegen.
 * Vom Nutzer eingetragene Werte bleiben lokal und ändern die Tier-JSON nicht.
 */
import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";
import { automatischeTrennVorschlaege } from "./trennEmpfehlungen.js";
import { getLanguage, getLocalizedValue } from "../features/language.js";
import {
  getTierAuswahl,
} from "../features/tierAuswahl.js";
import { filterTiere, getTierFilterName } from "../features/tierFilter.js";
import {
  ZONEN_TYPEN, UEBERGANGS_TYPEN, profilAusZoopedia,
  pruefeZonen, pruefeZonenKapazitaet, umweltUeberschneidung, optimalesKlima, paarStatus,
} from "./zonenLogik.js";
import {
  FLAECHEN,
  BEWEGUNGEN,
  getRechnerDaten,
  sozialeGruppen,
  berechneFlaechen,
  analysiereBeziehungen,
  zahlOderNull,
} from "./rechnerBerechnung.js";

const STORAGE_KEY = "planetZoo2-gehegerechner-v2";
const ALT_STORAGE_KEY = "planetZoo2-gehegerechner-v1";
const AREA_LABELS = {
  land: "Landfläche",
  wasser: "Wasserfläche",
  tauchflaeche: "Tauchfläche (tiefes Wasser)",
  klettern: "Kletterfläche",
  flug: "Flugfläche",
  schutz: "Unterschlupf",
};
const MOVEMENT_LABELS = {
  fliegen: "Fliegt",
  klettern: "Klettert",
  tauchen: "Taucht",
  schwimmen: "Schwimmt",
  landgang: "Kann an Land gehen",
  springen: "Springt über Hindernisse",
  waten: "Watet im Flachwasser",
  flattern: "Flattert über Hindernisse",
  durchschlupf: "Passt durch schmale Öffnungen",
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
let state = { gehege: [], aktivId: null, daten: {} };
function neueId() {
  return `gehege-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function neuesGehege(name, tiereIds = [], mengen = {}) {
  return {
    id: neueId(),
    name,
    tiereIds: [...new Set(tiereIds)],
    mengen: { ...mengen },
    zonen: [],
    uebergaenge: [],
  };
}
function aktivesGehege() {
  return state.gehege.find((g) => g.id === state.aktivId) ?? state.gehege[0];
}
function aktuelleAuswahl() {
  return aktivesGehege()?.tiereIds ?? [];
}
function setTierAuswahl(ids) {
  const g = aktivesGehege();
  if (!g) return;
  g.tiereIds = [...new Set(ids.filter((id) => typeof id === "string"))];
  speichereZustand();
  renderAuswahl();
  renderErgebnisse();
}
function setTierAusgewaehlt(id, aktiv) {
  const liste = new Set(aktuelleAuswahl());
  if (aktiv) liste.add(id);
  else liste.delete(id);
  setTierAuswahl([...liste]);
}
function mengeSpeicher() {
  return aktivesGehege()?.mengen ?? {};
}
const aufgeklappteTiere = new Set();

function leseZustand() {
  try {
    const gespeichert = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (gespeichert && Array.isArray(gespeichert.gehege) && gespeichert.gehege.length) {
      const gehege = gespeichert.gehege.filter((g) => g && typeof g.id === "string")
        .map((g) => ({
          id: g.id,
          name: String(g.name || "Unbenanntes Gehege").slice(0, 80),
          tiereIds: Array.isArray(g.tiereIds) ? g.tiereIds.filter((id) => typeof id === "string") : [],
          mengen: g.mengen && typeof g.mengen === "object" ? g.mengen : {},
          zonen: Array.isArray(g.zonen) ? g.zonen : [],
          uebergaenge: Array.isArray(g.uebergaenge) ? g.uebergaenge : [],
        }));
      if (gehege.length) return {
        gehege, aktivId: gehege.some((g) => g.id === gespeichert.aktivId)
          ? gespeichert.aktivId : gehege[0].id,
        daten: gespeichert.daten ?? {},
      };
    }
  } catch (error) {
    console.warn("Gehegespeicher konnte nicht gelesen werden", error);
  }
  // Vorhandene Rechnerwerte und die gemeinsame Auswahl nur beim ersten Start übernehmen.
  let alt = {};
  try { alt = JSON.parse(localStorage.getItem(ALT_STORAGE_KEY) || "null") ?? {}; }
  catch { /* alter Speicher ungültig */ }
  const erstes = neuesGehege("Gehege 1", getTierAuswahl(), alt.mengen ?? {});
  return { gehege: [erstes], aktivId: erstes.id, daten: alt.daten ?? {} };
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
  const eintrag = mengeSpeicher()[id];
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
  const selected = new Set(aktuelleAuswahl());
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
  filter.ausgewaehlteIds = aktuelleAuswahl();
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

function renderGehegeAuswahl() {
  const select = document.querySelector("[data-calculator-habitat-select]");
  if (!select) return;
  select.replaceChildren();
  for (const g of state.gehege) {
    const option = el("option", "", `${g.name} (${g.tiereIds.length} Arten)`);
    option.value = g.id;
    select.append(option);
  }
  select.value = aktivesGehege().id;
  text(document.querySelector("[data-calculator-current-name]"), aktivesGehege().name);
  const del = document.querySelector("[data-calculator-habitat-delete]");
  if (del) del.disabled = state.gehege.length <= 1;
}
function wechselGehege(id) {
  if (!state.gehege.some((g) => g.id === id)) return;
  state.aktivId = id;
  aufgeklappteTiere.clear();
  speichereZustand();
  renderGehegeAuswahl();
  renderAuswahl();
  renderErgebnisse();
}
function erzeugeGehege(duplizieren = false) {
  const alt = aktivesGehege();
  const neu = neuesGehege(
    duplizieren ? `${alt.name} (Kopie)` : `Gehege ${state.gehege.length + 1}`,
    duplizieren ? alt.tiereIds : [],
    duplizieren ? structuredClone(alt.mengen) : {},
  );
  if (duplizieren) {
    neu.zonen = structuredClone(alt.zonen ?? []);
    neu.uebergaenge = structuredClone(alt.uebergaenge ?? []);
  }
  state.gehege.push(neu);
  wechselGehege(neu.id);
}
function umbenennenGehege() {
  const g = aktivesGehege();
  const name = window.prompt("Name des Geheges:", g.name);
  if (name === null || !name.trim()) return;
  g.name = name.trim().slice(0, 80);
  speichereZustand();
  renderGehegeAuswahl();
}
function loescheGehege() {
  if (state.gehege.length <= 1) return;
  const g = aktivesGehege();
  if (!window.confirm(`Gehege „${g.name}“ mit seiner Tierplanung löschen?`)) return;
  state.gehege = state.gehege.filter((e) => e.id !== g.id);
  wechselGehege(state.gehege[0].id);
}
function exportiereGehege() {
  const datei = new Blob([JSON.stringify({ version: 2, ...state }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(datei);
  const link = document.createElement("a");
  link.href = url;
  link.download = "planet-zoo-2-gehegeplaene.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function importiereGehege(datei) {
  if (!datei) return;
  if (datei.size > 5_000_000) { window.alert("Die Datei ist zu gross (maximal 5 MB)."); return; }
  try {
    const incoming = JSON.parse(await datei.text());
    if (incoming.version !== 2 || !Array.isArray(incoming.gehege) || !incoming.gehege.length) {
      throw new Error("Keine gültige Gehegeplan-Sicherung (Version 2).");
    }
    if (!window.confirm("Alle aktuellen Gehegepläne durch die Sicherung ersetzen?")) return;
    const bekannte = new Set(tiere.map((tier) => tier.id));
    const gehege = incoming.gehege.slice(0, 200).filter((g) => g && typeof g === "object")
      .map((g, index) => ({
        id: neueId(),
        name: String(g.name || `Gehege ${index + 1}`).slice(0, 80),
        tiereIds: Array.isArray(g.tiereIds)
          ? [...new Set(g.tiereIds.filter((id) => bekannte.has(id)))] : [],
        zonen: Array.isArray(g.zonen) ? g.zonen.slice(0,100).filter((z)=>typeof z?.id==="string") : [],
        uebergaenge: Array.isArray(g.uebergaenge) ? g.uebergaenge.slice(0,300).filter((v)=>typeof v?.von==="string") : [],
        mengen: Object.fromEntries(
          Object.entries(g.mengen ?? {}).filter(([id]) => bekannte.has(id)).map(([id, m]) => [id, {
            maennchen: pruefeMenge(m?.maennchen),
            weibchen: pruefeMenge(m?.weibchen),
            jungtiere: pruefeMenge(m?.jungtiere),
          }]),
        ),
      }));
    if (!gehege.length) throw new Error("Keine Gehegepläne in der Datei gefunden.");
    // Manuelle Stammdaten aus alter Version 2 ebenfalls mitnehmen.
    state = { gehege, aktivId: gehege[0].id,
      daten: incoming.daten && typeof incoming.daten === "object" && !Array.isArray(incoming.daten)
        ? incoming.daten : {} };
    aufgeklappteTiere.clear();
    speichereZustand();
    renderGehegeAuswahl();
    renderAuswahl();
    renderErgebnisse();
  } catch (error) {
    window.alert(`Import fehlgeschlagen: ${error.message}`);
  }
}
function importiereGemeinsameAuswahl() {
  const ids = getTierAuswahl();
  if (!ids.length) {
    window.alert("Die gemeinsame Tierauswahl ist noch leer.");
    return;
  }
  setTierAuswahl([...aktuelleAuswahl(), ...ids]);
}
function renderAuswahl() {
  const liste = document.querySelector("[data-calculator-pick-list]");
  if (!liste) return;
  const selected = new Set(aktuelleAuswahl());
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
  const erwachsene = e.maennchen + e.weibchen;
  const typ = e.maennchen > 0 && e.weibchen > 0 ? "gemischt" :
    e.maennchen > 0 ? "maennlich" : "weiblich";
  const spielregel = e.rechner.gruppenTypen?.[typ];
  const grenzen = spielregel ?? gruppe;
  const fehler = [];
  if (grenzen.min !== null && grenzen.min !== undefined && erwachsene < grenzen.min)
    fehler.push(`Mindestens ${grenzen.min} Erwachsene (${typ})`);
  if (grenzen.max !== null && grenzen.max !== undefined && erwachsene > grenzen.max)
    fehler.push(`Höchstens ${grenzen.max} Erwachsene (${typ})`);
  if (Number.isFinite(grenzen.maennchenMax) && e.maennchen > grenzen.maennchenMax)
    fehler.push(`Maximal ${grenzen.maennchenMax} Männchen in dieser Gruppierung`);
  if (Number.isFinite(grenzen.weibchenMax) && e.weibchen > grenzen.weibchenMax)
    fehler.push(`Maximal ${grenzen.weibchenMax} Weibchen in dieser Gruppierung`);
  return {gruppe, erwachsene, typ, grenzen, fehler,
    zuWenig: fehler.some((f)=>f.startsWith("Mindestens")),
    zuViele: fehler.some((f)=>!f.startsWith("Mindestens"))};
}

function aktualisiereGruppenStatus(e) {
  const {gruppe, erwachsene, grenzen, fehler, typ} = gruppenPruefung(e);
  const beschreibung = [
    `Gruppe (${typ}): ${grenzen.min ?? "?"} – ${grenzen.max ?? "?"}`,
    `${erwachsene} Erwachsene + ${e.jungtiere} Jungtiere`,
    ...fehler,
  ].join(" · ");
  const status = document.querySelector(`[data-calculator-group-status="${e.tier.id}"]`);
  text(status,beschreibung);
  status?.classList.toggle("calculator-danger-text",fehler.length>0);
  const card = document.querySelector(`[data-calculator-species-id="${e.tier.id}"]`);
  card?.classList.toggle("calculator-has-problem",fehler.length>0);
  text(document.querySelector(`[data-calculator-group-source="${e.tier.id}"]`),
    e.rechner.gruppenTypen ? "Gruppentypen aus eingefügter Zoopedia" : gruppe.quelle);
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
    const { gruppe, grenzen } = gruppenPruefung(e);
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
      ["min", grenzen.min],
      ["max", grenzen.max],
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
    if (e.rechner.quelle?.url) {
      const note = el("p", "calculator-muted", `Flächen und Gruppengrössen: ${e.rechner.quelle.art} (${e.rechner.quelle.stand}).`);
      const link = el("a", "", "Datenquelle öffnen");
      link.href = e.rechner.quelle.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      note.append(" ", link);
      details.append(note);
    }
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
          : resultat.wert === 0 ? "Nicht erforderlich" : `${resultat.wert.toLocaleString(getLanguage())} m²`,
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
        : "Vorprüfung bei gemeinsam erreichbaren Flächen: je Flächenart gilt der grösste Artenbedarf. Getrennte Zonen müssen zusätzlich einzeln eingeplant werden.",
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
  // Die Zoopedia selbst unterscheidet neutral/erfolgreich von
  // unbekannt; Nahrungsnetz-Lücken dürfen diese Aussage nicht überschreiben.
  const zoopediaPaare = paare.map((pair) => {
    const a = eintraege.find((e)=>e.name===pair.a);
    const b = eintraege.find((e)=>e.name===pair.b);
    return {...pair,spiel:a&&b?paarStatus(a,b,paare):null};
  });
  const spielBekannt=zoopediaPaare.filter((pair)=>["neutral","erfolgreich"].includes(pair.spiel?.status));
  const bekannte = paare.filter((pair) => pair.beziehungen.length);
  const unbekannte = paare.filter((pair) => !pair.beziehungen.length);
  const risiken = bekannte.filter((pair) =>
    pair.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ)),
  );
  text(
    document.querySelector("[data-calculator-relation-count]"),
    `${risiken.length} Nahrungsnetz-Risiken · ${bekannte.length+spielBekannt.length} Einträge`,
  );
  if (!bekannte.length && !spielBekannt.length)
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
  for (const paar of spielBekannt) {
    const row=el("div","calculator-relation");
    row.append(el("strong","",`${paar.a} ↔ ${paar.b}`),
      el("span","calculator-good-text",`Zoopedia: ${paar.spiel.status} · ${paar.spiel.grund}`));
    liste.append(row);
  }
  const wirklichUnbekannte=unbekannte.filter((pair)=>!spielBekannt.some((known)=>known.a===pair.a&&known.b===pair.b));
  if (wirklichUnbekannte.length) {
    const details = el("details", "calculator-unknown-relations");
    details.append(
      el(
        "summary",
        "",
        `${wirklichUnbekannte.length} Tierpaare ohne erfasste Beziehung anzeigen`,
      ),
    );
    const content = el("div");
    for (const pair of wirklichUnbekannte) {
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

function renderAutomatischeTrennung(eintraege) {
  const host = document.querySelector("[data-calculator-auto-separations]");
  if (!host) return;
  host.replaceChildren();
  const daten = automatischeTrennVorschlaege(eintraege);
  if (daten.arten < 2) {
    host.append(el("p", "calculator-muted", "Wähle mindestens zwei Tierarten aus. Danach erscheinen automatisch die passenden Trennideen je Tierpaar."));
    return;
  }
  const statusText = {
    neutral: "Neutral laut Zoopedia", erfolgreich: "Erfolgreiche Zoopedia-Beziehung",
    gefahr: "Ökologisches Risiko", unbekannt: "Beziehung nicht belegt",
    oekologisch: "Ökologische Beziehung vorhanden",
  };
  host.append(el("p", "calculator-muted", `${daten.paare.length} Tierpaare geprüft. Bewegungsunterschiede stammen aus Tierprofilen; eine konkrete Bauweise muss weiterhin gegen Umwege und Jungtiere geprüft werden.`));
  const maximal = 80;
  for (const paar of daten.paare.slice(0, maximal)) {
    const box = el("article", "calculator-advice-card");
    const head = el("div", "calculator-advice-head");
    head.append(el("strong", "", `${paar.a} ↔ ${paar.b}`));
    head.append(el("span", `calculator-advice-relation ${paar.relation.status==='gefahr'?'calculator-advice-danger':''}`,
      statusText[paar.relation.status] ?? "Beziehung prüfen"));
    box.append(head, el("p", "calculator-muted", paar.pruefung));
    if (paar.gemeinsam.length)
      box.append(el("p", "calculator-muted", `Beide besitzen laut Profil: ${paar.gemeinsam.join(", ")}. Das allein kann die beiden nicht trennen.`));
    const kandidaten=paar.varianten;
    const anz = kandidaten.filter((v)=>v.sicherheit==='datenbasiert').length;
    box.append(el("p", "calculator-muted", anz
      ? `${anz} Bewegungsunterschied(e) im Tierprofil erkennbar; konkrete Abtrennung trotzdem prüfen.`
      : "Keine ausschliessliche Bewegungsmethode für dieses Paar sicher nachgewiesen. Prüfvorschläge folgen."));
    const vorschlagListe = el("div", "calculator-advice-list");
    for(const v of kandidaten.slice(0, 3)) {
      const option = el("div", "calculator-advice-option");
      const ober = el("div", "calculator-advice-option-head");
      ober.append(el("strong", "", v.titel));
      ober.append(el("span", `calculator-advice-indicator ${v.sicherheit==='datenbasiert'?'calculator-advice-derived':''}`,
        v.sicherheit==='datenbasiert'?'Bewegungsunterschied belegt':'Im Spiel prüfen'));
      option.append(ober, el("p", "", v.richtung));
      option.append(el("p", "calculator-muted", `${v.beschreibung} ${v.bau}`));
      option.append(el("p", "calculator-muted", `${v.begruendung} ${v.bedingung}`));
      vorschlagListe.append(option);
    }
    box.append(vorschlagListe);
    if(kandidaten.length > 3) {
      const weitere=el("details", "calculator-advice-more");
      weitere.append(el("summary", "", `${kandidaten.length - 3} weitere Trennvarianten anzeigen`));
      for(const v of kandidaten.slice(3)) {
        const option=el("div", "calculator-advice-option");
        option.append(el("strong", "", v.titel),el("p", "", `${v.richtung}: ${v.beschreibung}`),
          el("p", "calculator-muted", `${v.bau} ${v.bedingung}`));
        weitere.append(option);
      }
      box.append(weitere);
    }
    host.append(box);
  }
  if(daten.paare.length > maximal) host.append(el("p", "calculator-warning-text", `Es werden die ersten ${maximal} von ${daten.paare.length} Paaren angezeigt. Wähle weniger Tierarten für eine gezielte Planung.`));
  if(daten.besucher.length) {
    const visitors=el("section", "calculator-advice-card");
    visitors.append(el("h3", "", "Besucherbereiche automatisch berücksichtigen"));
    for(const v of daten.besucher) visitors.append(el("p", "calculator-muted",
      `${v.tier} darf laut Zoopedia in Besucherbereiche, ${v.fernzuhalten} nicht. `+
      (v.varianten.some((o)=>o.sicherheit==='datenbasiert')
        ? `Geprüfter Bewegungsunterschied vorhanden – Trennvorschlag beim Tierpaar beachten.`
        : `Keine gesicherte selektive Durchgangslösung aus den gespeicherten Daten. Besucherbereich abtrennen.`)));
    host.append(visitors);
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
    const profil = profilAusZoopedia(e);
    const f = profil.faehigkeiten;
    if (f.landgang === true) hints.push("Landgang aus Zoopedia-Daten abgeleitet; Reichweite und Hindernisse separat prüfen.");
    if (f.waten === true) hints.push("Watet im Flachwasser; Ufer und Wassertiefe getrennt prüfen.");
    if (f.flattern === true) hints.push("Flatterfähigkeit erfasst; weder freie Flugfähigkeit noch Distanz abgeleitet.");
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
    const ableitung = Object.entries(profil.beschreibung)
      .filter(([key,quelle]) => f[key] === true && quelle.startsWith("Abgeleitet"))
      .map(([key,quelle]) => `${MOVEMENT_LABELS[key]??key}: ${quelle}`);
    hints.push(...ableitung);
    if (unknown.length)
      hints.push(
        `Nicht geprüft: ${unknown.map((key) => MOVEMENT_LABELS[key]).join(", ")}.`,
      );
    if (e.rechner.barriere?.hoeheMeter !== undefined) {
      const b = e.rechner.barriere;
      hints.unshift(`Zoopedia-Mindestbarriere: Stufe ${b.stufe}, ${b.hoeheMeter} m Höhe${b.klettersicher === true ? ", klettersicher erforderlich" : ""}. Keine Garantie gegen Ausbrüche über andere Wege.`);
      if (b.wassergraben) {
        hints.push(`Zoopedia nennt Wassergraben als Option: mindestens ${b.wassergraben.mindestensBreiteMeter} m breit und ${b.wassergraben.mindestensTiefeMeter} m tief. Nur bei geprüftem Verlauf ohne Umgehung.`);
      }
    }
    if (e.rechner.temperaturC) hints.push(`Temperaturbereich: ${e.rechner.temperaturC.min}–${e.rechner.temperaturC.max} °C.`);
    if (e.rechner.luftfeuchteProzent) hints.push(`Luftfeuchte: ${e.rechner.luftfeuchteProzent.min}–${e.rechner.luftfeuchteProzent.max} %.`);
    if (e.rechner.salinitaet?.length) hints.push(`Wassertyp: ${e.rechner.salinitaet.join(", ")}.`);
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
        "Unterschiedliche Zoopedia-Gehegetypen: Wasser, Land und Luft können in einer Anlage liegen. Prüfe erreichbare Bereiche und bestätigte Konflikte zonenweise – keine automatische Aquariumspflicht.",
      ),
    );
  }
  if (candidates.length) {
    const bs = candidates.map((e) => e.rechner.barriere);
    if (bs.every((b) => b?.stufe != null && b?.hoeheMeter != null)) {
      const stufe = Math.max(...bs.map((b) => b.stufe));
      const hoehe = Math.max(...bs.map((b) => b.hoeheMeter));
      const kletter = bs.some((b) => b.klettersicher === true);
      const hinweis = `Gemeinsame Mindestbarriere nach den vorliegenden Artenwerten: Stufe ${stufe}, Höhe ${hoehe} m${kletter ? ", klettersicher" : ""}. Die gesamte Abtrennung muss trotzdem auf Tierwege, Tunnel, Klettermöglichkeiten und Türen geprüft werden.`;
      liste.prepend(el("p", "calculator-warning-text", hinweis));
      if (bs.every((b) => b.wassergraben)) {
        const breite = Math.max(...bs.map((b) => b.wassergraben.mindestensBreiteMeter));
        const tiefe = Math.max(...bs.map((b) => b.wassergraben.mindestensTiefeMeter));
        liste.prepend(el("p", "calculator-warning-text", `Alle gewählten Arten haben einen dokumentierten Wassergraben-Eintrag: mindestens ${breite} m Breite und ${tiefe} m Tiefe. Umgehungen und Tauchpassagen weiterhin separat ausschliessen.`));
      }
    }
  }
  if (candidates.length > 1) {
    const bands = candidates.map((e) => e.rechner.temperaturC).filter(Boolean);
    if (bands.length === candidates.length && Math.max(...bands.map((b) => b.min)) > Math.min(...bands.map((b) => b.max))) {
      liste.prepend(el("p", "calculator-danger-text", "Kein gemeinsamer Temperaturbereich für alle ausgewählten Tierarten."));
    }
    const salinitaeten = candidates.filter((e) => e.rechner.salinitaet?.length);
    if (salinitaeten.length > 1) {
      const werte = ["Freshwater", "Brackish", "Saltwater"];
      const gemeinsam = werte.filter((wert) => salinitaeten.every((e) =>
        e.rechner.salinitaet.includes(wert) || e.rechner.salinitaet.includes("Any Salinity"),
      ));
      if (!gemeinsam.length) liste.prepend(el("p", "calculator-danger-text", "Kein gemeinsamer Salzgehalt für alle ausgewählten Aquarientiere."));
    }
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
        "Besucher dürfen nicht automatisch in alle Bereiche. Eine gesonderte Besucherzone ist möglich, wenn keine verbotene Art sie erreichen kann (siehe Zonenprüfung).",
      ),
    );
  }
}

// --------------------------------------------------------------
// Zonenverwaltung: jede Tierart erhält explizite Startzone(n).
// Wege können ungeprüft oder vom Nutzer im Spiel getestet sein.
// --------------------------------------------------------------
function zoneEingabe(titel,wert,feld,zoneId,art="text") {
  const wrapper=el("label","calculator-field",titel);
  const input=el("input");input.type=art;
  if(art==="number") {input.min="0";input.step="0.1";}
  input.value=wert ?? "";input.dataset.zoneEdit=feld;input.dataset.zoneId=zoneId;
  wrapper.append(input);return wrapper;
}
function optionsFeld(titel,werte,wert,attribut) {
  const wrapper=el("label","calculator-field",titel);const select=el("select");
  Object.assign(select.dataset,attribut);
  for(const [id,name] of Object.entries(werte)) {
    const option=el("option","",name);option.value=id;select.append(option);
  }
  select.value=wert;wrapper.append(select);return wrapper;
}
function renderZonen(eintraege) {
  const host=document.querySelector("[data-calculator-zones]");
  if(!host)return;
  const g=aktivesGehege();
  g.zonen??=[];g.uebergaenge??=[];
  host.replaceChildren();
  const info=el("p","calculator-muted","Lege Zonen an und wähle pro Tier eine Startzone. Übergänge lassen sich öffnen, sperren oder als Kletter-, Flug-, Schwimm-, Tauch-, Sprung- bzw. Schlupfweg anlegen. Die Prüfung ist konservativ: ungeprüfte Wege werden niemals als sicher freigegeben.");
  host.append(info);
  const buttons=el("div","calculator-actions");
  const add=el("button","","+ Zone hinzufügen");add.type="button";add.dataset.zoneAdd="1";
  const addLink=el("button","","+ Übergang hinzufügen");addLink.type="button";addLink.dataset.linkAdd="1";
  addLink.disabled=g.zonen.length<2;
  buttons.append(add,addLink);host.append(buttons);
  if (!g.zonen.length) {
    host.append(el("p","calculator-warning-text","Noch keine Zonen eingerichtet: Beziehungen und Flächen sind bisher nur eine allgemeine Vorprüfung."));
    return;
  }
  for(const zone of g.zonen) {
    const card=el("article","calculator-zone-card");
    const kopf=el("div","calculator-zone-head");
    kopf.append(el("strong","",zone.name||"Neue Zone"));
    const del=el("button","calculator-button-subtle","Zone entfernen ×");del.type="button";del.dataset.zoneRemove=zone.id;
    kopf.append(del);card.append(kopf);
    const fields=el("div","calculator-zone-fields");
    fields.append(zoneEingabe("Name",zone.name,"name",zone.id),
      optionsFeld("Bereich",ZONEN_TYPEN,zone.typ,{zoneEdit:"typ",zoneId:zone.id}),
      zoneEingabe("Geplante Fläche (m², optional)",zone.flaeche,"flaeche",zone.id,"number"));
    card.append(fields);
    const sub=el("div","calculator-zone-animals");
    sub.append(el("strong","","Startzone für diese Tiere:"));
    for(const e of eintraege.filter((x)=>x.anzahl>0)) {
      const wrap=el("label","calculator-zone-check");
      const check=el("input");check.type="checkbox";check.checked=(zone.startArten??[]).includes(e.tier.id);
      check.dataset.zoneAnimal=zone.id;check.dataset.tierId=e.tier.id;
      wrap.append(check,el("span","",e.name));sub.append(wrap);
    }
    if(!eintraege.length) sub.append(el("small","calculator-muted","Bitte zuerst Tiere auswählen."));
    card.append(sub);host.append(card);
  }
  const links=el("div","calculator-zone-links");
  links.append(el("h3","","Verbindungen zwischen Zonen"));
  for (const [index, verbindung] of g.uebergaenge.entries()) {
    const row=el("div","calculator-zone-link");
    const namen=Object.fromEntries(g.zonen.map((z)=>[z.id,z.name]));
    row.append(optionsFeld("Von",namen,verbindung.von,{linkEdit:"von",linkIndex:String(index)}),
      optionsFeld("Nach",namen,verbindung.nach,{linkEdit:"nach",linkIndex:String(index)}),
      optionsFeld("Übergang",UEBERGANGS_TYPEN,verbindung.art,{linkEdit:"art",linkIndex:String(index)}));
    for (const [name,feld] of [["Im Spiel getestet","getestet"],["Beide Richtungen","beidseitig"]]) {
      const control=el("label","calculator-zone-check");const check=el("input");check.type="checkbox";
      check.checked=verbindung[feld]===true || (feld==="beidseitig" && verbindung[feld]!==false);
      check.dataset.linkEdit=feld;check.dataset.linkIndex=String(index);
      control.append(check,el("span","",name));row.append(control);
    }
    const del=el("button","calculator-button-subtle","Entfernen ×");del.type="button";del.dataset.linkRemove=String(index);
    row.append(del);links.append(row);
  }
  host.append(links);
  const analyse=pruefeZonen(eintraege,g.zonen,g.uebergaenge);
  const overview=el("section","calculator-zone-overview");
  overview.append(el("h3","","Erreichbarkeit & Kontakt"));
  const startFehlt=eintraege.filter((e)=>e.anzahl>0 && !g.zonen.some((z)=>(z.startArten??[]).includes(e.tier.id)));
  if(startFehlt.length) overview.append(el("p","calculator-warning-text",`Keine Startzone für: ${startFehlt.map((e)=>e.name).join(", ")}.`));
  for (const e of eintraege.filter((x)=>x.anzahl>0)) {
    const profile=analyse.bewegung[e.tier.id];
    const row=el("div","calculator-zone-result");row.append(el("strong","",e.name));
    const known=g.zonen.filter((z)=>profile.zonen[z.id]===2).map((z)=>z.name);
    const maybe=g.zonen.filter((z)=>profile.zonen[z.id]===1).map((z)=>z.name);
    row.append(el("span","calculator-good-text",`Erreichbar aus Profil / getesteter Verbindung: ${known.join(", ")||"keine"}`));
    if(maybe.length)row.append(el("span","calculator-warning-text",`Möglicherweise erreichbar: ${maybe.join(", ")}`));
    overview.append(row);
  }
  for(const pair of analyse.paare) {
    const risk=pair.status==="gefahr";
    const row=el("div","calculator-zone-result");
    const c=risk&&pair.kontaktMoeglich?"calculator-danger-text":"calculator-muted";
    row.append(el("strong",c,`${pair.a} ↔ ${pair.b}: ${pair.status}`));
    row.append(el("span",c,`${pair.grund}. ${pair.kontaktMoeglich ? `Gemeinsame erreichbare Bereiche: ${pair.kontakt.join(", ")}.` : "Kein gemeinsamer erreichbarer Bereich nach aktuellem Plan."}`));
    if(risk&&pair.kontaktMoeglich)row.append(el("small","calculator-danger-text","Kontakt zu einer problematischen Beziehung möglich: sichere Trennung erforderlich."));
    if(pair.status==="unbekannt")row.append(el("small","calculator-warning-text","Unbekannt ist weder harmlos noch bestätigt gefährlich."));
    overview.append(row);
  }
  for(const b of analyse.besucher) {
    const row=el("p",b.verboten.length?"calculator-danger-text":"calculator-warning-text",
      `Besucherzone ${b.zone}: ${b.verboten.length?"Unzulässige Arten können sie erreichen: "+b.verboten.join(", "):b.ungeprueft.length?"Betretbarkeit ungeklärt: "+b.ungeprueft.join(", "):"Nur betretbare Arten derzeit erreichbar; echte Wegfindung im Spiel prüfen."}`);
    overview.append(row);
  }
  if(g.zonen.some((z)=>z.flaeche!==null && Number.isFinite(z.flaeche))) {
    overview.append(el("p","calculator-muted","Zonenflächen werden nicht addiert, wenn sie sich überschneiden. Pro Tier muss die Summe der tatsächlich nutzbaren Flächen überprüft werden; die Eingaben allein sind kein Nachweis."));
  }
  const pruefung=pruefeZonenKapazitaet(eintraege,g.zonen,g.uebergaenge);
  if(pruefung.length) {
    const size=el("div","calculator-zone-capacity");
    size.append(el("h3","","Fläche pro Tier über erreichbare Zonen"));
    size.append(el("p","calculator-muted","Getrennte Flächen der gleichen Art werden je Tier zusammengerechnet. Gemeinsam genutzte Flächen werden nicht für jede Art separat benötigt. Eine rechnerisch ausreichende Fläche ersetzt keine Wegfindungsprüfung."));
    for(const p of pruefung) {
      const danger=["zu-klein","zone-fehlt"].includes(p.status);
      const row=el("div","calculator-zone-result");
      row.append(el("strong",danger?"calculator-danger-text":"",`${p.name} · ${AREA_LABELS[p.art]}`));
      row.append(el("span",danger?"calculator-danger-text":"calculator-muted",
        `Bedarf: ${p.bedarf===null?"unbekannt":p.bedarf+" m²"} · erreichbar: ${p.moeglichFlaeche} m² (davon getestet: ${p.sicherFlaeche} m²)`));
      row.append(el("small",p.status==="rechnerisch-ausreichend"?"calculator-good-text":danger?"calculator-danger-text":"calculator-warning-text",
        `${p.status.replaceAll("-"," ")} · ${p.zonen.join(", ")||"keine geeignete Zone"}`));
      size.append(row);
    }
    overview.append(size);
  }
  host.append(overview);
}
function renderUmwelt(eintraege) {
  const host=document.querySelector("[data-calculator-environment]");if(!host)return;
  host.replaceChildren();if(!eintraege.length)return;
  const g=aktivesGehege();const zonen=g.zonen??[];
  const analyse=zonen.length?pruefeZonen(eintraege,zonen,g.uebergaenge??[]):null;
  const gruppen=zonen.length?zonen.map((z)=>({
    name:z.name, arten:eintraege.filter((e)=>e.anzahl>0 && analyse.bewegung[e.tier.id].zonen[z.id]>0),
  })):[{name:"Gemeinsames Gehege (Vorprüfung)",arten:eintraege}];
  for(const gruppe of gruppen.filter((x)=>x.arten.length)) {
    const wert=umweltUeberschneidung(gruppe.arten);
    const klima=optimalesKlima(gruppe.arten);
    const card=el("article","calculator-zone-result");card.append(el("strong","",gruppe.name));
    const t=wert.temperatur;
    card.append(el("p",t.konflikt?"calculator-danger-text":"calculator-muted",
      t.min===null?"Temperatur unbekannt":t.konflikt?`⚠ Temperaturkonflikt: Minimum ${t.min} °C > Maximum ${t.max} °C`:
      `Gemeinsame Temperatur: ${t.min}–${t.max} °C${t.fehlend.length?" (unvollständig)":""}`));
    if (wert.temperatur.konflikt && klima.bester) {
      card.append(el("p","calculator-warning-text",
        `Bestmögliche Temperatur für die grösste Tierzahl: ${klima.bester.grad} °C · ${klima.bester.tiere} von ${gruppe.arten.reduce((s,e)=>s+e.anzahl,0)} Tieren innerhalb des Bereichs. Zusätzliche Klimazone für: ${klima.bester.abweichend.join(", ")}.`));
    }
    const gelaende=el("div","calculator-terrain");
    for (const art of wert.gelaende) {
      gelaende.append(el("div",art.konflikt?"calculator-danger-text":"calculator-muted",
        `${art.konflikt?"⚠ ":""}${art.typ}: ${art.min}–${art.max} %${art.vollstaendig?"":" (nur erfasste Arten)"}`));
    }
    card.append(gelaende);
    if(wert.prozentPruefung.vollstaendig)
      card.append(el("small",wert.prozentPruefung.konflikt || wert.prozentPruefung.summeMin>100 || wert.prozentPruefung.summeMax<100 ? "calculator-danger-text":"calculator-muted",
        `Boden-Prozentprüfung: Mindestanteile zusammen ${wert.prozentPruefung.summeMin} %, Obergrenzen zusammen ${wert.prozentPruefung.summeMax} %.`));
    else card.append(el("small","calculator-warning-text","⚠ Geländeangaben nicht für alle Arten vollständig. Keine Gesamtfreigabe möglich."));
    host.append(card);
  }
  host.append(el("p","calculator-muted","Wenn sich die Prozent- oder Temperaturbereiche nicht überschneiden, separate Zonen anbieten statt das Tierwohl zu verschlechtern. Temperatur gilt nicht als sichere Barriere."));
}
function speichereZonenEingabe(target) {
  const g=aktivesGehege();
  if (target.dataset.zoneEdit) {
    const z=g.zonen.find((item)=>item.id===target.dataset.zoneId);if(!z)return;
    const key=target.dataset.zoneEdit;
    z[key]=key==="flaeche" ? zahlOderNull(target.value) : target.value.slice(0,80);
  } else if(target.dataset.zoneAnimal) {
    const z=g.zonen.find((item)=>item.id===target.dataset.zoneAnimal);if(!z)return;
    const selected=new Set(z.startArten??[]);
    if(target.checked)selected.add(target.dataset.tierId);else selected.delete(target.dataset.tierId);
    z.startArten=[...selected];
  } else if(target.dataset.linkEdit) {
    const v=g.uebergaenge[Number(target.dataset.linkIndex)];if(!v)return;
    v[target.dataset.linkEdit]=target.type==="checkbox"?target.checked:target.value;
  }
  speichereZustand();renderBerechnungen();
}
function renderBerechnungen() {
  if (!document.querySelector("[data-calculator-page]")) return;
  const eintraege = erstelleEintraege();
  // Eingabefelder bei Änderungen nicht neu erzeugen: Fokus und Aufklappzustand bleiben erhalten.
  for (const e of eintraege) {
    aktualisiereGruppenStatus(e);
    const { gruppe, grenzen } = gruppenPruefung(e);
    for (const art of ["min", "max"]) {
      const button = document.querySelector(
        `[data-calc-limit="${art}"][data-id="${e.tier.id}"]`,
      );
      if (!button) continue;
      button.disabled = grenzen[art] === null || grenzen[art] === undefined;
      button.title =
        grenzen[art] === null || grenzen[art] === undefined
          ? "Keine Gruppengrenze vorhanden"
          : `${grenzen[art]} Erwachsene einstellen (Gruppentyp beachten)`;
    }
  }
  const zonenAktiv=(aktivesGehege().zonen??[]).length>0;
  const risiken = zonenAktiv
    ? pruefeZonen(eintraege,aktivesGehege().zonen,aktivesGehege().uebergaenge??[])
      .paare.filter((p)=>p.status==="gefahr" && p.kontaktMoeglich)
    : analysiereBeziehungen(eintraege).filter((pair) =>
      pair.beziehungen.some((rel) => WARN_RELATIONS.has(rel.typ)));
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
          "⚠ Problematische Beziehung mit möglichem Kontakt. Zonen/Barrieren prüfen.",
        );
        note.dataset.calculatorRelationWarning = "1";
        card.append(note);
      }
    } else note?.remove();
  }
  renderFlaechen(eintraege);
  renderBeziehungen(eintraege);
  renderAbtrennung(eintraege);
  renderAutomatischeTrennung(eintraege);
  renderZonen(eintraege);
  renderUmwelt(eintraege);
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
      if (target.matches("[data-calculator-habitat-import-file]")) {
        void importiereGehege(target.files?.[0]);
        target.value = "";
      } else if (target.matches("[data-calculator-habitat-select]")) {
        wechselGehege(target.value);
      } else if (target.dataset.zoneEdit || target.dataset.zoneAnimal || target.dataset.linkEdit) {
        speichereZonenEingabe(target);
      } else if (target.dataset.calcSelect) {
        setTierAusgewaehlt(target.dataset.calcSelect, target.checked);
      } else if (target.dataset.calcSex) {
        const id = target.dataset.id;
        mengeSpeicher()[id] = {
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
      if (event.target.closest("[data-calculator-habitat-new]")) erzeugeGehege();
      if (event.target.closest("[data-calculator-habitat-clone]")) erzeugeGehege(true);
      if (event.target.closest("[data-calculator-habitat-rename]")) umbenennenGehege();
      if (event.target.closest("[data-calculator-habitat-delete]")) loescheGehege();
      if (event.target.closest("[data-calculator-habitat-export]")) exportiereGehege();
      if (event.target.closest("[data-calculator-habitat-import]"))
        document.querySelector("[data-calculator-habitat-import-file]")?.click();
      if (event.target.closest("[data-calculator-import-selection]")) importiereGemeinsameAuswahl();
      const g=aktivesGehege();
      if(event.target.closest("[data-zone-add]")) {
        g.zonen??=[];
        g.zonen.push({id:neueId(),name:`Zone ${g.zonen.length+1}`,typ:"land",flaeche:null,startArten:[]});
        speichereZustand();renderBerechnungen();
      }
      const zoneRemove=event.target.closest("[data-zone-remove]");
      if(zoneRemove) {
        g.zonen=g.zonen.filter((z)=>z.id!==zoneRemove.dataset.zoneRemove);
        g.uebergaenge=(g.uebergaenge??[]).filter((v)=>v.von!==zoneRemove.dataset.zoneRemove&&v.nach!==zoneRemove.dataset.zoneRemove);
        speichereZustand();renderBerechnungen();
      }
      if(event.target.closest("[data-link-add]") && g.zonen?.length>1) {
        g.uebergaenge??=[];
        g.uebergaenge.push({von:g.zonen[0].id,nach:g.zonen[1].id,art:"gesperrt",getestet:false,beidseitig:true});
        speichereZustand();renderBerechnungen();
      }
      const linkRemove=event.target.closest("[data-link-remove]");
      if(linkRemove) {
        g.uebergaenge.splice(Number(linkRemove.dataset.linkRemove),1);
        speichereZustand();renderBerechnungen();
      }
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
          const alt = menge(tier.id);
          const grenze = gruppenPruefung({tier,name:label(tier),...alt,
            rechner:getRechnerDaten(tier,state.daten[tier.id])}).grenzen;
          const wert = grenze[limit.dataset.calcLimit];
          if (wert !== null && wert !== undefined) {
            const maennchen = Math.min(alt.maennchen, wert,
              Number.isFinite(grenze.maennchenMax)?grenze.maennchenMax:wert);
            mengeSpeicher()[tier.id] = {
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
        setTierAuswahl([...aktuelleAuswahl(), ...neu]);
      }
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
  renderGehegeAuswahl();
  renderAuswahl();
  renderErgebnisse();
}
