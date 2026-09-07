import {
  datenImportieren,
} from "../../daten/lebewesen/tiere/datenImport.js";

import {
  getTierAuswahl,
} from "../features/tierAuswahl.js";

import {
  setAktivesTierId,
} from "../features/tierAktiv.js";

import {
  createGraphCanvas,
} from "../features/graph/graphCanvas.js";

import {
  buildNahrungsnetzGraph,
} from "./features/netzwerkDaten.js";


let controller =
  null;

let tiere =
  [];

let graphCanvas =
  null;


/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export async function init() {
  controller?.abort();

  controller =
    new AbortController();

  const {
    signal,
  } = controller;


  tiere =
    await datenImportieren();


  const stage =
    document.querySelector(
      "[data-graph-stage]",
    );

  const scroll =
    document.querySelector(
      "[data-graph-scroll]",
    );

  const nodes =
    document.querySelector(
      "[data-graph-nodes]",
    );

  const connections =
    document.querySelector(
      "[data-graph-connections]",
    );


  if (
    !stage ||
    !scroll ||
    !nodes ||
    !connections
  ) {
    console.error(
      "Nahrungsnetz-Graph konnte nicht initialisiert werden.",
    );

    return;
  }


  graphCanvas =
    createGraphCanvas({
      stage,
      scroll,

      nodesContainer:
        nodes,

      connectionsSvg:
        connections,

      storageKey:
        "planetZoo2-nahrungsnetz-positionen",

      signal,
    });


  document
    .querySelector(
      "[data-graph-reset]",
    )
    ?.addEventListener(
      "click",
      () =>
        graphCanvas
          .resetPositions(),
      {
        signal,
      },
    );


  document
    .querySelector(
      "[data-graph-center]",
    )
    ?.addEventListener(
      "click",
      () =>
        graphCanvas
          .centerOnFocus(),
      {
        signal,
      },
    );


  document
    .querySelector(
      "[data-nahrungsnetz-page]",
    )
    ?.addEventListener(
      "click",
      (event) => {
        const info =
          event.target.closest(
            "[data-graph-info]",
          );


        if (!info) {
          return;
        }


        setAktivesTierId(
          info.dataset
            .graphTierId,
        );
      },
      {
        signal,
      },
    );


  document.addEventListener(
    "tierAuswahlChanged",
    render,
    {
      signal,
    },
  );


  document.addEventListener(
    "languageChanged",
    render,
    {
      signal,
    },
  );


  render();
}


/* ======================================== */
/* RENDERN                                  */
/* ======================================== */

function render() {
  if (!graphCanvas) {
    return;
  }


  const selectedIds =
    getTierAuswahl();


  const graph =
    buildNahrungsnetzGraph(
      tiere,
      selectedIds,
    );


  const empty =
    document.querySelector(
      "[data-nahrungsnetz-empty]",
    );

  const graphArea =
    document.querySelector(
      "[data-nahrungsnetz-graph]",
    );

  const animalCount =
    document.querySelector(
      "[data-nahrungsnetz-animal-count]",
    );

  const nodeCount =
    document.querySelector(
      "[data-nahrungsnetz-node-count]",
    );

  const edgeCount =
    document.querySelector(
      "[data-nahrungsnetz-edge-count]",
    );


  if (animalCount) {
    animalCount.textContent =
      String(
        graph.focusCount,
      );
  }


  if (nodeCount) {
    nodeCount.textContent =
      String(
        graph.nodes.length,
      );
  }


  if (edgeCount) {
    edgeCount.textContent =
      String(
        graph.edges.length,
      );
  }


  const hasFocus =
    graph.focusCount >
    0;


  if (empty) {
    empty.hidden =
      hasFocus;
  }


  if (graphArea) {
    graphArea.hidden =
      !hasFocus;
  }


  if (!hasFocus) {
    return;
  }


  graphCanvas.render(
    graph,
  );
}
