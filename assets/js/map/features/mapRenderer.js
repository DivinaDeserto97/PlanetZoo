import { getLanguage } from "../../features/language.js";

import { getTierName } from "./tierListe.js";

/* ======================================== */
/* REFERENZ-WELTKARTE                       */
/* ======================================== */

const WORLD_REFERENCE_PATH =
  "./assets/daten/Weltkarte/Weltkartenreferenz_map.png";

/*
    Alle vorhandenen Karten:

    784 × 744 px

    Verwendet wird ausschließlich
    die obere Weltkarte innerhalb
    des weißen Rahmens.
*/

const WORLD_CROP = {
  x: 127,

  y: 15,

  width: 540,

  height: 267,
};

/* ======================================== */
/* QUELLFARBEN                              */
/* ======================================== */

const SOURCE_LAND = {
  r: 80,

  g: 107,

  b: 123,
};

/* ======================================== */
/* BASISFARBEN                              */
/* ======================================== */

const BASE_WATER = "#10242b";

const BASE_LAND = "#506b7b";

/* ======================================== */
/* ZOOM                                     */
/* ======================================== */

const MIN_ZOOM = 1;

const MAX_ZOOM = 8;

const ZOOM_FACTOR = 1.18;

/* ======================================== */
/* RENDERER INITIALISIEREN                  */
/* ======================================== */

