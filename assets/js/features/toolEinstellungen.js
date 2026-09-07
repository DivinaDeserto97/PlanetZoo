import {
  TOOLS,
} from "./toolRegistry.js";


const STORAGE_KEY =
  "planetZoo2-toolEinstellungen";


export const TOOL_STUFEN = {
  WICHTIG: "wichtig",
  NICHT_WICHTIG: "nichtWichtig",
  UNSICHTBAR: "unsichtbar",
};


const GUELTIGE_STUFEN =
  new Set(
    Object.values(
      TOOL_STUFEN,
    ),
  );


function getStandardEinstellungen() {
  return Object.fromEntries(
    TOOLS.map(
      (tool) => [
        tool.id,
        tool.standard,
      ],
    ),
  );
}


export function getToolEinstellungen() {
  const standard =
    getStandardEinstellungen();


  try {
    const gespeichert =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY,
        ) ??
          "{}",
      );


    for (
      const [
        toolId,
        stufe,
      ] of Object.entries(
        gespeichert,
      )
    ) {
      if (
        GUELTIGE_STUFEN.has(
          stufe,
        )
      ) {
        standard[toolId] =
          stufe;
      }
    }
  }

  catch (error) {
    console.warn(
      "Tool-Einstellungen konnten nicht gelesen werden.",
      error,
    );
  }


  return standard;
}


export function getToolEinstellung(
  toolId,
) {
  return (
    getToolEinstellungen()[
      toolId
    ] ??
    TOOL_STUFEN.UNSICHTBAR
  );
}


export function setToolEinstellung(
  toolId,
  stufe,
) {
  if (
    !GUELTIGE_STUFEN.has(
      stufe,
    )
  ) {
    console.error(
      `Ungültige Tool-Stufe: ${stufe}`,
    );

    return;
  }


  const einstellungen =
    getToolEinstellungen();


  einstellungen[
    toolId
  ] = stufe;


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      einstellungen,
    ),
  );


  document.dispatchEvent(
    new CustomEvent(
      "toolEinstellungenChanged",
      {
        detail: {
          toolId,
          stufe,
          einstellungen,
        },
      },
    ),
  );
}
