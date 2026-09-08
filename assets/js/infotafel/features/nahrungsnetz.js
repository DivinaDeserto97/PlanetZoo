import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";

import {
  getFressfeinde,
  getNahrungsBeziehungen,
  getSelbstBedingungen,
  getZielBedingungen,
} from "../../features/nahrungsBeziehungen.js";

import {
  enumLabel,
  getTierName,
  ui,
} from "./ui.js";


let foodRelation =
  "frisst";

let foodAge =
  "erwachsen";


export function resetFoodState() {
  foodRelation =
    "frisst";

  foodAge =
    "erwachsen";
}


export function setFoodRelation(
  value,
) {
  if (
    value ===
      "frisst" ||
    value ===
      "wirdGefressenVon"
  ) {
    foodRelation =
      value;
  }
}


export function setFoodAge(
  value,
) {
  if (
    value ===
      "jungtier" ||
    value ===
      "erwachsen"
  ) {
    foodAge =
      value;
  }
}


export function renderFoodWeb(
  tier,
  tiere,
) {
  document
    .querySelectorAll(
      "[data-food-relation]",
    )
    .forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset
            .foodRelation ===
            foodRelation,
        );
      },
    );


  document
    .querySelectorAll(
      "[data-food-age]",
    )
    .forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset
            .foodAge ===
            foodAge,
        );
      },
    );


  const content =
    document.querySelector(
      "[data-food-content]",
    );


  if (!content) {
    return;
  }


  content.replaceChildren();


  if (
    foodRelation ===
    "frisst"
  ) {
    renderFoodRelations(
      content,

      getNahrungsBeziehungen(
        tier,
        foodAge,
      ),

      tiere,
    );

    return;
  }


  if (
    foodRelation ===
    "wirdGefressenVon"
  ) {
    renderPredatorRelations(
      content,

      getFressfeinde(
        tiere,
        tier,
        foodAge,
      ),
    );

    return;
  }


  renderFoodEmpty(
    content,
  );
}


function renderFoodRelations(
  content,
  beziehungen,
  tiere,
) {
  if (
    !Array.isArray(
      beziehungen,
    ) ||
    beziehungen.length ===
      0
  ) {
    renderFoodEmpty(
      content,
    );

    return;
  }


  const list =
    document.createElement(
      "ul",
    );

  list.className =
    "foodweb-list";


  beziehungen.forEach(
    (beziehung) => {
      const item =
        document.createElement(
          "li",
        );

      item.textContent =
        formatFoodRelation(
          beziehung,
          tiere,
        );

      list.appendChild(
        item,
      );
    },
  );


  content.appendChild(
    list,
  );
}


function renderPredatorRelations(
  content,
  fressfeinde,
) {
  if (
    !Array.isArray(
      fressfeinde,
    ) ||
    fressfeinde.length ===
      0
  ) {
    const p =
      document.createElement(
        "p",
      );

    p.className =
      "foodweb-empty";

    p.textContent =
      ui(
        "noNaturalPredators",
      );

    content.appendChild(
      p,
    );

    return;
  }


  const list =
    document.createElement(
      "ul",
    );

  list.className =
    "foodweb-list";


  const texte =
    new Set();


  fressfeinde.forEach(
    (eintrag) => {
      const text =
        formatPredatorRelation(
          eintrag,
        );


      if (
        !text ||
        texte.has(
          text,
        )
      ) {
        return;
      }


      texte.add(
        text,
      );


      const item =
        document.createElement(
          "li",
        );

      item.textContent =
        text;

      list.appendChild(
        item,
      );
    },
  );


  content.appendChild(
    list,
  );
}


function formatFoodRelation(
  beziehung,
  tiere,
) {
  const teile = [
    getFoodValueLabel(
      beziehung?.wert,
      tiere,
    ),
  ];


  const typText =
    getFoodTypeLabel(
      beziehung?.typ,
    );


  if (typText) {
    teile.push(
      typText,
    );
  }


  let text =
    teile
      .filter(
        Boolean,
      )
      .join(
        " – ",
      );


  const bedingungen =
    formatFoodConditions(
      beziehung,
    );


  if (bedingungen) {
    text +=
      ` (${bedingungen})`;
  }


  if (
    beziehung?.typ ===
    "nutzung"
  ) {
    const art =
      beziehung
        ?.nutzung
        ?.art;


    if (art) {
      text +=
        ` · ${getUsageTypeLabel()}: ${enumLabel(art)}`;
    }


    const parsed =
      parseNutzungsHaeufigkeit(
        beziehung
          ?.nutzung
          ?.haeufigkeit,
      );


    if (
      parsed.menge
    ) {
      text +=
        ` · ${getAmountLabel()}: ${parsed.menge}`;
    }


    if (
      parsed.haeufigkeit
    ) {
      text +=
        ` · ${getFrequencyLabel()}: ${parsed.haeufigkeit}`;
    }


    if (
      parsed.zeitraum
    ) {
      text +=
        ` · ${getPeriodLabel()}: ${parsed.zeitraum}`;
    }


    const nutzungsHinweis =
      getLocalizedValue(
        beziehung
          ?.nutzung
          ?.hinweis,

        getLanguage(),
      );


    if (
      nutzungsHinweis
    ) {
      text +=
        ` · ${nutzungsHinweis}`;
    }
  }


  if (
    beziehung?.typ ===
    "aas"
  ) {
    const zustand =
      beziehung
        ?.aas
        ?.zustand;


    if (zustand) {
      text +=
        ` · ${getCarrionStateLabel()}: ${zustand}`;
    }


    const aasHinweis =
      getLocalizedValue(
        beziehung
          ?.aas
          ?.hinweis,

        getLanguage(),
      );


    if (aasHinweis) {
      text +=
        ` · ${aasHinweis}`;
    }
  }


  const hinweis =
    getLocalizedValue(
      beziehung?.hinweis,
      getLanguage(),
    );


  if (hinweis) {
    text +=
      ` · ${hinweis}`;
  }


  return (
    text ||
    ui(
      "noData",
    )
  );
}


