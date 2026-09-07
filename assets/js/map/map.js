import {
  datenImportieren,
} from "../../daten/lebewesen/tiere/datenImport.js";

import {
  getTierAuswahl,
} from "../features/tierAuswahl.js";

import {
  filterUndSortiereTiere,
} from "../features/tierFilter.js";

import {
  initMapFilter,
} from "./features/filter.js";

import {
  initMapLayout,
} from "./features/layout.js";

import {
  initMapRenderer,
} from "./features/mapRenderer.js";

import {
  initTierListe,
} from "./features/tierListe.js";


let controller = null;


/* ======================================== */
/* MAP INITIALISIEREN                       */
/* ======================================== */

export async function init() {
  controller?.abort();

  controller =
    new AbortController();

  const {
    signal,
  } = controller;


  const tiere =
    await datenImportieren();


  const renderer =
    await initMapRenderer(
      tiere,
      signal,
    );


  const tierListe =
    initTierListe(
      tiere,
      renderer,
      signal,
    );


  if (!tierListe) {
    return;
  }


  let filterSteuerung =
    null;


  function renderListe() {
    if (!filterSteuerung) {
      return;
    }


    const state =
      filterSteuerung.getState();


    state.filter.ausgewaehlteIds =
      getTierAuswahl();


    const sichtbareTiere =
      filterUndSortiereTiere(
        tiere,
        state,
      );


    tierListe.render(
      sichtbareTiere,
    );
  }


  filterSteuerung =
    initMapFilter({
      signal,
      onChange:
        renderListe,
    });


  document.addEventListener(
    "languageChanged",
    () => {
      renderListe();
      renderer.updateLanguage();
    },
    {
      signal,
    },
  );


  document.addEventListener(
    "tierAuswahlChanged",
    renderListe,
    {
      signal,
    },
  );

  document.addEventListener(
    "toolEinstellungenChanged",
    renderListe,
    {
      signal,
    },
  );


  initMapLayout(
    signal,
  );


  renderListe();
}
