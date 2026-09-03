import { datenImportieren } from "../../daten/tiere/datenImport.js";
import { getLanguage, getLocalizedValue } from "../features/language.js";
import { getTierAuswahl } from "../features/tierAuswahl.js";
import {
  getConservationLabel,
  getAnimalUiText,
} from "../features/animalLabels.js";

let controller = null;
let tiere = [];
let selectedTiere = [];
let activeTierId = null;
let imageIndex = 0;
let factIndex = 0;
let audioIndex = 0;
let audioItems = [];
let foodRelation = "frisst";
let foodAge = "erwachsen";
let mapTransform = { scale: 1, x: 0, y: 0 };
let mapDrag = null;

const audioMetaCache = new Map();

const UI = {
  de: {
    map: "Karte",
    openMap: "Zum Vergrößern anklicken",
    animalName: "Tiername",
    scientificName: "Wissenschaftlicher Name",
    conservationStatus: "Gefährdungsgrad",
    zoopedia: "Zoopedia",
    facts: "Tierfakten",
    foodWeb: "Nahrungsnetz",
    eats: "Frisst",
    eatenBy: "Wird gefressen von",
    young: "Jungtier",
    adult: "Erwachsen",
    noData: "Keine Angabe",
    placeholder: "Platzhalter",
    social: "Soziale Struktur",
    biome: "Biome",
    bodyLength: "Körperlänge",
    wingspan: "Flügelspannweite",
    weight: "Gewicht",
    wildPopulation: "Wildpopulation",
    maturity: "Geschlechtsreife",
    lifespan: "Lebensspanne",
    speed: "Geschwindigkeit",
    upTo: "Bis zu",
    from: "Ab",
    activity: "Aktivität",
    dietType: "Fressverhalten",
    noImage: "Kein Bild",
    noMap: "Keine Karte",
    noAudio: "Keine Audiodaten",
    noFacts: "Keine Tierfakten",
    noFoodData: "Keine Daten für diese Auswahl.",
    noNaturalPredators: "Keine natürlichen Fressfeinde angegeben.",
    image: "Bild",
    audio: "Audio",
    years: "Jahre",
  },
  en: {
    map: "Map",
    openMap: "Click to enlarge",
    animalName: "Animal name",
    scientificName: "Scientific name",
    conservationStatus: "Conservation status",
    zoopedia: "Zoopedia",
    facts: "Animal facts",
    foodWeb: "Food web",
    eats: "Eats",
    eatenBy: "Eaten by",
    young: "Young",
    adult: "Adult",
    noData: "No data",
    placeholder: "Placeholder",
    social: "Social structure",
    biome: "Biomes",
    bodyLength: "Body length",
    wingspan: "Wingspan",
    weight: "Weight",
    wildPopulation: "Wild population",
    maturity: "Sexual maturity",
    lifespan: "Lifespan",
    speed: "Speed",
    upTo: "Up to",
    from: "From",
    activity: "Activity",
    dietType: "Diet",
    noImage: "No image",
    noMap: "No map",
    noAudio: "No audio data",
    noFacts: "No animal facts",
    noFoodData: "No data for this selection.",
    noNaturalPredators: "No natural predators listed.",
    image: "Image",
    audio: "Audio",
    years: "years",
  },
};

const VALUE_LABELS = {
  solitaryOrPair: { de: "Einzelgänger / Paar", en: "Solitary / pair" },
  temperateGrassland: {
    de: "Gemäßigte Graslandschaft",
    en: "Temperate grassland",
  },
  wetland: { de: "Feuchtgebiete", en: "Wetlands" },
  mangrove: { de: "Mangroven", en: "Mangroves" },
  openOcean: { de: "Offenes Meer", en: "Open ocean" },
  reef: { de: "Riff", en: "Reef" },
  lakesAndRivers: { de: "Seen und Flüsse", en: "Lakes and rivers" },
  taiga: { de: "Taiga", en: "Taiga" },
  tropical: { de: "Tropen", en: "Tropical" },
  tundra: { de: "Tundra", en: "Tundra" },
  desert: { de: "Wüste", en: "Desert" },
  diurnal: { de: "Tagaktiv", en: "Diurnal" },
  nocturnal: { de: "Nachtaktiv", en: "Nocturnal" },
  crepuscular: { de: "Dämmerungsaktiv", en: "Crepuscular" },
  carnivore: { de: "Carnivor", en: "Carnivore" },
  herbivore: { de: "Herbivor", en: "Herbivore" },
  omnivore: { de: "Omnivor", en: "Omnivore" },
  lagomorpha: { de: "Hasenartige", en: "Lagomorphs" },
  smallAndMediumMammals: {
    de: "Kleine und mittelgroße Säugetiere",
    en: "Small and medium-sized mammals",
  },
  reptiles: { de: "Reptilien", en: "Reptiles" },
  birds: { de: "Vögel", en: "Birds" },
  largerMammals: { de: "Größere Säugetiere", en: "Larger mammals" },
  hare: { de: "Hase", en: "Hare" },
  rabbit: { de: "Kaninchen", en: "Rabbit" },
  marmot: { de: "Murmeltier", en: "Marmot" },
  chamois: { de: "Gämse", en: "Chamois" },
  foodShortage: { de: "bei Nahrungsknappheit", en: "during food shortage" },
};

