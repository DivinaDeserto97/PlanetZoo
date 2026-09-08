import {
  buildPixelLayout,
  buildRoutes,
  createDefaultSlotMap,
  createSlotId,
  getCorridorRect,
  getGridSize,
  getSlotRect,
  parseCorridor,
  parseSlot,
} from "./graphGrid.js";

import {
  getLaneHandlePosition,
  renderGraphConnections,
} from "./graphConnections.js";

import {
  initGraphSlotDrag,
  initLaneHandleDrag,
} from "./graphDrag.js";


/* ======================================== */
/* GRAPH-CANVAS                             */
/* ======================================== */

export function createGraphCanvas({
  stage,
  scroll,
  nodesContainer,
  routePointsContainer,
  connectionsSvg,
  storageKey,
  signal,
  onDirtyChange,
}) {
  let currentGraph = {
    nodes:
      [],

    edges:
      [],
  };


  let workspace = {
    nodes:
      {},

    edges:
      {},
  };


  let routeEdit =
    false;

  let dirty =
    false;

  let currentModel =
    null;

  let previewSlot =
    null;


  /* ==================================== */
  /* ÖFFENTLICH RENDERN                   */
  /* ==================================== */

  function render(
    graph,
  ) {
    currentGraph =
      graph;


    const saved =
      loadSavedLayout();


    const defaults =
      createDefaultSlotMap(
        graph,
      );


    workspace = {
      nodes:
        {},

      edges: {
        ...(saved.edges ??
          {}),
      },
    };


    graph.nodes.forEach(
      (node) => {
        const savedSlot =
          parseSlot(
            saved.nodes?.[
              node.id
            ],
          )?.id;

        const jsonSlot =
          parseSlot(
            node.position,
          )?.id;

        const defaultSlot =
          parseSlot(
            defaults[
              node.id
            ],
          )?.id;


        workspace.nodes[
          node.id
        ] =
          savedSlot ??
          jsonSlot ??
          defaultSlot ??
          "1.1";
      },
    );


    setDirty(
      false,
    );


    rebuild();
  }


  /* ==================================== */
  /* MODELL NEU BERECHNEN                 */
  /* ==================================== */

  function rebuild() {
    clearPreview();


    const gridSize =
      getGridSize({
        graph:
          currentGraph,

        nodeSlots:
          workspace.nodes,
      });


    const localEdgeLanes =
      getLocalEdgeLanes();


    const routeModel =
      buildRoutes({
        graph:
          currentGraph,

        nodeSlots:
          workspace.nodes,

        rows:
          gridSize.rows,

        columns:
          gridSize.columns,

        localEdgeLanes,
      });


    const layout =
      buildPixelLayout({
        rows:
          gridSize.rows,

        columns:
          gridSize.columns,

        laneCounts:
          routeModel.laneCounts,
      });


    currentModel = {
      ...gridSize,

      ...routeModel,

      layout,
    };


    stage.style.width =
      `${layout.width}px`;

    stage.style.height =
      `${layout.height}px`;


    connectionsSvg.style.width =
      `${layout.width}px`;

    connectionsSvg.style.height =
      `${layout.height}px`;


    renderGridOverlay();

    renderNodes();

    drawConnections();

    renderLaneHandles();
  }


  /* ==================================== */
  /* KÄSTCHEN                             */
  /* ==================================== */

  function renderNodes() {
    nodesContainer.replaceChildren();


    currentGraph.nodes.forEach(
      (nodeData) => {
        const slotId =
          workspace.nodes[
            nodeData.id
          ];


        const rect =
          getSlotRect(
            currentModel.layout,
            slotId,
          );


        if (!rect) {
          return;
        }


        const element =
          createNodeElement(
            nodeData,
            slotId,
          );


        setNodeRect(
          element,
          rect,
        );


        nodesContainer.appendChild(
          element,
        );


        initGraphSlotDrag({
          node:
            element,

          stage,

          layout:
            currentModel.layout,

          signal,

          onPreview:
            (newSlot) => {
              showPreviewSlot(
                newSlot,
              );
            },

          onDrop:
            (newSlot) => {
              moveNodeToSlot(
                nodeData.id,
                newSlot,
              );
            },
        });
      },
    );
  }


  function moveNodeToSlot(
    nodeId,
    newSlot,
  ) {
    if (
      !parseSlot(
        newSlot,
      )
    ) {
      rebuild();

      return;
    }


    const oldSlot =
      workspace.nodes[
        nodeId
      ];


    if (
      oldSlot ===
      newSlot
    ) {
      rebuild();

      return;
    }


    const other =
      Object.entries(
        workspace.nodes,
      ).find(
        (
          [
            id,
            slot,
          ],
        ) =>
          id !==
            nodeId &&
          slot ===
            newSlot,
      );


    if (other) {
      workspace.nodes[
        other[0]
      ] =
        oldSlot;
    }


    workspace.nodes[
      nodeId
    ] =
      newSlot;


    markDirty();

    rebuild();
  }


  /* ==================================== */
  /* LINIEN                               */
  /* ==================================== */

  function drawConnections() {
    renderGraphConnections({
      svg:
        connectionsSvg,

      layout:
        currentModel.layout,

      edges:
        currentGraph.edges,

      routes:
        currentModel.routes,

      nodeSlots:
        workspace.nodes,
    });
  }


  /* ==================================== */
  /* LINIEN-SPUREN BEARBEITEN             */
  /* ==================================== */

  function renderLaneHandles() {
    if (
      !routePointsContainer
    ) {
      return;
    }


    routePointsContainer.replaceChildren();


    if (!routeEdit) {
      return;
    }


    currentGraph.edges.forEach(
      (edge) => {
        const route =
          currentModel.routes.get(
            edge.id,
          ) ??
          [];


        route.forEach(
          (
            step,
            index,
          ) => {
            const position =
              getLaneHandlePosition(
                currentModel.layout,
                step,
              );


            if (!position) {
              return;
            }


            const handle =
              document.createElement(
                "button",
              );


            handle.type =
              "button";

            handle.className =
              "graph-route-point";


            handle.style.left =
              `${position.x}px`;

            handle.style.top =
              `${position.y}px`;


            handle.textContent =
              String(
                step.spur,
              );


            handle.title =
              `${step.bereich} · Spur ${step.spur}`;


            routePointsContainer.appendChild(
              handle,
            );


            const laneCount =
              currentModel
                .laneCounts[
                  step.bereich
                ] ??
              1;


            initLaneHandleDrag({
              handle,
              stage,

              layout:
                currentModel.layout,

              corridorRect:
                position.rect,

              orientation:
                position.orientation,

              laneCount,

              signal,

              onDrop:
                (lane) => {
                  setEdgeLane(
                    edge.id,
                    step.bereich,
                    step.spur,
                    lane,
                  );
                },
            });
          },
        );
      },
    );
  }


  function setEdgeLane(
    edgeId,
    corridor,
    oldLane,
    newLane,
  ) {
    if (
      oldLane ===
      newLane
    ) {
      return;
    }


    /*
        Falls die Zielspur bereits von
        einer anderen Linie belegt ist,
        werden die beiden Spuren getauscht.
    */

    currentGraph.edges.forEach(
      (otherEdge) => {
        if (
          otherEdge.id ===
          edgeId
        ) {
          return;
        }


        const otherRoute =
          currentModel.routes.get(
            otherEdge.id,
          ) ??
          [];


        const matching =
          otherRoute.find(
            (step) =>
              step.bereich ===
                corridor &&
              step.spur ===
                newLane,
          );


        if (!matching) {
          return;
        }


        setLocalLane(
          otherEdge.id,
          corridor,
          oldLane,
        );
      },
    );


    setLocalLane(
      edgeId,
      corridor,
      newLane,
    );


    markDirty();

    rebuild();
  }


  function setLocalLane(
    edgeId,
    corridor,
    lane,
  ) {
    if (
      !workspace.edges[
        edgeId
      ]
    ) {
      workspace.edges[
        edgeId
      ] = {
        lanes:
          {},
      };
    }


    if (
      !workspace.edges[
        edgeId
      ].lanes
    ) {
      workspace.edges[
        edgeId
      ].lanes =
        {};
    }


    workspace.edges[
      edgeId
    ].lanes[
      corridor
    ] =
      lane;
  }


  function getLocalEdgeLanes() {
    const result =
      {};


    Object.entries(
      workspace.edges,
    ).forEach(
      (
        [
          edgeId,
          data,
        ],
      ) => {
        result[
          edgeId
        ] = {
          ...(data?.lanes ??
            {}),
        };
      },
    );


    return result;
  }


  function setRouteEdit(
    enabled,
  ) {
    routeEdit =
      Boolean(
        enabled,
      );


    renderLaneHandles();

    stage.classList.toggle(
      "is-line-editing",
      routeEdit,
    );
  }


  /* ==================================== */
  /* GRID-OVERLAY                         */
  /* ==================================== */

  function renderGridOverlay() {
    let overlay =
      stage.querySelector(
        "[data-graph-grid-overlay]",
      );


    if (!overlay) {
      overlay =
        document.createElement(
          "div",
        );

      overlay.className =
        "graph-grid-overlay";

      overlay.dataset.graphGridOverlay =
        "";

      stage.prepend(
        overlay,
      );
    }


    overlay.replaceChildren();


    const {
      rows,
      columns,
      layout,
    } =
      currentModel;


    for (
      let row = 1;
      row <=
      rows;
      row++
    ) {
      for (
        let column = 1;
        column <=
        columns;
        column++
      ) {
        const slotId =
          createSlotId(
            row,
            column,
          );

        const rect =
          getSlotRect(
            layout,
            slotId,
          );


        const slot =
          document.createElement(
            "div",
          );


        slot.className =
          "graph-grid-slot";

        slot.dataset.gridSlot =
          slotId;

        slot.textContent =
          slotId;


        setRect(
          slot,
          rect,
        );


        overlay.appendChild(
          slot,
        );
      }
    }


    /*
        Linienbereich-Beschriftungen.
    */

    for (
      let row = 1;
      row <=
      rows;
      row++
    ) {
      for (
        let gapColumn = 1;
        gapColumn <
        columns;
        gapColumn++
      ) {
        addCorridorLabel(
          overlay,
          `L${2 * row - 1}.${gapColumn}`,
          layout,
        );
      }
    }


    for (
      let gapRow = 1;
      gapRow <
      rows;
      gapRow++
    ) {
      for (
        let column = 1;
        column <=
        columns;
        column++
      ) {
        addCorridorLabel(
          overlay,
          `L${2 * gapRow}.${column}`,
          layout,
        );
      }
    }
  }


  function addCorridorLabel(
    overlay,
    corridorId,
    layout,
  ) {
    const rect =
      getCorridorRect(
        layout,
        corridorId,
      );


    if (!rect) {
      return;
    }


    const label =
      document.createElement(
        "span",
      );


    label.className =
      "graph-corridor-label";

    label.textContent =
      corridorId;


    label.style.left =
      `${rect.x + rect.width / 2}px`;

    label.style.top =
      `${rect.y + rect.height / 2}px`;


    overlay.appendChild(
      label,
    );
  }


  /* ==================================== */
  /* PREVIEW-SLOT                         */
  /* ==================================== */

  function showPreviewSlot(
    slotId,
  ) {
    if (
      previewSlot ===
      slotId
    ) {
      return;
    }


    clearPreview();


    previewSlot =
      slotId;


    stage
      .querySelector(
        `[data-grid-slot="${slotId}"]`,
      )
      ?.classList.add(
        "is-drop-target",
      );
  }


  function clearPreview() {
    stage
      .querySelector(
        ".graph-grid-slot.is-drop-target",
      )
      ?.classList.remove(
        "is-drop-target",
      );


    previewSlot =
      null;
  }


  /* ==================================== */
  /* SPEICHERN                            */
  /* ==================================== */

  function saveLayout() {
    localStorage.setItem(
      storageKey,
      JSON.stringify(
        {
          version:
            3,

          nodes:
            workspace.nodes,

          edges:
            workspace.edges,
        },
      ),
    );


    setDirty(
      false,
    );
  }


  function resetPositions() {
    localStorage.removeItem(
      storageKey,
    );


    render(
      currentGraph,
    );
  }


  function loadSavedLayout() {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            storageKey,
          ) ??
          "{}",
        );


      if (
        saved?.version !==
        3
      ) {
        return {
          nodes:
            {},

          edges:
            {},
        };
      }


      return {
        nodes:
          saved.nodes ??
          {},

        edges:
          saved.edges ??
          {},
      };
    }

    catch {
      return {
        nodes:
          {},

        edges:
          {},
      };
    }
  }


  function markDirty() {
    setDirty(
      true,
    );
  }


  function setDirty(
    value,
  ) {
    dirty =
      value;


    onDirtyChange?.(
      dirty,
    );
  }


  /* ==================================== */
  /* ZENTRIEREN                           */
  /* ==================================== */

  function centerOnFocus() {
    if (!currentModel) {
      return;
    }


    const focus =
      currentGraph.nodes.filter(
        (node) =>
          node.focus,
      );


    const target =
      focus[
        0
      ] ??
      currentGraph.nodes[
        0
      ];


    if (!target) {
      return;
    }


    const slotId =
      workspace.nodes[
        target.id
      ];

    const rect =
      getSlotRect(
        currentModel.layout,
        slotId,
      );


    if (!rect) {
      return;
    }


    scroll.scrollTo({
      left:
        Math.max(
          0,
          rect.x +
            rect.width /
              2 -
            scroll.clientWidth /
              2,
        ),

      top:
        Math.max(
          0,
          rect.y +
            rect.height /
              2 -
            scroll.clientHeight /
              2,
        ),

      behavior:
        "smooth",
    });
  }


  return {
    render,
    saveLayout,
    resetPositions,
    centerOnFocus,
    setRouteEdit,

    isDirty() {
      return dirty;
    },
  };
}


