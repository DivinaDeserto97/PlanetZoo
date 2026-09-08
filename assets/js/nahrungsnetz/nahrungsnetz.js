import {
  datenImportieren,
} from "../../daten/lebewesen/tiere/datenImport.js";

import {
  getTierAuswahl,
  setTierAusgewaehlt,
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

  const page =
    document.querySelector(
      "[data-nahrungsnetz-page]",
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


  /* ==================================== */
  /* AUSWAHL ZENTRIEREN                   */
  /* ==================================== */

  document
    .querySelector(
      "[data-graph-center]",
    )
    ?.addEventListener(
      "click",
      () => {
        graphCanvas
          .centerOnFocus();
      },
      {
        signal,
      },
    );


  /* ==================================== */
  /* SPUREN BEARBEITEN                    */
  /* ==================================== */

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
              ? "Spuren ausblenden"
              : "Spuren bearbeiten";
        }
      },
      {
        signal,
      },
    );


  /* ==================================== */
  /* LAYOUT SPEICHERN                     */
  /* ==================================== */

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


  /* ==================================== */
  /* LAYOUT ZURÜCKSETZEN                  */
  /* ==================================== */

  document
    .querySelector(
      "[data-graph-reset]",
    )
    ?.addEventListener(
      "click",
      () => {
        graphCanvas
          .resetPositions();
      },
      {
        signal,
      },
    );


  /* ==================================== */
  /* INFO-BUTTON                          */
  /* ==================================== */

  page?.addEventListener(
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


  /* ==================================== */
  /* TIER-CHECKBOX                         */
  /* ==================================== */

  page?.addEventListener(
    "change",
    (event) => {
      const checkbox =
        event.target.closest(
          "[data-graph-tier-checkbox]",
        );


      if (!checkbox) {
        return;
      }


      const tierId =
        checkbox.dataset
          .graphTierId;


      if (!tierId) {
        return;
      }


      /*
          Das ist absichtlich dieselbe
          Auswahl wie auf home.html.
      */

      setTierAusgewaehlt(
        tierId,
        checkbox.checked,
      );
    },
    {
      signal,
    },
  );


  /* ==================================== */
  /* GLOBALE AUSWAHL ÄNDERT SICH          */
  /* ==================================== */

  document.addEventListener(
    "tierAuswahlChanged",
    render,
    {
      signal,
    },
  );


  /* ==================================== */
  /* SPRACHE ÄNDERT SICH                  */
  /* ==================================== */

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


  const selectedSet =
    new Set(
      selectedIds,
    );


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


  /*
      graphCanvas erzeugt zuerst die
      Kästchen.

      Danach setzen wir die Checkboxen
      hinein.
  */

  renderTierCheckboxes(
    graph,
    selectedSet,
  );


  graphCanvas.setRouteEdit(
    routeEdit,
  );
}


/* ======================================== */
/* CHECKBOXEN IN DIE TIERKÄSTCHEN           */
/* ======================================== */

function renderTierCheckboxes(
  graph,
  selectedSet,
) {
  const nodeElements =
    new Map();


  document
    .querySelectorAll(
      "[data-graph-node-id]",
    )
    .forEach(
      (element) => {
        nodeElements.set(
          element.dataset
            .graphNodeId,
          element,
        );
      },
    );


  graph.nodes.forEach(
    (node) => {
      /*
          Nur echte Tiere aus unseren
          geladenen Tier-JSONs bekommen
          eine Auswahlbox.

          Pflanzen, Aas, Wasser usw.
          bekommen keine.
      */

      if (!node.tierId) {
        return;
      }


      const element =
        nodeElements.get(
          node.id,
        );


      if (!element) {
        return;
      }


      element
        .querySelector(
          "[data-graph-tier-checkbox]",
        )
        ?.remove();


      const checkbox =
        document.createElement(
          "input",
        );


      checkbox.type =
        "checkbox";


      checkbox.className =
        "graph-node__select";


      checkbox.dataset
        .graphTierCheckbox =
        "";


      checkbox.dataset
        .graphTierId =
        node.tierId;


      checkbox.checked =
        selectedSet.has(
          node.tierId,
        );


      checkbox.setAttribute(
        "aria-label",
        `${node.label} auswählen`,
      );


      /*
          Vor dem Tiernamen einsetzen.
      */

      const title =
        element.querySelector(
          ".graph-node__title",
        );


      if (title) {
        element.insertBefore(
          checkbox,
          title,
        );
      }

      else {
        element.prepend(
          checkbox,
        );
      }
    },
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