function formatPredatorRelation(
  eintrag,
) {
  const fressfeind =
    eintrag?.fressfeind;


  if (!fressfeind) {
    return "";
  }


  let text =
    getTierName(
      fressfeind,
    );


  if (
    eintrag?.lebensphase
  ) {
    text +=
      ` – ${getFoodAgeLabel(
        eintrag.lebensphase,
      )}`;
  }


  const bedingungen =
    formatFoodConditions(
      eintrag.beziehung,
    );


  if (bedingungen) {
    text +=
      ` (${bedingungen})`;
  }


  return text;
}


function getFoodValueLabel(
  wert,
  tiere,
) {
  if (
    wert === undefined ||
    wert === null
  ) {
    return ui(
      "noData",
    );
  }


  const tier =
    findTierByFoodValue(
      wert,
      tiere,
    );


  return tier
    ? getTierName(
        tier,
      )
    : enumLabel(
        wert,
      );
}


function findTierByFoodValue(
  wert,
  tiere,
) {
  const value =
    String(
      wert ??
      "",
    ).trim();


  if (!value) {
    return null;
  }


  return (
    tiere.find(
      (tier) =>
        tier?.id ===
          value ||

        tier?.datenId ===
          value ||

        tier
          ?.wissenschaftlicherName ===
          value ||

        tier
          ?.originalDaten
          ?.id ===
          value ||

        tier
          ?.originalDaten
          ?.daten
          ?.taxonomie
          ?.werte
          ?.[0]
          ?.art ===
          value,
    ) ??
    null
  );
}


function formatFoodConditions(
  beziehung,
) {
  const teile =
    [];


  const selbst =
    getSelbstBedingungen(
      beziehung,
    );

  const ziel =
    getZielBedingungen(
      beziehung,
    );


  if (
    selbst.length
  ) {
    teile.push(
      selbst
        .map(
          enumLabel,
        )
        .join(
          ", ",
        ),
    );
  }


  if (
    ziel.length
  ) {
    teile.push(
      `${getTargetLabel()}: ${ziel
        .map(enumLabel)
        .join(", ")}`,
    );
  }


  return teile.join(
    " · ",
  );
}


function getFoodTypeLabel(
  typ,
) {
  switch (
    String(
      typ ??
      "",
    ).toLowerCase()
  ) {
    case "tier":
    case "pflanze":
      return "";

    case "nutzung":
      return getLanguage()
        .startsWith(
          "en",
        )
          ? "Use"
          : "Nutzung";

    case "aas":
      return getLanguage()
        .startsWith(
          "en",
        )
          ? "Carrion"
          : "Aas";

    case "giftig":
      return getLanguage()
        .startsWith(
          "en",
        )
          ? "Toxic"
          : "Giftig";

    default:
      return "";
  }
}


function getFoodAgeLabel(
  lebensphase,
) {
  if (
    lebensphase ===
    "jungtier"
  ) {
    return ui(
      "young",
    );
  }


  if (
    lebensphase ===
    "erwachsen"
  ) {
    return ui(
      "adult",
    );
  }


  return enumLabel(
    lebensphase,
  );
}


function getTargetLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Target"
      : "Ziel";
}


function parseNutzungsHaeufigkeit(
  wert,
) {
  const result = {
    menge: "",
    haeufigkeit: "",
    zeitraum: "",
  };


  if (
    typeof wert !==
      "string" ||
    !wert.trim()
  ) {
    return result;
  }


  wert
    .split(
      "|",
    )
    .map(
      (teil) =>
        teil.trim(),
    )
    .filter(
      Boolean,
    )
    .forEach(
      (teil) => {
        if (
          teil.startsWith(
            "Menge:",
          )
        ) {
          result.menge =
            teil
              .slice(
                "Menge:".length,
              )
              .trim();
        }

        else if (
          teil.startsWith(
            "Häufigkeit:",
          )
        ) {
          result.haeufigkeit =
            teil
              .slice(
                "Häufigkeit:".length,
              )
              .trim();
        }

        else if (
          teil.startsWith(
            "Zeitraum:",
          )
        ) {
          result.zeitraum =
            teil
              .slice(
                "Zeitraum:".length,
              )
              .trim();
        }
      },
    );


  return result;
}


function getUsageTypeLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Use"
      : "Nutzung";
}


function getAmountLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Amount"
      : "Menge";
}


function getFrequencyLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Frequency"
      : "Häufigkeit";
}


function getPeriodLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Period"
      : "Zeitraum";
}


function getCarrionStateLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Condition"
      : "Zustand";
}


function renderFoodEmpty(
  content,
) {
  const p =
    document.createElement(
      "p",
    );

  p.className =
    "foodweb-empty";

  p.textContent =
    ui(
      "noFoodData",
    );

  content.appendChild(
    p,
  );
}