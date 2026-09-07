import {
  getLanguage,
  getLocalizedValue,
} from "../../features/language.js";

import {
  getTierAuswahl,
  setTierAusgewaehlt,
} from "../../features/tierAuswahl.js";

import {
  getEnclosureLabel,
  getConservationLabel,
  getEditionLabel,
  getContinentLabel,
  getAnimalUiText,
} from "../../features/animalLabels.js";


/* ======================================== */
/* TIERNAME                                 */
/* ======================================== */

function getTierName(tier) {
  return (
    getLocalizedValue(
      tier.namen,
      getLanguage(),
    ) ??
    tier.wissenschaftlicherName ??
    tier.id
  );
}


/* ======================================== */
/* BADGE                                    */
/* ======================================== */

function createBadge(text) {
  const badge =
    document.createElement("span");

  badge.className =
    "home-animal-card__badge";

  badge.textContent =
    text;

  return badge;
}


/* ======================================== */
/* BILD-PLATZHALTER                         */
/* ======================================== */

function createImagePlaceholder() {
  const placeholder =
    document.createElement("span");

  placeholder.className =
    "home-animal-card__placeholder";

  placeholder.textContent =
    getAnimalUiText("noImage");

  return placeholder;
}


/* ======================================== */
/* TIERKARTE                                */
/* ======================================== */

function createAnimalCard(
  tier,
  selected,
  signal,
) {
  const card =
    document.createElement("article");

  card.className =
    "home-animal-card";

  card.dataset.animalId =
    tier.id;


  if (
    selected.has(
      tier.id,
    )
  ) {
    card.classList.add(
      "is-selected",
    );
  }


  /* ==================================== */
  /* BILD                                 */
  /* ==================================== */

  const media =
    document.createElement("div");

  media.className =
    "home-animal-card__media";


  if (tier.hauptbildPfad) {
    const image =
      document.createElement("img");

    image.src =
      tier.hauptbildPfad;

    image.alt =
      getTierName(tier);

    image.loading =
      "lazy";


    image.addEventListener(
      "error",
      () => {
        media.replaceChildren(
          createImagePlaceholder(),
        );
      },
      {
        once: true,
        signal,
      },
    );


    media.appendChild(
      image,
    );
  }

  else {
    media.appendChild(
      createImagePlaceholder(),
    );
  }


  /* ==================================== */
  /* AUSWAHL                              */
  /* ==================================== */

  const checkbox =
    document.createElement("input");

  checkbox.type =
    "checkbox";

  checkbox.className =
    "home-animal-card__select";

  checkbox.checked =
    selected.has(
      tier.id,
    );

  checkbox.setAttribute(
    "aria-label",
    `${getTierName(tier)} auswählen`,
  );


  checkbox.addEventListener(
    "change",
    () => {
      setTierAusgewaehlt(
        tier.id,
        checkbox.checked,
      );
    },
    {
      signal,
    },
  );


  media.appendChild(
    checkbox,
  );


  /* ==================================== */
  /* INHALT                               */
  /* ==================================== */

  const body =
    document.createElement("div");

  body.className =
    "home-animal-card__body";


  /* ==================================== */
  /* BADGES                               */
  /* ==================================== */

  const badges =
    document.createElement("div");

  badges.className =
    "home-animal-card__badges";


  const enclosure =
    tier.filter
      ?.gehegetyp
      ?.[0];


  if (enclosure) {
    badges.appendChild(
      createBadge(
        getEnclosureLabel(
          enclosure,
        ),
      ),
    );
  }


  if (
    tier.filter
      ?.schutzstatus
  ) {
    badges.appendChild(
      createBadge(
        getConservationLabel(
          tier.filter
            .schutzstatus,
        ),
      ),
    );
  }


  if (
    tier.filter
      ?.edition
  ) {
    badges.appendChild(
      createBadge(
        getEditionLabel(
          tier.filter
            .edition,
        ),
      ),
    );
  }


  /* ==================================== */
  /* NAME                                 */
  /* ==================================== */

  const name =
    document.createElement("h2");

  name.className =
    "home-animal-card__name";

  name.textContent =
    getTierName(tier);


  const scientific =
    document.createElement("p");

  scientific.className =
    "home-animal-card__scientific";

  scientific.textContent =
    tier.wissenschaftlicherName;


  /* ==================================== */
  /* REGIONEN                             */
  /* ==================================== */

  const regions =
    document.createElement("p");

  regions.className =
    "home-animal-card__regions";

  regions.textContent =
    (
      tier.filter
        ?.kontinente ??
      []
    )
      .map(
        (continent) =>
          getContinentLabel(
            continent,
          ),
      )
      .join(" · ");


  body.append(
    badges,
    name,
    scientific,
    regions,
  );


  card.append(
    media,
    body,
  );


  return card;
}


/* ======================================== */
/* ALLE KARTEN RENDERN                      */
/* ======================================== */

export function renderHomeTierKarten(
  tiere,
  signal,
) {
  const list =
    document.querySelector(
      "[data-home-animal-list]",
    );

  const empty =
    document.querySelector(
      "[data-home-empty]",
    );

  const resultCount =
    document.querySelector(
      "[data-home-result-count]",
    );


  if (!list) {
    return;
  }


  const selected =
    new Set(
      getTierAuswahl(),
    );


  list.replaceChildren();


  tiere.forEach(
    (tier) => {
      list.appendChild(
        createAnimalCard(
          tier,
          selected,
          signal,
        ),
      );
    },
  );


  if (resultCount) {
    resultCount.textContent =
      String(
        tiere.length,
      );
  }


  if (empty) {
    empty.hidden =
      tiere.length !== 0;
  }
}