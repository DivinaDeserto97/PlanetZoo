import {
  initGraphDrag,
} from "./graphDrag.js";

import {
  renderGraphConnections,
} from "./graphConnections.js";


/* ======================================== */
/* GRAPH-CANVAS                             */
/* ======================================== */

export function createGraphCanvas({
  stage,
  scroll,
  nodesContainer,
  connectionsSvg,
  storageKey,
  signal,
}) {
  let currentGraph = {
    nodes:
      [],

    edges:
      [],
  };


  const nodeElements =
    new Map();


  let resizeObserver =
    null;


  function render(
    graph,
  ) {
    currentGraph =
      graph;


    nodeElements.clear();

    nodesContainer.replaceChildren();


    const positions =
      loadPositions();


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


        const position =
          positions[
            nodeData.id
          ] ??
          defaults[
            nodeData.id
          ];


        element.style.left =
          `${position.x}px`;

        element.style.top =
          `${position.y}px`;


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

          onMove:
            draw,

          onEnd:
            (newPosition) => {
              savePosition(
                nodeData.id,
                newPosition,
              );

              draw();
            },
        });
      },
    );


    observeNodes();


    requestAnimationFrame(
      () => {
        draw();

        if (
          !Object.keys(
            positions,
          ).length
        ) {
          centerOnFocus();
        }
      },
    );
  }


  function draw() {
    renderGraphConnections({
      svg:
        connectionsSvg,

      stage,

      edges:
        currentGraph.edges,

      nodeElements,
    });
  }


  function resetPositions() {
    localStorage.removeItem(
      storageKey,
    );


    render(
      currentGraph,
    );
  }


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
    resetPositions,
    centerOnFocus,
  };


  /* ==================================== */
  /* POSITIONEN                           */
  /* ==================================== */

  function loadPositions() {
    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            storageKey,
          ) ??
          "{}",
        );


      return (
        saved &&
        typeof saved ===
          "object"
          ? saved
          : {}
      );
    }

    catch {
      return {};
    }
  }


  function savePosition(
    id,
    position,
  ) {
    const all =
      loadPositions();


    all[id] = {
      x:
        Math.round(
          position.x,
        ),

      y:
        Math.round(
          position.y,
        ),
    };


    localStorage.setItem(
      storageKey,
      JSON.stringify(
        all,
      ),
    );
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


  element.appendChild(
    kind,
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
/* STANDARD-LAYOUT                          */
/* ======================================== */

function createDefaultPositions(
  graph,
) {
  const buckets = {
    left:
      [],

    focus:
      [],

    right:
      [],

    other:
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


      if (
        [
          "plant",
          "resource",
          "carrion",
          "water",
          "mineral",
        ].includes(
          node.kind,
        )
      ) {
        buckets.left.push(
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
        buckets.left.push(
          node,
        );
      }

      else if (
        consumesFocus &&
        !feedsFocus
      ) {
        buckets.right.push(
          node,
        );
      }

      else {
        buckets.other.push(
          node,
        );
      }
    },
  );


  const result =
    {};


  placeBucket(
    result,
    buckets.left,
    90,
    80,
  );

  placeBucket(
    result,
    buckets.focus,
    690,
    150,
  );

  placeBucket(
    result,
    buckets.other,
    1010,
    100,
  );

  placeBucket(
    result,
    buckets.right,
    1340,
    80,
  );


  return result;
}


function placeBucket(
  result,
  nodes,
  startX,
  startY,
) {
  const rowsPerColumn =
    7;

  const rowGap =
    120;

  const columnGap =
    245;


  nodes.forEach(
    (
      node,
      index,
    ) => {
      const column =
        Math.floor(
          index /
          rowsPerColumn,
        );

      const row =
        index %
        rowsPerColumn;


      result[
        node.id
      ] = {
        x:
          startX +
          column *
            columnGap,

        y:
          startY +
          row *
            rowGap,
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
        1800,
        1500 +
          Math.ceil(
            nodeCount /
            20,
          ) *
            260,
      ),

    height:
      Math.max(
        950,
        850 +
          Math.ceil(
            nodeCount /
            28,
          ) *
            160,
      ),
  };
}
