import {
  getTierMarkierungsStatus,
} from "../../features/tierDatenPruefung.js";

import {
  getTierName,
} from "./ui.js";


let selectedCount =
  0;


export function renderTierNavigation(
  selectedTiere,
  activeTierId,
) {
  selectedCount =
    selectedTiere.length;


  const track =
    document.querySelector(
      "[data-tier-nav-track]",
    );

  const prev =
    document.querySelector(
      "[data-tier-nav-prev]",
    );

  const next =
    document.querySelector(
      "[data-tier-nav-next]",
    );


  if (!track) {
    return;
  }


  track.replaceChildren();


  selectedTiere.forEach(
    (tier) => {
      const button =
        document.createElement(
          "button",
        );

      button.type =
        "button";

      button.className =
        "tier-nav__item";

      button.dataset.tierId =
        tier.id;

      button.classList.toggle(
        "active",
        tier.id ===
          activeTierId,
      );


      const datenStatus =
        getTierMarkierungsStatus(
          tier,
        );


      if (
        datenStatus ===
        "error"
      ) {
        button.classList.add(
          "has-data-error",
        );
      }

      else if (
        datenStatus ===
        "warning"
      ) {
        button.classList.add(
          "has-data-warning",
        );
      }


      if (
        tier.hauptbildPfad
      ) {
        const img =
          document.createElement(
            "img",
          );

        img.src =
          tier.hauptbildPfad;

        img.alt =
          "";

        img.loading =
          "lazy";


        img.addEventListener(
          "error",
          () =>
            img.replaceWith(
              createNavFallback(),
            ),
          {
            once:
              true,
          },
        );


        button.appendChild(
          img,
        );
      }

      else {
        button.appendChild(
          createNavFallback(),
        );
      }


      const name =
        document.createElement(
          "span",
        );

      name.className =
        "tier-nav__name";

      name.textContent =
        getTierName(
          tier,
        );


      button.appendChild(
        name,
      );

      track.appendChild(
        button,
      );
    },
  );


  requestAnimationFrame(
    updateTierNavArrows,
  );


  if (prev) {
    prev.hidden =
      selectedTiere.length <=
      1;
  }


  if (next) {
    next.hidden =
      selectedTiere.length <=
      1;
  }
}


function createNavFallback() {
  const fallback =
    document.createElement(
      "span",
    );

  fallback.className =
    "tier-nav__fallback";

  fallback.textContent =
    "?";

  return fallback;
}


export function updateTierNavArrows() {
  const viewport =
    document.querySelector(
      "[data-tier-nav-viewport]",
    );

  const track =
    document.querySelector(
      "[data-tier-nav-track]",
    );

  const prev =
    document.querySelector(
      "[data-tier-nav-prev]",
    );

  const next =
    document.querySelector(
      "[data-tier-nav-next]",
    );


  if (
    !viewport ||
    !track ||
    !prev ||
    !next ||
    selectedCount <=
      1
  ) {
    return;
  }


  const canScroll =
    track.scrollWidth >
    viewport.clientWidth +
      2;


  prev.hidden =
    !canScroll;

  next.hidden =
    !canScroll;


  if (canScroll) {
    prev.disabled =
      track.scrollLeft <=
      2;

    next.disabled =
      track.scrollLeft +
        track.clientWidth >=
      track.scrollWidth -
        2;
  }
}


export function bindTierNavigationEvents(
  signal,
) {
  const track =
    document.querySelector(
      "[data-tier-nav-track]",
    );


  track?.addEventListener(
    "scroll",
    updateTierNavArrows,
    {
      signal,
      passive: true,
    },
  );


  window.addEventListener(
    "resize",
    updateTierNavArrows,
    {
      signal,
    },
  );
}


export function scrollTierNav(
  direction,
) {
  const track =
    document.querySelector(
      "[data-tier-nav-track]",
    );


  if (!track) {
    return;
  }


  track.scrollBy({
    left:
      direction *
      Math.max(
        180,
        track.clientWidth *
          0.7,
      ),

    behavior:
      "smooth",
  });
}