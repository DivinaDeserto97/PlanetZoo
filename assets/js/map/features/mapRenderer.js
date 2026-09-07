import {
  getLanguage,
} from "../../features/language.js";

import {
  getTierName,
} from "./tierListe.js";


/* ======================================== */
/* REFERENZ-WELTKARTE                       */
/* ======================================== */

const WORLD_REFERENCE_PATH =
  "./assets/daten/Weltkarte/Weltkartenreferenz_map.png";


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


const BASE_WATER =
  "#10242b";

const BASE_LAND =
  "#506b7b";


/* ======================================== */
/* ZOOM                                     */
/* ======================================== */

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 1.18;


/* ======================================== */
/* RENDERER                                 */
/* ======================================== */

export async function initMapRenderer(
  tiere,
  signal,
) {
  const svg =
    document.querySelector(
      "[data-map-svg]",
    );

  const viewport =
    document.querySelector(
      "[data-map-viewport]",
    );

  const worldTilesGroup =
    document.querySelector(
      "[data-map-world-tiles]",
    );

  const rangeTilesGroup =
    document.querySelector(
      "[data-map-range-tiles]",
    );

  const hoverMarkersGroup =
    document.querySelector(
      "[data-map-hover-markers]",
    );

  const selectedMarkersGroup =
    document.querySelector(
      "[data-map-selected-markers]",
    );

  const status =
    document.querySelector(
      "[data-map-status]",
    );

  const hoverInfo =
    document.querySelector(
      "[data-map-hover-info]",
    );

  const selectedInfo =
    document.querySelector(
      "[data-map-selected-info]",
    );


  if (
    !svg ||
    !viewport ||
    !worldTilesGroup ||
    !rangeTilesGroup
  ) {
    console.error(
      "SVG-Kartenelemente wurden nicht gefunden.",
    );

    return createEmptyRenderer();
  }


  /* ==================================== */
  /* WELTKARTE LADEN                     */
  /* ==================================== */

  let referenceImage;


  try {
    referenceImage =
      await loadImage(
        WORLD_REFERENCE_PATH,
      );
  }

  catch (error) {
    console.error(
      `Referenz-Weltkarte konnte nicht geladen werden: ${WORLD_REFERENCE_PATH}`,
      error,
    );

    setStatusText(
      status,
      "referenceError",
    );

    return createEmptyRenderer();
  }


  const baseDataUrl =
    createCleanBaseMap(
      referenceImage,
    );


  createTiledImages(
    worldTilesGroup,
    baseDataUrl,
  );


  const rangeTiles =
    createTiledImages(
      rangeTilesGroup,
      transparentMapDataUrl(),
    );


  /* ==================================== */
  /* TIER-MASKEN                         */
  /* ==================================== */

  const masks =
    new Map();

  const colors =
    new Map();

  let colorIndex =
    0;


  for (const tier of tiere) {
    /*
        PNG ist absichtlich die Standard-
        und Quelldatei für die Maske.

        SVG ist optional und wird für die
        Kartenlogik nicht vorausgesetzt.
    */

    if (!tier.kartenPfad) {
      continue;
    }


    try {
      const image =
        await loadImage(
          tier.kartenPfad,
        );

      const mask =
        createRangeMask(
          image,
        );


      masks.set(
        tier.id,
        mask,
      );


      colors.set(
        tier.id,
        createMapColor(
          colorIndex,
        ),
      );


      colorIndex++;
    }

    catch (error) {
      console.error(
        `Tierkarte konnte nicht geladen werden: ${tier.kartenPfad}`,
        error,
      );
    }
  }


  let currentSelected =
    new Set();

  let hoverPoint =
    null;

  let selectedPoint =
    null;


  /* ==================================== */
  /* ZOOM / PAN                          */
  /* ==================================== */

  let zoom =
    1;

  let panX =
    0;

  let panY =
    0;

  let dragging =
    false;

  let lastPointer =
    null;


  function normalisierePan() {
    const width =
      WORLD_CROP.width *
      zoom;

    const height =
      WORLD_CROP.height *
      zoom;


    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }


    panX =
      modulo(
        panX,
        width,
      ) -
      width;


    /*
        Waagerecht wiederholt sich die Welt
        normal nach 1 Kartenbreite.

        Senkrecht wird jede zweite Welt
        gespiegelt. Darum ist der vertikale
        Wiederholungszyklus 2 Kartenhöhen.
    */
    panY =
      modulo(
        panY,
        height * 2,
      ) -
      height * 2;
  }


  function applyTransform() {
    viewport.setAttribute(
      "transform",
      `translate(${panX} ${panY}) scale(${zoom})`,
    );


    updateMarkers();
  }


  function resetView() {
    zoom =
      1;

    panX =
      0;

    panY =
      0;

    normalisierePan();
    applyTransform();
  }


  /* ==================================== */
  /* MAUSRAD ZOOM                        */
  /* ==================================== */

  svg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();


      const mouse =
        clientToSvgPoint(
          svg,
          event.clientX,
          event.clientY,
        );


      const oldZoom =
        zoom;


      const nextZoom =
        clamp(
          event.deltaY < 0
            ? oldZoom *
              ZOOM_FACTOR
            : oldZoom /
              ZOOM_FACTOR,

          MIN_ZOOM,
          MAX_ZOOM,
        );


      if (
        nextZoom ===
        oldZoom
      ) {
        return;
      }


      const worldX =
        (mouse.x - panX) /
        oldZoom;

      const worldY =
        (mouse.y - panY) /
        oldZoom;


      zoom =
        nextZoom;


      panX =
        mouse.x -
        worldX *
        zoom;

      panY =
        mouse.y -
        worldY *
        zoom;


      normalisierePan();
      applyTransform();


      updateHoverFromSvgPoint(
        mouse,
      );
    },
    {
      passive: false,
      signal,
    },
  );


  /* ==================================== */
  /* MITTLERE MAUSTASTE = VERSCHIEBEN    */
  /* ==================================== */

  svg.addEventListener(
    "pointerdown",
    (event) => {
      /* ============================== */
      /* RECHTSKLICK = PUNKT SETZEN     */
      /* ============================== */

      if (
        event.button === 0
      ) {
        event.preventDefault();


        const point =
          clientToSvgPoint(
            svg,
            event.clientX,
            event.clientY,
          );


        /*
            Es existiert absichtlich immer
            nur EIN fixer Punkt.

            Jeder neue Rechtsklick ersetzt
            den vorherigen Punkt.
        */
        selectedPoint =
          svgPointToWorldPoint(
            point,
          );


        updateMarkers();


        renderPointInfo(
          selectedPoint,
          selectedInfo,
          "selected",
        );


        return;
      }


      /* ============================== */
      /* MITTLERE MAUSTASTE = PAN       */
      /* ============================== */

      if (
        event.button !== 1
      ) {
        return;
      }


      event.preventDefault();


      dragging =
        true;

      lastPointer =
        clientToSvgPoint(
          svg,
          event.clientX,
          event.clientY,
        );


      svg.classList.add(
        "is-dragging",
      );


      svg.setPointerCapture(
        event.pointerId,
      );
    },
    {
      signal,
    },
  );


  svg.addEventListener(
    "pointermove",
    (event) => {
      const pointer =
        clientToSvgPoint(
          svg,
          event.clientX,
          event.clientY,
        );


      if (
        dragging &&
        lastPointer
      ) {
        panX +=
          pointer.x -
          lastPointer.x;

        panY +=
          pointer.y -
          lastPointer.y;


        lastPointer =
          pointer;


        normalisierePan();
        applyTransform();

        return;
      }


      updateHoverFromSvgPoint(
        pointer,
      );
    },
    {
      signal,
    },
  );


  function endDrag(
    event,
  ) {
    if (!dragging) {
      return;
    }


    dragging =
      false;

    lastPointer =
      null;


    svg.classList.remove(
      "is-dragging",
    );


    if (
      svg.hasPointerCapture(
        event.pointerId,
      )
    ) {
      svg.releasePointerCapture(
        event.pointerId,
      );
    }
  }


  svg.addEventListener(
    "pointerup",
    endDrag,
    {
      signal,
    },
  );


  svg.addEventListener(
    "pointercancel",
    endDrag,
    {
      signal,
    },
  );


  svg.addEventListener(
    "auxclick",
    (event) => {
      if (
        event.button === 1
      ) {
        event.preventDefault();
      }
    },
    {
      signal,
    },
  );


  /* ==================================== */
  /* BROWSER-KONTEXTMENÜ UNTERDRÜCKEN     */
  /* ==================================== */

  svg.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
    },
    {
      signal,
    },
  );


  svg.addEventListener(
    "pointerleave",
    () => {
      if (dragging) {
        return;
      }


      hoverPoint =
        null;

      updateMarkers();


      renderPointInfo(
        null,
        hoverInfo,
        "hover",
      );
    },
    {
      signal,
    },
  );


  document
    .querySelector(
      "[data-map-reset-view]",
    )
    ?.addEventListener(
      "click",
      resetView,
      {
        signal,
      },
    );


  /* ==================================== */
  /* RENDERN                             */
  /* ==================================== */

  function render(
    selected,
  ) {
    currentSelected =
      new Set(
        selected,
      );


    const selectedTiere =
      tiere.filter(
        (tier) =>
          currentSelected.has(
            tier.id,
          ) &&
          masks.has(
            tier.id,
          ),
      );


    const overlayDataUrl =
      createCombinedOverlay(
        selectedTiere,
        masks,
        colors,
      );


    rangeTiles.forEach(
      (image) => {
        image.setAttribute(
          "href",
          overlayDataUrl,
        );
      },
    );


    setStatusText(
      status,
      selectedTiere.length
        ? "ready"
        : "empty",
      selectedTiere.length,
    );


    renderPointInfo(
      selectedPoint,
      selectedInfo,
      "selected",
    );


    renderPointInfo(
      hoverPoint,
      hoverInfo,
      "hover",
    );
  }


  /* ==================================== */
  /* PUNKTE / HITTEST                    */
  /* ==================================== */

  function updateHoverFromSvgPoint(
    point,
  ) {
    if (dragging) {
      return;
    }


    hoverPoint =
      svgPointToWorldPoint(
        point,
      );


    updateMarkers();


    renderPointInfo(
      hoverPoint,
      hoverInfo,
      "hover",
    );
  }


  function svgPointToWorldPoint(
    point,
  ) {
    const rawX =
      (point.x - panX) /
      zoom;

    const rawY =
      (point.y - panY) /
      zoom;


    return {
      x:
        modulo(
          rawX,
          WORLD_CROP.width,
        ),

      /*
          Senkrechte Wiederholung ist
          gespiegelt:

          Nord -> Spiegel-Nord
          Süd  -> Spiegel-Süd

          Dadurch springt man am Pol
          nicht direkt auf die andere
          Seite der Weltkarte.
      */
      y:
        mirrorModulo(
          rawY,
          WORLD_CROP.height,
        ),
    };
  }


  function getHitsAtPoint(
    point,
  ) {
    if (!point) {
      return [];
    }


    const x =
      clamp(
        Math.floor(
          point.x,
        ),
        0,
        WORLD_CROP.width -
          1,
      );

    const y =
      clamp(
        Math.floor(
          point.y,
        ),
        0,
        WORLD_CROP.height -
          1,
      );


    const index =
      y *
      WORLD_CROP.width +
      x;


    return tiere.filter(
      (tier) => {
        if (
          !currentSelected.has(
            tier.id,
          )
        ) {
          return false;
        }


        const mask =
          masks.get(
            tier.id,
          );


        return Boolean(
          mask?.[index],
        );
      },
    );
  }


  function renderPointInfo(
    point,
    container,
    mode,
  ) {
    if (!container) {
      return;
    }


    container.replaceChildren();


    if (!point) {
      const placeholder =
        document.createElement(
          "span",
        );

      placeholder.className =
        "map-point-empty";

      placeholder.textContent =
        getPointPlaceholder(
          mode,
        );


      container.appendChild(
        placeholder,
      );

      return;
    }


    const hits =
      getHitsAtPoint(
        point,
      );


    if (!hits.length) {
      const empty =
        document.createElement(
          "span",
        );

      empty.className =
        "map-point-empty";

      empty.textContent =
        getNoAnimalsText();


      container.appendChild(
        empty,
      );

      return;
    }


    const list =
      document.createElement(
        "div",
      );

    list.className =
      "map-point-list";


    hits.forEach(
      (tier) => {
        const item =
          document.createElement(
            "span",
          );

        item.className =
          "map-point-animal";


        const color =
          document.createElement(
            "span",
          );

        color.className =
          "map-point-animal__color";

        color.style.backgroundColor =
          colors.get(
            tier.id,
          );


        const name =
          document.createElement(
            "span",
          );

        name.textContent =
          getTierName(
            tier,
          );


        item.append(
          color,
          name,
        );


        list.appendChild(
          item,
        );
      },
    );


    container.appendChild(
      list,
    );
  }


  function updateMarkers() {
    renderMarkerCopies(
      hoverMarkersGroup,
      hoverPoint,
      "hover",
      zoom,
    );


    renderMarkerCopies(
      selectedMarkersGroup,
      selectedPoint,
      "selected",
      zoom,
    );
  }


  function updateLanguage() {
    setStatusText(
      status,
      currentSelected.size
        ? "ready"
        : "empty",
      [...currentSelected].filter(
        (tierId) =>
          masks.has(
            tierId,
          ),
      ).length,
    );


    renderPointInfo(
      selectedPoint,
      selectedInfo,
      "selected",
    );


    renderPointInfo(
      hoverPoint,
      hoverInfo,
      "hover",
    );
  }


  resetView();


  setStatusText(
    status,
    masks.size
      ? "empty"
      : "none",
  );


  return {
    render,
    updateLanguage,
    resetView,

    hasMap(
      tierId,
    ) {
      return masks.has(
        tierId,
      );
    },

    getMapColor(
      tierId,
    ) {
      return (
        colors.get(
          tierId,
        ) ??
        null
      );
    },
  };
}