export async function initMapRenderer(tiere, signal) {
  const svg = document.querySelector("[data-map-svg]");

  const viewport = document.querySelector("[data-map-viewport]");

  const baseImage = document.querySelector("[data-world-base]");

  const rangeImage = document.querySelector("[data-range-layer]");

  const status = document.querySelector("[data-map-status]");

  const hoverInfo = document.querySelector("[data-map-hover-info]");

  if (!svg || !viewport || !baseImage || !rangeImage) {
    console.error("SVG-Kartenelemente wurden nicht gefunden.");

    return {
      render() {},

      updateLanguage() {},

      resetView() {},
    };
  }

  /* ==================================== */
  /* REFERENZ-WELTKARTE LADEN             */
  /* ==================================== */

  let referenceImage;

  try {
    referenceImage = await loadImage(WORLD_REFERENCE_PATH);
  } catch (error) {
    console.error(
      `Referenz-Weltkarte konnte nicht geladen werden: ${WORLD_REFERENCE_PATH}`,
      error,
    );

    setStatusText(status, "referenceError");

    return {
      render() {},

      updateLanguage() {},

      resetView() {},
    };
  }

  /*
        Aus der Referenz-PNG erzeugen wir
        eine saubere Weltkarte:

        Grau  = Land
        alles andere = Meer

        Dadurch verschwindet auch Pink.
    */

  const baseDataUrl = createCleanBaseMap(referenceImage);

  baseImage.setAttribute("href", baseDataUrl);

  /* ==================================== */
  /* TIER-MASKEN LADEN                    */
  /* ==================================== */

  const masks = new Map();

  for (const tier of tiere) {
    if (!tier.kartenPfad) {
      continue;
    }

    try {
      const image = await loadImage(tier.kartenPfad);

      const mask = createRangeMask(image);

      masks.set(tier.id, mask);
    } catch (error) {
      console.error(
        `Tierkarte konnte nicht geladen werden: ${tier.kartenPfad}`,
        error,
      );
    }
  }

  let currentSelected = new Set();

  /* ==================================== */
  /* ZOOM / PAN                           */
  /* ==================================== */

  let zoom = 1;

  let panX = 0;

  let panY = 0;

  let dragging = false;

  let lastPointer = null;

  function applyTransform() {
    viewport.setAttribute(
      "transform",
      `translate(${panX} ${panY}) scale(${zoom})`,
    );
  }

  function resetView() {
    zoom = 1;

    panX = 0;

    panY = 0;

    applyTransform();
  }

  /* ==================================== */
  /* MAUSRAD ZOOM                         */
  /* ==================================== */

  svg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      const mouse = clientToSvgPoint(svg, event.clientX, event.clientY);

      const oldZoom = zoom;

      const nextZoom = clamp(
        event.deltaY < 0 ? oldZoom * ZOOM_FACTOR : oldZoom / ZOOM_FACTOR,

        MIN_ZOOM,

        MAX_ZOOM,
      );

      if (nextZoom === oldZoom) {
        return;
      }

      /*
                Position unter dem Mauszeiger
                soll beim Zoomen gleich bleiben.
            */

      const worldX = (mouse.x - panX) / oldZoom;

      const worldY = (mouse.y - panY) / oldZoom;

      zoom = nextZoom;

      panX = mouse.x - worldX * zoom;

      panY = mouse.y - worldY * zoom;

      applyTransform();
    },
    {
      passive: false,

      signal,
    },
  );

  /* ==================================== */
  /* KARTE ZIEHEN                         */
  /* ==================================== */

  svg.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0) {
        return;
      }

      dragging = true;

      lastPointer = clientToSvgPoint(svg, event.clientX, event.clientY);

      svg.classList.add("is-dragging");

      svg.setPointerCapture(event.pointerId);
    },
    {
      signal,
    },
  );

  svg.addEventListener(
    "pointermove",
    (event) => {
      const pointer = clientToSvgPoint(svg, event.clientX, event.clientY);

      if (dragging && lastPointer) {
        panX += pointer.x - lastPointer.x;

        panY += pointer.y - lastPointer.y;

        lastPointer = pointer;

        applyTransform();

        return;
      }

      updateHoverFromSvgPoint(pointer);
    },
    {
      signal,
    },
  );

  function endDrag(event) {
    if (!dragging) {
      return;
    }

    dragging = false;

    lastPointer = null;

    svg.classList.remove("is-dragging");

    if (svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }
  }

  svg.addEventListener("pointerup", endDrag, {
    signal,
  });

  svg.addEventListener("pointercancel", endDrag, {
    signal,
  });

  /*
        Doppelklick =
        Kartenansicht zurücksetzen.
    */

  svg.addEventListener("dblclick", resetView, {
    signal,
  });

  /* ==================================== */
  /* RENDERN                              */
  /* ==================================== */

  function render(selected) {
    currentSelected = new Set(selected);

    const selectedTiere = tiere.filter((tier) => {
      return currentSelected.has(tier.id) && masks.has(tier.id);
    });

    const overlayDataUrl = createCombinedOverlay(selectedTiere, masks);

    rangeImage.setAttribute("href", overlayDataUrl);

    setStatusText(
      status,

      selectedTiere.length > 0 ? "ready" : "empty",

      selectedTiere.length,
    );
  }

  /* ==================================== */
  /* HOVER                                */
  /* ==================================== */

  function updateHoverFromSvgPoint(point) {
    if (dragging) {
      return;
    }

    /*
            SVG-Koordinate zurück in
            Weltkarten-Koordinate rechnen.
        */

    const worldX = (point.x - panX) / zoom;

    const worldY = (point.y - panY) / zoom;

    const x = Math.floor(worldX);

    const y = Math.floor(worldY);

    if (x < 0 || y < 0 || x >= WORLD_CROP.width || y >= WORLD_CROP.height) {
      updateHover([]);

      return;
    }

    const index = y * WORLD_CROP.width + x;

    const hits = tiere.filter((tier) => {
      if (!currentSelected.has(tier.id)) {
        return false;
      }

      const mask = masks.get(tier.id);

      return Boolean(mask?.[index]);
    });

    updateHover(hits);
  }

  function updateHover(hits) {
    if (!hoverInfo) {
      return;
    }

    const language = getLanguage();

    if (!hits.length) {
      const text = {
        de: "Fahre mit der Maus über die Karte.",

        en: "Move the mouse over the map.",

        fr: "Passez la souris sur la carte.",
      };

      hoverInfo.textContent = text[language] ?? text.de;

      return;
    }

    hoverInfo.textContent = hits
      .map((tier) => {
        return getTierName(tier, language);
      })
      .join(" · ");
  }

  function updateLanguage() {
    render(currentSelected);
  }

  resetView();

  setStatusText(
    status,

    masks.size > 0 ? "empty" : "none",
  );

  return {
    render,

    updateLanguage,

    resetView,
  };
}

