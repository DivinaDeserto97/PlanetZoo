import { loadPage } from "./pages.js";

import { initLanguage } from "./features/language.js";

import { initTheme } from "./features/theme.js";

import { initDevice, getDevice } from "./features/device.js";

import { initNavigation } from "./features/navigation.js";

import { initPageTitle } from "./features/pageTitle.js";

/* ======================================== */
/* HEADER                                   */
/* ======================================== */

let loadedHeader = null;

/* ======================================== */
/* HEADER LADEN                             */
/* ======================================== */

async function loadHeader() {
  const device = getDevice();

  /*
        Richtiger Header ist
        bereits geladen.
    */
  if (loadedHeader === device) {
    return;
  }

  loadedHeader = device;

  const header = document.querySelector("#header");

  if (!header) {
    console.error('Element "#header" wurde nicht gefunden.');

    return;
  }

  const base = `./assets/components/header/${device}`;

  /* ==================================== */
  /* HTML                                 */
  /* ==================================== */

  const response = await fetch(`${base}/header.html`);

  if (!response.ok) {
    console.error(`Header "${device}" konnte nicht geladen werden.`);

    return;
  }

  header.innerHTML = await response.text();

  /* ==================================== */
  /* CSS                                  */
  /* ==================================== */

  const oldCSS = document.querySelector("#header-css");

  if (oldCSS) {
    oldCSS.remove();
  }

  const css = document.createElement("link");

  css.id = "header-css";

  css.rel = "stylesheet";

  css.href = `${base}/header.css`;

  document.head.appendChild(css);

  /* ==================================== */
  /* JAVASCRIPT                           */
  /* ==================================== */

  try {
    const module = await import(`../components/header/${device}/header.js`);

    if (typeof module.init === "function") {
      module.init();
    }
  } catch (error) {
    console.warn(
      `Header-JavaScript für "${device}" konnte nicht geladen werden.`,
      error,
    );
  }

  document.dispatchEvent(
    new CustomEvent("componentLoaded", {
      detail: {
        component: "header",

        device,
      },
    }),
  );
}


/* ======================================== */
/* FOOTER                                   */
/* ======================================== */

async function loadFooter() {
  const footer = document.querySelector("#footer");

  if (!footer) {
    console.error('Element "#footer" wurde nicht gefunden.');
    return;
  }

  const response = await fetch("./assets/components/footer/footer.html");

  if (!response.ok) {
    console.error("Footer konnte nicht geladen werden.");
    return;
  }

  footer.innerHTML = await response.text();

  if (!document.querySelector("#footer-css")) {
    const css = document.createElement("link");
    css.id = "footer-css";
    css.rel = "stylesheet";
    css.href = "./assets/components/footer/footer.css";
    document.head.appendChild(css);
  }

  try {
    const module = await import("../components/footer/footer.js");

    if (typeof module.init === "function") {
      module.init();
    }
  } catch (error) {
    console.warn("Footer-JavaScript konnte nicht geladen werden.", error);
  }

  document.dispatchEvent(
    new CustomEvent("componentLoaded", {
      detail: { component: "footer" },
    }),
  );
}

/* ======================================== */
/* PROGRAMMSTART                            */
/* ======================================== */

async function main() {
  /*
        Allgemeine Features
    */
  initLanguage();

  initTheme();

  initDevice();

  initNavigation();

  initPageTitle();

  /*
        Gemeinsame Komponenten
    */
  await loadHeader();
  await loadFooter();

  /*
        Startseite
    */
  await loadPage("home");
}

/* ======================================== */
/* GERÄTEWECHSEL                            */
/* ======================================== */

document.addEventListener("deviceChanged", async () => {
  await loadHeader();
});

/* ======================================== */
/* START                                    */
/* ======================================== */

main();