/* ======================================== */
/* ENDLOSE WELTKARTE                        */
/* ======================================== */

function createTiledImages(
  group,
  href,
) {
  group.replaceChildren();

  const result =
    [];


  /*
      Waagerecht:
      - normale Wiederholung

      Senkrecht:
      - jede zweite Zeile gespiegelt
      - dadurch treffen Nordpol auf Nordpol
        und Südpol auf Südpol

      Fünf Zeilen sind nötig, weil der
      senkrechte Wiederholungszyklus durch
      die Spiegelung zwei Kartenhöhen hat.
  */
  for (
    let tileY = -2;
    tileY <= 2;
    tileY++
  ) {
    for (
      let tileX = -1;
      tileX <= 1;
      tileX++
    ) {
      const image =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "image",
        );


      image.setAttribute(
        "x",
        "0",
      );

      image.setAttribute(
        "y",
        "0",
      );

      image.setAttribute(
        "width",
        String(
          WORLD_CROP.width,
        ),
      );

      image.setAttribute(
        "height",
        String(
          WORLD_CROP.height,
        ),
      );

      image.setAttribute(
        "preserveAspectRatio",
        "none",
      );

      image.setAttribute(
        "href",
        href,
      );


      const translateX =
        tileX *
        WORLD_CROP.width;


      const mirrored =
        Math.abs(
          tileY,
        ) %
          2 ===
        1;


      if (mirrored) {
        /*
            Gespiegelte Zeile:

            tileY = -1
            -> -H ... 0

            tileY = 1
            -> H ... 2H
        */
        const translateY =
          (
            tileY +
            1
          ) *
          WORLD_CROP.height;


        image.setAttribute(
          "transform",
          `translate(${translateX} ${translateY}) scale(1 -1)`,
        );
      }

      else {
        const translateY =
          tileY *
          WORLD_CROP.height;


        image.setAttribute(
          "transform",
          `translate(${translateX} ${translateY})`,
        );
      }


      group.appendChild(
        image,
      );


      result.push(
        image,
      );
    }
  }


  return result;
}


