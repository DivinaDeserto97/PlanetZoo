/* ======================================== */
/* SEITEN                                   */
/* ======================================== */

export const pages = {
  /* ==================================== */
  /* HOME                                 */
  /* ==================================== */

  home: {
    html: "./pages/home.html",

    css: "./assets/css/home/home.css",

    js: "./home/home.js",

    /*
            Home wird NICHT unten
            in der Navigation angezeigt.
        */
    navigation: null,

    /*
            Titel oben links im Header.
        */
    headerTitle: {
      de: "Home",
      en: "Home",
      fr: "Accueil",
    },
  },

  /* ==================================== */
  /* KARTE                                */
  /* ==================================== */

  map: {
    html: "./pages/map.html",

    /*
            Noch keine eigene map.css.
        */
    css: "./assets/css/map/map.css",

    /*
            Noch keine eigene map.js.
        */
    js: "./map/map.js",

    /*
            Eintrag in der Navigation.
        */
    navigation: {
      de: "Karte",
      en: "Map",
      fr: "Carte",
    },

    /*
            Titel oben links im Header.
        */
    headerTitle: {
      de: "Karte",
      en: "Map",
      fr: "Carte",
    },
  },
};

/* ======================================== */
/* AKTUELLE SEITE                           */
/* ======================================== */

let currentPage = "home";

/* ======================================== */
/* AKTUELLE SEITE ABFRAGEN                  */
/* ======================================== */

export function getCurrentPage() {
  return currentPage;
}

/* ======================================== */
/* SEITE LADEN                              */
/* ======================================== */

export async function loadPage(pageName) {
  const page = pages[pageName];

  /*
        Prüfen, ob Seite existiert.
    */
  if (!page) {
    console.error(`Seite "${pageName}" existiert nicht.`);

    return;
  }

  /*
        Aktuelle Seite speichern.
    */
  currentPage = pageName;

  /*
        HTML laden.
    */
  await loadHTML(page);

  /*
        CSS laden.
    */
  loadCSS(page);

  /*
        JavaScript laden.
    */
  await loadJS(page);

  /*
        Allen Features mitteilen,
        dass die neue Seite fertig
        geladen wurde.
    */
  document.dispatchEvent(
    new CustomEvent("pageLoaded", {
      detail: {
        page: pageName,
      },
    }),
  );
}

/* ======================================== */
/* HTML LADEN                               */
/* ======================================== */

async function loadHTML(page) {
  const container = document.querySelector("#page");

  if (!container) {
    console.error('Element "#page" wurde nicht gefunden.');

    return;
  }

  const response = await fetch(page.html);

  if (!response.ok) {
    console.error(`HTML konnte nicht geladen werden: ${page.html}`);

    return;
  }

  container.innerHTML = await response.text();
}

/* ======================================== */
/* CSS LADEN                                */
/* ======================================== */

function loadCSS(page) {
  /*
        CSS der vorherigen Seite entfernen.
    */
  const oldCSS = document.querySelector("#page-css");

  if (oldCSS) {
    oldCSS.remove();
  }

  /*
        Seite besitzt kein eigenes CSS.
    */
  if (!page.css) {
    return;
  }

  const css = document.createElement("link");

  css.id = "page-css";

  css.rel = "stylesheet";

  css.href = page.css;

  document.head.appendChild(css);
}

/* ======================================== */
/* JAVASCRIPT LADEN                         */
/* ======================================== */

async function loadJS(page) {
  /*
        Seite besitzt kein eigenes JS.
    */
  if (!page.js) {
    return;
  }

  try {
    const module = await import(page.js);

    /*
            Falls die Seitendatei
            init() exportiert.
        */
    if (typeof module.init === "function") {
      module.init();
    }
  } catch (error) {
    console.error(`JavaScript konnte nicht geladen werden: ${page.js}`, error);
  }
}
