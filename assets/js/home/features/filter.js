/* ======================================== */
/* HOME-FILTER                              */
/* ======================================== */

export function initHomeFilter({
  signal,
  onChange,
}) {
  const elemente = {
    suche:
      document.querySelector(
        "[data-home-search]",
      ),

    gehegetyp:
      document.querySelector(
        "[data-home-enclosure]",
      ),

    kontinent:
      document.querySelector(
        "[data-home-continent]",
      ),

    biome:
      document.querySelector(
        "[data-home-biome]",
      ),

    schutzstatus:
      document.querySelector(
        "[data-home-status]",
      ),

    edition:
      document.querySelector(
        "[data-home-edition]",
      ),

    sortierenNach:
      document.querySelector(
        "[data-home-sort-by]",
      ),

    richtung:
      document.querySelector(
        "[data-home-sort-direction]",
      ),

    reset:
      document.querySelector(
        "[data-home-reset]",
      ),
  };


  /* ==================================== */
  /* ZUSTAND HOLEN                        */
  /* ==================================== */

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


  /* ==================================== */
  /* EVENTS                               */
  /* ==================================== */

  const elementListe = [
    elemente.suche,
    elemente.gehegetyp,
    elemente.kontinent,
    elemente.biome,
    elemente.schutzstatus,
    elemente.edition,
    elemente.sortierenNach,
    elemente.richtung,
  ];


  elementListe.forEach(
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


  /* ==================================== */
  /* RESET                                */
  /* ==================================== */

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


  return {
    getState,
  };
}