/* ======================================== */
/* KNOTEN-ELEMENT                           */
/* ======================================== */

function createNodeElement(
  node,
  slotId,
) {
  const element =
    document.createElement(
      "article",
    );


  element.className =
    [
      "graph-node",
      `graph-node--${node.kind ?? "resource"}`,
      node.focus
        ? "graph-node--focus"
        : "",
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  element.dataset.graphNodeId =
    node.id;


  const title =
    document.createElement(
      "strong",
    );

  title.className =
    "graph-node__title";

  title.textContent =
    node.label;


  element.appendChild(
    title,
  );


  if (
    node.subtitle
  ) {
    const subtitle =
      document.createElement(
        "span",
      );

    subtitle.className =
      "graph-node__subtitle";

    subtitle.textContent =
      node.subtitle;


    element.appendChild(
      subtitle,
    );
  }


  const footer =
    document.createElement(
      "div",
    );

  footer.className =
    "graph-node__footer";


  const kind =
    document.createElement(
      "span",
    );

  kind.className =
    "graph-node__kind";

  kind.textContent =
    node.kindLabel ??
    node.kind ??
    "";


  const coordinate =
    document.createElement(
      "span",
    );

  coordinate.className =
    "graph-node__coordinate";

  coordinate.textContent =
    `Pos ${slotId}`;


  footer.append(
    kind,
    coordinate,
  );


  element.appendChild(
    footer,
  );


  if (
    node.tierId
  ) {
    const info =
      document.createElement(
        "button",
      );

    info.type =
      "button";

    info.className =
      "graph-node__info";

    info.textContent =
      "i";

    info.dataset.graphInfo =
      "";

    info.dataset.graphTierId =
      node.tierId;

    info.dataset.page =
      "tier";

    info.setAttribute(
      "aria-label",
      `${node.label} – Info`,
    );


    element.appendChild(
      info,
    );
  }


  return element;
}


/* ======================================== */
/* CSS-RECT                                 */
/* ======================================== */

function setNodeRect(
  element,
  rect,
) {
  element.style.left =
    `${rect.x}px`;

  element.style.top =
    `${rect.y}px`;

  element.style.width =
    `${rect.width}px`;

  element.style.height =
    `${rect.height}px`;
}


function setRect(
  element,
  rect,
) {
  element.style.left =
    `${rect.x}px`;

  element.style.top =
    `${rect.y}px`;

  element.style.width =
    `${rect.width}px`;

  element.style.height =
    `${rect.height}px`;
}
