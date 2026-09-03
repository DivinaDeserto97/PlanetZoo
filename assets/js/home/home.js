import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";

import {
  getLanguage,
  getLocalizedValue,
} from "../features/language.js";

import {
  getTierAuswahl,
  setTierAusgewaehlt,
  bereinigeTierAuswahl,
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

/* ======================================== */
/* HILFSFUNKTIONEN                          */
/* ======================================== */

function getTierName(tier) {
  return (
    getLocalizedValue(tier.namen, getLanguage()) ??
    tier.wissenschaftlicherName ??
    tier.id
  );
}

function getSearchText(tier) {
  const namen = Object.values(tier.namen ?? {});

  return [...namen, tier.wissenschaftlicherName]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

/* ======================================== */
/* KARTE ERSTELLEN                          */
/* ======================================== */

function createAnimalCard(tier, selected, signal, rerender) {
  const card = document.createElement("article");
  card.className = "home-animal-card";
  card.dataset.animalId = tier.id;

  if (selected.has(tier.id)) {
    card.classList.add("is-selected");
  }

  const media = document.createElement("div");
  media.className = "home-animal-card__media";

  if (tier.hauptbildPfad) {
    const image = document.createElement("img");
    image.src = tier.hauptbildPfad;
    image.alt = getTierName(tier);
    image.loading = "lazy";

    image.addEventListener(
      "error",
      () => {
        media.replaceChildren(createImagePlaceholder());
      },
      { once: true, signal },
    );

    media.appendChild(image);
  } else {
    media.appendChild(createImagePlaceholder());
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "home-animal-card__select";
  checkbox.checked = selected.has(tier.id);
  checkbox.setAttribute("aria-label", `${getTierName(tier)} auswählen`);

  checkbox.addEventListener(
    "change",
    () => {
      setTierAusgewaehlt(tier.id, checkbox.checked);
      rerender();
    },
    { signal },
  );

  media.appendChild(checkbox);

  const body = document.createElement("div");
  body.className = "home-animal-card__body";

  const badges = document.createElement("div");
  badges.className = "home-animal-card__badges";

  const enclosure = tier.filter.gehegetyp?.[0];

  if (enclosure) {
    badges.appendChild(createBadge(getEnclosureLabel(enclosure)));
  }

  if (tier.filter.schutzstatus) {
    badges.appendChild(
      createBadge(getConservationLabel(tier.filter.schutzstatus)),
    );
  }

  if (tier.filter.edition) {
    badges.appendChild(createBadge(getEditionLabel(tier.filter.edition)));
  }

  const name = document.createElement("h2");
  name.className = "home-animal-card__name";
  name.textContent = getTierName(tier);

  const scientific = document.createElement("p");
  scientific.className = "home-animal-card__scientific";
  scientific.textContent = tier.wissenschaftlicherName;

  const regions = document.createElement("p");
  regions.className = "home-animal-card__regions";
  regions.textContent = (tier.filter.kontinente ?? [])
    .map((continent) => getContinentLabel(continent))
    .join(" · ");

  body.append(badges, name, scientific, regions);
  card.append(media, body);

  return card;
}

function createImagePlaceholder() {
  const placeholder = document.createElement("span");
  placeholder.className = "home-animal-card__placeholder";
  placeholder.textContent = getAnimalUiText("noImage");

  return placeholder;
}

function createBadge(text) {
  const badge = document.createElement("span");
  badge.className = "home-animal-card__badge";
  badge.textContent = text;

  return badge;
}

/* ======================================== */
/* HOME INITIALISIEREN                      */
/* ======================================== */

export async function init() {
  controller?.abort();
  controller = new AbortController();

  const { signal } = controller;

  const list = document.querySelector("[data-home-animal-list]");
  const empty = document.querySelector("[data-home-empty]");
  const resultCount = document.querySelector("[data-home-result-count]");

  const search = document.querySelector("[data-home-search]");
  const enclosure = document.querySelector("[data-home-enclosure]");
  const continent = document.querySelector("[data-home-continent]");
  const status = document.querySelector("[data-home-status]");
  const edition = document.querySelector("[data-home-edition]");
  const reset = document.querySelector("[data-home-reset]");

  if (!list) {
    return;
  }

  tiere = await datenImportieren();
  bereinigeTierAuswahl(tiere);

  function getFilteredAnimals() {
    const query = search?.value.trim().toLocaleLowerCase() ?? "";
    const enclosureValue = enclosure?.value ?? "";
    const continentValue = continent?.value ?? "";
    const statusValue = status?.value ?? "";
    const editionValue = edition?.value ?? "";

    return tiere.filter((tier) => {
      const matchesSearch = !query || getSearchText(tier).includes(query);
      const matchesEnclosure =
        !enclosureValue || tier.filter.gehegetyp.includes(enclosureValue);
      const matchesContinent =
        !continentValue || tier.filter.kontinente.includes(continentValue);
      const matchesStatus =
        !statusValue || tier.filter.schutzstatus === statusValue;
      const matchesEdition =
        !editionValue || tier.filter.edition === editionValue;

      return (
        matchesSearch &&
        matchesEnclosure &&
        matchesContinent &&
        matchesStatus &&
        matchesEdition
      );
    });
  }

  function render() {
    const visibleTiere = getFilteredAnimals();
    const selected = new Set(getTierAuswahl());

    list.replaceChildren();

    visibleTiere.forEach((tier) => {
      list.appendChild(createAnimalCard(tier, selected, signal, render));
    });

    if (resultCount) {
      resultCount.textContent = String(visibleTiere.length);
    }

    if (empty) {
      empty.hidden = visibleTiere.length !== 0;
    }
  }

  [search, enclosure, continent, status, edition].forEach((element) => {
    element?.addEventListener("input", render, { signal });
    element?.addEventListener("change", render, { signal });
  });

  reset?.addEventListener(
    "click",
    () => {
      if (search) search.value = "";
      if (enclosure) enclosure.value = "";
      if (continent) continent.value = "";
      if (status) status.value = "";
      if (edition) edition.value = "";

      render();
    },
    { signal },
  );

  document.addEventListener("languageChanged", render, { signal });
  document.addEventListener("tierAuswahlChanged", render, { signal });

  render();
}
