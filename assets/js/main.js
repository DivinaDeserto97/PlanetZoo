"use strict";

const html = document.documentElement;

const THEME_SPEICHERNAME = "planet-zoo-theme";
const SPRACHE_SPEICHERNAME = "planet-zoo-sprache";

function speichern(name, wert) {
  try {
    localStorage.setItem(name, wert);
  } catch {
    console.warn(name + " konnte nicht gespeichert werden.");
  }
}

function laden(name, standardwert) {
  try {
    return localStorage.getItem(name) || standardwert;
  } catch {
    return standardwert;
  }
}

/* Handy, Tablet oder PC erkennen */

function geraetErkennen() {
  const breite = window.innerWidth;

  let geraet = "pc";
  let anzeige = "PC";

  if (breite <= 767) {
    geraet = "handy";
    anzeige = "Handy";
  } else if (breite <= 1100) {
    geraet = "tablet";
    anzeige = "Tablet";
  }

  html.dataset.geraet = geraet;

  const geraeteAnzeige =
    document.querySelector("#geraeteAnzeige");

  if (geraeteAnzeige) {
    geraeteAnzeige.textContent = anzeige;
  }
}

/* Dark- und Light-Mode */

function themeAnzeigen() {
  const theme = html.dataset.theme;

  const symbol =
    document.querySelector("#themeSymbol");

  const text =
    document.querySelector("#themeText");

  if (!symbol || !text) {
    return;
  }

  if (theme === "dark") {
    symbol.textContent = "☀";
    text.textContent =
      html.lang === "en" ? "Light" : "Hell";
  } else {
    symbol.textContent = "☾";
    text.textContent =
      html.lang === "en" ? "Dark" : "Dunkel";
  }
}

function themeStarten() {
  html.dataset.theme = laden(
    THEME_SPEICHERNAME,
    "dark"
  );

  themeAnzeigen();

  const button =
    document.querySelector("#themeButton");

  button?.addEventListener("click", () => {
    const neuesTheme =
      html.dataset.theme === "dark"
        ? "light"
        : "dark";

    html.dataset.theme = neuesTheme;

    speichern(THEME_SPEICHERNAME, neuesTheme);
    themeAnzeigen();
  });
}

/* Sprache */

function spracheAnzeigen() {
  const sprache = html.lang;

  document
    .querySelectorAll("[data-text-de][data-text-en]")
    .forEach((element) => {
      element.textContent =
        sprache === "en"
          ? element.dataset.textEn
          : element.dataset.textDe;
    });

  const sprachText =
    document.querySelector("#spracheText");

  if (sprachText) {
    sprachText.textContent = sprache.toUpperCase();
  }

  themeAnzeigen();
}

function spracheStarten() {
  html.lang = laden(
    SPRACHE_SPEICHERNAME,
    "de"
  );

  spracheAnzeigen();

  const button =
    document.querySelector("#spracheButton");

  button?.addEventListener("click", () => {
    html.lang = html.lang === "de" ? "en" : "de";

    speichern(SPRACHE_SPEICHERNAME, html.lang);
    spracheAnzeigen();
  });
}

/* Aktuelle Seite in der Navigation markieren */

function navigationMarkieren() {
  const aktuelleSeite =
    document.body.dataset.seite;

  document
    .querySelectorAll(".hauptnavigation [data-seite]")
    .forEach((link) => {
      const istAktiv =
        link.dataset.seite === aktuelleSeite;

      link.classList.toggle("aktiv", istAktiv);

      if (istAktiv) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
}

/* Grundfunktionen starten */

function grundfunktionenStarten() {
  geraetErkennen();
  themeStarten();
  spracheStarten();
  navigationMarkieren();

  window.addEventListener("resize", geraetErkennen);
}

grundfunktionenStarten();