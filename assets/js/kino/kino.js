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
  video?.addEventListener("loadedmetadata", handleVideoMetadata, { signal });
  video?.addEventListener("loadeddata", handleVideoBildBereit, { signal });
  video?.addEventListener("playing", handleVideoBildBereit, { signal });

  const audio = getElement("[data-kino-audio]");
  audio?.addEventListener("error", () => {
    if (playback?.aktiv && playback.phase === "pause") {
      console.warn("Zwischenprogramm-Audio konnte nicht geladen werden.");
    }
  }, { signal });

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

const VIDEO_MIME = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
};

const AUDIO_MIME = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  wave: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
};

function dateiendung(pfad) {
  const sauber = String(pfad ?? "").split(/[?#]/, 1)[0];
  const match = sauber.match(/\.([a-z0-9]+)$/i);
  return match?.[1]?.toLowerCase() ?? "";
}

function mediaTyp(datei) {
  const eingetragen = String(datei?.dateityp ?? "").trim().toLowerCase();
  return eingetragen || dateiendung(datei?.pfad);
}

function browserVideoDatei(datei) {
  return Boolean(datei?.pfad && VIDEO_MIME[mediaTyp(datei)]);
}

function browserAudioDatei(datei) {
  return Boolean(datei?.pfad && AUDIO_MIME[mediaTyp(datei)]);
}

function mimeFuerMedia(medien, art = "video") {
  const typ = String(medien?.dateityp ?? dateiendung(medien?.pfad)).toLowerCase();
  return art === "audio" ? (AUDIO_MIME[typ] ?? "") : (VIDEO_MIME[typ] ?? "");
}

function normalisiereMediaPfad(pfad) {
  const wert = String(pfad ?? "").trim().replace(/\\/g, "/");

  if (!wert) {
    return "";
  }

  if (/^(?:https?:|blob:|data:)/i.test(wert)) {
    return wert;
  }

  try {
    return new URL(wert.replace(/^\.\//, ""), document.baseURI).href;
  } catch {
    return wert;
  }
}

function leereMediaQuelle(element) {
  if (!element) {
    return;
  }

  element.pause?.();
  element.removeAttribute("src");
  element.replaceChildren();
  element.load?.();
}

function setzeBrowserQuelle(element, medien, art = "video") {
  if (!element) {
    return false;
  }

  leereMediaQuelle(element);

  if (!medien?.pfad) {
    return false;
  }

  const pfad = normalisiereMediaPfad(medien.pfad);
  if (!pfad) {
    return false;
  }

  /*
    Absichtlich direkt element.src setzen statt <source>-Elemente zu bauen.
    Das ist für lokal ausgelieferte MP4/WebM/OGV-Dateien robuster und
    verhindert, dass Chrome eine vorhandene Datei wegen eines unpassenden
    MIME-Hinweises überspringt.
  */
  element.src = pfad;
  element.preload = "auto";

  if (art === "video") {
    element.playsInline = true;
    element.muted = false;
    element.volume = 1;
    element.removeAttribute("hidden");
  }

  element.load();
  return true;
}

function findeFilmPfad(variante) {
  const dateien = alsArray(variante?.dateien);

  // Für das Kino werden AUSSCHLIESSLICH Browser-Videodateien verwendet.
  // Originale wie MKV bleiben Archivdateien und werden nie an <video> übergeben.
  const wiedergabe = dateien.find((datei) =>
    datei?.typ === "wiedergabe" && browserVideoDatei(datei),
  );

  const browserDatei = wiedergabe ?? dateien.find((datei) => browserVideoDatei(datei));

  if (browserDatei?.pfad) {
    return {
      pfad: browserDatei.pfad,
      dateityp: mediaTyp(browserDatei),
      mime: mimeFuerMedia(browserDatei, "video"),
      browserGeeignet: true,
      quelle: "lokal",
    };
  }

  // Externe URLs nur dann direkt verwenden, wenn sie auf eine typische
  // Browser-Videodatei zeigen. Webseiten-URLs gehören nicht in <video>.
  if (variante?.url) {
    const extern = {
      pfad: variante.url,
      dateityp: dateiendung(variante.url),
    };

    if (browserVideoDatei(extern)) {
      return {
        ...extern,
        mime: mimeFuerMedia(extern, "video"),
        browserGeeignet: true,
        quelle: "extern",
      };
    }
  }

  return {
    pfad: "",
    dateityp: "",
    mime: "",
    browserGeeignet: false,
    quelle: "keine-browserdatei",
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
  let filme = getAktiveFilme().filter((film) =>
    film.medien.pfad && film.medien.browserGeeignet,
  );

  if (!filme.length) {
    const warning = getElement("[data-kino-warning]");

    if (warning) {
      warning.hidden = false;
      warning.textContent = "Es gibt keinen ausgewählten Film mit einer Browser-Videodatei (MP4, WebM oder OGV). Originaldateien wie MKV werden absichtlich nicht abgespielt.";
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

  stoppePauseAudio();
  video.hidden = false;
  video.controls = false;
  video.playsInline = true;
  video.muted = false;
  video.volume = 1;

  if (!setzeBrowserQuelle(video, film.medien, "video")) {
    showMessage("Für diesen Film ist keine Browser-Videodatei vorhanden.");
    window.setTimeout(handleFilmEnded, 1200);
    return;
  }

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
      showMessage("Der Film konnte nicht automatisch gestartet werden. Klicke einmal auf Weiter und danach wieder auf den Film.");
    });
  }
}

function handleVideoMetadata() {
  if (!playback?.aktiv || playback.phase !== "film") {
    return;
  }

  const video = getElement("[data-kino-video]");
  if (!video) {
    return;
  }

  // Bei MP4 kann loadedmetadata bereits kommen, bevor der erste Bild-Frame
  // wirklich gezeichnet wurde. Darum hier nicht vorschnell eine schwarze
  // Fehlerfläche darüberlegen.
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    handleVideoBildBereit();
  }
}

function handleVideoBildBereit() {
  if (!playback?.aktiv || playback.phase !== "film") {
    return;
  }

  const video = getElement("[data-kino-video]");
  if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
    return;
  }

  video.hidden = false;
  hideMessage();
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
  const video = getElement("[data-kino-video]");
  const code = video?.error?.code ?? 0;

  console.error("Kino-Video konnte nicht abgespielt werden:", {
    titel,
    pfad: film?.medien?.pfad,
    errorCode: code,
  });

  showMessage(`„${titel}“ konnte im Browser nicht abgespielt werden.`);
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
    setzeBrowserQuelle(video, null, "video");
    video.hidden = true;
  }
  stoppePauseAudio();

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
          audioPfad: beitrag.medien?.audio ?? "",
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
        audioPfad: "",
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
  const video = getElement("[data-kino-video]");
  const audio = getElement("[data-kino-audio]");

  if (!card || !video) {
    return;
  }

  stoppePauseAudio();

  if (beitrag.videoPfad) {
    const media = {
      pfad: beitrag.videoPfad,
      dateityp: dateiendung(beitrag.videoPfad),
    };

    if (browserVideoDatei(media)) {
      card.hidden = true;
      video.hidden = false;
      video.controls = false;
      setzeBrowserQuelle(video, media, "video");
      video.play().catch(() => {
        video.hidden = true;
        zeigeTextKarte(beitrag);
      });
      return;
    }
  }

  setzeBrowserQuelle(video, null, "video");
  video.hidden = true;
  zeigeTextKarte(beitrag);

  // Audio (MP3/WAV/OGG/M4A/AAC/FLAC) kann als Ton unter einer Text-/Bildkarte
  // laufen. Das ist getrennt vom Videoelement, damit Audio nie als schwarzes
  // "Video" dargestellt wird.
  if (beitrag.audioPfad && audio) {
    const media = {
      pfad: beitrag.audioPfad,
      dateityp: dateiendung(beitrag.audioPfad),
    };

    if (browserAudioDatei(media)) {
      setzeBrowserQuelle(audio, media, "audio");
      audio.play().catch((fehler) => {
        console.warn("Zwischenprogramm-Audio konnte nicht gestartet werden.", fehler);
      });
    }
  }
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

function stoppePauseAudio() {
  const audio = getElement("[data-kino-audio]");
  if (!audio) {
    return;
  }

  setzeBrowserQuelle(audio, null, "audio");
}

function showBlackPause() {
  hideCard();
  stoppePauseAudio();
  const video = getElement("[data-kino-video]");

  if (video) {
    setzeBrowserQuelle(video, null, "video");
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

  stoppePauseAudio();
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
    leereMediaQuelle(video);
    video.hidden = false;
  }

  stoppePauseAudio();
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
