import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";
import { kinoDatenImportieren } from "../../daten/kino/kinoImport.js";
import { getLanguage, getLocalizedValue } from "../features/language.js";
import {
  getTierAuswahl,
  setTierAusgewaehlt,
  setTierAuswahl,
} from "../features/tierAuswahl.js";

let controller = null;
let tiere = [];
let kinoKategorien = [];
let filmQuellen = new Set();
let filmTypen = new Set();
let quellenInitialisiert = false;
let typenInitialisiert = false;

let playback = null;
let pauseTimer = null;
let beitragTimer = null;
let lastBeitragId = null;


/* ======================================== */
/* INITIALISIERUNG                          */
/* ======================================== */

export async function init() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  stopPlayback({ zurueckZumBuilder: false });

  [tiere, kinoKategorien] = await Promise.all([
    datenImportieren(),
    kinoDatenImportieren(),
  ]);

  document.addEventListener("tierAuswahlChanged", renderBuilder, { signal });
  document.addEventListener("languageChanged", renderBuilder, { signal });

  document.querySelector("[data-kino-builder]")?.addEventListener("change", handleBuilderChange, { signal });
  document.querySelector("[data-kino-builder]")?.addEventListener("click", handleBuilderClick, { signal });

  document.querySelector("[data-kino-start]")?.addEventListener("click", startPlayback, { signal });
  document.querySelector("[data-kino-stop]")?.addEventListener("click", () => stopPlayback(), { signal });
  document.querySelector("[data-kino-skip]")?.addEventListener("click", skipCurrent, { signal });
  document.querySelector("[data-kino-fullscreen]")?.addEventListener("click", toggleFullscreen, { signal });

  const video = getElement("[data-kino-video]");
  video?.addEventListener("ended", handleFilmEnded, { signal });
  video?.addEventListener("error", handleVideoError, { signal });

  renderBuilder();
}


/* ======================================== */
/* ALLGEMEINE HILFSFUNKTIONEN               */
/* ======================================== */

function getElement(selector) {
  return document.querySelector(selector);
}

function alsArray(wert) {
  if (Array.isArray(wert)) {
    return wert;
  }

  if (wert === undefined || wert === null || wert === "") {
    return [];
  }

  return [wert];
}

function text(wert, fallback = "") {
  if (typeof wert === "string") {
    return wert;
  }

  return getLocalizedValue(wert, getLanguage()) ?? fallback;
}

