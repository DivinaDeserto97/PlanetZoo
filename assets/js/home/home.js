import {
  datenImportieren,
} from "../../daten/lebewesen/tiere/datenImport.js";

import {
  bereinigeTierAuswahl,
  getTierAuswahl,
  setTierAuswahl,
} from "../features/tierAuswahl.js";

import {
  filterUndSortiereTiere,
} from "../features/tierFilter.js";

import {
  initHomeFilter,
} from "./features/filter.js";

import {
  renderHomeTierKarten,
} from "./features/tierKarten.js";


let controller = null;

let tiere = [];

let sichtbareTiere = [];


/* ======================================== */
/* HOME INITIALISIEREN                      */
/* ======================================== */

export async function init() {
  controller?.abort();

  controller =
    new AbortController();

  const {
    signal,
  } = controller;


  /* ==================================== */
  /* DATEN LADEN                          */
  /* ==================================== */

  tiere =
    await datenImportieren();

  bereinigeTierAuswahl(
    tiere,
  );


  let filterSteuerung =
    null;


  /* ==================================== */
  /* RENDERN                              */
  /* ==================================== */

  function render() {
    if (!filterSteuerung) {
      return;
    }

    sichtbareTiere =
      filterUndSortiereTiere(
        tiere,
        filterSteuerung.getState(),
      );

    renderHomeTierKarten(
      sichtbareTiere,
      signal,
    );
  }


  /* ==================================== */
  /* ALLE SICHTBAREN AUSWÄHLEN            */
  /* ==================================== */

  function selectAllVisible() {
    const selected =
      new Set(
        getTierAuswahl(),
      );

    sichtbareTiere.forEach(
      (tier) => {
        selected.add(
          tier.id,
        );
      },
    );

    setTierAuswahl(
      [...selected],
    );
  }


  /* ==================================== */
  /* ALLE SICHTBAREN ABWÄHLEN             */
  /* ==================================== */

  function selectNoneVisible() {
    const visibleIds =
      new Set(
        sichtbareTiere.map(
          (tier) => tier.id,
        ),
      );

    const selected =
      getTierAuswahl()
        .filter(
          (tierId) =>
            !visibleIds.has(
              tierId,
            ),
        );

    setTierAuswahl(
      selected,
    );
  }


  /* ==================================== */
  /* FILTER INITIALISIEREN                */
  /* ==================================== */

  filterSteuerung =
    initHomeFilter({
      signal,

      onChange:
        render,

      onSelectAll:
        selectAllVisible,

      onSelectNone:
        selectNoneVisible,
    });


  /* ==================================== */
  /* GEMEINSAME EVENTS                    */
  /* ==================================== */

  document.addEventListener(
    "languageChanged",
    render,
    {
      signal,
    },
  );

  document.addEventListener(
    "tierAuswahlChanged",
    render,
    {
      signal,
    },
  );

  document.addEventListener(
    "toolEinstellungenChanged",
    render,
    {
      signal,
    },
  );


  /* ==================================== */
  /* ERSTER AUFBAU                        */
  /* ==================================== */

  render();
}