/* ======================================== */
/* GEMEINSAME ÜBERSETZUNGEN                 */
/* ======================================== */

const TEXT = {
  home: {
    de: "Home",
    en: "Home",
    "en-US": "Home",
    es: "Inicio",
    fr: "Accueil",
    it: "Home",
    "pt-BR": "Início",
    ja: "ホーム",
    "zh-Hans": "主页",
  },
  map: {
    de: "Karte",
    en: "Map",
    "en-US": "Map",
    es: "Mapa",
    fr: "Carte",
    it: "Mappa",
    "pt-BR": "Mapa",
    ja: "マップ",
    "zh-Hans": "地图",
  },
  infotafel: {
    de: "Infotafel",
    en: "Info board",
    "en-US": "Info board",
    es: "Panel informativo",
    fr: "Panneau d’information",
    it: "Pannello informativo",
    "pt-BR": "Painel informativo",
    ja: "情報パネル",
    "zh-Hans": "信息板",
  },
  rechner: {
    de: "Rechner",
    en: "Calculator",
    "en-US": "Calculator",
    es: "Calculadora",
    fr: "Calculateur",
    it: "Calcolatore",
    "pt-BR": "Calculadora",
    ja: "計算機",
    "zh-Hans": "计算器",
  },
};

/* ======================================== */
/* SEITEN                                   */
/* ======================================== */

export const pages = {
  home: {
    html: "./pages/home.html",
    css: "./assets/css/home/home.css",
    js: "./home/home.js",
    navigation: null,
    headerTitle: TEXT.home,
  },

  map: {
    html: "./pages/map.html",
    css: "./assets/css/map/map.css",
    js: "./map/map.js",
    navigation: TEXT.map,
    headerTitle: TEXT.map,
  },

  infotafel: {
    html: "./pages/infotafel.html",
    css: "./assets/css/infotafel/infotafel.css",
    js: "./infotafel/infotafel.js",
    navigation: TEXT.infotafel,
    headerTitle: TEXT.infotafel,
  },

  rechner: {
    html: "./pages/rechner.html",
    css: "./assets/css/rechner/rechner.css",
    js: "./rechner/rechner.js",
    navigation: TEXT.rechner,
    headerTitle: TEXT.rechner,
  },
};

/* ======================================== */
/* AKTUELLE SEITE                           */
/* ======================================== */

let currentPage = "home";

export function getCurrentPage() {
  return currentPage;
}

/* ======================================== */
/* SEITE LADEN                              */
/* ======================================== */

export async function loadPage(pageName) {
  const page = pages[pageName];

  if (!page) {
    console.error(`Seite "${pageName}" existiert nicht.`);
    return;
  }

  currentPage = pageName;

  await loadHTML(page);
  loadCSS(page);
  await loadJS(page);

  document.dispatchEvent(
    new CustomEvent("pageLoaded", {
      detail: { page: pageName },
    }),
  );
}

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

function loadCSS(page) {
  document.querySelector("#page-css")?.remove();

  if (!page.css) {
    return;
  }

  const css = document.createElement("link");
  css.id = "page-css";
  css.rel = "stylesheet";
  css.href = page.css;
  document.head.appendChild(css);
}

async function loadJS(page) {
  if (!page.js) {
    return;
  }

  try {
    const module = await import(page.js);

    if (typeof module.init === "function") {
      await module.init();
    }
  } catch (error) {
    console.error(`JavaScript konnte nicht geladen werden: ${page.js}`, error);
  }
}