/* ======================================== */
/* SAUBERE BASISKARTE                       */
/* ======================================== */

function createCleanBaseMap(image) {
  const canvas = document.createElement("canvas");

  canvas.width = WORLD_CROP.width;

  canvas.height = WORLD_CROP.height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  /*
        Nur die obere Weltkarte
        aus der 784 × 744 PNG kopieren.
    */

  context.drawImage(
    image,

    WORLD_CROP.x,
    WORLD_CROP.y,
    WORLD_CROP.width,
    WORLD_CROP.height,

    0,
    0,
    WORLD_CROP.width,
    WORLD_CROP.height,
  );

  const imageData = context.getImageData(
    0,
    0,

    WORLD_CROP.width,
    WORLD_CROP.height,
  );

  const land = hexToRgb(BASE_LAND);

  const water = hexToRgb(BASE_WATER);

  for (let y = 0; y < WORLD_CROP.height; y++) {
    for (let x = 0; x < WORLD_CROP.width; x++) {
      const index = (y * WORLD_CROP.width + x) * 4;

      const pixel = {
        r: imageData.data[index],

        g: imageData.data[index + 1],

        b: imageData.data[index + 2],
      };

      /*
                Äußerste zwei Pixel
                immer Meer.

                Dadurch verschwinden
                mögliche Reste des Rahmens.
            */

      const edge =
        x < 2 ||
        y < 2 ||
        x >= WORLD_CROP.width - 2 ||
        y >= WORLD_CROP.height - 2;

      const color = !edge && isLandPixel(pixel) ? land : water;

      imageData.data[index] = color.r;

      imageData.data[index + 1] = color.g;

      imageData.data[index + 2] = color.b;

      imageData.data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}

/* ======================================== */
/* TIERGEBIET AUS PNG                       */
/* ======================================== */

function createRangeMask(image) {
  const canvas = document.createElement("canvas");

  canvas.width = WORLD_CROP.width;

  canvas.height = WORLD_CROP.height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  context.drawImage(
    image,

    WORLD_CROP.x,
    WORLD_CROP.y,
    WORLD_CROP.width,
    WORLD_CROP.height,

    0,
    0,
    WORLD_CROP.width,
    WORLD_CROP.height,
  );

  const data = context.getImageData(
    0,
    0,

    WORLD_CROP.width,
    WORLD_CROP.height,
  ).data;

  const mask = new Uint8Array(WORLD_CROP.width * WORLD_CROP.height);

  for (let pixelIndex = 0, i = 0; i < data.length; i += 4, pixelIndex++) {
    mask[pixelIndex] = isRangePixel({
      r: data[i],

      g: data[i + 1],

      b: data[i + 2],
    })
      ? 1
      : 0;
  }

  return mask;
}

/* ======================================== */
/* GEMEINSAMER TIER-LAYER                   */
/* ======================================== */

function createCombinedOverlay(selectedTiere, masks) {
  const canvas = document.createElement("canvas");

  canvas.width = WORLD_CROP.width;

  canvas.height = WORLD_CROP.height;

  const context = canvas.getContext("2d");

  const output = context.createImageData(
    WORLD_CROP.width,

    WORLD_CROP.height,
  );

  const colors = selectedTiere.map((tier) => {
    return hexToRgb(tier.mapColor);
  });

  for (let y = 0; y < WORLD_CROP.height; y++) {
    for (let x = 0; x < WORLD_CROP.width; x++) {
      const mapIndex = y * WORLD_CROP.width + x;

      const hitIndexes = [];

      for (let tierIndex = 0; tierIndex < selectedTiere.length; tierIndex++) {
        const mask = masks.get(selectedTiere[tierIndex].id);

        if (mask?.[mapIndex]) {
          hitIndexes.push(tierIndex);
        }
      }

      if (!hitIndexes.length) {
        continue;
      }

      let color;

      /* ============================ */
      /* EIN TIER                     */
      /* ============================ */

      if (hitIndexes.length === 1) {
        color = colors[hitIndexes[0]];
      } else if (hitIndexes.length === 2) {

      /* ============================ */
      /* ZWEI TIERE                   */
      /* ============================ */
        const stripe = (x + y) % 12 < 6 ? 0 : 1;

        color = colors[hitIndexes[stripe]];
      } else {

      /* ============================ */
      /* DREI ODER MEHR               */
      /* ============================ */
        const diagonalA = (x + y) % 14 < 4;

        const diagonalB = (x - y + 10000) % 14 < 4;

        if (diagonalA) {
          color = colors[hitIndexes[0]];
        } else if (diagonalB) {
          color = colors[hitIndexes[1]];
        } else {
          color = colors[hitIndexes[2]];
        }
      }

      const outputIndex = mapIndex * 4;

      output.data[outputIndex] = color.r;

      output.data[outputIndex + 1] = color.g;

      output.data[outputIndex + 2] = color.b;

      output.data[outputIndex + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);

  return canvas.toDataURL("image/png");
}

/* ======================================== */
/* PINK ERKENNEN                            */
/* ======================================== */

function isRangePixel(pixel) {
  return (
    pixel.r > 215 && pixel.g < 150 && pixel.b < 190 && pixel.r - pixel.g > 70
  );
}

/* ======================================== */
/* LAND ERKENNEN                            */
/* ======================================== */

function isLandPixel(pixel) {
  const dr = pixel.r - SOURCE_LAND.r;

  const dg = pixel.g - SOURCE_LAND.g;

  const db = pixel.b - SOURCE_LAND.b;

  return Math.sqrt(dr * dr + dg * dg + db * db) < 85;
}

/* ======================================== */
/* STATUS                                   */
/* ======================================== */

function setStatusText(status, type, count = 0) {
  if (!status) {
    return;
  }

  const language = getLanguage();

  const text = {
    referenceError: {
      de: "Referenz-Weltkarte konnte nicht geladen werden",

      en: "Reference world map could not be loaded",

      fr: "La carte du monde de référence n’a pas pu être chargée",
    },

    none: {
      de: "Keine Tierkarten gefunden",

      en: "No animal maps found",

      fr: "Aucune carte animale trouvée",
    },

    empty: {
      de: "Keine Tierkarte ausgewählt",

      en: "No animal map selected",

      fr: "Aucune carte animale sélectionnée",
    },

    ready: {
      de: `${count} Tierkarten aktiv`,

      en: `${count} animal maps active`,

      fr: `${count} cartes animales actives`,
    },
  };

  status.textContent = text[type]?.[language] ?? text[type]?.de ?? "";
}

/* ======================================== */
/* BILD LADEN                               */
/* ======================================== */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error(`Bild nicht gefunden: ${src}`));
    };

    image.src = resolvePath(src);
  });
}

/* ======================================== */
/* PFAD AUFLÖSEN                            */
/* ======================================== */

function resolvePath(path) {
  return new URL(
    String(path).replace(/^\/+/, ""),

    document.baseURI,
  ).href;
}

/* ======================================== */
/* MAUS → SVG KOORDINATE                    */
/* ======================================== */

function clientToSvgPoint(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();

  const viewBox = svg.viewBox.baseVal;

  return {
    x: ((clientX - rect.left) / rect.width) * viewBox.width + viewBox.x,

    y: ((clientY - rect.top) / rect.height) * viewBox.height + viewBox.y,
  };
}

/* ======================================== */
/* BEGRENZEN                                */
/* ======================================== */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/* ======================================== */
/* HEX → RGB                                */
/* ======================================== */

function hexToRgb(hex) {
  const cleaned = hex.replace("#", "");

  return {
    r: parseInt(cleaned.slice(0, 2), 16),

    g: parseInt(cleaned.slice(2, 4), 16),

    b: parseInt(cleaned.slice(4, 6), 16),
  };
}
