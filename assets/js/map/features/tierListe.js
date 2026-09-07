import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";

import {
  getTierAuswahl,
  setTierAuswahl,
  setTierAusgewaehlt,
} from "../../features/tierAuswahl.js";


/* ======================================== */
/* TIERNAME                                 */
/* ======================================== */

export function getTierName(
  tier,
  language = getLanguage(),
) {
  return (
    getLocalizedValue(
      tier.namen ??
      tier.originalDaten
        ?.identitaet
        ?.namen ??
      {},
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

export function initTierListe(
  tiere,
  renderer,
  signal,
) {
  const container =
    document.querySelector(
      "[data-animal-list]",
    );

  const count =
    document.querySelector(
      "[data-animal-count]",
    );


  if (!container) {
    return null;
  }


  const knownIds =
    new Set(
      tiere.map(
        (tier) => tier.id,
      ),
    );


  const selected =
    new Set(
      getTierAuswahl().filter(
        (tierId) =>
          knownIds.has(
            tierId,
          ),
      ),
    );


  let currentVisible =
    tiere;


  function render(
    visibleTiere = currentVisible,
  ) {
    currentVisible =
      visibleTiere;

    container.replaceChildren();


    if (count) {
      count.textContent =
        String(
          visibleTiere.length,
        );
    }


    visibleTiere.forEach(
      (tier) => {
        const hatKarte =
          renderer.hasMap(
            tier.id,
          );

        const row =
          document.createElement(
            "label",
          );

        row.className =
          "map-animal";

        row.dataset.animalId =
          tier.id;


        if (!hatKarte) {
          row.classList.add(
            "has-no-map",
          );
        }


        const checkbox =
          document.createElement(
            "input",
          );

        checkbox.type =
          "checkbox";

        checkbox.className =
          "map-animal__checkbox";

        checkbox.checked =
          selected.has(
            tier.id,
          );


        checkbox.addEventListener(
          "change",
          () => {
            setTierAusgewaehlt(
              tier.id,
              checkbox.checked,
            );
          },
          {
            signal,
          },
        );


        const color =
          document.createElement(
            "span",
          );

        color.className =
          "map-animal__color";


        const mapColor =
          renderer.getMapColor(
            tier.id,
          );


        if (
          hatKarte &&
          mapColor
        ) {
          color.style.backgroundColor =
            mapColor;
        }

        else {
          color.classList.add(
            "is-empty",
          );
        }


        const text =
          document.createElement(
            "span",
          );


        const name =
          document.createElement(
            "span",
          );

        name.className =
          "map-animal__name";

        name.textContent =
          getTierName(
            tier,
          );


        const scientific =
          document.createElement(
            "span",
          );

        scientific.className =
          "map-animal__scientific";

        scientific.textContent =
          tier.wissenschaftlicherName;


        text.append(
          name,
          scientific,
        );


        if (!hatKarte) {
          const noMap =
            document.createElement(
              "span",
            );

          noMap.className =
            "map-animal__no-map";

          noMap.textContent =
            getNoMapText();


          text.appendChild(
            noMap,
          );
        }


        row.append(
          checkbox,
          color,
          text,
        );


        container.appendChild(
          row,
        );
      },
    );
  }


  function syncSelection(
    tierIds,
  ) {
    selected.clear();


    tierIds
      .filter(
        (tierId) =>
          knownIds.has(
            tierId,
          ),
      )
      .forEach(
        (tierId) =>
          selected.add(
            tierId,
          ),
      );


    container
      .querySelectorAll(
        "[data-animal-id]",
      )
      .forEach(
        (row) => {
          const checkbox =
            row.querySelector(
              ".map-animal__checkbox",
            );

          if (checkbox) {
            checkbox.checked =
              selected.has(
                row.dataset
                  .animalId,
              );
          }
        },
      );


    renderer.render(
      selected,
    );
  }


  document
    .querySelector(
      "[data-select-all]",
    )
    ?.addEventListener(
      "click",
      () => {
        /*
            Absichtlich alle Tiere,
            nicht nur die gefilterten.
        */
        setTierAuswahl(
          tiere.map(
            (tier) =>
              tier.id,
          ),
        );
      },
      {
        signal,
      },
    );


  document
    .querySelector(
      "[data-select-none]",
    )
    ?.addEventListener(
      "click",
      () => {
        setTierAuswahl(
          [],
        );
      },
      {
        signal,
      },
    );


  document.addEventListener(
    "tierAuswahlChanged",
    (event) => {
      syncSelection(
        event.detail?.tierIds ??
        getTierAuswahl(),
      );
    },
    {
      signal,
    },
  );


  render(
    tiere,
  );

  renderer.render(
    selected,
  );


  return {
    render,
    selected,
  };
}


/* ======================================== */
/* KEINE KARTE                              */
/* ======================================== */

function getNoMapText() {
  const language =
    getLanguage();


  const text = {
    de: "Noch keine lokale PNG-Karte",
    en: "No local PNG map yet",
    "en-US": "No local PNG map yet",
    es: "Aún no hay mapa PNG local",
    fr: "Pas encore de carte PNG locale",
    it: "Nessuna mappa PNG locale",
    "pt-BR": "Ainda sem mapa PNG local",
    ja: "ローカルPNGマップ未登録",
    "zh-Hans": "尚无本地PNG地图",
  };


  return (
    text[language] ??
    text.de
  );
}
