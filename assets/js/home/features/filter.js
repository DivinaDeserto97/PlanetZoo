/* ======================================== */
/* FILTER-ENUMS AUS "LEERES TIER"           */
/* ======================================== */

const FILTER_ENUM_URL =
  "../assets/daten/lebewesen/tiere/1leeres%20Tier/leeres%20Tier.json";

const FILTER_FELDER = {
  gehegetypAuswahl: "[data-home-enclosure]",
  kontinenteAuswahl: "[data-home-continent]",
  biomeAuswahl: "[data-home-biome]",
  schutzstatusAuswahl: "[data-home-status]",
  editionAuswahl: "[data-home-edition]",
};

function holeVorhandeneOptionen(select) {
  return new Map(
    [...select.options]
      .filter((option) => option.value)
      .map((option) => [
        option.value,
        {
          text: option.textContent.trim(),
          attribute: [...option.attributes]
            .filter((attribut) => attribut.name.startsWith("data-"))
            .reduce((daten, attribut) => {
              daten[attribut.name] = attribut.value;
              return daten;
            }, {}),
        },
      ]),
  );
}

function baueFilterOptionen(select, werte) {
  if (!select || !Array.isArray(werte)) {
    return;
  }

  const vorhandene = holeVorhandeneOptionen(select);
  const alleOption = select.querySelector('option[value=""]')?.cloneNode(true);

  select.replaceChildren();

  if (alleOption) {
    select.append(alleOption);
  }

  werte.forEach((wert) => {
    const option = document.createElement("option");
    const alt = vorhandene.get(wert);

    option.value = wert;
    option.textContent = alt?.text || wert;

    Object.entries(alt?.attribute ?? {}).forEach(([name, value]) => {
      option.setAttribute(name, value);
    });

    select.append(option);
  });
}

async function ladeFilterEnumsAusLeeremTier(elemente) {
  try {
    const antwort = await fetch(FILTER_ENUM_URL);

    if (!antwort.ok) {
      throw new Error(`HTTP ${antwort.status}`);
    }

    const leeresTier = await antwort.json();
    const filter = leeresTier?.filter ?? {};

    Object.entries(FILTER_FELDER).forEach(([feld, selector]) => {
      const select = document.querySelector(selector);

      baueFilterOptionen(select, filter[feld]);
    });
  } catch (fehler) {
    console.error(
      "Filter-Enumerationen konnten nicht aus dem leeren Tier geladen werden:",
      fehler,
    );
  }
}

/* ======================================== */
/* HOME-FILTER                              */
/* ======================================== */

export async function initHomeFilter({
  signal,
  onChange,
  onSelectAll,
  onSelectNone,
}) {
  const elemente = {
    suche: document.querySelector("[data-home-search]"),

    gehegetyp: document.querySelector("[data-home-enclosure]"),

    kontinent: document.querySelector("[data-home-continent]"),

    biome: document.querySelector("[data-home-biome]"),

    schutzstatus: document.querySelector("[data-home-status]"),

    edition: document.querySelector("[data-home-edition]"),

    sortierenNach: document.querySelector("[data-home-sort-by]"),

    richtung: document.querySelector("[data-home-sort-direction]"),

    alleAuswaehlen: document.querySelector("[data-home-select-all]"),

    alleAbwaehlen: document.querySelector("[data-home-select-none]"),

    reset: document.querySelector("[data-home-reset]"),
  };

  await ladeFilterEnumsAusLeeremTier(elemente);

  /* ==================================== */
  /* ZUSTAND HOLEN                        */
  /* ==================================== */

  function getState() {
    return {
      filter: {
        suche: elemente.suche?.value ?? "",

        gehegetyp: elemente.gehegetyp?.value ?? "",

        kontinent: elemente.kontinent?.value ?? "",

        biome: elemente.biome?.value ?? "",

        schutzstatus: elemente.schutzstatus?.value ?? "",

        edition: elemente.edition?.value ?? "",
      },

      sortierung: {
        sortierenNach: elemente.sortierenNach?.value ?? "newest",

        richtung: elemente.richtung?.value ?? "desc",
      },
    };
  }

  /* ==================================== */
  /* FILTER / SORTIERUNG                  */
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

  elementListe.forEach((element) => {
    if (!element) {
      return;
    }

    element.addEventListener("input", onChange, {
      signal,
    });

    element.addEventListener("change", onChange, {
      signal,
    });
  });

  /* ==================================== */
  /* ALLE AUSWÄHLEN                       */
  /* ==================================== */

  elemente.alleAuswaehlen?.addEventListener(
    "click",
    () => {
      onSelectAll?.();
    },
    {
      signal,
    },
  );

  /* ==================================== */
  /* ALLE ABWÄHLEN                        */
  /* ==================================== */

  elemente.alleAbwaehlen?.addEventListener(
    "click",
    () => {
      onSelectNone?.();
    },
    {
      signal,
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
        elemente.sortierenNach.value = "newest";
      }

      if (elemente.richtung) {
        elemente.richtung.value = "desc";
      }

      onChange?.();
    },
    {
      signal,
    },
  );

  return {
    getState,
  };
}
