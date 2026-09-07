import {
  datenImportieren,
} from "../../daten/lebewesen/tiere/datenImport.js";

import {
  getLanguage,
  getLocalizedValue,
} from "../features/language.js";

import {
  getTierAuswahl,
} from "../features/tierAuswahl.js";

import {
  getAktivesTier,
  setAktivesTierId,
} from "../features/tierAktiv.js";

import {
  pruefeLokaleTierDateien,
  pruefeTierDaten,
} from "../features/tierDatenPruefung.js";

import {
  TOOL_STUFEN,
} from "../features/toolEinstellungen.js";


let controller = null;
let tiere = [];


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


  stelleAktivesTierSicher();


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


  render();
}


function stelleAktivesTierSicher() {
  if (
    getAktivesTier(
      tiere,
    )
  ) {
    return;
  }


  const ausgewaehlt =
    new Set(
      getTierAuswahl(),
    );


  const fallback =
    tiere.find(
      (tier) =>
        ausgewaehlt.has(
          tier.id,
        ),
    ) ??
    tiere[0] ??
    null;


  if (fallback) {
    setAktivesTierId(
      fallback.id,
    );
  }
}


function render() {
  const tier =
    getAktivesTier(
      tiere,
    );

  const empty =
    document.querySelector(
      "[data-tier-empty]",
    );

  const content =
    document.querySelector(
      "[data-tier-content]",
    );


  if (!tier) {
    if (empty) {
      empty.hidden = false;
    }

    if (content) {
      content.hidden = true;
    }

    return;
  }


  if (empty) {
    empty.hidden = true;
  }

  if (content) {
    content.hidden = false;
  }


  const name =
    getLocalizedValue(
      tier.namen,
      getLanguage(),
    ) ??
    tier.wissenschaftlicherName ??
    tier.id;


  setText(
    "[data-tier-name]",
    name,
  );

  setText(
    "[data-tier-scientific]",
    tier.wissenschaftlicherName,
  );


  renderImage(
    tier,
    name,
  );

  renderToolChecks(
    tier,
  );
}


function renderImage(
  tier,
  name,
) {
  const image =
    document.querySelector(
      "[data-tier-image]",
    );

  const fallback =
    document.querySelector(
      "[data-tier-image-fallback]",
    );


  if (
    !image ||
    !fallback
  ) {
    return;
  }


  if (!tier.hauptbildPfad) {
    image.hidden = true;
    fallback.hidden = false;
    return;
  }


  image.hidden = false;
  fallback.hidden = true;
  image.src = tier.hauptbildPfad;
  image.alt = name;


  image.onerror =
    () => {
      image.hidden = true;
      fallback.hidden = false;
    };
}


function renderToolChecks(
  tier,
) {
  const container =
    document.querySelector(
      "[data-tier-tool-list]",
    );


  if (!container) {
    return;
  }


  container.replaceChildren();


  pruefeTierDaten(
    tier,
  ).forEach(
    (pruefung) => {
      const section =
        document.createElement(
          "section",
        );

      section.className =
        "tier-tool";


      if (
        !pruefung.vollstaendig
      ) {
        section.classList.add(
          "is-incomplete",
        );
      }


      const header =
        document.createElement(
          "header",
        );

      header.className =
        "tier-tool__header";


      const title =
        document.createElement(
          "div",
        );

      title.className =
        "tier-tool__title";


      const state =
        document.createElement(
          "span",
        );

      state.className =
        "tier-tool__state";

      state.textContent =
        pruefung.vollstaendig
          ? "✓"
          : "✕";


      const heading =
        document.createElement(
          "h2",
        );

      heading.textContent =
        getToolLabel(
          pruefung.tool,
        );


      title.append(
        state,
        heading,
      );


      const setting =
        document.createElement(
          "span",
        );

      setting.className =
        "tier-tool__setting";

      setting.classList.add(
        getSettingClass(
          pruefung.stufe,
        ),
      );

      setting.textContent =
        getSettingText(
          pruefung.stufe,
        );


      header.append(
        title,
        setting,
      );


      const checks =
        document.createElement(
          "div",
        );

      checks.className =
        "tier-tool__checks";


      pruefung.checks.forEach(
        (check) => {
          checks.appendChild(
            createCheckRow(
              check,
            ),
          );
        },
      );


      section.append(
        header,
        checks,
      );


      container.appendChild(
        section,
      );
    },
  );
}


function createCheckRow(
  check,
) {
  const row =
    document.createElement(
      "div",
    );

  row.className =
    `tier-check ${check.ok ? "is-ok" : "is-error"}`;


  const state =
    document.createElement(
      "span",
    );

  state.className =
    "tier-check__state";

  state.textContent =
    check.ok
      ? "✓"
      : "✕";


  const label =
    document.createElement(
      "div",
    );

  label.className =
    "tier-check__label";


  const strong =
    document.createElement(
      "strong",
    );

  strong.textContent =
    check.label;


  const code =
    document.createElement(
      "code",
    );

  code.textContent =
    check.pfad;


  label.append(
    strong,
    code,
  );


  row.append(
    state,
    label,
  );


  if (check.ok) {
    const complete =
      document.createElement(
        "span",
      );

    complete.className =
      "tier-check__complete";

    complete.textContent =
      "Vollständig";


    row.appendChild(
      complete,
    );
  }

  else {
    const missing =
      document.createElement(
        "ul",
      );

    missing.className =
      "tier-check__missing";


    check.fehlt.forEach(
      (text) => {
        const li =
          document.createElement(
            "li",
          );

        li.textContent =
          text;

        missing.appendChild(
          li,
        );
      },
    );


    row.appendChild(
      missing,
    );
  }


  return row;
}


function getToolLabel(tool) {
  const language =
    getLanguage();

  return (
    tool.label?.[
      language
    ] ??
    tool.label?.de ??
    tool.id
  );
}


function getSettingClass(
  stufe,
) {
  if (
    stufe ===
    TOOL_STUFEN.WICHTIG
  ) {
    return "is-error";
  }

  if (
    stufe ===
    TOOL_STUFEN.NICHT_WICHTIG
  ) {
    return "is-warning";
  }

  return "is-hidden";
}


function getSettingText(
  stufe,
) {
  if (
    stufe ===
    TOOL_STUFEN.WICHTIG
  ) {
    return "Wichtig";
  }

  if (
    stufe ===
    TOOL_STUFEN.NICHT_WICHTIG
  ) {
    return "Nicht wichtig";
  }

  return "Unsichtbar";
}


function setText(
  selector,
  value,
) {
  const element =
    document.querySelector(
      selector,
    );


  if (element) {
    element.textContent =
      value ??
      "";
  }
}
