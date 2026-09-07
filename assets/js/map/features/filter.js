/* ======================================== */
/* MAP-FILTER                               */
/* ======================================== */

export function initMapFilter({
  signal,
  onChange,
}) {
  const elemente = {
    details:
      document.querySelector(
        "[data-map-filter]",
      ),

    suche:
      document.querySelector(
        "[data-map-search]",
      ),

    gehegetyp:
      document.querySelector(
        "[data-map-enclosure]",
      ),

    kontinent:
      document.querySelector(
        "[data-map-continent]",
      ),

    biome:
      document.querySelector(
        "[data-map-biome]",
      ),

    schutzstatus:
      document.querySelector(
        "[data-map-conservation]",
      ),

    edition:
      document.querySelector(
        "[data-map-edition]",
      ),

    nurAusgewaehlt:
      document.querySelector(
        "[data-map-selected-only]",
      ),

    sortierenNach:
      document.querySelector(
        "[data-map-sort-by]",
      ),

    richtung:
      document.querySelector(
        "[data-map-sort-direction]",
      ),

    reset:
      document.querySelector(
        "[data-map-filter-reset]",
      ),
  };


  function getState() {
    return {
      filter: {
        suche:
          elemente.suche?.value ??
          "",

        gehegetyp:
          elemente.gehegetyp?.value ??
          "",

        kontinent:
          elemente.kontinent?.value ??
          "",

        biome:
          elemente.biome?.value ??
          "",

        schutzstatus:
          elemente.schutzstatus?.value ??
          "",

        edition:
          elemente.edition?.value ??
          "",

        nurAusgewaehlt:
          elemente.nurAusgewaehlt?.checked ??
          false,
      },

      sortierung: {
        sortierenNach:
          elemente.sortierenNach?.value ??
          "newest",

        richtung:
          elemente.richtung?.value ??
          "desc",
      },
    };
  }


  const controls = [
    elemente.suche,
    elemente.gehegetyp,
    elemente.kontinent,
    elemente.biome,
    elemente.schutzstatus,
    elemente.edition,
    elemente.nurAusgewaehlt,
    elemente.sortierenNach,
    elemente.richtung,
  ];


  controls.forEach(
    (element) => {
      if (!element) {
        return;
      }

      element.addEventListener(
        "input",
        onChange,
        {
          signal,
        },
      );

      element.addEventListener(
        "change",
        onChange,
        {
          signal,
        },
      );
    },
  );


  elemente.reset?.addEventListener(
    "click",
    () => {
      if (elemente.suche) {
        elemente.suche.value = "";
      }

      if (elemente.gehegetyp) {
        elemente.gehegetyp.value = "";
      }

      if (elemente.kontinent) {
        elemente.kontinent.value = "";
      }

      if (elemente.biome) {
        elemente.biome.value = "";
      }

      if (elemente.schutzstatus) {
        elemente.schutzstatus.value = "";
      }

      if (elemente.edition) {
        elemente.edition.value = "";
      }

      if (elemente.nurAusgewaehlt) {
        elemente.nurAusgewaehlt.checked = false;
      }

      if (elemente.sortierenNach) {
        elemente.sortierenNach.value =
          "newest";
      }

      if (elemente.richtung) {
        elemente.richtung.value =
          "desc";
      }

      onChange();
    },
    {
      signal,
    },
  );


  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        !elemente.details?.open ||
        elemente.details.contains(
          event.target,
        )
      ) {
        return;
      }

      elemente.details.open = false;
    },
    {
      signal,
    },
  );


  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        elemente.details?.open
      ) {
        elemente.details.open = false;
      }
    },
    {
      signal,
    },
  );


  return {
    getState,
  };
}