function escapeIdTeil(wert) {
  return String(wert ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatZeit(sekunden) {
  const total = Math.max(0, Math.ceil(Number(sekunden) || 0));
  const minuten = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minuten).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function shuffle(liste) {
  const kopie = [...liste];

  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }

  return kopie;
}

function browserVideoDatei(datei) {
  const typ = String(datei?.dateityp ?? "").toLowerCase();
  const pfad = String(datei?.pfad ?? "").toLowerCase();

  return ["mp4", "webm", "ogg", "ogv", "m4v"].includes(typ) ||
    /\.(mp4|webm|ogg|ogv|m4v)(\?.*)?$/.test(pfad);
}

function findeFilmPfad(variante) {
  const dateien = alsArray(variante?.dateien);

  const wiedergabe = dateien.find((datei) =>
    datei?.typ === "wiedergabe" && datei?.pfad && browserVideoDatei(datei),
  );

  if (wiedergabe?.pfad) {
    return {
      pfad: wiedergabe.pfad,
      dateityp: wiedergabe.dateityp ?? "",
      browserGeeignet: true,
      quelle: "lokal",
    };
  }

  const browserDatei = dateien.find((datei) => datei?.pfad && browserVideoDatei(datei));

  if (browserDatei?.pfad) {
    return {
      pfad: browserDatei.pfad,
      dateityp: browserDatei.dateityp ?? "",
      browserGeeignet: true,
      quelle: "lokal",
    };
  }

  const irgendeineDatei = dateien.find((datei) => datei?.pfad);

  if (irgendeineDatei?.pfad) {
    return {
      pfad: irgendeineDatei.pfad,
      dateityp: irgendeineDatei.dateityp ?? "",
      browserGeeignet: false,
      quelle: "lokal",
    };
  }

  if (variante?.url) {
    return {
      pfad: variante.url,
      dateityp: "url",
      browserGeeignet: true,
      quelle: "extern",
    };
  }

  return {
    pfad: "",
    dateityp: "",
    browserGeeignet: false,
    quelle: "keine",
  };
}


/* ======================================== */
/* FILME AUS TIER-JSONS                     */
/* ======================================== */

function getAlleFilme() {
  return tiere.flatMap((tier) =>
    alsArray(tier.video).flatMap((gruppe, gruppenIndex) =>
      alsArray(gruppe?.varianten).map((variante, variantenIndex) => {
        const quelleId = String(variante?.quelle ?? "unbekannt");
        const quelleDaten = tier.originalDaten?.quellen?.[quelleId];
        const medien = findeFilmPfad(variante);
        const typ = String(gruppe?.typ ?? "video");
        const filmId = [
          tier.id,
          typ,
          variante?.variante ?? variantenIndex + 1,
          quelleId,
          gruppenIndex,
        ].join("::");

        return {
          id: filmId,
          tier,
          tierId: tier.id,
          typ,
          quelleId,
          quelleName: quelleDaten?.name ?? quelleId,
          reihe: variante?.reihe ?? "",
          titel: variante?.titel ?? {},
          beschreibung: variante?.beschreibung ?? {},
          dauerSekunden: Number(variante?.dauerSekunden) || null,
          medien,
          original: variante,
        };
      }),
    ),
  );
}

function getAusgewaehlteTierIds() {
  return new Set(getTierAuswahl());
}

function getQuellenFuerAusgewaehlteTiere() {
  const tierIds = getAusgewaehlteTierIds();
  const map = new Map();

  getAlleFilme()
    .filter((film) => tierIds.has(film.tierId))
    .forEach((film) => {
      if (!map.has(film.quelleId)) {
        map.set(film.quelleId, film.quelleName);
      }
    });

  return map;
}

function getTypenFuerAusgewaehlteTiere() {
  const tierIds = getAusgewaehlteTierIds();
  return [...new Set(
    getAlleFilme()
      .filter((film) => tierIds.has(film.tierId))
      .map((film) => film.typ),
  )];
}

function getAktiveFilme() {
  const tierIds = getAusgewaehlteTierIds();

  return getAlleFilme().filter((film) =>
    tierIds.has(film.tierId) &&
    filmQuellen.has(film.quelleId) &&
    filmTypen.has(film.typ),
  );
}


/* ======================================== */
/* BUILDER RENDERN                          */
/* ======================================== */

function renderBuilder() {
  if (playback?.aktiv) {
    return;
  }

  renderTiere();
  renderQuellen();
  renderTypen();
  renderKategorien();
  renderFilme();
  renderSummary();
}

function renderTiere() {
  const container = getElement("[data-kino-animal-list]");

  if (!container) {
    return;
  }

  const ausgewaehlt = getAusgewaehlteTierIds();
  container.replaceChildren();

  tiere.forEach((tier) => {
    const label = document.createElement("label");
    label.className = "kino-check-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.kinoAnimal = tier.id;
    input.checked = ausgewaehlt.has(tier.id);

    const span = document.createElement("span");
    const strong = document.createElement("strong");
    const small = document.createElement("small");

    strong.textContent = text(tier.namen, tier.wissenschaftlicherName);
    small.textContent = tier.wissenschaftlicherName;

    span.append(strong, small);
    label.append(input, span);
    container.appendChild(label);
  });
}

function renderQuellen() {
  const container = getElement("[data-kino-source-list]");

  if (!container) {
    return;
  }

  const quellen = getQuellenFuerAusgewaehlteTiere();
  const gueltigeIds = new Set(quellen.keys());

  filmQuellen = new Set([...filmQuellen].filter((id) => gueltigeIds.has(id)));

  if (!quellenInitialisiert && quellen.size) {
    filmQuellen = new Set(quellen.keys());
    quellenInitialisiert = true;
  }

  container.replaceChildren();

  if (!quellen.size) {
    const leer = document.createElement("p");
    leer.className = "kino-empty";
    leer.textContent = "Für die ausgewählten Tiere sind noch keine Filme eingetragen.";
    container.appendChild(leer);
    return;
  }

  quellen.forEach((name, id) => {
    const label = document.createElement("label");
    label.className = "kino-check-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.kinoSource = id;
    input.checked = filmQuellen.has(id);

    const span = document.createElement("span");
    const strong = document.createElement("strong");
    const small = document.createElement("small");

    strong.textContent = name;
    small.textContent = id;
    span.append(strong, small);
    label.append(input, span);
    container.appendChild(label);
  });
}

function renderTypen() {
  const container = getElement("[data-kino-type-list]");

  if (!container) {
    return;
  }

  const typen = getTypenFuerAusgewaehlteTiere();
  const gueltigeTypen = new Set(typen);

  filmTypen = new Set([...filmTypen].filter((typ) => gueltigeTypen.has(typ)));

  if (!typenInitialisiert && typen.length) {
    filmTypen = new Set(typen);
    typenInitialisiert = true;
  }

  container.replaceChildren();

  if (!typen.length) {
    const leer = document.createElement("p");
    leer.className = "kino-empty";
    leer.textContent = "Keine Filmarten verfügbar.";
    container.appendChild(leer);
    return;
  }

  typen.forEach((typ) => {
    const label = document.createElement("label");
    label.className = "kino-check-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.kinoType = typ;
    input.checked = filmTypen.has(typ);

    const span = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = typ;

    span.appendChild(strong);
    label.append(input, span);
    container.appendChild(label);
  });
}

function renderKategorien() {
  const container = getElement("[data-kino-category-list]");

  if (!container) {
    return;
  }

  const alteAuswahl = new Map(
    [...container.querySelectorAll("[data-kino-intermission]")].map((input) => [
      input.dataset.kinoIntermission,
      input.checked,
    ]),
  );

  container.replaceChildren();

  kinoKategorien.forEach((kategorie) => {
    const aktivCount = kategorie.beitraege.filter((beitrag) => beitrag.aktiv).length;
    const label = document.createElement("label");
    label.className = "kino-check-row";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.kinoIntermission = kategorie.kategorie;
    input.checked = alteAuswahl.get(kategorie.kategorie) ?? true;

    const span = document.createElement("span");
    const strong = document.createElement("strong");
    const small = document.createElement("small");

    strong.textContent = text(kategorie.name, kategorie.kategorie);
    small.textContent = `${aktivCount} aktive Beiträge aus ${kategorie.jsonPfad}`;

    span.append(strong, small);
    label.append(input, span);
    container.appendChild(label);
  });
}

function renderFilme() {
  const container = getElement("[data-kino-film-list]");
  const count = getElement("[data-kino-film-count]");

  if (!container || !count) {
    return;
  }

  const filme = getAktiveFilme();
  count.textContent = `${filme.length} ${filme.length === 1 ? "Film" : "Filme"}`;
  container.replaceChildren();

  if (!filme.length) {
    const leer = document.createElement("p");
    leer.className = "kino-empty";
    leer.textContent = "Wähle mindestens ein Tier, eine Filmquelle und eine Filmart aus.";
    container.appendChild(leer);
    return;
  }

  const liste = document.createElement("div");
  liste.className = "kino-film-list";

  filme.forEach((film) => {
    const item = document.createElement("article");
    item.className = "kino-film-item";

    if (!film.medien.pfad || !film.medien.browserGeeignet) {
      item.classList.add("kino-film-item--warning");
    }

    const titel = document.createElement("strong");
    const meta = document.createElement("span");
    const pfad = document.createElement("span");

    titel.textContent = text(film.titel, film.reihe || "Film");
    meta.textContent = `${text(film.tier.namen, film.tier.wissenschaftlicherName)} · ${film.quelleName} · ${film.typ}`;

    if (!film.medien.pfad) {
      pfad.textContent = "⚠ Kein Video-Pfad eingetragen";
    } else if (!film.medien.browserGeeignet) {
      pfad.textContent = `⚠ ${film.medien.dateityp || "Datei"}: Browser-Wiedergabe unsicher – MP4-Wiedergabevariante empfohlen`;
    } else {
      pfad.textContent = film.medien.pfad;
    }

    item.append(titel, meta, pfad);
    liste.appendChild(item);
  });

  container.appendChild(liste);
}

function renderSummary() {
  const container = getElement("[data-kino-summary]");
  const warning = getElement("[data-kino-warning]");

  if (!container || !warning) {
    return;
  }

  const filme = getAktiveFilme();
  const pauseSekunden = getPauseSekunden();
  const intermission = getIntermissionAuswahl();

  container.replaceChildren();

  const werte = [
    `${filme.length} ${filme.length === 1 ? "Film" : "Filme"}`,
    `Pause ${formatZeit(pauseSekunden)}`,
    `${intermission.length} Zwischenprogramm-Arten`,
    getElement("[data-kino-loop-mode]")?.value === "loop" ? "Endlosschleife" : "Ein Durchlauf",
  ];

  werte.forEach((wert) => {
    const chip = document.createElement("span");
    chip.textContent = wert;
    container.appendChild(chip);
  });

  const probleme = [];

  if (!filme.length) {
    probleme.push("Es ist noch kein Film für den Durchlauf ausgewählt.");
  }

  const ohnePfad = filme.filter((film) => !film.medien.pfad).length;
  const unsicher = filme.filter((film) => film.medien.pfad && !film.medien.browserGeeignet).length;

  if (ohnePfad) {
    probleme.push(`${ohnePfad} Film(e) haben keinen Video-Pfad und werden beim Abspielen übersprungen.`);
  }

  if (unsicher) {
    probleme.push(`${unsicher} Film(e) haben keine browserfreundliche Wiedergabe-Datei. Für OBS am besten eine MP4-Datei als \"wiedergabe\" eintragen.`);
  }

  if (pauseSekunden > 0 && !intermission.length) {
    probleme.push("Die Pause ist größer als 0, aber es ist kein Zwischenprogramm ausgewählt. Die Pause bleibt dann schwarz mit Countdown.");
  }

  warning.hidden = !probleme.length;
  warning.textContent = probleme.join(" ");
}


/* ======================================== */
/* BUILDER INTERAKTION                      */
/* ======================================== */

function handleBuilderChange(event) {
  const animal = event.target.closest("[data-kino-animal]");

  if (animal) {
    quellenInitialisiert = false;
    typenInitialisiert = false;
    setTierAusgewaehlt(animal.dataset.kinoAnimal, animal.checked);
    return;
  }

  const source = event.target.closest("[data-kino-source]");

  if (source) {
    if (source.checked) {
      filmQuellen.add(source.dataset.kinoSource);
    } else {
      filmQuellen.delete(source.dataset.kinoSource);
    }

    renderFilme();
    renderSummary();
    return;
  }

  const type = event.target.closest("[data-kino-type]");

  if (type) {
    if (type.checked) {
      filmTypen.add(type.dataset.kinoType);
    } else {
      filmTypen.delete(type.dataset.kinoType);
    }

    renderFilme();
    renderSummary();
    return;
  }

  renderSummary();
}

function handleBuilderClick(event) {
  if (event.target.closest("[data-kino-select-all-animals]")) {
    quellenInitialisiert = false;
    typenInitialisiert = false;
    setTierAuswahl(tiere.map((tier) => tier.id));
    return;
  }

  if (event.target.closest("[data-kino-select-no-animals]")) {
    filmQuellen.clear();
    filmTypen.clear();
    quellenInitialisiert = false;
    typenInitialisiert = false;
    setTierAuswahl([]);
    return;
  }

  if (event.target.closest("[data-kino-select-all-sources]")) {
    filmQuellen = new Set(getQuellenFuerAusgewaehlteTiere().keys());
    renderQuellen();
    renderFilme();
    renderSummary();
    return;
  }

  if (event.target.closest("[data-kino-select-no-sources]")) {
    filmQuellen.clear();
    renderQuellen();
    renderFilme();
    renderSummary();
  }
}

function getPauseSekunden() {
  const minuten = Number(getElement("[data-kino-pause-minutes]")?.value) || 0;
  const sekunden = Number(getElement("[data-kino-pause-seconds]")?.value) || 0;
  return Math.max(0, Math.round(minuten * 60 + sekunden));
}

function getCardDauer() {
  return Math.max(3, Number(getElement("[data-kino-card-duration]")?.value) || 15);
}

function getIntermissionAuswahl() {
  return [...document.querySelectorAll("[data-kino-intermission]:checked")]
    .map((input) => input.dataset.kinoIntermission)
    .filter(Boolean);
}


/* ======================================== */
/* PLAYLIST STARTEN                         */
/* ======================================== */

function startPlayback() {
  let filme = getAktiveFilme().filter((film) => film.medien.pfad);

  if (!filme.length) {
    const warning = getElement("[data-kino-warning]");

    if (warning) {
      warning.hidden = false;
      warning.textContent = "Es gibt keinen ausgewählten Film mit einem eingetragenen Video-Pfad.";
    }

    return;
  }

  if (getElement("[data-kino-film-order]")?.value === "random") {
    filme = shuffle(filme);
  }

  playback = {
    aktiv: true,
    filme,
    index: 0,
    loop: getElement("[data-kino-loop-mode]")?.value === "loop",
    pauseSekunden: getPauseSekunden(),
    cardDauer: getCardDauer(),
    intermission: getIntermissionAuswahl(),
    avoidRepeats: getElement("[data-kino-avoid-repeats]")?.checked !== false,
    showCountdown: getElement("[data-kino-show-countdown]")?.checked !== false,
    phase: "film",
    pauseEnde: null,
    naechsterFilmIndex: null,
  };

  getElement("[data-kino-builder]")?.setAttribute("hidden", "");
  const player = getElement("[data-kino-player]");

  if (player) {
    player.hidden = false;
    player.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  spieleFilm(0);
}

function spieleFilm(index) {
  if (!playback?.aktiv) {
    return;
  }

  clearTimers();
  playback.phase = "film";
  playback.index = index;

  const film = playback.filme[index];
  const video = getElement("[data-kino-video]");

  if (!film || !video) {
    stopPlayback();
    return;
  }

  hideCard();
  hideMessage();
  setCountdown(null);

  video.hidden = false;
  video.controls = false;
  video.src = film.medien.pfad;
  video.currentTime = 0;

  const filmInfo = getElement("[data-kino-film-info]");
  const filmTitle = getElement("[data-kino-film-title]");
  const filmAnimal = getElement("[data-kino-film-animal]");

  if (filmInfo && filmTitle && filmAnimal) {
    filmInfo.hidden = false;
    filmTitle.textContent = text(film.titel, film.reihe || "Film");
    filmAnimal.textContent = `${text(film.tier.namen, film.tier.wissenschaftlicherName)} · ${film.quelleName}`;
  }

  updatePosition();

  const playPromise = video.play();

  if (playPromise?.catch) {
    playPromise.catch((fehler) => {
      console.warn("Film konnte nicht automatisch gestartet werden.", fehler);
      showMessage("Der Film konnte nicht automatisch gestartet werden. Klicke einmal in den Player oder auf Weiter.");
    });
  }
}

function handleFilmEnded() {
  if (!playback?.aktiv || playback.phase !== "film") {
    return;
  }

  const letzterFilm = playback.index >= playback.filme.length - 1;

  if (letzterFilm && !playback.loop) {
    finishPlayback();
    return;
  }

  const naechsterIndex = letzterFilm ? 0 : playback.index + 1;

  if (playback.pauseSekunden <= 0) {
    spieleFilm(naechsterIndex);
    return;
  }

  startePause(naechsterIndex);
}

function handleVideoError() {
  if (!playback?.aktiv || playback.phase !== "film") {
    return;
  }

  const film = playback.filme[playback.index];
  const titel = film ? text(film.titel, film.reihe || "Film") : "Film";

  showMessage(`„${titel}“ konnte nicht geladen werden und wird übersprungen.`);
  window.setTimeout(() => {
    if (playback?.aktiv && playback.phase === "film") {
      handleFilmEnded();
    }
  }, 1800);
}


/* ======================================== */
/* ZWISCHENPROGRAMM                         */
/* ======================================== */

function startePause(naechsterFilmIndex) {
  if (!playback?.aktiv) {
    return;
  }

  clearTimers();
  playback.phase = "pause";
  playback.naechsterFilmIndex = naechsterFilmIndex;
  playback.pauseEnde = Date.now() + playback.pauseSekunden * 1000;

  const video = getElement("[data-kino-video]");

  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.hidden = true;
  }

  getElement("[data-kino-film-info]")?.setAttribute("hidden", "");
  hideMessage();

  zeigeNaechstenBeitrag();
  updateCountdown();

  pauseTimer = window.setInterval(updateCountdown, 250);
}

function updateCountdown() {
  if (!playback?.aktiv || playback.phase !== "pause") {
    return;
  }

  const restMs = playback.pauseEnde - Date.now();
  const restSekunden = Math.max(0, restMs / 1000);

  if (playback.showCountdown) {
    setCountdown(restSekunden);
  } else {
    setCountdown(null);
  }

  if (restMs <= 0) {
    clearTimers();
    spieleFilm(playback.naechsterFilmIndex);
  }
}

function zeigeNaechstenBeitrag() {
  if (!playback?.aktiv || playback.phase !== "pause") {
    return;
  }

  const restSekunden = Math.max(0, (playback.pauseEnde - Date.now()) / 1000);

  if (restSekunden <= 0) {
    return;
  }

  const pool = baueZwischenprogrammPool();

  if (!pool.length) {
    showBlackPause();
    return;
  }

  let moegliche = pool;

  if (playback.avoidRepeats && pool.length > 1 && lastBeitragId) {
    moegliche = pool.filter((beitrag) => beitrag.id !== lastBeitragId);
  }

  const beitrag = moegliche[Math.floor(Math.random() * moegliche.length)] ?? pool[0];
  lastBeitragId = beitrag.id;

  const dauer = Math.min(
    restSekunden,
    Math.max(3, Number(beitrag.dauerSekunden) || playback.cardDauer),
  );

  zeigeBeitrag(beitrag);

  beitragTimer = window.setTimeout(() => {
    if (playback?.aktiv && playback.phase === "pause") {
      zeigeNaechstenBeitrag();
    }
  }, dauer * 1000);
}

function baueZwischenprogrammPool() {
  const ausgewaehlt = new Set(playback?.intermission ?? []);
  const pool = [];

  if (ausgewaehlt.has("tierinfo")) {
    const film = playback?.filme?.[playback?.naechsterFilmIndex];

    if (film?.tier) {
      pool.push(...baueTierinfos(film.tier));
    }
  }

  kinoKategorien.forEach((kategorie) => {
    if (!ausgewaehlt.has(kategorie.kategorie)) {
      return;
    }

    kategorie.beitraege
      .filter((beitrag) => beitrag.aktiv)
      .forEach((beitrag) => {
        pool.push({
          ...beitrag,
          id: `kino::${kategorie.kategorie}::${beitrag.id}`,
          kategorieLabel: text(kategorie.name, kategorie.kategorie),
          titelText: text(beitrag.titel, beitrag.id),
          textText: text(beitrag.text, ""),
          quelleText: formatBeitragQuelle(beitrag.quelle),
          bildPfad: beitrag.medien?.bild ?? "",
          videoPfad: beitrag.medien?.video ?? "",
        });
      });
  });

  return pool;
}

function baueTierinfos(tier) {
  const texte = tier.originalDaten?.texte ?? {};
  const kandidaten = [
    ["tierfakten", "Tierfakt"],
    ["uebersicht", "Tierübersicht"],
    ["arterhaltung", "Artenschutz"],
  ];

  const result = [];

  kandidaten.forEach(([schluessel, label]) => {
    const sprachDaten = getSprachEintraege(texte?.[schluessel]);

    sprachDaten.forEach((eintrag, index) => {
      if (!eintrag?.inhalt) {
        return;
      }

      result.push({
        id: `tierinfo::${tier.id}::${schluessel}::${index}`,
        kategorie: "tierinfo",
        kategorieLabel: label,
        titelText: text(tier.namen, tier.wissenschaftlicherName),
        textText: eintrag.inhalt,
        quelleText: formatTierQuelle(tier, eintrag.quelle),
        bildPfad: tier.hauptbildPfad ?? "",
        videoPfad: "",
        dauerSekunden: playback?.cardDauer ?? 15,
      });
    });
  });

  return result;
}

function getSprachEintraege(sprachObjekt) {
  if (!sprachObjekt || typeof sprachObjekt !== "object") {
    return [];
  }

  const sprache = getLanguage();
  const fallback = [sprache];

  if (sprache === "en-US") {
    fallback.push("en");
  }

  fallback.push("de", "en");

  for (const code of [...new Set(fallback)]) {
    const wert = sprachObjekt[code];

    if (Array.isArray(wert) && wert.length) {
      return wert;
    }
  }

  return [];
}

function formatTierQuelle(tier, quelleId) {
  if (!quelleId) {
    return "";
  }

  return tier.originalDaten?.quellen?.[quelleId]?.name ?? String(quelleId);
}

function formatBeitragQuelle(quelle) {
  if (!quelle) {
    return "";
  }

  if (typeof quelle === "string") {
    return quelle;
  }

  return text(quelle.name, quelle.id ?? "");
}

function zeigeBeitrag(beitrag) {
  const card = getElement("[data-kino-card]");
  const category = getElement("[data-kino-card-category]");
  const title = getElement("[data-kino-card-title]");
  const body = getElement("[data-kino-card-text]");
  const source = getElement("[data-kino-card-source]");
  const media = getElement("[data-kino-card-media]");
  const image = getElement("[data-kino-card-image]");
  const video = getElement("[data-kino-video]");

  if (!card || !category || !title || !body || !source || !media || !image || !video) {
    return;
  }

  if (beitrag.videoPfad) {
    card.hidden = true;
    video.hidden = false;
    video.src = beitrag.videoPfad;
    video.currentTime = 0;
    video.play().catch(() => {
      video.hidden = true;
      zeigeTextKarte(beitrag);
    });
    return;
  }

  video.pause();
  video.removeAttribute("src");
  video.load();
  video.hidden = true;
  zeigeTextKarte(beitrag);
}

function zeigeTextKarte(beitrag) {
  const card = getElement("[data-kino-card]");
  const category = getElement("[data-kino-card-category]");
  const title = getElement("[data-kino-card-title]");
  const body = getElement("[data-kino-card-text]");
  const source = getElement("[data-kino-card-source]");
  const media = getElement("[data-kino-card-media]");
  const image = getElement("[data-kino-card-image]");

  if (!card || !category || !title || !body || !source || !media || !image) {
    return;
  }

  card.hidden = false;
  category.textContent = beitrag.kategorieLabel ?? beitrag.kategorie ?? "Zwischenprogramm";
  title.textContent = beitrag.titelText ?? text(beitrag.titel, beitrag.id ?? "");
  body.textContent = beitrag.textText ?? text(beitrag.text, "");
  source.textContent = beitrag.quelleText ? `Quelle: ${beitrag.quelleText}` : "";

  if (beitrag.bildPfad) {
    media.hidden = false;
    image.src = beitrag.bildPfad;
    image.alt = title.textContent;
  } else {
    media.hidden = true;
    image.removeAttribute("src");
    image.alt = "";
  }
}

function showBlackPause() {
  hideCard();
  const video = getElement("[data-kino-video]");

  if (video) {
    video.pause();
    video.hidden = true;
  }
}


/* ======================================== */
/* PLAYER-STEUERUNG                         */
/* ======================================== */

function skipCurrent() {
  if (!playback?.aktiv) {
    return;
  }

  if (playback.phase === "film") {
    handleFilmEnded();
    return;
  }

  if (playback.phase === "pause") {
    clearTimers();
    spieleFilm(playback.naechsterFilmIndex);
  }
}

function finishPlayback() {
  if (!playback?.aktiv) {
    return;
  }

  clearTimers();
  playback.phase = "fertig";

  const video = getElement("[data-kino-video]");

  if (video) {
    video.pause();
    video.hidden = true;
  }

  hideCard();
  setCountdown(null);
  getElement("[data-kino-film-info]")?.setAttribute("hidden", "");
  showMessage("Kinodurchlauf beendet.");
  updatePosition("Fertig");
}

function stopPlayback({ zurueckZumBuilder = true } = {}) {
  clearTimers();

  const video = getElement("[data-kino-video]");

  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.hidden = false;
  }

  playback = null;
  lastBeitragId = null;

  hideCard();
  hideMessage();
  setCountdown(null);
  getElement("[data-kino-film-info]")?.setAttribute("hidden", "");

  const player = getElement("[data-kino-player]");
  const builder = getElement("[data-kino-builder]");

  if (player) {
    player.hidden = true;
  }

  if (builder && zurueckZumBuilder) {
    builder.hidden = false;
    renderBuilder();
    builder.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function clearTimers() {
  if (pauseTimer) {
    window.clearInterval(pauseTimer);
    pauseTimer = null;
  }

  if (beitragTimer) {
    window.clearTimeout(beitragTimer);
    beitragTimer = null;
  }
}

function hideCard() {
  const card = getElement("[data-kino-card]");

  if (card) {
    card.hidden = true;
  }
}

function showMessage(nachricht) {
  const message = getElement("[data-kino-player-message]");

  if (!message) {
    return;
  }

  message.textContent = nachricht;
  message.hidden = false;
}

function hideMessage() {
  const message = getElement("[data-kino-player-message]");

  if (message) {
    message.hidden = true;
    message.textContent = "";
  }
}

function setCountdown(sekunden) {
  const container = getElement("[data-kino-countdown]");
  const value = getElement("[data-kino-countdown-value]");

  if (!container || !value) {
    return;
  }

  if (sekunden === null || sekunden === undefined) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  value.textContent = formatZeit(sekunden);
}

function updatePosition(extra = "") {
  const position = getElement("[data-kino-position]");

  if (!position || !playback) {
    return;
  }

  const basis = `Film ${playback.index + 1} / ${playback.filme.length}`;
  position.textContent = extra ? `${basis} · ${extra}` : basis;
}

async function toggleFullscreen() {
  const stage = getElement("[data-kino-stage]");

  if (!stage) {
    return;
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await stage.requestFullscreen();
    }
  } catch (fehler) {
    console.warn("Vollbild konnte nicht umgeschaltet werden.", fehler);
  }
}
