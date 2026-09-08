import { datenImportieren } from "../../daten/lebewesen/tiere/datenImport.js";
import { getTierAuswahl } from "../features/tierAuswahl.js";
import { pruefeLokaleTierDateien } from "../features/tierDatenPruefung.js";

import {
  bindTierNavigationEvents,
  renderTierNavigation,
  scrollTierNav,
} from "./features/tierNavigation.js";

import { renderHeading } from "./features/heading.js";

import {
  changeImage,
  openImageDialog,
  renderMainImage,
  resetImageState,
} from "./features/bilder.js";

import { renderStats } from "./features/steckbrief.js";

import {
  bindAudioEvents,
  handleAudioSide,
  renderAudio,
  resetAudioState,
  toggleAudio,
} from "./features/audio.js";

import {
  bindMapEvents,
  openMapDialog,
  renderMap,
  resetMapState,
  resetMapTransform,
  zoomMap,
} from "./features/karte.js";

import { renderZoopedia } from "./features/zoopedia.js";

import {
  changeFact,
  renderFacts,
  resetFactState,
} from "./features/tierfakten.js";

import {
  renderFoodWeb,
  resetFoodState,
  setFoodAge,
  setFoodRelation,
} from "./features/nahrungsnetz.js";

import { renderUiText } from "./features/ui.js";


let controller = null;
let tiere = [];
let selectedTiere = [];
let activeTierId = null;


export async function init() {
  controller?.abort();

  controller =
    new AbortController();

  const { signal } =
    controller;


  tiere =
    await datenImportieren();


  await pruefeLokaleTierDateien(
    tiere,
  );


  bindStaticEvents(
    signal,
  );

  bindTierNavigationEvents(
    signal,
  );

  bindAudioEvents(
    signal,
  );

  bindMapEvents(
    signal,
  );


  document.addEventListener(
    "languageChanged",
    render,
    { signal },
  );


  document.addEventListener(
    "toolEinstellungenChanged",
    render,
    { signal },
  );


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
  const ids =
    getTierAuswahl();


  const byId =
    new Map(
      tiere.map(
        (tier) => [
          tier.id,
          tier,
        ],
      ),
    );


  selectedTiere =
    ids
      .map(
        (id) =>
          byId.get(
            id,
          ),
      )
      .filter(
        Boolean,
      );


  if (
    !selectedTiere.length
  ) {
    activeTierId =
      null;

    return;
  }


  if (
    !selectedTiere.some(
      (tier) =>
        tier.id ===
        activeTierId,
    )
  ) {
    activeTierId =
      selectedTiere[0].id;

    resetPerTierState();
  }
}


function resetPerTierState() {
  resetImageState();
  resetFactState();
  resetAudioState();
  resetFoodState();
  resetMapState();
}


function render() {
  const empty =
    document.querySelector(
      "[data-info-empty]",
    );

  const content =
    document.querySelector(
      "[data-info-content]",
    );


  renderUiText();

  renderTierNavigation(
    selectedTiere,
    activeTierId,
  );


  if (
    !selectedTiere.length
  ) {
    if (empty) {
      empty.hidden =
        false;
    }

    if (content) {
      content.hidden =
        true;
    }

    return;
  }


  if (empty) {
    empty.hidden =
      true;
  }

  if (content) {
    content.hidden =
      false;
  }


  const tier =
    getActiveTier();


  if (!tier) {
    return;
  }


  renderHeading(
    tier,
  );

  renderMainImage(
    tier,
  );

  renderStats(
    tier,
  );

  renderMap(
    tier,
  );

  renderZoopedia(
    tier,
  );

  renderFacts(
    tier,
  );

  renderFoodWeb(
    tier,
    tiere,
  );

  renderAudio(
    tier,
    getActiveTier,
  );
}


function getActiveTier() {
  return (
    selectedTiere.find(
      (tier) =>
        tier.id ===
        activeTierId,
    ) ??
    selectedTiere[0] ??
    null
  );
}


function bindStaticEvents(
  signal,
) {
  document.addEventListener(
    "click",
    handleClick,
    { signal },
  );


  document
    .querySelectorAll(
      "dialog",
    )
    .forEach(
      (dialog) => {
        dialog.addEventListener(
          "click",
          (event) => {
            if (
              event.target ===
              dialog
            ) {
              dialog.close();
            }
          },
          { signal },
        );
      },
    );
}


function handleClick(
  event,
) {
  const tierButton =
    event.target.closest(
      "[data-tier-id]",
    );


  if (tierButton) {
    activeTierId =
      tierButton.dataset
        .tierId;

    resetPerTierState();
    render();

    return;
  }


  if (
    event.target.closest(
      "[data-tier-nav-prev]",
    )
  ) {
    scrollTierNav(
      -1,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-tier-nav-next]",
    )
  ) {
    scrollTierNav(
      1,
    );

    return;
  }


  const tier =
    getActiveTier();


  if (
    event.target.closest(
      "[data-main-image-button]",
    )
  ) {
    openImageDialog(
      tier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-image-dialog-close]",
    )
  ) {
    document
      .querySelector(
        "[data-image-dialog]",
      )
      ?.close();

    return;
  }


  if (
    event.target.closest(
      "[data-image-prev]",
    )
  ) {
    changeImage(
      -1,
      tier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-image-next]",
    )
  ) {
    changeImage(
      1,
      tier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-audio-play]",
    )
  ) {
    toggleAudio();

    return;
  }


  if (
    event.target.closest(
      "[data-audio-left]",
    )
  ) {
    handleAudioSide(
      -1,
      getActiveTier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-audio-right]",
    )
  ) {
    handleAudioSide(
      1,
      getActiveTier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-map-open]",
    )
  ) {
    openMapDialog(
      tier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-map-close]",
    )
  ) {
    document
      .querySelector(
        "[data-map-dialog]",
      )
      ?.close();

    return;
  }


  if (
    event.target.closest(
      "[data-map-zoom-in]",
    )
  ) {
    zoomMap(
      0.25,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-map-zoom-out]",
    )
  ) {
    zoomMap(
      -0.25,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-map-reset]",
    )
  ) {
    resetMapTransform();

    return;
  }


  if (
    event.target.closest(
      "[data-fact-prev]",
    )
  ) {
    changeFact(
      -1,
      tier,
    );

    return;
  }


  if (
    event.target.closest(
      "[data-fact-next]",
    )
  ) {
    changeFact(
      1,
      tier,
    );

    return;
  }


  const relation =
    event.target.closest(
      "[data-food-relation]",
    );


  if (relation) {
    setFoodRelation(
      relation.dataset
        .foodRelation,
    );

    if (tier) {
      renderFoodWeb(
        tier,
        tiere,
      );
    }

    return;
  }


  const age =
    event.target.closest(
      "[data-food-age]",
    );


  if (age) {
    setFoodAge(
      age.dataset
        .foodAge,
    );

    if (tier) {
      renderFoodWeb(
        tier,
        tiere,
      );
    }
  }
}