/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export async function init() {
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;

  tiere = await datenImportieren();

  bindStaticEvents(signal);

  document.addEventListener("languageChanged", render, { signal });
  document.addEventListener(
    "tierAuswahlChanged",
    () => {
      syncSelectedTiere();
      render();
    },
    { signal },
  );

  syncSelectedTiere();
  render();
}

function syncSelectedTiere() {
  const ids = getTierAuswahl();
  const byId = new Map(tiere.map((tier) => [tier.id, tier]));

  selectedTiere = ids.map((id) => byId.get(id)).filter(Boolean);

  if (!selectedTiere.length) {
    activeTierId = null;
    return;
  }

  if (!selectedTiere.some((tier) => tier.id === activeTierId)) {
    activeTierId = selectedTiere[0].id;
    resetPerTierState();
  }
}

function resetPerTierState() {
  imageIndex = 0;
  factIndex = 0;
  audioIndex = 0;
  audioItems = [];
  foodRelation = "frisst";
  foodAge = "erwachsen";
  resetMapTransform();
}

/* ======================================== */
/* RENDERN                                  */
/* ======================================== */

function render() {
  const empty = document.querySelector("[data-info-empty]");
  const content = document.querySelector("[data-info-content]");

  renderUiText();
  renderTierNavigation();

  if (!selectedTiere.length) {
    if (empty) empty.hidden = false;
    if (content) content.hidden = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (content) content.hidden = false;

  const tier = getActiveTier();
  if (!tier) return;

  renderHeading(tier);
  renderMainImage(tier);
  renderStats(tier);
  renderMap(tier);
  renderZoopedia(tier);
  renderFacts(tier);
  renderFoodWeb(tier);
  renderAudio(tier);
}

function getActiveTier() {
  return (
    selectedTiere.find((tier) => tier.id === activeTierId) ??
    selectedTiere[0] ??
    null
  );
}

/* ======================================== */
/* 1 - TIER-NAVIGATION                      */
/* ======================================== */

function renderTierNavigation() {
  const track = document.querySelector("[data-tier-nav-track]");
  const prev = document.querySelector("[data-tier-nav-prev]");
  const next = document.querySelector("[data-tier-nav-next]");

  if (!track) return;

  track.replaceChildren();

  selectedTiere.forEach((tier) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tier-nav__item";
    button.dataset.tierId = tier.id;
    button.classList.toggle("active", tier.id === activeTierId);

    if (tier.hauptbildPfad) {
      const img = document.createElement("img");
      img.src = tier.hauptbildPfad;
      img.alt = "";
      img.loading = "lazy";
      img.addEventListener(
        "error",
        () => img.replaceWith(createNavFallback()),
        { once: true },
      );
      button.appendChild(img);
    } else {
      button.appendChild(createNavFallback());
    }

    const name = document.createElement("span");
    name.className = "tier-nav__name";
    name.textContent = getTierName(tier);
    button.appendChild(name);

    track.appendChild(button);
  });

  requestAnimationFrame(updateTierNavArrows);

  if (prev) prev.hidden = selectedTiere.length <= 1;
  if (next) next.hidden = selectedTiere.length <= 1;
}

function createNavFallback() {
  const fallback = document.createElement("span");
  fallback.className = "tier-nav__fallback";
  fallback.textContent = "?";
  return fallback;
}

function updateTierNavArrows() {
  const viewport = document.querySelector("[data-tier-nav-viewport]");
  const track = document.querySelector("[data-tier-nav-track]");
  const prev = document.querySelector("[data-tier-nav-prev]");
  const next = document.querySelector("[data-tier-nav-next]");

  if (!viewport || !track || !prev || !next || selectedTiere.length <= 1)
    return;

  const canScroll = track.scrollWidth > viewport.clientWidth + 2;
  prev.hidden = !canScroll;
  next.hidden = !canScroll;

  if (canScroll) {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  }
}

/* ======================================== */
/* 20 - 22: NAME / WISS. NAME / STATUS      */
/* ======================================== */

