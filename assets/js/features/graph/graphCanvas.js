import {
  initGraphDrag,
  initGraphPointDrag,
  snapValue,
} from "./graphDrag.js";

import {
  createDefaultRoute,
  renderGraphConnections,
} from "./graphConnections.js";


const SNAP =
  20;


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


  const nodeElements =
    new Map();


  let workspace = {
    nodes:
      {},

    edges:
      {},
  };


  let dirty =
    false;

  let routeEdit =
    false;

  let resizeObserver =
    null;


  /* ==================================== */
  /* RENDERN                              */
  /* ==================================== */

  function render(
    graph,
  ) {
    currentGraph =
      graph;


    nodeElements.clear();

    nodesContainer.replaceChildren();

    routePointsContainer?.replaceChildren();


    const saved =
      loadSavedLayout();


    workspace = {
      nodes: {
        ...(saved.nodes ??
          {}),
      },

      edges: {
        ...(saved.edges ??
          {}),
      },
    };


    const defaults =
      createDefaultPositions(
        graph,
      );


    const size =
      calculateStageSize(
        graph.nodes.length,
      );


    stage.style.width =
      `${size.width}px`;

    stage.style.height =
      `${size.height}px`;


    graph.nodes.forEach(
      (nodeData) => {
        const element =
          createNodeElement(
            nodeData,
          );


        const jsonPosition =
          normalizePosition(
            nodeData.position,
          );


        const position =
          normalizePosition(
            workspace
              .nodes[
                nodeData.id
              ],
          ) ??
          jsonPosition ??
          defaults[
            nodeData.id
          ];


        workspace.nodes[
          nodeData.id
        ] = {
          x:
            snapValue(
              position.x,
              SNAP,
            ),

          y:
            snapValue(
              position.y,
              SNAP,
            ),
        };


        setNodePosition(
          element,
          workspace
            .nodes[
              nodeData.id
            ],
        );


        nodesContainer.appendChild(
          element,
        );


        nodeElements.set(
          nodeData.id,
          element,
        );


        initGraphDrag({
          node:
            element,

          stage,

          signal,

          snap:
            SNAP,

          onMove:
            (newPosition) => {
              workspace.nodes[
                nodeData.id
              ] =
                newPosition;


              updateNodeCoordinate(
                element,
                newPosition,
              );


              /*
                  Automatische Linien bleiben
                  am Knoten hängen.

                  Benutzerdefinierte Routen
                  behalten ihre festen Punkte.
              */

              draw();
            },

          onEnd:
            (newPosition) => {
              workspace.nodes[
                nodeData.id
              ] =
                newPosition;


              updateNodeCoordinate(
                element,
                newPosition,
              );


              markDirty();

              draw();
            },
        });
      },
    );


    /*
        JSON-Routen werden erst übernommen,
        wenn noch keine lokal gespeicherte
        Route existiert.
    */

    graph.edges.forEach(
      (edge) => {
        if (
          !workspace.edges[
            edge.id
          ] &&
          Array.isArray(
            edge.route,
          ) &&
          edge.route.length
        ) {
          workspace.edges[
            edge.id
          ] = {
            points:
              edge.route
                .map(
                  normalizePosition,
                )
                .filter(
                  Boolean,
                ),
          };
        }
      },
    );


    setDirty(
      false,
    );


    observeNodes();


    requestAnimationFrame(
      () => {
        draw();
        centerOnFocus();
      },
    );
  }


  /* ==================================== */
  /* ZEICHNEN                             */
  /* ==================================== */

  function draw() {
    const routes =
      getRenderRoutes();


    renderGraphConnections({
      svg:
        connectionsSvg,

      stage,

      edges:
        currentGraph.edges,

      nodeElements,

      routes,
    });


    renderRouteHandles(
      routes,
    );
  }


  function getRenderRoutes() {
    const routes =
      {};


    currentGraph.edges.forEach(
      (edge) => {
        const custom =
          workspace.edges[
            edge.id
          ]?.points;


        if (
          Array.isArray(
            custom,
          ) &&
          custom.length
        ) {
          routes[
            edge.id
          ] =
            custom;

          return;
        }


        const from =
          nodeElements.get(
            edge.from,
          );

        const to =
          nodeElements.get(
            edge.to,
          );


        if (
          !from ||
          !to
        ) {
          routes[
            edge.id
          ] =
            [];

          return;
        }


        routes[
          edge.id
        ] =
          createDefaultRoute({
            from,
            to,
            stage,
            snap:
              SNAP,
          });
      },
    );


    return routes;
  }


  /* ==================================== */
  /* ROUTEN-PUNKTE                        */
  /* ==================================== */

  function renderRouteHandles(
    routes,
  ) {
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
        const points =
          routes[
            edge.id
          ] ??
          [];


        points.forEach(
          (
            pointData,
            pointIndex,
          ) => {
            const point =
              document.createElement(
                "button",
              );


            point.type =
              "button";

            point.className =
              "graph-route-point";

            point.dataset.edgeId =
              edge.id;

            point.dataset.pointIndex =
              String(
                pointIndex,
              );


            point.textContent =
              String(
                pointIndex +
                  1,
              );


            setRoutePointPosition(
              point,
              pointData,
            );


            point.title =
              `P${pointIndex + 1} · X ${pointData.x} · Y ${pointData.y}`;


            routePointsContainer.appendChild(
              point,
            );


            initGraphPointDrag({
              point,
              stage,
              signal,

              snap:
                SNAP,

              onMove:
                (position) => {
                  ensureCustomRoute(
                    edge,
                    routes[
                      edge.id
                    ],
                  );


                  workspace
                    .edges[
                      edge.id
                    ]
                    .points[
                      pointIndex
                    ] =
                      position;


                  point.title =
                    `P${pointIndex + 1} · X ${position.x} · Y ${position.y}`;


                  drawConnectionsOnly();
                },

              onEnd:
                (position) => {
                  ensureCustomRoute(
                    edge,
                    routes[
                      edge.id
                    ],
                  );


                  workspace
                    .edges[
                      edge.id
                    ]
                    .points[
                      pointIndex
                    ] =
                      position;


                  markDirty();

                  draw();
                },
            });
          },
        );
      },
    );
  }


  function ensureCustomRoute(
    edge,
    defaultPoints,
  ) {
    if (
      workspace.edges[
        edge.id
      ]?.points
    ) {
      return;
    }


    workspace.edges[
      edge.id
    ] = {
      points:
        defaultPoints.map(
          (point) => ({
            x:
              point.x,

            y:
              point.y,
          }),
        ),
    };
  }


  function drawConnectionsOnly() {
    renderGraphConnections({
      svg:
        connectionsSvg,

      stage,

      edges:
        currentGraph.edges,

      nodeElements,

      routes:
        getRenderRoutes(),
    });
  }


  function setRouteEdit(
    enabled,
  ) {
    routeEdit =
      Boolean(
        enabled,
      );


    draw();
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
            2,

          snap:
            SNAP,

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
    const focus =
      currentGraph.nodes.filter(
        (node) =>
          node.focus,
      );


    const targetNodes =
      focus.length
        ? focus
        : currentGraph.nodes;


    if (
      !targetNodes.length
    ) {
      return;
    }


    const centers =
      targetNodes
        .map(
          (node) => {
            const element =
              nodeElements.get(
                node.id,
              );


            if (!element) {
              return null;
            }


            return {
              x:
                (
                  Number.parseFloat(
                    element.style.left,
                  ) ||
                  0
                ) +
                element.offsetWidth /
                  2,

              y:
                (
                  Number.parseFloat(
                    element.style.top,
                  ) ||
                  0
                ) +
                element.offsetHeight /
                  2,
            };
          },
        )
        .filter(
          Boolean,
        );


    if (
      !centers.length
    ) {
      return;
    }


    const center = {
      x:
        centers.reduce(
          (
            sum,
            point,
          ) =>
            sum +
            point.x,
          0,
        ) /
        centers.length,

      y:
        centers.reduce(
          (
            sum,
            point,
          ) =>
            sum +
            point.y,
          0,
        ) /
        centers.length,
    };


    scroll.scrollTo({
      left:
        Math.max(
          0,
          center.x -
            scroll.clientWidth /
              2,
        ),

      top:
        Math.max(
          0,
          center.y -
            scroll.clientHeight /
              2,
        ),

      behavior:
        "smooth",
    });
  }


  /* ==================================== */
  /* OBSERVER                             */
  /* ==================================== */

  function observeNodes() {
    resizeObserver?.disconnect();


    if (
      typeof ResizeObserver !==
      "function"
    ) {
      return;
    }


    resizeObserver =
      new ResizeObserver(
        draw,
      );


    nodeElements.forEach(
      (element) =>
        resizeObserver.observe(
          element,
        ),
    );


    resizeObserver.observe(
      stage,
    );
  }


  signal.addEventListener(
    "abort",
    () => {
      resizeObserver?.disconnect();
    },
    {
      once:
        true,
    },
  );


  return {
    render,
    draw,
    saveLayout,
    resetPositions,
    centerOnFocus,
    setRouteEdit,

    isDirty() {
      return dirty;
    },

    getSnap() {
      return SNAP;
    },
  };


  /* ==================================== */
  /* LAYOUT LADEN                         */
  /* ==================================== */

  function loadSavedLayout() {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            storageKey,
          ) ??
          "{}",
        );


      /*
          Alte Version nur mit
          Knotenpositionen weiterhin
          akzeptieren.
      */

      if (
        saved &&
        typeof saved ===
          "object" &&
        !saved.nodes &&
        !saved.edges
      ) {
        return {
          nodes:
            saved,

          edges:
            {},
        };
      }


      return {
        nodes:
          saved?.nodes ??
          {},

        edges:
          saved?.edges ??
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
}


