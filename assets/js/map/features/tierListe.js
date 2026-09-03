import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";

import {
  getTierAuswahl,
  setTierAuswahl,
  setTierAusgewaehlt,
} from "../../features/tierAuswahl.js";

const TIER_FARBEN = [
  "#38bdf8",
  "#f59e0b",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#facc15",
];

/* ======================================== */
/* TIERNAME                                 */
/* ======================================== */

export function getTierName(tier, language = getLanguage()) {
  return (
    getLocalizedValue(
      tier.namen ?? tier.originalDaten?.identitaet?.namen ?? {},
      language,
    ) ??
    tier.wissenschaftlicherName ??
    tier.id ??
    "Unbekannte Tierart"
  );
}

/* ======================================== */
/* TIERLISTE INITIALISIEREN                 */
/* ======================================== */

export function initTierListe(tiere, renderer, signal) {
  const container = document.querySelector("[data-animal-list]");
  const count = document.querySelector("[data-animal-count]");

  if (!container) {
    return null;
  }

  tiere.forEach((tier, index) => {
    tier.mapColor = TIER_FARBEN[index % TIER_FARBEN.length];
  });

  const knownIds = new Set(tiere.map((tier) => tier.id));
  const selected = new Set(
    getTierAuswahl().filter((tierId) => knownIds.has(tierId)),
  );

  let currentVisible = tiere;

  function render(visibleTiere = currentVisible) {
    currentVisible = visibleTiere;
    container.replaceChildren();

    if (count) {
      count.textContent = String(visibleTiere.length);
    }

    visibleTiere.forEach((tier) => {
      const row = document.createElement("label");
      row.className = "map-animal";
      row.dataset.animalId = tier.id;

      if (!tier.kartenPfad) {
        row.classList.add("has-no-map");
      }

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "map-animal__checkbox";
      checkbox.checked = selected.has(tier.id);

      checkbox.addEventListener(
        "change",
        () => {
          setTierAusgewaehlt(tier.id, checkbox.checked);
        },
        { signal },
      );

      const color = document.createElement("span");
      color.className = "map-animal__color";
      color.style.backgroundColor = tier.mapColor;

      const text = document.createElement("span");

      const name = document.createElement("span");
      name.className = "map-animal__name";
      name.textContent = getTierName(tier);

      const scientific = document.createElement("span");
      scientific.className = "map-animal__scientific";
      scientific.textContent = tier.wissenschaftlicherName;

      text.append(name, scientific);

      if (!tier.kartenPfad) {
        const noMap = document.createElement("span");
        noMap.className = "map-animal__no-map";
        noMap.dataset.mapNoMap = "";
        noMap.textContent = getNoMapText();
        text.appendChild(noMap);
      }

      row.append(checkbox, color, text);
      container.appendChild(row);
    });
  }

  function syncSelection(tierIds) {
    selected.clear();

    tierIds
      .filter((tierId) => knownIds.has(tierId))
      .forEach((tierId) => selected.add(tierId));

    container.querySelectorAll("[data-animal-id]").forEach((row) => {
      const checkbox = row.querySelector(".map-animal__checkbox");

      if (checkbox) {
        checkbox.checked = selected.has(row.dataset.animalId);
      }
    });

    renderer.render(selected);
  }

  document.querySelector("[data-select-all]")?.addEventListener(
    "click",
    () => {
      setTierAuswahl(tiere.map((tier) => tier.id));
    },
    { signal },
  );

  document.querySelector("[data-select-none]")?.addEventListener(
    "click",
    () => {
      setTierAuswahl([]);
    },
    { signal },
  );

  document.addEventListener(
    "tierAuswahlChanged",
    (event) => {
      syncSelection(event.detail?.tierIds ?? getTierAuswahl());
    },
    { signal },
  );

  document.addEventListener(
    "languageChanged",
    () => {
      render(currentVisible);
      renderer.updateLanguage();
    },
    { signal },
  );

  render(tiere);
  renderer.render(selected);

  return {
    render,
    selected,
  };
}

function getNoMapText() {
  const language = getLanguage();

  const text = {
    de: "Noch keine lokale Karte",
    en: "No local map yet",
    "en-US": "No local map yet",
    es: "Aún no hay mapa local",
    fr: "Pas encore de carte locale",
    it: "Nessuna mappa locale",
    "pt-BR": "Ainda sem mapa local",
    ja: "ローカルマップ未登録",
    "zh-Hans": "尚无本地地图",
  };

  return text[language] ?? text.de;
}