/* ======================================== */
/* MARKER-KOPIEN                            */
/* ======================================== */

function renderMarkerCopies(
  group,
  point,
  type,
  zoom,
) {
  if (!group) {
    return;
  }


  group.replaceChildren();


  if (!point) {
    return;
  }


  for (
    let tileY = -2;
    tileY <= 2;
    tileY++
  ) {
    for (
      let tileX = -1;
      tileX <= 1;
      tileX++
    ) {
      const circle =
        document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );


      const mirrored =
        Math.abs(
          tileY,
        ) %
          2 ===
        1;


      const markerY =
        tileY *
          WORLD_CROP.height +
        (
          mirrored
            ? WORLD_CROP.height -
              point.y
            : point.y
        );


      circle.setAttribute(
        "cx",
        String(
          point.x +
          tileX *
          WORLD_CROP.width,
        ),
      );

      circle.setAttribute(
        "cy",
        String(
          markerY,
        ),
      );

      circle.setAttribute(
        "r",
        String(
          (
            type ===
            "selected"
              ? 5
              : 4
          ) /
          zoom,
        ),
      );

      circle.setAttribute(
        "stroke-width",
        String(
          2 /
          zoom,
        ),
      );


      group.appendChild(
        circle,
      );
    }
  }
}


/* ======================================== */
/* SAUBERE BASISKARTE                       */
/* ======================================== */

