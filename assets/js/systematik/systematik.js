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
  buildSystematikGraph,
} from "./features/systematikDaten.js";


let controller =
  null;

let graphCanvas =
  null;

let tiere =
  [];

let routeEdit =
  false;

let rightPress =
  null;


const filters = {
  lebend:
    true,

  ausgestorben:
    true,

  wildform:
    true,

  domestiziert:
    true,

  planetZoo2:
    true,

  jurassicWorldEvolution1:
    true,

  jurassicWorldEvolution2:
    true,

  jurassicWorldEvolution3:
    true,
};


/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export async function init() {
  controller?.abort();


  controller =
    new AbortController();


  const {
    signal,
  } =
    controller;


  tiere =
    await datenImportieren();


  const page =
    document.querySelector(
      "[data-systematik-page]",
    );

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
    !page ||
    !stage ||
    !scroll ||
    !nodes ||
    !routePoints ||
    !connections
  ) {
    console.error(
      "Systematik-Graph konnte nicht initialisiert werden.",
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
        "planetZoo2-systematik-layout-v1",

      signal,

      onDirtyChange:
        updateSaveStatus,

      onZoomChange:
        updateZoomLabel,
    });


  bindFilters(
    page,
    signal,
  );


  bindViewportControls(
    signal,
  );


  bindToolbar(
    signal,
  );


  bindNodeControls(
    page,
    signal,
  );


  bindRightMouseControls(
    page,
    signal,
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


  updateZoomLabel(
    graphCanvas.getZoom(),
  );


  render();
}


/* ======================================== */
/* FILTER                                   */
/* ======================================== */

function bindFilters(
  page,
  signal,
) {
  page
    .querySelectorAll(
      "[data-systematik-filter]",
    )
    .forEach(
      (input) => {
        const key =
          input.dataset
            .systematikFilter;


        if (
          key in
          filters
        ) {
          filters[key] =
            input.checked;
        }


        input.addEventListener(
          "change",
          () => {
            if (
              key in
              filters
            ) {
              filters[key] =
                input.checked;

              render();
            }
          },
          {
            signal,
          },
        );
      },
    );
}


/* ======================================== */
/* VIEWPORT                                 */
/* ======================================== */

function bindViewportControls(
  signal,
) {
  document
    .querySelectorAll(
      "[data-graph-center], [data-graph-nav-center]",
    )
    .forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            graphCanvas
              ?.centerOnFocus();
          },
          {
            signal,
          },
        );
      },
    );


  const controls = [
    [
      "[data-graph-pan-left]",
      -0.7,
      0,
    ],

    [
      "[data-graph-pan-right]",
      0.7,
      0,
    ],

    [
      "[data-graph-pan-up]",
      0,
      -0.7,
    ],

    [
      "[data-graph-pan-down]",
      0,
      0.7,
    ],
  ];


  controls.forEach(
    (
      [
        selector,
        x,
        y,
      ],
    ) => {
      document
        .querySelector(
          selector,
        )
        ?.addEventListener(
          "click",
          () => {
            graphCanvas
              ?.panByViewport(
                x,
                y,
              );
          },
          {
            signal,
          },
        );
    },
  );


  document
    .querySelector(
      "[data-graph-zoom-reset]",
    )
    ?.addEventListener(
      "click",
      () => {
        graphCanvas
          ?.resetZoom();
      },
      {
        signal,
      },
    );
}


/* ======================================== */
/* TOOLBAR                                  */
/* ======================================== */

function bindToolbar(
  signal,
) {
  const edit =
    document.querySelector(
      "[data-graph-edit-lines]",
    );


  edit?.addEventListener(
    "click",
    () => {
      routeEdit =
        !routeEdit;


      graphCanvas
        ?.setRouteEdit(
          routeEdit,
        );


      edit.classList.toggle(
        "is-active",
        routeEdit,
      );


      const text =
        edit.querySelector(
          "[data-graph-edit-lines-text]",
        );


      if (text) {
        text.textContent =
          routeEdit
            ? "Linien ausblenden"
            : "Linien bearbeiten";
      }
    },
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
          ?.saveLayout();

        showSavedMessage();
      },
      {
        signal,
      },
    );


  document
    .querySelector(
      "[data-graph-reset]",
    )
    ?.addEventListener(
      "click",
      () => {
        graphCanvas
          ?.resetPositions();
      },
      {
        signal,
      },
    );
}


/* ======================================== */
/* KNOTEN                                   */
/* ======================================== */