function renderHeading(tier) {
  setText("[data-animal-name]", getTierName(tier));
  setText(
    "[data-scientific-name]",
    tier.wissenschaftlicherName ?? tier.originalDaten?.id ?? tier.id,
  );

  const status = tier.filter?.schutzstatus
    ? getConservationLabel(tier.filter.schutzstatus)
    : ui("noData");

  setText("[data-conservation-status]", status);
}

/* ======================================== */
/* 2 - BILDER                               */
/* ======================================== */

function getTierImages(tier) {
  return (tier.bilder ?? []).filter(
    (bild) => typeof bild?.pfad === "string" && bild.pfad.trim(),
  );
}

function renderMainImage(tier) {
  const images = getTierImages(tier);
  imageIndex = clampIndex(imageIndex, images.length);

  const image = document.querySelector("[data-main-image]");
  const fallback = document.querySelector("[data-main-image-fallback]");
  const count = document.querySelector("[data-image-count]");
  const button = document.querySelector("[data-main-image-button]");

  if (!image || !fallback || !button) return;

  if (!images.length) {
    image.hidden = true;
    fallback.hidden = false;
    fallback.textContent = ui("noImage");
    button.disabled = true;
    if (count) count.textContent = "";
    return;
  }

  const current = images[imageIndex];
  image.hidden = false;
  fallback.hidden = true;
  button.disabled = false;
  image.src = current.pfad;
  image.alt = getTierName(tier);
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
    fallback.textContent = ui("noImage");
  };

  if (count) {
    count.textContent =
      images.length > 1 ? `${imageIndex + 1}/${images.length}` : "↗";
  }
}

function openImageDialog() {
  const tier = getActiveTier();
  const images = tier ? getTierImages(tier) : [];
  if (!tier || !images.length) return;

  const dialog = document.querySelector("[data-image-dialog]");
  if (!dialog) return;

  renderImageDialog(tier);
  dialog.showModal();
}

function renderImageDialog(tier) {
  const images = getTierImages(tier);
  imageIndex = clampIndex(imageIndex, images.length);
  if (!images.length) return;

  const image = document.querySelector("[data-dialog-image]");
  const title = document.querySelector("[data-image-dialog-title]");
  const counter = document.querySelector("[data-image-dialog-counter]");
  const prev = document.querySelector("[data-image-prev]");
  const next = document.querySelector("[data-image-next]");

  if (image) {
    image.src = images[imageIndex].pfad;
    image.alt = getTierName(tier);
  }
  if (title) title.textContent = getTierName(tier);
  if (counter)
    counter.textContent = `${ui("image")} ${imageIndex + 1} / ${images.length}`;
  if (prev) prev.hidden = images.length <= 1;
  if (next) next.hidden = images.length <= 1;
}

function changeImage(direction) {
  const tier = getActiveTier();
  const images = tier ? getTierImages(tier) : [];
  if (!tier || images.length <= 1) return;

  imageIndex = wrapIndex(imageIndex + direction, images.length);
  renderMainImage(tier);
  renderImageDialog(tier);
}

/* ======================================== */
/* 3 - 9 / 15 / 17: STECKBRIEF              */
/* ======================================== */

