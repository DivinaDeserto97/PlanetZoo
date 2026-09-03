import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";

import { initTierListe } from "./features/tierListe.js";

import { initFilter } from "./features/filter.js";

import { initMapRenderer } from "./features/mapRenderer.js";

let controller = null;

/* ======================================== */
/* MAP INITIALISIEREN                       */
/* ======================================== */

export async function init() {
  /*
        Alte Events entfernen,
        falls die Map erneut geöffnet wird.
    */
  if (controller) {
    controller.abort();
  }

  controller = new AbortController();

  const signal = controller.signal;

  /* ==================================== */
  /* TIERDATEN LADEN                      */
  /* ==================================== */

  const tiere = await datenImportieren();

  console.log("Geladene Tiere:", tiere);

  /* ==================================== */
  /* KARTEN-RENDERER                      */
  /* ==================================== */

  const renderer = await initMapRenderer(tiere, signal);

  /* ==================================== */
  /* TIERLISTE                            */
  /* ==================================== */

  const tierListe = initTierListe(tiere, renderer, signal);

  /* ==================================== */
  /* FILTER                               */
  /* ==================================== */

  initFilter(tiere, tierListe, signal);
}