function bindNodeControls(
  page,
  signal,
) {
  page.addEventListener(
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


      setTierAusgewaehlt(
        tierId,
        checkbox.checked,
      );
    },
    {
      signal,
    },
  );


  page.addEventListener(
    "click",
    (event) => {
      const info =
        event.target.closest(
          "[data-graph-info]",
        );


      if (!info) {
        return;
      }


      const tierId =
        info.dataset
          .graphTierId;


      if (tierId) {
        setAktivesTierId(
          tierId,
        );
      }
    },
    {
      signal,
    },
  );
}


/* ======================================== */
/* RECHTE MAUSTASTE                         */
/* ======================================== */

function bindRightMouseControls(
  page,
  signal,
) {
  page.addEventListener(
    "contextmenu",
    (event) => {
      if (
        event.target.closest(
          ".graph-node[data-graph-tier-id]",
        )
      ) {
        event.preventDefault();
      }
    },
    {
      signal,
    },
  );


  page.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.button !==
        2
      ) {
        return;
      }


      const node =
        event.target.closest(
          ".graph-node[data-graph-tier-id]",
        );


      if (!node) {
        return;
      }


      event.preventDefault();


      const press = {
        pointerId:
          event.pointerId,

        node,

        tierId:
          node.dataset
            .graphTierId,

        startX:
          event.clientX,

        startY:
          event.clientY,

        moved:
          false,

        longPress:
          false,

        timer:
          null,
      };


      press.timer =
        window.setTimeout(
          () => {
            press.longPress =
              true;


            node
              .querySelector(
                "[data-graph-info]",
              )
              ?.click();
          },
          600,
        );


      rightPress =
        press;
    },
    {
      signal,
    },
  );


  page.addEventListener(
    "pointermove",
    (event) => {
      if (
        !rightPress ||
        rightPress.pointerId !==
          event.pointerId
      ) {
        return;
      }


      const distance =
        Math.hypot(
          event.clientX -
            rightPress.startX,

          event.clientY -
            rightPress.startY,
        );


      if (
        distance >
        8
      ) {
        rightPress.moved =
          true;

        window.clearTimeout(
          rightPress.timer,
        );
      }
    },
    {
      signal,
    },
  );


  const finish =
    (event) => {
      if (
        !rightPress ||
        rightPress.pointerId !==
          event.pointerId
      ) {
        return;
      }


      const press =
        rightPress;


      rightPress =
        null;


      window.clearTimeout(
        press.timer,
      );


      if (
        press.longPress ||
        press.moved ||
        !press.tierId
      ) {
        return;
      }


      const selected =
        new Set(
          getTierAuswahl(),
        );


      setTierAusgewaehlt(
        press.tierId,
        !selected.has(
          press.tierId,
        ),
      );
    };


  page.addEventListener(
    "pointerup",
    finish,
    {
      signal,
    },
  );


  page.addEventListener(
    "pointercancel",
    finish,
    {
      signal,
    },
  );
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
    buildSystematikGraph(
      tiere,
      selectedIds,
      filters,
    );


  const empty =
    document.querySelector(
      "[data-systematik-empty]",
    );

  const graphArea =
    document.querySelector(
      "[data-systematik-graph]",
    );

  const count =
    document.querySelector(
      "[data-systematik-count]",
    );


  if (count) {
    count.textContent =
      String(
        selectedIds.length,
      );
  }


  const hasGraph =
    graph.nodes.length >
    0;


  if (empty) {
    empty.hidden =
      hasGraph;
  }


  if (graphArea) {
    graphArea.hidden =
      !hasGraph;
  }


  if (!hasGraph) {
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
/* STATUS                                   */
/* ======================================== */

function updateZoomLabel(
  zoom,
) {
  const element =
    document.querySelector(
      "[data-graph-zoom-label]",
    );


  if (element) {
    element.textContent =
      `${Math.round(
        (
          Number(
            zoom,
          ) ||
          1
        ) *
          100,
      )}%`;
  }
}


function updateSaveStatus(
  dirty,
) {
  const element =
    document.querySelector(
      "[data-graph-save-status]",
    );


  if (!element) {
    return;
  }


  element.textContent =
    dirty
      ? "Ungespeicherte Änderungen"
      : "Layout gespeichert";


  element.classList.toggle(
    "is-dirty",
    dirty,
  );
}


function showSavedMessage() {
  const element =
    document.querySelector(
      "[data-graph-save-status]",
    );


  if (!element) {
    return;
  }


  element.textContent =
    "Layout gespeichert";

  element.classList.remove(
    "is-dirty",
  );
}