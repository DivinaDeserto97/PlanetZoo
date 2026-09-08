import {
  enumLabel,
  formatNumber,
  ui,
} from "./ui.js";


export function renderStats(
  tier,
) {
  const daten =
    tier.originalDaten
      ?.daten ??
    {};


  const socialEntry =
    daten.sozialeStruktur
      ?.werte
      ?.[0];

  const socialValue =
    formatEnumValues(
      daten.sozialeStruktur
        ?.werte,
    );


  setIconOnlyStat(
    '[data-stat-icon-only="social"]',
    ui(
      "social",
    ),
    socialValue,
    getSocialIcon(
      socialEntry?.wert,
    ),
  );


  const biomeElement =
    document.querySelector(
      "[data-stat-biome]",
    );


  if (biomeElement) {
    const biomeValue =
      formatEnumValues(
        daten.biome
          ?.werte,
      );


    setOrbitSteckbrief(
      biomeElement,
      ui(
        "biome",
      ),
      biomeValue,
      "🌍",
    );
  }


  const steckbriefKandidaten =
    [
      {
        key:
          "bodyLength",
        icon:
          "↔",
        entry:
          daten.koerperlaenge
            ?.werte
            ?.[0],
      },

      {
        key:
          "wingspan",
        icon:
          "🪽",
        entry:
          daten.fluegelspannweite
            ?.werte
            ?.[0],
      },

      {
        key:
          "weight",
        icon:
          "⚖",
        entry:
          daten.gewicht
            ?.werte
            ?.[0],
      },

      {
        key:
          "lifespan",
        icon:
          "⌛",
        entry:
          daten.lebensspanne
            ?.werte
            ?.[0],
      },

      {
        key:
          "speed",
        icon:
          "➤",
        entry:
          daten.geschwindigkeit
            ?.werte
            ?.[0],
      },

      {
        key:
          "maturity",
        icon:
          "◉",
        entry:
          daten.geschlechtsreife
            ?.werte
            ?.[0],
      },
    ]
      .filter(
        (item) =>
          item.entry &&
          typeof item.entry ===
            "object",
      )
      .slice(
        0,
        5,
      );


  document
    .querySelectorAll(
      "[data-stat-slot]",
    )
    .forEach(
      (element) => {
        const slotIndex =
          Number(
            element.dataset
              .statSlot,
          );

        const stat =
          steckbriefKandidaten[
            slotIndex
          ];


        if (!stat) {
          element.hidden =
            true;

          return;
        }


        element.hidden =
          false;


        setOrbitSteckbrief(
          element,
          ui(
            stat.key,
          ),
          formatRange(
            stat.entry,
          ),
          stat.icon,
        );
      },
    );


  const activityEntry =
    daten.aktivitaet
      ?.werte
      ?.[0];

  const activityValue =
    formatEnumValues(
      daten.aktivitaet
        ?.werte,
    );


  setIconOnlyStat(
    '[data-stat-icon-only="activity"]',
    ui(
      "activity",
    ),
    activityValue,
    getActivityIcon(
      activityEntry?.wert,
    ),
  );


  const dietEntry =
    daten.ernaehrung
      ?.fressverhalten
      ?.werte
      ?.[0];

  const dietValue =
    formatEnumValues(
      daten.ernaehrung
        ?.fressverhalten
        ?.werte,
    );


  setIconOnlyStat(
    '[data-stat-icon-only="dietType"]',
    ui(
      "dietType",
    ),
    dietValue,
    getDietIcon(
      dietEntry?.wert,
    ),
  );
}


function setOrbitSteckbrief(
  element,
  label,
  value,
  icon,
) {
  const iconElement =
    element.querySelector(
      "[data-orbit-icon]",
    );

  const valueElement =
    element.querySelector(
      "[data-orbit-value]",
    );


  if (iconElement) {
    iconElement.textContent =
      icon;
  }


  if (valueElement) {
    valueElement.textContent =
      value ||
      ui(
        "noData",
      );
  }


  const tooltip =
    `${label}: ${value || ui("noData")}`;


  element.dataset.tooltip =
    tooltip;

  element.setAttribute(
    "aria-label",
    tooltip,
  );
}


function setIconOnlyStat(
  selector,
  label,
  value,
  icon,
) {
  const element =
    document.querySelector(
      selector,
    );


  if (!element) {
    return;
  }


  const iconElement =
    element.querySelector(
      "[data-orbit-icon]",
    );


  if (iconElement) {
    iconElement.textContent =
      icon;
  }


  const tooltip =
    `${label}: ${value || ui("noData")}`;


  element.dataset.tooltip =
    tooltip;

  element.setAttribute(
    "aria-label",
    tooltip,
  );
}


function getSocialIcon(
  value,
) {
  const icons = {
    solitary:
      "👤",

    solitaryOrPair:
      "👥",

    pair:
      "👥",

    pairs:
      "👥",

    group:
      "🐾",

    groups:
      "🐾",

    herd:
      "🐾",

    pack:
      "🐾",
  };


  return (
    icons[value] ??
    "👥"
  );
}


function getActivityIcon(
  value,
) {
  const icons = {
    diurnal:
      "☀",

    nocturnal:
      "🌙",

    crepuscular:
      "◐",
  };


  return (
    icons[value] ??
    "◐"
  );
}


function getDietIcon(
  value,
) {
  const icons = {
    carnivore:
      "🥩",

    herbivore:
      "🌿",

    omnivore:
      "🍽",
  };


  return (
    icons[value] ??
    "🍽"
  );
}


function formatRange(
  entry,
) {
  if (
    !entry ||
    typeof entry !==
      "object"
  ) {
    return ui(
      "noData",
    );
  }


  const unit =
    formatUnit(
      entry.einheit,
    );


  if (
    entry.min !==
      undefined &&
    entry.min !==
      null &&
    entry.max !==
      undefined &&
    entry.max !==
      null
  ) {
    return `${formatNumber(entry.min)}–${formatNumber(entry.max)}${unit}`;
  }


  if (
    entry.max !==
      undefined &&
    entry.max !==
      null
  ) {
    return `${ui("upTo")} ${formatNumber(entry.max)}${unit}`;
  }


  if (
    entry.min !==
      undefined &&
    entry.min !==
      null
  ) {
    return `${ui("from")} ${formatNumber(entry.min)}${unit}`;
  }


  if (
    entry.wert !==
      undefined &&
    entry.wert !==
      null
  ) {
    return `${formatNumber(entry.wert)}${unit}`;
  }


  return ui(
    "noData",
  );
}


function formatUnit(
  unit,
) {
  if (!unit) {
    return "";
  }


  if (
    unit ===
    "jahr"
  ) {
    return ` ${ui("years")}`;
  }


  return ` ${unit}`;
}


function formatEnumValues(
  entries,
) {
  if (
    !Array.isArray(
      entries,
    ) ||
    !entries.length
  ) {
    return ui(
      "noData",
    );
  }


  const values =
    entries
      .map(
        (entry) =>
          enumLabel(
            entry?.wert,
          ),
      )
      .filter(
        Boolean,
      );


  return values.length
    ? values.join(
        " · ",
      )
    : ui(
        "noData",
      );
}