function createCleanBaseMap(
  image,
) {
  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    WORLD_CROP.width;

  canvas.height =
    WORLD_CROP.height;


  const context =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      },
    );


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


  const imageData =
    context.getImageData(
      0,
      0,
      WORLD_CROP.width,
      WORLD_CROP.height,
    );


  const land =
    hexToRgb(
      BASE_LAND,
    );

  const water =
    hexToRgb(
      BASE_WATER,
    );


  for (
    let y = 0;
    y < WORLD_CROP.height;
    y++
  ) {
    for (
      let x = 0;
      x < WORLD_CROP.width;
      x++
    ) {
      const index =
        (
          y *
          WORLD_CROP.width +
          x
        ) *
        4;


      const pixel = {
        r:
          imageData.data[
            index
          ],

        g:
          imageData.data[
            index + 1
          ],

        b:
          imageData.data[
            index + 2
          ],
      };


      const edge =
        x < 2 ||
        y < 2 ||
        x >=
          WORLD_CROP.width -
            2 ||
        y >=
          WORLD_CROP.height -
            2;


      const color =
        !edge &&
        isLandPixel(
          pixel,
        )
          ? land
          : water;


      imageData.data[
        index
      ] =
        color.r;

      imageData.data[
        index + 1
      ] =
        color.g;

      imageData.data[
        index + 2
      ] =
        color.b;

      imageData.data[
        index + 3
      ] =
        255;
    }
  }


  context.putImageData(
    imageData,
    0,
    0,
  );


  return canvas.toDataURL(
    "image/png",
  );
}


