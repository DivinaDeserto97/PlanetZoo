import { getLanguage } from "../../features/language.js";

import { getTierName } from "./tierListe.js";

/* ======================================== */
/* ORIGINALFARBEN DER TIER-KARTEN           */
/* ======================================== */

const SOURCE_BACKGROUND = {
  r: 16,
  g: 36,
  b: 43,
};

const SOURCE_LAND = {
  r: 80,
  g: 107,
  b: 123,
};

/*
    In deinen Kartenbildern:

    Pink =
    RGB 255 / 74 / 117
*/

const SOURCE_RANGE = {
  r: 255,
  g: 74,
  b: 117,
};

/* ======================================== */
/* OBERER WELTKARTENBEREICH                 */
/* ======================================== */

/*
    Deine Dateien sind 784 × 744.

    Die komplette Weltkarte befindet
    sich oben.

    Der vergrösserte Detailbereich
    darunter wird absichtlich ignoriert.
*/

const WORLD_SOURCE_HEIGHT = 290;

/* ======================================== */
/* RENDERER INITIALISIEREN                  */
/* ======================================== */

export async function initMapRenderer(tiere, signal) {
  const canvas = document.querySelector("[data-map-canvas]");

  const status = document.querySelector("[data-map-status]");

  const hoverInfo = document.querySelector("[data-map-hover-info]");

  if (!canvas) {
    return {
      render() {},
      updateLanguage() {},
    };
  }

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  /* ==================================== */
  /* BILDER LADEN                         */
  /* ==================================== */

  const mapData = new Map();

  for (const tier of tiere) {
    if (!tier.kartenPfad) {
      continue;
    }

    try {
      const image = await loadImage(tier.kartenPfad);

      const data = readMapImage(image);

      mapData.set(tier.id, data);
    } catch (error) {
      console.error(
        `Karte konnte nicht geladen werden: ${tier.kartenPfad}`,
        error,
      );
    }
  }

  /* ==================================== */
  /* ERSTES BILD ALS REFERENZ             */
  /* ==================================== */

  const firstMap = mapData.values().next().value;

  if (!firstMap) {
    setStatus("none");

    return {
      render() {},
      updateLanguage() {},
    };
  }

  const crop = detectWorldBounds(firstMap);

  /*
        Seitenverhältnis
        der gemeinsamen Weltkarte.
    */
  const outputWidth = 1200;

  const outputHeight = Math.round(outputWidth * (crop.height / crop.width));

  canvas.width = outputWidth;

  canvas.height = outputHeight;

  let currentSelected = new Set();

  /* ==================================== */
  /* RENDERN                              */
  /* ==================================== */

  function render(selected) {
    currentSelected = new Set(selected);

    const selectedTiere = tiere.filter((tier) => {
      return currentSelected.has(tier.id) && mapData.has(tier.id);
    });

    drawCombinedMap(context, canvas, crop, firstMap, selectedTiere, mapData);

    setStatus(selectedTiere.length ? "ready" : "empty", selectedTiere.length);
  }

  /* ==================================== */
  /* HOVER                                */
  /* ==================================== */

  canvas.addEventListener(
    "mousemove",
    (event) => {
      const rect = canvas.getBoundingClientRect();

      const x = Math.floor(
        ((event.clientX - rect.left) * canvas.width) / rect.width,
      );

      const y = Math.floor(
        ((event.clientY - rect.top) * canvas.height) / rect.height,
      );

      const sourceX = crop.x + Math.floor((x / canvas.width) * crop.width);

      const sourceY = crop.y + Math.floor((y / canvas.height) * crop.height);

      const hits = tiere.filter((tier) => {
        if (!currentSelected.has(tier.id)) {
          return false;
        }

        const map = mapData.get(tier.id);

        if (!map) {
          return false;
        }

        return isRangePixelAt(map, sourceX, sourceY);
      });

      updateHover(hits);
    },
    {
      signal,
    },
  );

  canvas.addEventListener(
    "mouseleave",
    () => {
      updateHover([]);
    },
    {
      signal,
    },
  );

  /* ==================================== */
  /* STATUS                               */
  /* ==================================== */

  function setStatus(type, count = 0) {
    if (!status) {
      return;
    }

    const language = getLanguage();

    const text = {
      none: {
        de: "Keine Karten gefunden",
        en: "No maps found",
        fr: "Aucune carte trouvée",
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

  /* ==================================== */
  /* HOVER TEXT                           */
  /* ==================================== */

  function updateHover(hits) {
    if (!hoverInfo) {
      return;
    }

    const language = getLanguage();

    if (!hits.length) {
      const empty = {
        de: "Fahre mit der Maus über die Karte.",

        en: "Move the mouse over the map.",

        fr: "Passez la souris sur la carte.",
      };

      hoverInfo.textContent = empty[language] ?? empty.de;

      return;
    }

    hoverInfo.textContent = hits
      .map((tier) => getTierName(tier, language))
      .join(" · ");
  }

  /* ==================================== */
  /* SPRACHE                              */
  /* ==================================== */

  function updateLanguage() {
    render(currentSelected);
  }

  return {
    render,
    updateLanguage,
  };
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

    image.onerror = reject;

    image.src = src;
  });
}

/* ======================================== */
/* PNG IN PIXELDATEN UMWANDELN              */
/* ======================================== */

function readMapImage(image) {
  const canvas = document.createElement("canvas");

  canvas.width = image.width;

  canvas.height = image.height;

  const context = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  context.drawImage(image, 0, 0);

  const imageData = context.getImageData(0, 0, image.width, image.height);

  return {
    width: image.width,

    height: image.height,

    pixels: imageData.data,
  };
}

/* ======================================== */
/* WELTKARTEN-GRENZEN FINDEN                */
/* ======================================== */

function detectWorldBounds(map) {
  let minX = map.width;

  let maxX = 0;

  let minY = WORLD_SOURCE_HEIGHT;

  let maxY = 0;

  for (let y = 0; y < WORLD_SOURCE_HEIGHT; y++) {
    for (let x = 0; x < map.width; x++) {
      const pixel = getPixel(map, x, y);

      if (isLandPixel(pixel) || isRangePixel(pixel)) {
        minX = Math.min(minX, x);

        maxX = Math.max(maxX, x);

        minY = Math.min(minY, y);

        maxY = Math.max(maxY, y);
      }
    }
  }

  const padding = 12;

  return {
    x: Math.max(0, minX - padding),

    y: Math.max(0, minY - padding),

    width: Math.min(map.width, maxX - minX + 1 + padding * 2),

    height: Math.min(WORLD_SOURCE_HEIGHT, maxY - minY + 1 + padding * 2),
  };
}

/* ======================================== */
/* GEMEINSAME KARTE ZEICHNEN                */
/* ======================================== */

function drawCombinedMap(
  context,
  canvas,
  crop,
  baseMap,
  selectedTiere,
  mapData,
) {
  /*
        Saubere Landmaske erstellen.

        Dabei werden dünne Linien wie:
        - Zoom-Rahmen
        - Verbindungslinien

        herausgefiltert.
    */
  const landMask = createCleanLandMask(baseMap);

  const output = context.createImageData(canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const sourceX = crop.x + Math.floor((x / canvas.width) * crop.width);

      const sourceY = crop.y + Math.floor((y / canvas.height) * crop.height);

      /* ================================= */
      /* WELCHE TIERE SIND HIER?           */
      /* ================================= */

      const hits = selectedTiere.filter((tier) => {
        const map = mapData.get(tier.id);

        return isRangePixelAt(map, sourceX, sourceY);
      });

      let color;

      /* ================================= */
      /* VERBREITUNG                       */
      /* ================================= */

      if (hits.length === 1) {
        color = hexToRgb(hits[0].mapColor);
      } else if (hits.length === 2) {
        /* ================================= */
        /* 2 TIERE                           */
        /* ================================= */
        const stripe = (x + y) % 14;

        color = hexToRgb(stripe < 7 ? hits[0].mapColor : hits[1].mapColor);
      } else if (hits.length >= 3) {
        /* ================================= */
        /* 3 ODER MEHR                       */
        /* ================================= */
        const diagonalA = (x + y) % 16 < 4;

        const diagonalB = (x - y + 5000) % 16 < 4;

        if (diagonalA) {
          color = hexToRgb(hits[0].mapColor);
        } else if (diagonalB) {
          color = hexToRgb(hits[1].mapColor);
        } else {
          color = hexToRgb(hits[2].mapColor);
        }
      } else if (
        /* ================================= */
        /* NORMALES LAND                     */
        /* ================================= */
        isCleanLand(landMask, baseMap.width, baseMap.height, sourceX, sourceY)
      ) {
        color = hexToRgb("#506b7b");
      } else {
        /* ================================= */
        /* MEER                              */
        /* ================================= */
        color = hexToRgb("#10242b");
      }

      setOutputPixel(output, canvas.width, x, y, color);
    }
  }

  context.putImageData(output, 0, 0);
}

