import {
  getTierName,
  setText,
  ui,
} from "./ui.js";


let mapTransform = {
  scale: 1,
  x: 0,
  y: 0,
};

let mapDrag =
  null;


export function resetMapState() {
  mapDrag =
    null;

  resetMapTransform();
}


export function renderMap(
  tier,
) {
  const path =
    tier.kartenPfad;


  const image =
    document.querySelector(
      "[data-map-image]",
    );

  const fallback =
    document.querySelector(
      "[data-map-fallback]",
    );

  const open =
    document.querySelector(
      "[data-map-open]",
    );


  if (
    !image ||
    !fallback ||
    !open
  ) {
    return;
  }


  if (!path) {
    image.hidden =
      true;

    fallback.hidden =
      false;

    fallback.style.display =
      "grid";

    fallback.textContent =
      ui(
        "noMap",
      );

    open.disabled =
      true;

    return;
  }


  open.disabled =
    false;

  fallback.hidden =
    true;

  fallback.style.display =
    "none";

  image.hidden =
    false;

  image.src =
    path;

  image.alt =
    `${ui("map")} – ${getTierName(tier)}`;


  image.onerror =
    () => {
      image.hidden =
        true;

      fallback.hidden =
        false;

      fallback.style.display =
        "grid";

      fallback.textContent =
        ui(
          "noMap",
        );

      open.disabled =
        true;
    };
}


export function openMapDialog(
  tier,
) {
  const dialog =
    document.querySelector(
      "[data-map-dialog]",
    );

  const image =
    document.querySelector(
      "[data-map-dialog-image]",
    );


  if (
    !tier?.kartenPfad ||
    !dialog ||
    !image
  ) {
    return;
  }


  image.src =
    tier.kartenPfad;

  image.alt =
    `${ui("map")} – ${getTierName(tier)}`;


  setText(
    "[data-map-dialog-title]",
    `${ui("map")} – ${getTierName(tier)}`,
  );


  resetMapTransform();

  dialog.showModal();

  requestAnimationFrame(
    fitMapImage,
  );
}


function fitMapImage() {
  const viewport =
    document.querySelector(
      "[data-map-viewport]",
    );

  const image =
    document.querySelector(
      "[data-map-dialog-image]",
    );


  if (
    !viewport ||
    !image
  ) {
    return;
  }


  const update =
    () => {
      const naturalWidth =
        image.naturalWidth ||
        1;

      const naturalHeight =
        image.naturalHeight ||
        1;


      const fit =
        Math.min(
          viewport.clientWidth /
            naturalWidth,

          viewport.clientHeight /
            naturalHeight,
        ) *
        0.94;


      image.dataset.fitScale =
        String(
          fit,
        );


      applyMapTransform();
    };


  if (
    image.complete
  ) {
    update();
  }

  else {
    image.addEventListener(
      "load",
      update,
      {
        once:
          true,
      },
    );
  }
}


export function zoomMap(
  delta,
) {
  mapTransform.scale =
    Math.max(
      0.5,

      Math.min(
        6,
        mapTransform.scale +
          delta,
      ),
    );


  applyMapTransform();
}


export function resetMapTransform() {
  mapTransform = {
    scale: 1,
    x: 0,
    y: 0,
  };


  applyMapTransform();
}


function applyMapTransform() {
  const image =
    document.querySelector(
      "[data-map-dialog-image]",
    );

  const reset =
    document.querySelector(
      "[data-map-reset]",
    );


  if (!image) {
    return;
  }


  const fitScale =
    Number(
      image.dataset
        .fitScale,
    ) ||
    1;


  const scale =
    fitScale *
    mapTransform.scale;


  image.style.transform =
    `translate(calc(-50% + ${mapTransform.x}px), calc(-50% + ${mapTransform.y}px)) scale(${scale})`;


  if (reset) {
    reset.textContent =
      `${Math.round(mapTransform.scale * 100)}%`;
  }
}


export function bindMapEvents(
  signal,
) {
  const viewport =
    document.querySelector(
      "[data-map-viewport]",
    );


  viewport?.addEventListener(
    "wheel",
    handleMapWheel,
    {
      signal,
      passive: false,
    },
  );


  viewport?.addEventListener(
    "pointerdown",
    handleMapPointerDown,
    {
      signal,
    },
  );


  viewport?.addEventListener(
    "pointermove",
    handleMapPointerMove,
    {
      signal,
    },
  );


  viewport?.addEventListener(
    "pointerup",
    handleMapPointerUp,
    {
      signal,
    },
  );


  viewport?.addEventListener(
    "pointercancel",
    handleMapPointerUp,
    {
      signal,
    },
  );
}


function handleMapWheel(
  event,
) {
  event.preventDefault();


  zoomMap(
    event.deltaY <
      0
      ? 0.15
      : -0.15,
  );
}


function handleMapPointerDown(
  event,
) {
  const viewport =
    event.currentTarget;


  mapDrag = {
    pointerId:
      event.pointerId,

    startX:
      event.clientX,

    startY:
      event.clientY,

    originX:
      mapTransform.x,

    originY:
      mapTransform.y,
  };


  viewport.setPointerCapture(
    event.pointerId,
  );


  viewport.classList.add(
    "is-dragging",
  );
}


function handleMapPointerMove(
  event,
) {
  if (
    !mapDrag ||
    mapDrag.pointerId !==
      event.pointerId
  ) {
    return;
  }


  mapTransform.x =
    mapDrag.originX +
    event.clientX -
    mapDrag.startX;


  mapTransform.y =
    mapDrag.originY +
    event.clientY -
    mapDrag.startY;


  applyMapTransform();
}


function handleMapPointerUp(
  event,
) {
  if (
    !mapDrag ||
    mapDrag.pointerId !==
      event.pointerId
  ) {
    return;
  }


  event.currentTarget
    .classList.remove(
      "is-dragging",
    );


  mapDrag =
    null;
}