/* ======================================== */
/* TIERGEBIET AUS PNG                       */
/* ======================================== */

function createRangeMask(
  image,
) {
  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    WORLD_CROP.width;

  canvas.height =
    WORLD_CROP.height;


  const context =
    canvas.getContext(
      "2d",
      {
        willReadFrequently:
          true,
      },
    );


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


  const data =
    context.getImageData(
      0,
      0,
      WORLD_CROP.width,
      WORLD_CROP.height,
    ).data;


  const mask =
    new Uint8Array(
      WORLD_CROP.width *
      WORLD_CROP.height,
    );


  for (
    let pixelIndex = 0,
      i = 0;
    i < data.length;
    i += 4,
      pixelIndex++
  ) {
    mask[
      pixelIndex
    ] =
      isRangePixel({
        r:
          data[i],

        g:
          data[
            i + 1
          ],

        b:
          data[
            i + 2
          ],
      })
        ? 1
        : 0;
  }


  return mask;
}


/* ======================================== */
/* GEMEINSAMER TIER-LAYER                   */
/* ======================================== */

function createCombinedOverlay(
  selectedTiere,
  masks,
  colors,
) {
  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    WORLD_CROP.width;

  canvas.height =
    WORLD_CROP.height;


  const context =
    canvas.getContext(
      "2d",
    );


  const output =
    context.createImageData(
      WORLD_CROP.width,
      WORLD_CROP.height,
    );


  const rgbColors =
    selectedTiere.map(
      (tier) =>
        hexToRgb(
          colors.get(
            tier.id,
          ),
        ),
    );


  for (
    let y = 0;
    y < WORLD_CROP.height;
    y++
  ) {
    for (
      let x = 0;
      x < WORLD_CROP.width;
      x++
    ) {
      const mapIndex =
        y *
        WORLD_CROP.width +
        x;


      const hitIndexes =
        [];


      for (
        let tierIndex = 0;
        tierIndex <
        selectedTiere.length;
        tierIndex++
      ) {
        const mask =
          masks.get(
            selectedTiere[
              tierIndex
            ].id,
          );


        if (
          mask?.[
            mapIndex
          ]
        ) {
          hitIndexes.push(
            tierIndex,
          );
        }
      }


      if (
        !hitIndexes.length
      ) {
        continue;
      }


      let color;


      if (
        hitIndexes.length ===
        1
      ) {
        color =
          rgbColors[
            hitIndexes[0]
          ];
      }

      else {
        /*
            Beliebig viele Tiere:
            diagonale Streifen wechseln
            durch alle beteiligten Farben.
        */

        const stripeWidth =
          4;

        const stripeIndex =
          Math.floor(
            modulo(
              x + y,
              stripeWidth *
                hitIndexes.length,
            ) /
              stripeWidth,
          );


        color =
          rgbColors[
            hitIndexes[
              stripeIndex
            ]
          ];
      }


      const outputIndex =
        mapIndex *
        4;


      output.data[
        outputIndex
      ] =
        color.r;

      output.data[
        outputIndex + 1
      ] =
        color.g;

      output.data[
        outputIndex + 2
      ] =
        color.b;

      output.data[
        outputIndex + 3
      ] =
        255;
    }
  }


  context.putImageData(
    output,
    0,
    0,
  );


  return canvas.toDataURL(
    "image/png",
  );
}