/* ======================================== */
/* PINKER VERBREITUNGSPIXEL                 */
/* ======================================== */

function isRangePixel(pixel) {
  return pixel.r > 220 && pixel.g < 130 && pixel.b < 170;
}

/* ======================================== */
/* LANDPIXEL                                */
/* ======================================== */

function isLandPixel(pixel) {
  const distance = Math.sqrt(
    (pixel.r - SOURCE_LAND.r) ** 2 +
      (pixel.g - SOURCE_LAND.g) ** 2 +
      (pixel.b - SOURCE_LAND.b) ** 2,
  );

  return distance < 70;
}

/* ======================================== */
/* PIXEL IST VERBREITUNG                    */
/* ======================================== */

function isRangePixelAt(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return false;
  }

  return isRangePixel(getPixel(map, x, y));
}

/* ======================================== */
/* PIXEL LESEN                              */
/* ======================================== */

function getPixel(map, x, y) {
  const index = (y * map.width + x) * 4;

  return {
    r: map.pixels[index],

    g: map.pixels[index + 1],

    b: map.pixels[index + 2],

    a: map.pixels[index + 3],
  };
}

/* ======================================== */
/* OUTPUT PIXEL                             */
/* ======================================== */

function setOutputPixel(imageData, width, x, y, color) {
  const index = (y * width + x) * 4;

  imageData.data[index] = color.r;

  imageData.data[index + 1] = color.g;

  imageData.data[index + 2] = color.b;

  imageData.data[index + 3] = 255;
}