function renderStats(tier) {
  const daten = tier.originalDaten?.daten ?? {};

  /* ======================================== */
  /* PUNKT 3: SOZIALE STRUKTUR                */
  /* nur Icon, Text per Hover                  */
  /* ======================================== */

  const socialEntry = daten.sozialeStruktur?.werte?.[0];
  const socialValue = formatEnumValues(daten.sozialeStruktur?.werte);

  setIconOnlyStat(
    '[data-stat-icon-only="social"]',
    ui("social"),
    socialValue,
    getSocialIcon(socialEntry?.wert),
  );

  /* ======================================== */
  /* PUNKT 4: BIOME                           */
  /* Icon + Linie + Daten                     */
  /* ======================================== */

  const biomeElement = document.querySelector("[data-stat-biome]");

  if (biomeElement) {
    const biomeValue = formatEnumValues(daten.biome?.werte);

    setOrbitSteckbrief(
      biomeElement,
      ui("biome"),
      biomeValue,
      "🌍",
    );
  }

  /* ======================================== */
  /* PUNKTE 5 - 9: STECKBRIEFDATEN            */
  /* Wildpopulation gehört NICHT hier hinein. */
  /* Es werden die ersten 5 vorhandenen Werte */
  /* aus dieser Reihenfolge benutzt.           */
  /* ======================================== */

  const steckbriefKandidaten = [
    {
      key: "bodyLength",
      icon: "↔",
      entry: daten.koerperlaenge?.werte?.[0],
    },
    {
      key: "wingspan",
      icon: "🪽",
      entry: daten.fluegelspannweite?.werte?.[0],
    },
    {
      key: "weight",
      icon: "⚖",
      entry: daten.gewicht?.werte?.[0],
    },
    {
      key: "lifespan",
      icon: "⌛",
      entry: daten.lebensspanne?.werte?.[0],
    },
    {
      key: "speed",
      icon: "➤",
      entry: daten.geschwindigkeit?.werte?.[0],
    },
    {
      key: "maturity",
      icon: "◉",
      entry: daten.geschlechtsreife?.werte?.[0],
    },
  ]
    .filter((item) => item.entry && typeof item.entry === "object")
    .slice(0, 5);

  document.querySelectorAll("[data-stat-slot]").forEach((element) => {
    const slotIndex = Number(element.dataset.statSlot);
    const stat = steckbriefKandidaten[slotIndex];

    if (!stat) {
      element.hidden = true;
      return;
    }

    element.hidden = false;

    setOrbitSteckbrief(
      element,
      ui(stat.key),
      formatRange(stat.entry),
      stat.icon,
    );
  });

  /* ======================================== */
  /* PUNKT 15: AKTIVITÄT                      */
  /* nur Icon, Text per Hover                  */
  /* ======================================== */

  const activityEntry = daten.aktivitaet?.werte?.[0];
  const activityValue = formatEnumValues(daten.aktivitaet?.werte);

  setIconOnlyStat(
    '[data-stat-icon-only="activity"]',
    ui("activity"),
    activityValue,
    getActivityIcon(activityEntry?.wert),
  );

  /* ======================================== */
  /* PUNKT 17: FRESSVERHALTEN                 */
  /* nur Icon, Text per Hover                  */
  /* ======================================== */

  const dietEntry = daten.ernaehrung?.fressverhalten?.werte?.[0];
  const dietValue = formatEnumValues(
    daten.ernaehrung?.fressverhalten?.werte,
  );

  setIconOnlyStat(
    '[data-stat-icon-only="dietType"]',
    ui("dietType"),
    dietValue,
    getDietIcon(dietEntry?.wert),
  );
}

function setOrbitSteckbrief(element, label, value, icon) {
  const iconElement = element.querySelector("[data-orbit-icon]");
  const valueElement = element.querySelector("[data-orbit-value]");

  if (iconElement) {
    iconElement.textContent = icon;
  }

  if (valueElement) {
    valueElement.textContent = value || ui("noData");
  }

  const tooltip = `${label}: ${value || ui("noData")}`;

  element.dataset.tooltip = tooltip;
  element.setAttribute("aria-label", tooltip);
}

function setIconOnlyStat(selector, label, value, icon) {
  const element = document.querySelector(selector);

  if (!element) return;

  const iconElement = element.querySelector("[data-orbit-icon]");

  if (iconElement) {
    iconElement.textContent = icon;
  }

  const tooltip = `${label}: ${value || ui("noData")}`;

  element.dataset.tooltip = tooltip;
  element.setAttribute("aria-label", tooltip);
}

function getSocialIcon(value) {
  const icons = {
    solitary: "👤",
    solitaryOrPair: "👥",
    pair: "👥",
    pairs: "👥",
    group: "🐾",
    groups: "🐾",
    herd: "🐾",
    pack: "🐾",
  };

  return icons[value] ?? "👥";
}

function getActivityIcon(value) {
  const icons = {
    diurnal: "☀",
    nocturnal: "🌙",
    crepuscular: "◐",
  };

  return icons[value] ?? "◐";
}

function getDietIcon(value) {
  const icons = {
    carnivore: "🥩",
    herbivore: "🌿",
    omnivore: "🍽",
  };

  return icons[value] ?? "🍽";
}


function formatRange(entry) {
  if (!entry || typeof entry !== "object") return ui("noData");

  const unit = formatUnit(entry.einheit);

  if (
    entry.min !== undefined &&
    entry.min !== null &&
    entry.max !== undefined &&
    entry.max !== null
  ) {
    return `${formatNumber(entry.min)}–${formatNumber(entry.max)}${unit}`;
  }

  if (entry.max !== undefined && entry.max !== null) {
    return `${ui("upTo")} ${formatNumber(entry.max)}${unit}`;
  }

  if (entry.min !== undefined && entry.min !== null) {
    return `${ui("from")} ${formatNumber(entry.min)}${unit}`;
  }

  if (entry.wert !== undefined && entry.wert !== null) {
    return `${formatNumber(entry.wert)}${unit}`;
  }

  return ui("noData");
}

