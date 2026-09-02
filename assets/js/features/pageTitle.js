import { pages, getCurrentPage } from "../pages.js";

import { getLanguage } from "./language.js";

/* ======================================== */
/* SEITENTITEL AKTUALISIEREN                */
/* ======================================== */

export function updatePageTitle() {
  /*
        Titel im Header suchen.
    */
  const headerTitle = document.querySelector("[data-header-title]");

  if (!headerTitle) {
    return;
  }

  /*
        Aktuell geladene Seite.
    */
  const pageName = getCurrentPage();

  const page = pages[pageName];

  if (!page) {
    return;
  }

  /*
        Aktuelle Sprache.
    */
  const language = getLanguage();

  /*
        Titel aus pages.js holen.
    */
  const title =
    page.headerTitle?.[language] ?? page.headerTitle?.de ?? pageName;

  /*
        Titel oben links ändern.
    */
  headerTitle.textContent = title;

  /*
        Browser-Tab.

        Home:
        PlanetZoo2

        Andere Seite:
        Karte | PlanetZoo2
    */
  if (pageName === "home") {
    document.title = "PlanetZoo2";
  } else {
    document.title = `${title} | PlanetZoo2`;
  }
}

/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export function initPageTitle() {
  /*
        Neue Seite wurde geladen.
    */
  document.addEventListener("pageLoaded", () => {
    updatePageTitle();
  });

  /*
        Sprache wurde geändert.
    */
  document.addEventListener("languageChanged", () => {
    updatePageTitle();
  });

  /*
        Header wurde neu geladen.

        Wichtig für:
        PC / Tablet / Handy.
    */
  document.addEventListener("componentLoaded", () => {
    updatePageTitle();
  });
}
