import {
  datenImportieren,
} from "../../daten/lebewesen/tiere/datenImport.js";

import {
  bereinigeTierAuswahl,
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


  /* ==================================== */
  /* FILTER-STEUERUNG                     */
  /* ==================================== */

  let filterSteuerung =
    null;


  /* ==================================== */
  /* RENDERN                              */
  /* ==================================== */

  function render() {
    if (!filterSteuerung) {
      return;
    }

    const state =
      filterSteuerung.getState();

    const sichtbareTiere =
      filterUndSortiereTiere(
        tiere,
        state,
      );

    renderHomeTierKarten(
      sichtbareTiere,
      signal,
    );
  }


  /* ==================================== */
  /* FILTER INITIALISIEREN                */
  /* ==================================== */

  filterSteuerung =
    initHomeFilter({
      signal,
      onChange: render,
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


  /* ==================================== */
  /* ERSTER AUFBAU                        */
  /* ==================================== */

  render();
}