import {
  getTierAuswahl,
} from "../../js/features/tierAuswahl.js";

import {
  getCurrentPage,
  pages,
} from "../../js/pages.js";

import {
  getLanguage,
} from "../../js/features/language.js";

import {
  TOOLS,
} from "../../js/features/toolRegistry.js";

import {
  getToolEinstellungen,
  setToolEinstellung,
} from "../../js/features/toolEinstellungen.js";


let controller = null;


function updateSelectionCount() {
  const count =
    document.querySelector(
      "[data-footer-selection-count]",
    );


  if (count) {
    count.textContent =
      String(
        getTierAuswahl().length,
      );
  }
}


function updateActivePage() {
  const currentPage =
    getCurrentPage();


  document
    .querySelectorAll(
      "[data-footer-page]",
    )
    .forEach(
      (link) => {
        link.classList.toggle(
          "active",
          link.dataset
            .footerPage ===
            currentPage,
        );
      },
    );
}


function renderTools() {
  const container =
    document.querySelector(
      "[data-footer-tools]",
    );


  if (!container) {
    return;
  }


  const language =
    getLanguage();

  const einstellungen =
    getToolEinstellungen();


  container.replaceChildren();


  TOOLS.forEach(
    (tool) => {
      const item =
        document.createElement(
          "div",
        );

      item.className =
        "app-footer__tool";


      const page =
        tool.page
          ? pages[
              tool.page
            ]
          : null;


      const labelText =
        page?.headerTitle?.[
          language
        ] ??
        page?.headerTitle?.de ??
        tool.label?.[
          language
        ] ??
        tool.label?.de ??
        tool.id;


      let label;


      if (page) {
        label =
          document.createElement(
            "a",
          );

        label.href =
          `#${tool.page}`;

        label.dataset.page =
          tool.page;

        label.dataset.footerPage =
          tool.page;
      }

      else {
        label =
          document.createElement(
            "span",
          );
      }


      label.className =
        "app-footer__tool-name";

      label.textContent =
        labelText;


      const select =
        document.createElement(
          "select",
        );

      select.className =
        "app-footer__tool-select";

      select.dataset.toolId =
        tool.id;

      select.setAttribute(
        "aria-label",
        `${labelText}: Priorität`,
      );


      [
        [
          "wichtig",
          getSettingLabel(
            "wichtig",
            language,
          ),
        ],
        [
          "nichtWichtig",
          getSettingLabel(
            "nichtWichtig",
            language,
          ),
        ],
        [
          "unsichtbar",
          getSettingLabel(
            "unsichtbar",
            language,
          ),
        ],
      ].forEach(
        ([value, text]) => {
          const option =
            document.createElement(
              "option",
            );

          option.value =
            value;

          option.textContent =
            text;

          select.appendChild(
            option,
          );
        },
      );


      select.value =
        einstellungen[
          tool.id
        ];


      select.addEventListener(
        "change",
        () => {
          setToolEinstellung(
            tool.id,
            select.value,
          );
        },
      );


      item.append(
        label,
        select,
      );


      container.appendChild(
        item,
      );
    },
  );


  updateActivePage();
}


function getSettingLabel(
  value,
  language,
) {
  const labels = {
    wichtig: {
      de: "Wichtig",
      en: "Important",
      "en-US": "Important",
      es: "Importante",
      fr: "Important",
      it: "Importante",
      "pt-BR": "Importante",
      ja: "重要",
      "zh-Hans": "重要",
    },

    nichtWichtig: {
      de: "Nicht wichtig",
      en: "Not important",
      "en-US": "Not important",
      es: "No importante",
      fr: "Pas important",
      it: "Non importante",
      "pt-BR": "Não importante",
      ja: "重要ではない",
      "zh-Hans": "不重要",
    },

    unsichtbar: {
      de: "Unsichtbar",
      en: "Hidden",
      "en-US": "Hidden",
      es: "Oculto",
      fr: "Masqué",
      it: "Nascosto",
      "pt-BR": "Oculto",
      ja: "非表示",
      "zh-Hans": "隐藏",
    },
  };


  return (
    labels[value]?.[
      language
    ] ??
    labels[value]?.de ??
    value
  );
}


export function init() {
  controller?.abort();
  controller =
    new AbortController();

  const { signal } =
    controller;


  document.addEventListener(
    "tierAuswahlChanged",
    updateSelectionCount,
    { signal },
  );


  document.addEventListener(
    "pageLoaded",
    updateActivePage,
    { signal },
  );


  document.addEventListener(
    "languageChanged",
    renderTools,
    { signal },
  );


  document.addEventListener(
    "toolEinstellungenChanged",
    renderTools,
    { signal },
  );


  updateSelectionCount();
  renderTools();
  updateActivePage();
}
