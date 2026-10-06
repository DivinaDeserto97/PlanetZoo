/*
 * ANFÄNGER-HINWEIS – assets/js/map/features/layout.js
 * ----------------------------------------
 * Diese Datei gehört zum handgeschriebenen Quellcode von Planet Zoo 2 Tools.
 * Die grossen Abschnittskommentare darunter zeigen, welcher Teil welche
 * Aufgabe übernimmt. Beim Ändern möglichst nur den passenden Abschnitt
 * bearbeiten und danach das Browser-Bundle neu bauen/testen.
 */

/* ======================================== */
/* MAP-LAYOUT                               */
/* ======================================== */

export function initMapLayout(signal) {
  const page = document.querySelector("[data-map-page]");

  if (!page) {
    return;
  }

  const desktop = window.matchMedia("(min-width: 801px)");

  function update() {
    if (!desktop.matches) {
      page.style.removeProperty("--map-verfuegbare-hoehe");
      return;
    }

    const pageRect = page.getBoundingClientRect();
    const footer = document.querySelector("#footer");

    let unterkante = window.innerHeight;

    if (footer) {
      const footerRect = footer.getBoundingClientRect();

      if (
        footerRect.height > 0 &&
        footerRect.top > 0 &&
        footerRect.top < window.innerHeight
      ) {
        unterkante = footerRect.top;
      }
    }

    const verfuegbar = Math.max(420, Math.floor(unterkante - pageRect.top));

    page.style.setProperty("--map-verfuegbare-hoehe", `${verfuegbar}px`);
  }

  update();

  window.addEventListener("resize", update, {
    signal,
  });

  document.addEventListener("componentLoaded", update, {
    signal,
  });
}
