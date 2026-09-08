import {
  getInfotafelBilder,
} from "../../features/tierMedien.js";

import {
  clampIndex,
  getTierName,
  ui,
  wrapIndex,
} from "./ui.js";


let imageIndex =
  0;


function getTierImages(
  tier,
) {
  return getInfotafelBilder(
    tier,
  );
}


export function resetImageState() {
  imageIndex =
    0;
}


export function renderMainImage(
  tier,
) {
  const images =
    getTierImages(
      tier,
    );


  imageIndex =
    clampIndex(
      imageIndex,
      images.length,
    );


  const image =
    document.querySelector(
      "[data-main-image]",
    );

  const fallback =
    document.querySelector(
      "[data-main-image-fallback]",
    );

  const count =
    document.querySelector(
      "[data-image-count]",
    );

  const button =
    document.querySelector(
      "[data-main-image-button]",
    );


  if (
    !image ||
    !fallback ||
    !button
  ) {
    return;
  }


  if (
    !images.length
  ) {
    image.hidden =
      true;

    fallback.hidden =
      false;

    fallback.textContent =
      ui(
        "noImage",
      );

    button.disabled =
      true;


    if (count) {
      count.textContent =
        "";
    }


    return;
  }


  const current =
    images[
      imageIndex
    ];


  image.hidden =
    false;

  fallback.hidden =
    true;

  button.disabled =
    false;

  image.src =
    current.pfad;

  image.alt =
    getTierName(
      tier,
    );


  image.onerror =
    () => {
      image.hidden =
        true;

      fallback.hidden =
        false;

      fallback.textContent =
        ui(
          "noImage",
        );
    };


  if (count) {
    count.textContent =
      images.length >
      1
        ? `${imageIndex + 1}/${images.length}`
        : "↗";
  }
}


export function openImageDialog(
  tier,
) {
  const images =
    tier
      ? getTierImages(
          tier,
        )
      : [];


  if (
    !tier ||
    !images.length
  ) {
    return;
  }


  const dialog =
    document.querySelector(
      "[data-image-dialog]",
    );


  if (!dialog) {
    return;
  }


  renderImageDialog(
    tier,
  );

  dialog.showModal();
}


function renderImageDialog(
  tier,
) {
  const images =
    getTierImages(
      tier,
    );


  imageIndex =
    clampIndex(
      imageIndex,
      images.length,
    );


  if (
    !images.length
  ) {
    return;
  }


  const image =
    document.querySelector(
      "[data-dialog-image]",
    );

  const title =
    document.querySelector(
      "[data-image-dialog-title]",
    );

  const counter =
    document.querySelector(
      "[data-image-dialog-counter]",
    );

  const prev =
    document.querySelector(
      "[data-image-prev]",
    );

  const next =
    document.querySelector(
      "[data-image-next]",
    );


  if (image) {
    image.src =
      images[
        imageIndex
      ].pfad;

    image.alt =
      getTierName(
        tier,
      );
  }


  if (title) {
    title.textContent =
      getTierName(
        tier,
      );
  }


  if (counter) {
    counter.textContent =
      `${ui("image")} ${imageIndex + 1} / ${images.length}`;
  }


  if (prev) {
    prev.hidden =
      images.length <=
      1;
  }


  if (next) {
    next.hidden =
      images.length <=
      1;
  }
}


export function changeImage(
  direction,
  tier,
) {
  const images =
    tier
      ? getTierImages(
          tier,
        )
      : [];


  if (
    !tier ||
    images.length <=
      1
  ) {
    return;
  }


  imageIndex =
    wrapIndex(
      imageIndex +
        direction,

      images.length,
    );


  renderMainImage(
    tier,
  );

  renderImageDialog(
    tier,
  );
}