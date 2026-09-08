import {
  getLanguage,
} from "../../features/language.js";

import {
  getTextEntries,
  ui,
} from "./ui.js";


const SECTIONS = [
  {
    key:
      "uebersicht",

    label: {
      de:
        "Übersicht",

      en:
        "Overview",

      "en-US":
        "Overview",
    },
  },

  {
    key:
      "vorkommen",

    label: {
      de:
        "Vorkommen",

      en:
        "Distribution",

      "en-US":
        "Distribution",
    },
  },

  {
    key:
      "arterhaltung",

    label: {
      de:
        "Arterhaltung",

      en:
        "Conservation",

      "en-US":
        "Conservation",
    },
  },

  {
    key:
      "sozialverhaltenUndFortpflanzung",

    label: {
      de:
        "Sozialverhalten & Fortpflanzung",

      en:
        "Social behaviour & reproduction",

      "en-US":
        "Social behavior & reproduction",
    },
  },

  {
    key:
      "tierfakten",

    label: {
      de:
        "Tierfakten",

      en:
        "Animal facts",

      "en-US":
        "Animal facts",
    },
  },

  {
    key:
      "entwicklungshinweis",

    label: {
      de:
        "Hinweis",

      en:
        "Note",

      "en-US":
        "Note",
    },
  },
];


export function renderZoopedia(
  tier,
) {
  const container =
    document.querySelector(
      "[data-zoopedia-text]",
    );


  if (!container) {
    return;
  }


  const language =
    getLanguage();


  container.replaceChildren();


  let rendered =
    0;


  SECTIONS.forEach(
    (sectionData) => {
      const entries =
        getTextEntries(
          tier,
          sectionData.key,
        );


      if (
        !entries.length
      ) {
        return;
      }


      rendered++;


      const section =
        document.createElement(
          "section",
        );

      section.className =
        "zoopedia-section";


      const heading =
        document.createElement(
          "h3",
        );


      heading.textContent =
        sectionData.label[
          language
        ] ??
        sectionData.label.de ??
        sectionData.key;


      section.appendChild(
        heading,
      );


      entries.forEach(
        (entry) => {
          const p =
            document.createElement(
              "p",
            );

          p.textContent =
            entry.inhalt;

          section.appendChild(
            p,
          );
        },
      );


      container.appendChild(
        section,
      );
    },
  );


  if (!rendered) {
    const p =
      document.createElement(
        "p",
      );

    p.textContent =
      ui(
        "noData",
      );

    container.appendChild(
      p,
    );
  }
}