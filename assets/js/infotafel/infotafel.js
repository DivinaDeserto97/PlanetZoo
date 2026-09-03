import { datenImportieren } from "../../daten/tiere/datenImport.js";

import {
  getLanguage,
  getLocalizedValue,
} from "../features/language.js";

import {
  getTierAuswahl,
  setTierAusgewaehlt,
} from "../features/tierAuswahl.js";

import {
  getEnclosureLabel,
  getConservationLabel,
  getEditionLabel,
  getContinentLabel,
  getAnimalUiText,
} from "../features/animalLabels.js";

let controller = null;
let tiere = [];

const REMOVE_TEXT = {
  de: "Abwählen",
  en: "Deselect",
  "en-US": "Deselect",
  es: "Deseleccionar",
  fr: "Désélectionner",
  it: "Deseleziona",
  "pt-BR": "Desmarcar",
  ja: "選択解除",
  "zh-Hans": "取消选择",
};

/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export async function init() {
  controller?.abort();
  controller = new AbortController();

  const { signal } = controller;

  tiere = await datenImportieren();

  document.addEventListener("languageChanged", render, { signal });
  document.addEventListener("tierAuswahlChanged", render, { signal });

  render();
}

/* ======================================== */
/* RENDERN                                  */
/* ======================================== */

function render() {
  const list = document.querySelector("[data-info-list]");
  const empty = document.querySelector("[data-info-empty]");
  const count = document.querySelector("[data-info-count]");

  if (!list) {
    return;
  }

  const selectedIds = new Set(getTierAuswahl());
  const selectedTiere = tiere.filter((tier) => selectedIds.has(tier.id));

  list.replaceChildren();
  selectedTiere.forEach((tier) => list.appendChild(createInfoCard(tier)));

  if (count) {
    count.textContent = String(selectedTiere.length);
  }

  if (empty) {
    empty.hidden = selectedTiere.length !== 0;
  }
}

/* ======================================== */
/* INFOTAFEL                                */
/* ======================================== */

function createInfoCard(tier) {
  const card = document.createElement("article");
  card.className = "info-card";
  card.dataset.animalId = tier.id;

  const hero = document.createElement("div");
  hero.className = "info-card__hero";

  if (tier.hauptbildPfad) {
    const image = document.createElement("img");
    image.src = tier.hauptbildPfad;
    image.alt = getTierName(tier);
    image.loading = "lazy";
    image.addEventListener(
      "error",
      () => image.replaceWith(createNoImage()),
      { once: true },
    );
    hero.appendChild(image);
  } else {
    hero.appendChild(createNoImage());
  }

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "info-card__remove";
  remove.textContent = REMOVE_TEXT[getLanguage()] ?? REMOVE_TEXT.de;
  remove.addEventListener("click", () => {
    setTierAusgewaehlt(tier.id, false);
  });
  hero.appendChild(remove);

  const title = document.createElement("header");
  title.className = "info-card__title";

  const name = document.createElement("h2");
  name.textContent = getTierName(tier);

  const scientific = document.createElement("p");
  scientific.className = "info-card__scientific";
  scientific.textContent = tier.wissenschaftlicherName;

  title.append(name, scientific);

  const quick = document.createElement("div");
  quick.className = "info-card__quick";

  quick.append(
    createStat(
      getAnimalUiText("enclosure"),
      tier.filter.gehegetyp.map(getEnclosureLabel).join(" · ") || getAnimalUiText("noData"),
    ),
    createStat(
      getAnimalUiText("region"),
      tier.filter.kontinente.map(getContinentLabel).join(" · ") || getAnimalUiText("noData"),
    ),
    createStat(
      getAnimalUiText("status"),
      tier.filter.schutzstatus
        ? getConservationLabel(tier.filter.schutzstatus)
        : getAnimalUiText("noData"),
    ),
    createStat(
      getAnimalUiText("edition"),
      tier.filter.edition
        ? getEditionLabel(tier.filter.edition)
        : getAnimalUiText("noData"),
    ),
    createStat(
      getAnimalUiText("bodyLength"),
      formatDataValue(tier.originalDaten?.daten?.koerperlaenge?.werte?.[0]),
    ),
    createStat(
      getAnimalUiText("weight"),
      formatDataValue(tier.originalDaten?.daten?.gewicht?.werte?.[0]),
    ),
  );

  const sections = document.createElement("div");
  sections.className = "info-card__sections";

  appendTextSection(sections, tier, "overview", "uebersicht");
  appendTextSection(sections, tier, "distribution", "vorkommen");
  appendTextSection(sections, tier, "conservation", "arterhaltung");
  appendTextSection(
    sections,
    tier,
    "social",
    "sozialverhaltenUndFortpflanzung",
  );
  appendTextSection(sections, tier, "facts", "tierfakten", true);

  card.append(hero, title, quick, sections);

  return card;
}

function createNoImage() {
  const placeholder = document.createElement("span");
  placeholder.className = "info-card__no-image";
  placeholder.textContent = getAnimalUiText("noImage");
  return placeholder;
}

function createStat(label, value) {
  const stat = document.createElement("div");
  stat.className = "info-stat";

  const labelElement = document.createElement("span");
  labelElement.className = "info-stat__label";
  labelElement.textContent = label;

  const valueElement = document.createElement("span");
  valueElement.className = "info-stat__value";
  valueElement.textContent = value || getAnimalUiText("noData");

  stat.append(labelElement, valueElement);
  return stat;
}

/* ======================================== */
/* TEXTE                                    */
/* ======================================== */

function appendTextSection(container, tier, labelKey, jsonKey, asList = false) {
  const entries = getTextEntries(tier, jsonKey);

  if (!entries.length) {
    return;
  }

  const section = document.createElement("section");
  section.className = "info-section";

  const heading = document.createElement("h3");
  heading.textContent = getAnimalUiText(labelKey);
  section.appendChild(heading);

  if (asList) {
    const list = document.createElement("ul");

    entries.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = entry.inhalt;
      list.appendChild(item);
    });

    section.appendChild(list);
  } else {
    entries.forEach((entry) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = entry.inhalt;
      section.appendChild(paragraph);
    });
  }

  container.appendChild(section);
}

function getTextEntries(tier, key) {
  const languageEntries = getLocalizedValue(
    tier.originalDaten?.texte?.[key],
    getLanguage(),
  );

  if (!Array.isArray(languageEntries)) {
    return [];
  }

  return languageEntries.filter(
    (entry) => entry && typeof entry.inhalt === "string" && entry.inhalt.trim(),
  );
}

/* ======================================== */
/* WERTE FORMATIEREN                        */
/* ======================================== */

function formatDataValue(value) {
  if (!value || typeof value !== "object") {
    return getAnimalUiText("noData");
  }

  const unit = value.einheit ? ` ${value.einheit}` : "";

  if (value.min !== undefined && value.max !== undefined) {
    return `${formatNumber(value.min)}–${formatNumber(value.max)}${unit}`;
  }

  if (value.wert !== undefined && value.wert !== null) {
    return `${formatNumber(value.wert)}${unit}`;
  }

  return getAnimalUiText("noData");
}

function formatNumber(value) {
  if (typeof value !== "number") {
    return String(value);
  }

  return new Intl.NumberFormat(getLanguage(), {
    maximumFractionDigits: 2,
  }).format(value);
}

function getTierName(tier) {
  return (
    getLocalizedValue(tier.namen, getLanguage()) ??
    tier.wissenschaftlicherName ??
    tier.id
  );
}