/* ======================================== */
/* PINK ERKENNEN                            */
/* ======================================== */

function isRangePixel(
  pixel,
) {
  return (
    pixel.r >
      215 &&
    pixel.g <
      150 &&
    pixel.b <
      190 &&
    pixel.r -
      pixel.g >
      70
  );
}


/* ======================================== */
/* LAND ERKENNEN                            */
/* ======================================== */

function isLandPixel(
  pixel,
) {
  const dr =
    pixel.r -
    SOURCE_LAND.r;

  const dg =
    pixel.g -
    SOURCE_LAND.g;

  const db =
    pixel.b -
    SOURCE_LAND.b;


  return (
    Math.sqrt(
      dr * dr +
      dg * dg +
      db * db,
    ) <
    85
  );
}


/* ======================================== */
/* UNBEGRENZTE TIERFARBEN                   */
/* ======================================== */

function createMapColor(
  index,
) {
  const hue =
    modulo(
      index *
        137.508 +
        197,
      360,
    );


  return hslToHex(
    hue,
    78,
    58,
  );
}


function hslToHex(
  h,
  s,
  l,
) {
  s /= 100;
  l /= 100;


  const c =
    (
      1 -
      Math.abs(
        2 * l -
        1,
      )
    ) *
    s;

  const x =
    c *
    (
      1 -
      Math.abs(
        (
          h /
          60
        ) %
          2 -
          1,
      )
    );

  const m =
    l -
    c /
      2;


  let r =
    0;

  let g =
    0;

  let b =
    0;


  if (
    h < 60
  ) {
    r = c;
    g = x;
  }

  else if (
    h < 120
  ) {
    r = x;
    g = c;
  }

  else if (
    h < 180
  ) {
    g = c;
    b = x;
  }

  else if (
    h < 240
  ) {
    g = x;
    b = c;
  }

  else if (
    h < 300
  ) {
    r = x;
    b = c;
  }

  else {
    r = c;
    b = x;
  }


  const toHex =
    (value) =>
      Math.round(
        (
          value +
          m
        ) *
          255,
      )
        .toString(
          16,
        )
        .padStart(
          2,
          "0",
        );


  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}