function formatUnit(unit) {
  if (!unit) return "";
  if (unit === "jahr") return ` ${ui("years")}`;
  return ` ${unit}`;
}

function formatEnumValues(entries) {
  if (!Array.isArray(entries) || !entries.length) return ui("noData");

  const values = entries.map((entry) => enumLabel(entry?.wert)).filter(Boolean);

  return values.length ? values.join(" · ") : ui("noData");
}

/* ======================================== */
/* 10 - 12: AUDIO                           */
/* ======================================== */

async function renderAudio(tier) {
  const requestedTierId = tier.id;
  audioItems = buildAudioItems(tier);
  audioIndex = clampIndex(audioIndex, audioItems.length);

  const audio = document.querySelector("[data-audio-element]");
  const play = document.querySelector("[data-audio-play]");
  const left = document.querySelector("[data-audio-left]");
  const right = document.querySelector("[data-audio-right]");

  if (!audio || !play || !left || !right) return;

  audio.pause();
  setAudioPlayIcon("▶");

  if (!audioItems.length) {
    audio.removeAttribute("src");
    audio.load();
    play.disabled = true;
    left.disabled = true;
    right.disabled = true;
    setText("[data-audio-title]", ui("audio"));
    setText("[data-audio-description]", ui("noAudio"));
    return;
  }

  play.disabled = false;
  left.disabled = false;
  right.disabled = false;

  const item = audioItems[audioIndex];
  audio.src = item.src;
  audio.load();

  setText(
    "[data-audio-title]",
    `${item.typ} · ${audioIndex + 1}/${audioItems.length}`,
  );
  setText("[data-audio-description]", item.typ);

  const meta = await loadAudioMetadata(item.metaPath);
  if (
    getActiveTier()?.id !== requestedTierId ||
    audioItems[audioIndex]?.key !== item.key
  )
    return;

  const description = getAudioDescription(meta) || item.typ;
  setText("[data-audio-description]", description);
}

function buildAudioItems(tier) {
  const groups = Array.isArray(tier.originalDaten?.audio)
    ? tier.originalDaten.audio
    : [];
  const items = [];

  groups.forEach((group) => {
    const variants = Array.isArray(group?.varianten) ? group.varianten : [];

    variants.forEach((variant, variantArrayIndex) => {
      const files = Array.isArray(variant?.dateien) ? variant.dateien : [];
      const best = chooseAudioFile(files);
      if (!best?.pfad) return;

      const variantNumber = Number(variant?.variante) || variantArrayIndex + 1;
      const src = best.pfad;
      const directory = src.slice(
        0,
        src.lastIndexOf("/") + 1,
      );

      items.push({
        key: `${group.typ ?? "Audio"}-${variantNumber}-${src}`,
        typ: group.typ ?? "Audio",
        variante: variantNumber,
        src,
        metaPath: `${directory}animal_sound_archive.json`,
      });
    });
  });

  return items;
}

function chooseAudioFile(files) {
  return (
    files.find((file) => String(file?.dateityp).toLowerCase() === "mp3") ??
    files.find((file) => String(file?.dateityp).toLowerCase() === "wav") ??
    files.find((file) => String(file?.dateityp).toLowerCase() === "flac") ??
    files[0] ??
    null
  );
}


async function loadAudioMetadata(path) {
  if (!path) return null;
  if (audioMetaCache.has(path)) return audioMetaCache.get(path);

  try {
    const response = await fetch(path);
    if (!response.ok)
      throw new Error(`${response.status} ${response.statusText}`);
    const data = await response.json();
    const meta = Array.isArray(data) ? (data[0] ?? null) : data;
    audioMetaCache.set(path, meta);
    return meta;
  } catch (error) {
    console.warn(
      `Audio-Metadaten konnten nicht geladen werden: ${path}`,
      error,
    );
    audioMetaCache.set(path, null);
    return null;
  }
}

function getAudioDescription(meta) {
  if (!meta || typeof meta !== "object") return "";
  const language = getLanguage();

  if (language.startsWith("en") && meta.description_en)
    return meta.description_en;
  return meta.description ?? meta.description_en ?? "";
}