/* ======================================== */
/* SAUBERE LANDMASKE                        */
/* ======================================== */

function createCleanLandMask(map) {
  const width = map.width;

  const height = WORLD_SOURCE_HEIGHT;

  const original = new Uint8Array(width * height);

  /* ==================================== */
  /* LAND ERKENNEN                        */
  /* ==================================== */

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = getPixel(map, x, y);

      /*
                Pink gehört ebenfalls
                zur Landmasse.

                Sonst würden Länder unter
                einer Verbreitungsfläche
                verschwinden.
            */
      if (isLandPixel(pixel) || isRangePixel(pixel)) {
        original[y * width + x] = 1;
      }
    }
  }

  /* ==================================== */
  /* DÜNNE LINIEN ENTFERNEN               */
  /* ==================================== */

  const cleaned = new Uint8Array(original);

  /*
        Dünne Linien besitzen nur wenige
        Nachbarpixel.

        Große Landflächen besitzen viele.
    */
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const index = y * width + x;

      if (!original[index]) {
        continue;
      }

      let neighbours = 0;

      /*
                5 × 5 Bereich untersuchen.
            */
      for (let offsetY = -2; offsetY <= 2; offsetY++) {
        for (let offsetX = -2; offsetX <= 2; offsetX++) {
          if (original[(y + offsetY) * width + (x + offsetX)]) {
            neighbours++;
          }
        }
      }

      /*
                Wenige Nachbarn =
                dünne Linie / Rahmen.

                Weg damit.
            */
      if (neighbours < 9) {
        cleaned[index] = 0;
      }
    }
  }

  return cleaned;
}

/* ======================================== */
/* LAND AUS MASKE ABFRAGEN                  */
/* ======================================== */

function isCleanLand(mask, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return false;
  }

  return mask[y * width + x] === 1;
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