/* ======================================== */
/* STATUS                                   */
/* ======================================== */

function setStatusText(
  status,
  type,
  count = 0,
) {
  if (!status) {
    return;
  }


  const language =
    getLanguage();


  const texts = {
    referenceError: {
      de: "Weltkarte konnte nicht geladen werden.",
      en: "World map could not be loaded.",
      "en-US": "World map could not be loaded.",
      es: "No se pudo cargar el mapa mundial.",
      fr: "La carte du monde n’a pas pu être chargée.",
      it: "Impossibile caricare la mappa mondiale.",
      "pt-BR": "Não foi possível carregar o mapa-múndi.",
      ja: "世界地図を読み込めませんでした。",
      "zh-Hans": "无法加载世界地图。",
    },

    none: {
      de: "Keine lokale PNG-Tierkarte verfügbar.",
      en: "No local PNG animal map available.",
      "en-US": "No local PNG animal map available.",
      es: "No hay mapas PNG locales disponibles.",
      fr: "Aucune carte PNG locale disponible.",
      it: "Nessuna mappa PNG locale disponibile.",
      "pt-BR": "Nenhum mapa PNG local disponível.",
      ja: "ローカルPNG動物マップがありません。",
      "zh-Hans": "没有可用的本地PNG动物地图。",
    },

    empty: {
      de: "Keine Tierkarte ausgewählt.",
      en: "No animal map selected.",
      "en-US": "No animal map selected.",
      es: "No hay mapa de animal seleccionado.",
      fr: "Aucune carte animale sélectionnée.",
      it: "Nessuna mappa animale selezionata.",
      "pt-BR": "Nenhum mapa de animal selecionado.",
      ja: "動物マップが選択されていません。",
      "zh-Hans": "未选择动物地图。",
    },

    ready: {
      de: `${count} Tierkarte${count === 1 ? "" : "n"} aktiv`,
      en: `${count} animal map${count === 1 ? "" : "s"} active`,
      "en-US": `${count} animal map${count === 1 ? "" : "s"} active`,
      es: `${count} mapa${count === 1 ? "" : "s"} de animales activo${count === 1 ? "" : "s"}`,
      fr: `${count} carte${count === 1 ? "" : "s"} animale${count === 1 ? "" : "s"} active${count === 1 ? "" : "s"}`,
      it: `${count} mapp${count === 1 ? "a" : "e"} animale${count === 1 ? "" : "i"} attiv${count === 1 ? "a" : "e"}`,
      "pt-BR": `${count} mapa${count === 1 ? "" : "s"} de animais ativo${count === 1 ? "" : "s"}`,
      ja: `${count} 件の動物マップが有効`,
      "zh-Hans": `${count} 张动物地图已启用`,
    },
  };


  status.textContent =
    texts[type]?.[
      language
    ] ??
    texts[type]?.de ??
    "";
}


/* ======================================== */
/* PUNKT-TEXTE                              */
/* ======================================== */

