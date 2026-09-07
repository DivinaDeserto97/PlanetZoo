import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";

import {
  getTierAuswahl,
  setTierAuswahl,
  setTierAusgewaehlt,
} from "../../features/tierAuswahl.js";

import {
  setAktivesTierId,
} from "../../features/tierAktiv.js";

import {
  getTierMarkierungsStatus,
} from "../../features/tierDatenPruefung.js";

import {
  getToolEinstellung,
  TOOL_STUFEN,
} from "../../features/toolEinstellungen.js";

import {
  TOOL_IDS,
} from "../../features/toolRegistry.js";


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

        const istAusgewaehlt =
          selected.has(
            tier.id,
          );

        const row =
          document.createElement(
            "div",
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


        if (istAusgewaehlt) {
          row.classList.add(
            "is-selected",
          );

          let status =
            getTierMarkierungsStatus(
              tier,
            );


          /*
              Die Map kennt zusätzlich den
              echten Laufzeit-Zustand. Wenn
              das Bild trotz JSON-Pfad nicht
              geladen werden konnte, zählt
              das hier ebenfalls als Map-Fehler.
          */

          if (!hatKarte) {
            const mapStufe =
              getToolEinstellung(
                TOOL_IDS.MAP,
              );


            if (
              mapStufe ===
              TOOL_STUFEN.WICHTIG
            ) {
              status =
                "error";
            }

            else if (
              mapStufe ===
                TOOL_STUFEN.NICHT_WICHTIG &&
              status !==
                "error"
            ) {
              status =
                "warning";
            }
          }


          if (
            status ===
            "error"
          ) {
            row.classList.add(
              "has-data-error",
            );
          }

          else if (
            status ===
            "warning"
          ) {
            row.classList.add(
              "has-data-warning",
            );
          }
        }


        const selectArea =
          document.createElement(
            "label",
          );

        selectArea.className =
          "map-animal__select-area";


        const checkbox =
          document.createElement(
            "input",
          );

        checkbox.type =
          "checkbox";

        checkbox.className =
          "map-animal__checkbox";

        checkbox.checked =
          istAusgewaehlt;


        checkbox.addEventListener(
          "change",
          () => {
            setTierAusgewaehlt(
              tier.id,
              checkbox.checked,
            );
          },
          { signal },
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

        text.className =
          "map-animal__text";


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


        selectArea.append(
          checkbox,
          color,
          text,
        );


        const info =
          document.createElement(
            "button",
          );

        info.type =
          "button";

        info.className =
          "map-animal__info";

        info.dataset.page =
          "tier";

        info.textContent =
          "Info";

        info.setAttribute(
          "aria-label",
          `${getTierName(tier)} – Info`,
        );


        info.addEventListener(
          "click",
          () => {
            setAktivesTierId(
              tier.id,
            );
          },
          { signal },
        );


        row.append(
          selectArea,
          info,
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


    render(
      currentVisible,
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
        setTierAuswahl(
          tiere.map(
            (tier) =>
              tier.id,
          ),
        );
      },
      { signal },
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
      { signal },
    );


  document.addEventListener(
    "tierAuswahlChanged",
    (event) => {
      syncSelection(
        event.detail?.tierIds ??
        getTierAuswahl(),
      );
    },
    { signal },
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