async function toggleAudio() {
  const audio = document.querySelector("[data-audio-element]");
  const play = document.querySelector("[data-audio-play]");
  if (!audio || !play || !audio.src) return;

  if (audio.paused) {
    try {
      await audio.play();
      setAudioPlayIcon("■");
    } catch (error) {
      console.warn("Audio konnte nicht abgespielt werden.", error);
    }
  } else {
    audio.pause();
    setAudioPlayIcon("▶");
  }
}
function handleAudioSide(direction) {
  const audio = document.querySelector("[data-audio-element]");

  if (!audio || !audioItems.length) return;

  /* =============================== */
  /* AUDIO LÄUFT → SPULEN            */
  /* =============================== */

  if (!audio.paused && !audio.ended) {
    const duration = Number.isFinite(audio.duration)
      ? audio.duration
      : Infinity;

    // LINKS:
    // +10 Sekunden vorspulen
    if (direction < 0) {
      audio.currentTime = Math.min(duration, audio.currentTime + 10);

      return;
    }

    // RECHTS:
    // -10 Sekunden zurückspulen
    audio.currentTime = Math.max(0, audio.currentTime - 10);

    return;
  }

  /* =============================== */
  /* AUDIO LÄUFT NICHT → RUF WECHSEL */
  /* =============================== */

  // LINKS  = vorheriger Ruf
  // RECHTS = nächster Ruf

  audioIndex = wrapIndex(audioIndex + direction, audioItems.length);

  const tier = getActiveTier();

  if (tier) {
    renderAudio(tier);
  }
}

/* ======================================== */
/* 19 - KARTE                               */
/* ======================================== */

function renderMap(tier) {
  const path = tier.kartenPfad;
  const image = document.querySelector("[data-map-image]");
  const fallback = document.querySelector("[data-map-fallback]");
  const open = document.querySelector("[data-map-open]");

  if (!image || !fallback || !open) return;

  if (!path) {
    image.hidden = true;
    fallback.hidden = false;
    fallback.style.display = "grid";
    fallback.textContent = ui("noMap");
    open.disabled = true;
    return;
  }

  open.disabled = false;
  fallback.hidden = true;
  fallback.style.display = "none";
  image.hidden = false;
  image.src = path;
  image.alt = `${ui("map")} – ${getTierName(tier)}`;
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
    fallback.style.display = "grid";
    fallback.textContent = ui("noMap");
    open.disabled = true;
  };
}

function openMapDialog() {
  const tier = getActiveTier();
  const dialog = document.querySelector("[data-map-dialog]");
  const image = document.querySelector("[data-map-dialog-image]");
  if (!tier?.kartenPfad || !dialog || !image) return;

  image.src = tier.kartenPfad;
  image.alt = `${ui("map")} – ${getTierName(tier)}`;
  setText("[data-map-dialog-title]", `${ui("map")} – ${getTierName(tier)}`);

  resetMapTransform();
  dialog.showModal();
  requestAnimationFrame(fitMapImage);
}

function fitMapImage() {
  const viewport = document.querySelector("[data-map-viewport]");
  const image = document.querySelector("[data-map-dialog-image]");
  if (!viewport || !image) return;

  const update = () => {
    const naturalWidth = image.naturalWidth || 1;
    const naturalHeight = image.naturalHeight || 1;
    const fit =
      Math.min(
        viewport.clientWidth / naturalWidth,
        viewport.clientHeight / naturalHeight,
      ) * 0.94;
    image.dataset.fitScale = String(fit);
    applyMapTransform();
  };

  if (image.complete) update();
  else image.addEventListener("load", update, { once: true });
}

function zoomMap(delta) {
  mapTransform.scale = Math.max(0.5, Math.min(6, mapTransform.scale + delta));
  applyMapTransform();
}

function resetMapTransform() {
  mapTransform = { scale: 1, x: 0, y: 0 };
  applyMapTransform();
}

function applyMapTransform() {
  const image = document.querySelector("[data-map-dialog-image]");
  const reset = document.querySelector("[data-map-reset]");
  if (!image) return;

  const fitScale = Number(image.dataset.fitScale) || 1;
  const scale = fitScale * mapTransform.scale;

  image.style.transform = `translate(calc(-50% + ${mapTransform.x}px), calc(-50% + ${mapTransform.y}px)) scale(${scale})`;
  if (reset) reset.textContent = `${Math.round(mapTransform.scale * 100)}%`;
}

/* ======================================== */
/* 23 - ZOOPEDIA-TEXT                       */
/* ======================================== */

function renderZoopedia(tier) {
  const container = document.querySelector("[data-zoopedia-text]");
  if (!container) return;

  const entries = getTextEntries(tier, "uebersicht");
  container.replaceChildren();

  if (!entries.length) {
    const p = document.createElement("p");
    p.textContent = ui("noData");
    container.appendChild(p);
    return;
  }

  entries.forEach((entry) => {
    const p = document.createElement("p");
    p.textContent = entry.inhalt;
    container.appendChild(p);
  });
}

/* ======================================== */
/* 24 - 26: TIERFAKTEN                      */
/* ======================================== */