function getPointPlaceholder(
  mode,
) {
  const language =
    getLanguage();


  const texts = {
    selected: {
      de: "Rechtsklick auf die Karte, um einen Punkt festzuhalten.",
      en: "Right-click the map to pin a point.",
      "en-US": "Right-click the map to pin a point.",
      es: "Haz clic derecho en el mapa para fijar un punto.",
      fr: "Faites un clic droit sur la carte pour fixer un point.",
      it: "Fai clic destro sulla mappa per fissare un punto.",
      "pt-BR": "Clique com o botão direito no mapa para fixar um ponto.",
      ja: "地図を右クリックして地点を固定します。",
      "zh-Hans": "右键单击地图以固定一个位置。",
    },

    hover: {
      de: "Fahre mit der Maus über die Karte.",
      en: "Move the mouse over the map.",
      "en-US": "Move the mouse over the map.",
      es: "Mueve el ratón sobre el mapa.",
      fr: "Passez la souris sur la carte.",
      it: "Sposta il mouse sulla mappa.",
      "pt-BR": "Mova o mouse sobre o mapa.",
      ja: "マップ上にマウスを移動してください。",
      "zh-Hans": "将鼠标移到地图上。",
    },
  };


  return (
    texts[mode]?.[
      language
    ] ??
    texts[mode]?.de ??
    ""
  );
}


function getNoAnimalsText() {
  const language =
    getLanguage();


  const texts = {
    de: "Keines der ausgewählten Tiere lebt an dieser Stelle.",
    en: "None of the selected animals occurs at this location.",
    "en-US": "None of the selected animals occurs at this location.",
    es: "Ninguno de los animales seleccionados vive en este lugar.",
    fr: "Aucun des animaux sélectionnés ne vit à cet endroit.",
    it: "Nessuno degli animali selezionati vive in questo punto.",
    "pt-BR": "Nenhum dos animais selecionados ocorre neste local.",
    ja: "選択した動物はこの地点には分布していません。",
    "zh-Hans": "所选动物均不分布在此位置。",
  };


  return (
    texts[
      language
    ] ??
    texts.de
  );
}


/* ======================================== */
/* HILFSFUNKTIONEN                          */
/* ======================================== */

function transparentMapDataUrl() {
  const canvas =
    document.createElement(
      "canvas",
    );

  canvas.width =
    WORLD_CROP.width;

  canvas.height =
    WORLD_CROP.height;


  return canvas.toDataURL(
    "image/png",
  );
}


function loadImage(
  src,
) {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const image =
        new Image();


      image.onload =
        () =>
          resolve(
            image,
          );


      image.onerror =
        () =>
          reject(
            new Error(
              `Bild konnte nicht geladen werden: ${src}`,
            ),
          );


      image.src =
        src;
    },
  );
}


function clientToSvgPoint(
  svg,
  clientX,
  clientY,
) {
  const point =
    svg.createSVGPoint();


  point.x =
    clientX;

  point.y =
    clientY;


  const matrix =
    svg
      .getScreenCTM()
      ?.inverse();


  if (!matrix) {
    return {
      x: 0,
      y: 0,
    };
  }


  const transformed =
    point.matrixTransform(
      matrix,
    );


  return {
    x:
      transformed.x,

    y:
      transformed.y,
  };
}


function clamp(
  value,
  min,
  max,
) {
  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}


function modulo(
  value,
  divisor,
) {
  return (
    (
      value %
      divisor
    ) +
    divisor
  ) %
  divisor;
}


/* ======================================== */
/* GESPIEGELTER MODULO                      */
/* ======================================== */

function mirrorModulo(
  value,
  size,
) {
  const period =
    size * 2;


  const position =
    modulo(
      value,
      period,
    );


  return (
    position <= size
      ? position
      : period -
        position
  );
}


function hexToRgb(
  hex,
) {
  const normalized =
    String(
      hex ??
      "#000000",
    )
      .replace(
        "#",
        "",
      )
      .trim();


  const value =
    Number.parseInt(
      normalized,
      16,
    );


  return {
    r:
      (
        value >>
        16
      ) &
      255,

    g:
      (
        value >>
        8
      ) &
      255,

    b:
      value &
      255,
  };
}


function createEmptyRenderer() {
  return {
    render() {},
    updateLanguage() {},
    resetView() {},
    hasMap() {
      return false;
    },
    getMapColor() {
      return null;
    },
  };
}