/* ======================================== */
/* KNOTEN-ELEMENT                           */
/* ======================================== */

function createNodeElement(
  node,
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

  coordinate.dataset.graphCoordinate =
    "";


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
/* POSITION ANZEIGEN                        */
/* ======================================== */

function setNodePosition(
  element,
  position,
) {
  element.style.left =
    `${position.x}px`;

  element.style.top =
    `${position.y}px`;


  updateNodeCoordinate(
    element,
    position,
  );
}


function updateNodeCoordinate(
  element,
  position,
) {
  const coordinate =
    element.querySelector(
      "[data-graph-coordinate]",
    );


  if (coordinate) {
    coordinate.textContent =
      `X ${Math.round(position.x)} · Y ${Math.round(position.y)}`;
  }
}


function setRoutePointPosition(
  element,
  position,
) {
  element.style.left =
    `${position.x}px`;

  element.style.top =
    `${position.y}px`;
}


/* ======================================== */
/* STANDARD-LAYOUT                          */
/* ======================================== */

function createDefaultPositions(
  graph,
) {
  const buckets = {
    input:
      [],

    focus:
      [],

    mixed:
      [],

    predator:
      [],
  };


  const focusIds =
    new Set(
      graph.nodes
        .filter(
          (node) =>
            node.focus,
        )
        .map(
          (node) =>
            node.id,
        ),
    );


  graph.nodes.forEach(
    (node) => {
      if (
        node.focus
      ) {
        buckets.focus.push(
          node,
        );

        return;
      }


      const feedsFocus =
        graph.edges.some(
          (edge) =>
            edge.from ===
              node.id &&
            focusIds.has(
              edge.to,
            ),
        );


      const consumesFocus =
        graph.edges.some(
          (edge) =>
            focusIds.has(
              edge.from,
            ) &&
            edge.to ===
              node.id,
        );


      if (
        feedsFocus &&
        !consumesFocus
      ) {
        buckets.input.push(
          node,
        );
      }

      else if (
        consumesFocus &&
        !feedsFocus
      ) {
        buckets.predator.push(
          node,
        );
      }

      else {
        buckets.mixed.push(
          node,
        );
      }
    },
  );


  const result =
    {};


  placeGrid(
    result,
    buckets.input,
    100,
    100,
    2,
  );

  placeGrid(
    result,
    buckets.focus,
    760,
    180,
    1,
  );

  placeGrid(
    result,
    buckets.mixed,
    1110,
    100,
    1,
  );

  placeGrid(
    result,
    buckets.predator,
    1450,
    100,
    1,
  );


  return result;
}


function placeGrid(
  result,
  nodes,
  startX,
  startY,
  columns,
) {
  const columnGap =
    260;

  const rowGap =
    130;


  nodes.forEach(
    (
      node,
      index,
    ) => {
      const column =
        index %
        columns;

      const row =
        Math.floor(
          index /
          columns,
        );


      result[
        node.id
      ] = {
        x:
          snapValue(
            startX +
              column *
                columnGap,
            SNAP,
          ),

        y:
          snapValue(
            startY +
              row *
                rowGap,
            SNAP,
          ),
      };
    },
  );
}


function calculateStageSize(
  nodeCount,
) {
  return {
    width:
      Math.max(
        1900,
        1600 +
          Math.ceil(
            nodeCount /
            20,
          ) *
            300,
      ),

    height:
      Math.max(
        1000,
        850 +
          Math.ceil(
            nodeCount /
            24,
          ) *
            200,
      ),
  };
}


function normalizePosition(
  value,
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }


  const x =
    Number(
      value.x,
    );

  const y =
    Number(
      value.y,
    );


  if (
    !Number.isFinite(
      x,
    ) ||
    !Number.isFinite(
      y,
    )
  ) {
    return null;
  }


  return {
    x:
      snapValue(
        x,
        SNAP,
      ),

    y:
      snapValue(
        y,
        SNAP,
      ),
  };
}