function renderFacts(tier) {
  const facts = getTextEntries(tier, "tierfakten");
  factIndex = clampIndex(factIndex, facts.length);

  const text = document.querySelector("[data-fact-text]");
  const counter = document.querySelector("[data-fact-counter]");
  const prev = document.querySelector("[data-fact-prev]");
  const next = document.querySelector("[data-fact-next]");

  if (text) text.textContent = facts[factIndex]?.inhalt ?? ui("noFacts");
  if (counter)
    counter.textContent = facts.length
      ? `${factIndex + 1} / ${facts.length}`
      : "";
  if (prev) prev.hidden = facts.length <= 1;
  if (next) next.hidden = facts.length <= 1;
}

function changeFact(direction) {
  const tier = getActiveTier();
  if (!tier) return;

  const facts = getTextEntries(tier, "tierfakten");
  if (facts.length <= 1) return;

  factIndex = wrapIndex(factIndex + direction, facts.length);
  renderFacts(tier);
}

/* ======================================== */
/* 27 - 29: NAHRUNGSNETZ                    */
/* ======================================== */

function renderFoodWeb(tier) {
  document.querySelectorAll("[data-food-relation]").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.foodRelation === foodRelation,
    );
  });

  document.querySelectorAll("[data-food-age]").forEach((button) => {
    button.classList.toggle("active", button.dataset.foodAge === foodAge);
  });

  const content = document.querySelector("[data-food-content]");
  if (!content) return;

  const selected =
    tier.originalDaten?.daten?.ernaehrung?.nahrungsnetz?.[foodRelation]?.[
      foodAge
    ];
  const values = Array.isArray(selected?.werte) ? selected.werte : [];

  content.replaceChildren();

  if (!values.length) {
    const p = document.createElement("p");
    p.className = "foodweb-empty";
    p.textContent = selected?.keineNatuerlichenFressfeinde
      ? ui("noNaturalPredators")
      : ui("noFoodData");
    content.appendChild(p);
    return;
  }

  const list = document.createElement("ul");
  list.className = "foodweb-list";

  values.forEach((entry) => {
    const item = document.createElement("li");
    const main = enumLabel(entry.wert);
    const examples = Array.isArray(entry.beispiele)
      ? entry.beispiele.map(enumLabel).filter(Boolean)
      : [];
    const condition = entry.bedingung ? enumLabel(entry.bedingung) : "";

    let text = main || ui("noData");
    if (examples.length) text += ` – ${examples.join(", ")}`;
    if (condition) text += ` (${condition})`;

    item.textContent = text;
    list.appendChild(item);
  });

  content.appendChild(list);
}

/* ======================================== */
/* EVENTS                                   */
/* ======================================== */

function bindStaticEvents(signal) {
  document.addEventListener("click", handleClick, { signal });

  const track = document.querySelector("[data-tier-nav-track]");
  track?.addEventListener("scroll", updateTierNavArrows, {
    signal,
    passive: true,
  });
  window.addEventListener("resize", updateTierNavArrows, { signal });

  const audio = document.querySelector("[data-audio-element]");
  audio?.addEventListener("play", () => setAudioPlayIcon("■"), {
    signal,
  });
  audio?.addEventListener("pause", () => setAudioPlayIcon("▶"), {
    signal,
  });
  audio?.addEventListener("ended", () => setAudioPlayIcon("▶"), {
    signal,
  });

  const viewport = document.querySelector("[data-map-viewport]");
  viewport?.addEventListener("wheel", handleMapWheel, {
    signal,
    passive: false,
  });
  viewport?.addEventListener("pointerdown", handleMapPointerDown, { signal });
  viewport?.addEventListener("pointermove", handleMapPointerMove, { signal });
  viewport?.addEventListener("pointerup", handleMapPointerUp, { signal });
  viewport?.addEventListener("pointercancel", handleMapPointerUp, { signal });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener(
      "click",
      (event) => {
        if (event.target === dialog) dialog.close();
      },
      { signal },
    );
  });
}

