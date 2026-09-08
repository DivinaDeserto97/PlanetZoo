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

let routeEdit =
  false;


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

  const routePoints =
    document.querySelector(
      "[data-graph-route-points]",
    );

  const connections =
    document.querySelector(
      "[data-graph-connections]",
    );


  if (
    !stage ||
    !scroll ||
    !nodes ||
    !routePoints ||
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

      routePointsContainer:
        routePoints,

      connectionsSvg:
        connections,

      storageKey:
        "planetZoo2-nahrungsnetz-layout-v3",

      signal,

      onDirtyChange:
        updateSaveStatus,
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
      "[data-graph-save]",
    )
    ?.addEventListener(
      "click",
      () => {
        graphCanvas
          .saveLayout();

        showSavedMessage();
      },
      {
        signal,
      },
    );


  document
    .querySelector(
      "[data-graph-edit-lines]",
    )
    ?.addEventListener(
      "click",
      (event) => {
        routeEdit =
          !routeEdit;


        graphCanvas
          .setRouteEdit(
            routeEdit,
          );


        event.currentTarget
          .classList.toggle(
            "is-active",
            routeEdit,
          );


        const text =
          event.currentTarget
            .querySelector(
              "[data-graph-edit-lines-text]",
            );


        if (text) {
          text.textContent =
            routeEdit
              ? "Linienpunkte ausblenden"
              : "Linien bearbeiten";
        }
      },
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


  graphCanvas.setRouteEdit(
    routeEdit,
  );
}


/* ======================================== */
/* SPEICHERSTATUS                           */
/* ======================================== */

function updateSaveStatus(
  dirty,
) {
  const status =
    document.querySelector(
      "[data-graph-save-status]",
    );

  const button =
    document.querySelector(
      "[data-graph-save]",
    );


  if (status) {
    status.textContent =
      dirty
        ? "Ungespeicherte Änderungen"
        : "Layout gespeichert";
  }


  if (button) {
    button.classList.toggle(
      "has-changes",
      dirty,
    );
  }
}


function showSavedMessage() {
  const status =
    document.querySelector(
      "[data-graph-save-status]",
    );


  if (status) {
    status.textContent =
      "Layout gespeichert";
  }
}
