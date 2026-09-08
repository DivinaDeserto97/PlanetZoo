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
  initRouteGuideDrag,
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
  onZoomChange,
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
  /* VIEWPORT / ZOOM / PANNING            */
  /* ==================================== */

  const MIN_ZOOM =
    0.5;

  const MAX_ZOOM =
    2.5;

  const ZOOM_STEP =
    0.12;

  let zoom =
    1;

  let panDrag =
    null;


  const world =
    ensureGraphWorld({
      stage,
      connectionsSvg,
      routePointsContainer,
      nodesContainer,
    });


  bindViewportControls();


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

        localEdgeGuides:
          getLocalEdgeGuides(),
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


    world.style.width =
      `${layout.width}px`;

    world.style.height =
      `${layout.height}px`;


    connectionsSvg.style.width =
      `${layout.width}px`;

    connectionsSvg.style.height =
      `${layout.height}px`;


    applyZoomSize();


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

          stage:
            world,

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


        /*
            Erst die großen Führungs-Handles.

            Horizontal: nach oben / unten ziehen.
            Vertikal:   nach links / rechts ziehen.

            So wird nicht bloß die Spur innerhalb
            eines Korridors verändert, sondern die
            komplette Linienführung in eine andere
            Raster-Zeile bzw. Raster-Spalte gelegt.
        */
        renderRouteGuideHandles(
          edge,
          route,
        );


        /*
            Die bisherigen nummerierten Kreise
            bleiben erhalten und bearbeiten nur
            die Spur innerhalb des Korridors.
        */
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


            handle.dataset.edgeId =
              edge.id;

            handle.dataset.routeStep =
              String(
                index,
              );


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
              stage:
                world,
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


  function renderRouteGuideHandles(
    edge,
    route,
  ) {
    const runs =
      buildRouteRuns(
        route,
      );


    runs.forEach(
      (run) => {
        const geometry =
          getRouteRunGeometry(
            currentModel.layout,
            run,
          );


        if (!geometry) {
          return;
        }


        const handle =
          document.createElement(
            "button",
          );


        handle.type =
          "button";

        handle.className =
          `graph-route-guide graph-route-guide--${run.orientation}`;


        handle.dataset.edgeId =
          edge.id;

        handle.dataset.routeOrientation =
          run.orientation;


        handle.style.left =
          `${geometry.x}px`;

        handle.style.top =
          `${geometry.y}px`;


        handle.textContent =
          run.orientation ===
            "horizontal"
            ? "↕"
            : "↔";


        handle.title =
          run.orientation ===
            "horizontal"
            ? "Linie in eine andere Zeile ziehen · Rechtsklick: automatische Zeile"
            : "Linie in eine andere Spalte ziehen · Rechtsklick: automatische Spalte";


        routePointsContainer.appendChild(
          handle,
        );


        initRouteGuideDrag({
          handle,
          stage:
            world,
          layout:
            currentModel.layout,
          orientation:
            run.orientation,
          signal,
          onDrop:
            (value) => {
              setEdgeGuide(
                edge.id,
                run.orientation,
                value,
              );
            },
        });


        handle.addEventListener(
          "contextmenu",
          (event) => {
            event.preventDefault();
            event.stopPropagation();

            clearEdgeGuide(
              edge.id,
              run.orientation,
            );
          },
          { signal },
        );
      },
    );
  }


  function buildRouteRuns(
    route,
  ) {
    const runs =
      [];


    route.forEach(
      (step) => {
        const corridor =
          parseCorridor(
            step.bereich,
          );


        if (!corridor) {
          return;
        }


        const axis =
          corridor.orientation ===
            "horizontal"
            ? corridor.gapRow
            : corridor.gapColumn;


        const previous =
          runs[
            runs.length - 1
          ];


        if (
          previous &&
          previous.orientation ===
            corridor.orientation &&
          previous.axis ===
            axis
        ) {
          previous.steps.push(
            step,
          );

          return;
        }


        runs.push({
          orientation:
            corridor.orientation,
          axis,
          steps:
            [
              step,
            ],
        });
      },
    );


    return runs;
  }


  function getRouteRunGeometry(
    layout,
    run,
  ) {
    const positions =
      run.steps
        .map(
          (step) =>
            getLaneHandlePosition(
              layout,
              step,
            ),
        )
        .filter(
          Boolean,
        );


    if (!positions.length) {
      return null;
    }


    return {
      x:
        positions.reduce(
          (sum, position) =>
            sum +
            position.x,
          0,
        ) /
        positions.length,

      y:
        positions.reduce(
          (sum, position) =>
            sum +
            position.y,
          0,
        ) /
        positions.length,
    };
  }


  function setEdgeGuide(
    edgeId,
    orientation,
    value,
  ) {
    if (
      !workspace.edges[
        edgeId
      ]
    ) {
      workspace.edges[
        edgeId
      ] =
        {};
    }


    if (
      !workspace.edges[
        edgeId
      ].guides
    ) {
      workspace.edges[
        edgeId
      ].guides =
        {};
    }


    const key =
      orientation ===
        "horizontal"
        ? "horizontalGapRow"
        : "verticalGapColumn";


    if (
      workspace.edges[
        edgeId
      ].guides[
        key
      ] ===
      value
    ) {
      return;
    }


    workspace.edges[
      edgeId
    ].guides[
      key
    ] =
      value;


    markDirty();
    rebuild();
  }


  function clearEdgeGuide(
    edgeId,
    orientation,
  ) {
    const guides =
      workspace.edges?.[
        edgeId
      ]?.guides;


    if (!guides) {
      return;
    }


    const key =
      orientation ===
        "horizontal"
        ? "horizontalGapRow"
        : "verticalGapColumn";


    if (
      !Object.prototype.hasOwnProperty.call(
        guides,
        key,
      )
    ) {
      return;
    }


    delete guides[
      key
    ];


    if (
      !Object.keys(
        guides,
      ).length
    ) {
      delete workspace.edges[
        edgeId
      ].guides;
    }


    markDirty();
    rebuild();
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


  function getLocalEdgeGuides() {
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
        if (
          data?.guides &&
          typeof data.guides ===
            "object"
        ) {
          result[
            edgeId
          ] = {
            ...data.guides,
          };
        }
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
      world.querySelector(
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

      world.prepend(
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


    world
      .querySelector(
        `[data-grid-slot="${slotId}"]`,
      )
      ?.classList.add(
        "is-drop-target",
      );
  }


  function clearPreview() {
    world
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
  /* VIEWPORT-STEUERUNG                   */
  /* ==================================== */

  function bindViewportControls() {
    scroll.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();


        const rect =
          scroll.getBoundingClientRect();

        const anchorX =
          event.clientX -
          rect.left;

        const anchorY =
          event.clientY -
          rect.top;

        const direction =
          event.deltaY < 0
            ? 1
            : -1;


        setZoom(
          zoom +
            direction *
              ZOOM_STEP,
          {
            anchorX,
            anchorY,
          },
        );
      },
      {
        signal,
        passive: false,
      },
    );


    scroll.addEventListener(
      "pointerdown",
      (event) => {
        /*
            Mittlere Maustaste / Mausrad:
            komplette Arbeitsfläche verschieben.
        */
        if (
          event.button !==
          1
        ) {
          return;
        }


        event.preventDefault();


        panDrag = {
          pointerId:
            event.pointerId,

          startX:
            event.clientX,

          startY:
            event.clientY,

          startLeft:
            scroll.scrollLeft,

          startTop:
            scroll.scrollTop,
        };


        scroll.classList.add(
          "is-panning",
        );


        scroll.setPointerCapture(
          event.pointerId,
        );
      },
      { signal },
    );


    scroll.addEventListener(
      "pointermove",
      (event) => {
        if (
          !panDrag ||
          panDrag.pointerId !==
            event.pointerId
        ) {
          return;
        }


        event.preventDefault();


        scroll.scrollLeft =
          panDrag.startLeft -
          (
            event.clientX -
            panDrag.startX
          );

        scroll.scrollTop =
          panDrag.startTop -
          (
            event.clientY -
            panDrag.startY
          );
      },
      { signal },
    );


    const finishPan =
      (event) => {
        if (
          !panDrag ||
          panDrag.pointerId !==
            event.pointerId
        ) {
          return;
        }


        if (
          scroll.hasPointerCapture(
            event.pointerId,
          )
        ) {
          scroll.releasePointerCapture(
            event.pointerId,
          );
        }


        panDrag =
          null;

        scroll.classList.remove(
          "is-panning",
        );
      };


    scroll.addEventListener(
      "pointerup",
      finishPan,
      { signal },
    );

    scroll.addEventListener(
      "pointercancel",
      finishPan,
      { signal },
    );


    scroll.addEventListener(
      "auxclick",
      (event) => {
        if (
          event.button ===
          1
        ) {
          event.preventDefault();
        }
      },
      { signal },
    );
  }


  function applyZoomSize() {
    world.dataset.graphScale =
      String(
        zoom,
      );

    world.style.transform =
      `scale(${zoom})`;

    world.style.transformOrigin =
      "0 0";


    if (!currentModel) {
      return;
    }


    stage.style.width =
      `${currentModel.layout.width * zoom}px`;

    stage.style.height =
      `${currentModel.layout.height * zoom}px`;
  }


  function setZoom(
    value,
    {
      anchorX =
        scroll.clientWidth /
        2,

      anchorY =
        scroll.clientHeight /
        2,
    } = {},
  ) {
    const nextZoom =
      Math.max(
        MIN_ZOOM,
        Math.min(
          MAX_ZOOM,
          Number(
            value,
          ) ||
            1,
        ),
      );


    if (
      Math.abs(
        nextZoom -
        zoom,
      ) <
      0.001
    ) {
      return;
    }


    const logicalX =
      (
        scroll.scrollLeft +
        anchorX
      ) /
      zoom;

    const logicalY =
      (
        scroll.scrollTop +
        anchorY
      ) /
      zoom;


    zoom =
      nextZoom;


    applyZoomSize();


    scroll.scrollTo({
      left:
        logicalX *
          zoom -
        anchorX,

      top:
        logicalY *
          zoom -
        anchorY,

      behavior:
        "auto",
    });


    onZoomChange?.(
      zoom,
    );
  }


  function resetZoom() {
    setZoom(
      1,
    );
  }


  function panBy(
    x,
    y,
    behavior =
      "smooth",
  ) {
    scroll.scrollBy({
      left: x,
      top: y,
      behavior,
    });
  }


  function panByViewport(
    xFactor,
    yFactor,
  ) {
    panBy(
      scroll.clientWidth *
        xFactor,
      scroll.clientHeight *
        yFactor,
    );
  }


  /* ==================================== */
  /* AUSWAHL / NETZ ZENTRIEREN            */
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


    const targets =
      focus.length
        ? focus
        : currentGraph.nodes;


    const rects =
      targets
        .map(
          (node) =>
            getSlotRect(
              currentModel.layout,
              workspace.nodes[
                node.id
              ],
            ),
        )
        .filter(
          Boolean,
        );


    if (!rects.length) {
      return;
    }


    const left =
      Math.min(
        ...rects.map(
          (rect) =>
            rect.x,
        ),
      );

    const top =
      Math.min(
        ...rects.map(
          (rect) =>
            rect.y,
        ),
      );

    const right =
      Math.max(
        ...rects.map(
          (rect) =>
            rect.x +
            rect.width,
        ),
      );

    const bottom =
      Math.max(
        ...rects.map(
          (rect) =>
            rect.y +
            rect.height,
        ),
      );


    scroll.scrollTo({
      left:
        Math.max(
          0,
          (
            left +
            right
          ) /
            2 *
            zoom -
          scroll.clientWidth /
            2,
        ),

      top:
        Math.max(
          0,
          (
            top +
            bottom
          ) /
            2 *
            zoom -
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
    setZoom,
    resetZoom,
    panBy,
    panByViewport,

    getZoom() {
      return zoom;
    },

    isDirty() {
      return dirty;
    },
  };
}


/* ======================================== */
/* LOGISCHE WELT FÜR ZOOM                   */
/* ======================================== */

function ensureGraphWorld({
  stage,
  connectionsSvg,
  routePointsContainer,
  nodesContainer,
}) {
  let world =
    stage.querySelector(
      ":scope > .graph-world",
    );


  if (!world) {
    world =
      document.createElement(
        "div",
      );

    world.className =
      "graph-world";

    world.dataset.graphWorld =
      "";

    stage.appendChild(
      world,
    );
  }


  [
    connectionsSvg,
    routePointsContainer,
    nodesContainer,
  ].forEach(
    (layer) => {
      if (
        layer &&
        layer.parentElement !==
          world
      ) {
        world.appendChild(
          layer,
        );
      }
    },
  );


  return world;
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


  if (node.tierId) {
    element.dataset.graphTierId =
      node.tierId;
  }


  if (node.color) {
    element.style.setProperty(
      "--nahrungsnetz-node-color",
      node.color,
    );
  }


  if (
    typeof node.selected ===
    "boolean"
  ) {
    element.classList.toggle(
      "is-nahrungsnetz-selected",
      node.selected,
    );

    element.classList.toggle(
      "is-nahrungsnetz-unselected",
      !node.selected,
    );
  }


  /*
      Auswahlbox direkt im Graph-Knoten.

      Dadurch bleibt sie auch dann bestehen,
      wenn graphCanvas nach einem Drag intern
      die Knoten neu aufbaut.
  */
  if (
    node.tierId &&
    typeof node.selected ===
      "boolean"
  ) {
    const checkbox =
      document.createElement(
        "input",
      );

    checkbox.type =
      "checkbox";

    checkbox.className =
      "graph-node__select";

    checkbox.dataset.graphTierCheckbox =
      "";

    checkbox.dataset.graphTierId =
      node.tierId;

    checkbox.checked =
      node.selected;

    checkbox.setAttribute(
      "aria-label",
      `${node.label} auswählen`,
    );

    element.appendChild(
      checkbox,
    );
  }


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