function handleClick(event) {
  const tierButton = event.target.closest("[data-tier-id]");
  if (tierButton) {
    activeTierId = tierButton.dataset.tierId;
    resetPerTierState();
    render();
    return;
  }

  if (event.target.closest("[data-tier-nav-prev]")) {
    scrollTierNav(-1);
    return;
  }
  if (event.target.closest("[data-tier-nav-next]")) {
    scrollTierNav(1);
    return;
  }

  if (event.target.closest("[data-main-image-button]")) {
    openImageDialog();
    return;
  }
  if (event.target.closest("[data-image-dialog-close]")) {
    document.querySelector("[data-image-dialog]")?.close();
    return;
  }
  if (event.target.closest("[data-image-prev]")) {
    changeImage(-1);
    return;
  }
  if (event.target.closest("[data-image-next]")) {
    changeImage(1);
    return;
  }

  if (event.target.closest("[data-audio-play]")) {
    toggleAudio();
    return;
  }
  if (event.target.closest("[data-audio-left]")) {
    handleAudioSide(-1);
    return;
  }
  if (event.target.closest("[data-audio-right]")) {
    handleAudioSide(1);
    return;
  }

  if (event.target.closest("[data-map-open]")) {
    openMapDialog();
    return;
  }
  if (event.target.closest("[data-map-close]")) {
    document.querySelector("[data-map-dialog]")?.close();
    return;
  }
  if (event.target.closest("[data-map-zoom-in]")) {
    zoomMap(0.25);
    return;
  }
  if (event.target.closest("[data-map-zoom-out]")) {
    zoomMap(-0.25);
    return;
  }
  if (event.target.closest("[data-map-reset]")) {
    resetMapTransform();
    return;
  }

  if (event.target.closest("[data-fact-prev]")) {
    changeFact(-1);
    return;
  }
  if (event.target.closest("[data-fact-next]")) {
    changeFact(1);
    return;
  }

  const relation = event.target.closest("[data-food-relation]");
  if (relation) {
    foodRelation = relation.dataset.foodRelation;
    const tier = getActiveTier();
    if (tier) renderFoodWeb(tier);
    return;
  }

  const age = event.target.closest("[data-food-age]");
  if (age) {
    foodAge = age.dataset.foodAge;
    const tier = getActiveTier();
    if (tier) renderFoodWeb(tier);
  }
}

function scrollTierNav(direction) {
  const track = document.querySelector("[data-tier-nav-track]");
  if (!track) return;
  track.scrollBy({
    left: direction * Math.max(180, track.clientWidth * 0.7),
    behavior: "smooth",
  });
}

function handleMapWheel(event) {
  event.preventDefault();
  zoomMap(event.deltaY < 0 ? 0.15 : -0.15);
}

function handleMapPointerDown(event) {
  const viewport = event.currentTarget;
  mapDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: mapTransform.x,
    originY: mapTransform.y,
  };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add("is-dragging");
}

function handleMapPointerMove(event) {
  if (!mapDrag || mapDrag.pointerId !== event.pointerId) return;
  mapTransform.x = mapDrag.originX + event.clientX - mapDrag.startX;
  mapTransform.y = mapDrag.originY + event.clientY - mapDrag.startY;
  applyMapTransform();
}

function handleMapPointerUp(event) {
  if (!mapDrag || mapDrag.pointerId !== event.pointerId) return;
  event.currentTarget.classList.remove("is-dragging");
  mapDrag = null;
}

/* ======================================== */
/* SPRACHE / TEXTE                          */
/* ======================================== */

function renderUiText() {
  document.querySelectorAll("[data-ui]").forEach((element) => {
    element.textContent = ui(element.dataset.ui);
  });
}

function ui(key) {
  const language = getLanguage();
  const base = language.startsWith("en") ? "en" : "de";
  return UI[base]?.[key] ?? UI.de[key] ?? key;
}

function enumLabel(key) {
  if (key === undefined || key === null) return "";
  const language = getLanguage();
  const values = VALUE_LABELS[key];
  if (!values) return String(key);

  if (language.startsWith("en")) return values.en ?? values.de ?? key;
  return values[language] ?? values.de ?? values.en ?? key;
}

function getTextEntries(tier, key) {
  const value = getLocalizedValue(
    tier.originalDaten?.texte?.[key],
    getLanguage(),
  );
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry) => entry && typeof entry.inhalt === "string" && entry.inhalt.trim(),
  );
}

function getTierName(tier) {
  return (
    getLocalizedValue(tier.namen, getLanguage()) ??
    tier.wissenschaftlicherName ??
    tier.id
  );
}

/* ======================================== */
/* HILFSFUNKTIONEN                          */
/* ======================================== */

function setAudioPlayIcon(icon) {
  const iconElement = document.querySelector("[data-audio-play-icon]");

  if (iconElement) {
    iconElement.textContent = icon;
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value ?? "";
}

function formatNumber(value) {
  if (typeof value !== "number") return String(value ?? "");
  return new Intl.NumberFormat(getLanguage(), {
    maximumFractionDigits: 2,
  }).format(value);
}

function clampIndex(index, length) {
  if (!length) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

function wrapIndex(index, length) {
  if (!length) return 0;
  return (index + length) % length;
}
