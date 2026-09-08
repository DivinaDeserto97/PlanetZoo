import {
  getCorridorRect,
  getLaneCoordinate,
  getSlotRect,
  parseCorridor,
} from "./graphGrid.js";


const SVG_NS =
  "http://www.w3.org/2000/svg";


/* ======================================== */
/* VERBINDUNGEN ZEICHNEN                    */
/* ======================================== */

export function renderGraphConnections({
  svg,
  layout,
  edges,
  routes,
  nodeSlots,
}) {
  if (
    !svg ||
    !layout
  ) {
    return;
  }


  svg.replaceChildren();


  svg.setAttribute(
    "width",
    String(
      layout.width,
    ),
  );

  svg.setAttribute(
    "height",
    String(
      layout.height,
    ),
  );

  svg.setAttribute(
    "viewBox",
    `0 0 ${layout.width} ${layout.height}`,
  );


  svg.appendChild(
    createDefs(),
  );


  edges.forEach(
    (edge) => {
      const route =
        routes.get(
          edge.id,
        ) ??
        [];


      const fromSlot =
        nodeSlots[
          edge.from
        ];

      const toSlot =
        nodeSlots[
          edge.to
        ];


      if (
        !route.length ||
        !fromSlot ||
        !toSlot
      ) {
        return;
      }


      const geometry =
        buildGeometry({
          layout,
          route,
          fromSlot,
          toSlot,
        });


      if (
        !geometry.path
      ) {
        return;
      }


      const path =
        document.createElementNS(
          SVG_NS,
          "path",
        );


      path.classList.add(
        "graph-edge",
        `graph-edge--${edge.type ?? "direct"}`,
      );


      path.dataset.edgeId =
        edge.id;


      path.setAttribute(
        "d",
        geometry.path,
      );


      /*
          Optionaler Farbwert aus dem
          jeweiligen Graph-Modul.

          Das Nahrungsnetz verwendet ihn
          für die Farbe des ownerTierId.
          Andere Graphen können ihn einfach
          weglassen und behalten das CSS-
          Standard-Styling.
      */

      if (edge.color) {
        path.style.stroke =
          edge.color;
      }


      path.classList.toggle(
        "graph-edge--selected",
        edge.selected ===
          true,
      );


      path.classList.toggle(
        "graph-edge--unselected",
        edge.selected ===
          false,
      );


      path.setAttribute(
        "marker-end",
        "url(#graph-arrow)",
      );


      svg.appendChild(
        path,
      );


      if (
        edge.label
      ) {
        const label =
          document.createElementNS(
            SVG_NS,
            "text",
          );


        label.classList.add(
          "graph-edge-label",
        );


        label.setAttribute(
          "x",
          String(
            geometry.label.x,
          ),
        );

        label.setAttribute(
          "y",
          String(
            geometry.label.y -
              6,
          ),
        );


        label.textContent =
          edge.label;


        if (edge.color) {
          label.style.fill =
            edge.color;
        }


        label.classList.toggle(
          "graph-edge-label--selected",
          edge.selected ===
            true,
        );


        label.classList.toggle(
          "graph-edge-label--unselected",
          edge.selected ===
            false,
        );


        svg.appendChild(
          label,
        );
      }
    },
  );
}


/* ======================================== */
/* PFAD-GEOMETRIE                           */
/* ======================================== */

function buildGeometry({
  layout,
  route,
  fromSlot,
  toSlot,
}) {
  const fromRect =
    getSlotRect(
      layout,
      fromSlot,
    );

  const toRect =
    getSlotRect(
      layout,
      toSlot,
    );


  if (
    !fromRect ||
    !toRect
  ) {
    return {
      path:
        "",

      label: {
        x:
          0,

        y:
          0,
      },
    };
  }


  const first =
    getRoutePoint(
      layout,
      route[0],
    );

  const last =
    getRoutePoint(
      layout,
      route[
        route.length -
        1
      ],
    );


  if (
    !first ||
    !last
  ) {
    return {
      path:
        "",

      label: {
        x:
          0,

        y:
          0,
      },
    };
  }


  const points =
    [];


  const startPort =
    getNodePort(
      fromRect,
      first.corridor,
      "start",
    );


  const startEntry =
    getNodeCorridorEntry(
      fromRect,
      first,
    );


  points.push(
    startPort,
    startEntry,
  );


  for (
    let index = 0;
    index <
    route.length -
      1;
    index++
  ) {
    const a =
      getRoutePoint(
        layout,
        route[
          index
        ],
      );

    const b =
      getRoutePoint(
        layout,
        route[
          index +
          1
        ],
      );


    const junction =
      getJunctionPoint(
        a,
        b,
      );


    if (junction) {
      points.push(
        junction,
      );
    }
  }


  const endEntry =
    getNodeCorridorEntry(
      toRect,
      last,
    );

  const endPort =
    getNodePort(
      toRect,
      last.corridor,
      "end",
    );


  points.push(
    endEntry,
    endPort,
  );


  const cleaned =
    removeDuplicatePoints(
      points,
    );


  const path =
    cleaned
      .map(
        (
          point,
          index,
        ) =>
          `${index === 0 ? "M" : "L"} ${round(point.x)} ${round(point.y)}`,
      )
      .join(
        " ",
      );


  const label =
    cleaned[
      Math.floor(
        cleaned.length /
          2,
      )
    ] ??
    endPort;


  return {
    path,
    label,
  };
}


/* ======================================== */
/* ROUTEN-PUNKT                             */
/* ======================================== */

function getRoutePoint(
  layout,
  step,
) {
  const corridor =
    parseCorridor(
      step.bereich,
    );

  const rect =
    getCorridorRect(
      layout,
      step.bereich,
    );

  const lane =
    getLaneCoordinate(
      layout,
      step.bereich,
      step.spur,
    );


  if (
    !corridor ||
    !rect ||
    !lane
  ) {
    return null;
  }


  return {
    corridor,
    rect,
    lane,
  };
}


/* ======================================== */
/* KNOTEN -> KORRIDOR                       */
/* ======================================== */

function getNodePort(
  nodeRect,
  corridor,
) {
  if (
    corridor.orientation ===
    "vertical"
  ) {
    const corridorIsLeft =
      corridor.gapColumn <
      nodeRect.column;


    return {
      x:
        corridorIsLeft
          ? nodeRect.x
          : nodeRect.x +
            nodeRect.width,

      y:
        nodeRect.y +
        nodeRect.height /
          2,
    };
  }


  const corridorIsAbove =
    corridor.gapRow <
    nodeRect.row;


  return {
    x:
      nodeRect.x +
      nodeRect.width /
        2,

    y:
      corridorIsAbove
        ? nodeRect.y
        : nodeRect.y +
          nodeRect.height,
  };
}


function getNodeCorridorEntry(
  nodeRect,
  routePoint,
) {
  const corridor =
    routePoint.corridor;


  if (
    corridor.orientation ===
    "vertical"
  ) {
    return {
      x:
        routePoint.lane.x,

      y:
        nodeRect.y +
        nodeRect.height /
          2,
    };
  }


  return {
    x:
      nodeRect.x +
      nodeRect.width /
        2,

    y:
      routePoint.lane.y,
  };
}


/* ======================================== */
/* KREUZUNG ZWEIER LINIENBEREICHE           */
/* ======================================== */

function getJunctionPoint(
  a,
  b,
) {
  if (
    !a ||
    !b
  ) {
    return null;
  }


  if (
    a.corridor.orientation ===
      "vertical" &&
    b.corridor.orientation ===
      "horizontal"
  ) {
    return {
      x:
        a.lane.x,

      y:
        b.lane.y,
    };
  }


  if (
    a.corridor.orientation ===
      "horizontal" &&
    b.corridor.orientation ===
      "vertical"
  ) {
    return {
      x:
        b.lane.x,

      y:
        a.lane.y,
    };
  }


  return null;
}


/* ======================================== */
/* EDITIER-HANDLE-POSITION                  */
/* ======================================== */

export function getLaneHandlePosition(
  layout,
  step,
) {
  const rect =
    getCorridorRect(
      layout,
      step.bereich,
    );

  const lane =
    getLaneCoordinate(
      layout,
      step.bereich,
      step.spur,
    );


  if (
    !rect ||
    !lane
  ) {
    return null;
  }


  if (
    rect.orientation ===
    "vertical"
  ) {
    return {
      x:
        lane.x,

      y:
        rect.y +
        rect.height /
          2,

      orientation:
        "vertical",

      rect,
    };
  }


  return {
    x:
      rect.x +
      rect.width /
        2,

    y:
      lane.y,

    orientation:
      "horizontal",

    rect,
  };
}


/* ======================================== */
/* SVG-PFEIL                                */
/* ======================================== */

function createDefs() {
  const defs =
    document.createElementNS(
      SVG_NS,
      "defs",
    );


  const marker =
    document.createElementNS(
      SVG_NS,
      "marker",
    );


  marker.setAttribute(
    "id",
    "graph-arrow",
  );

  marker.setAttribute(
    "viewBox",
    "0 0 10 10",
  );

  marker.setAttribute(
    "refX",
    "9",
  );

  marker.setAttribute(
    "refY",
    "5",
  );

  marker.setAttribute(
    "markerWidth",
    "7",
  );

  marker.setAttribute(
    "markerHeight",
    "7",
  );

  marker.setAttribute(
    "orient",
    "auto-start-reverse",
  );


  const path =
    document.createElementNS(
      SVG_NS,
      "path",
    );


  path.setAttribute(
    "d",
    "M 0 0 L 10 5 L 0 10 z",
  );

  path.setAttribute(
    "fill",
    "context-stroke",
  );


  marker.appendChild(
    path,
  );

  defs.appendChild(
    marker,
  );


  return defs;
}


/* ======================================== */
/* HELFER                                   */
/* ======================================== */

function removeDuplicatePoints(
  points,
) {
  const result =
    [];


  points.forEach(
    (point) => {
      const previous =
        result[
          result.length -
          1
        ];


      if (
        previous &&
        Math.abs(
          previous.x -
            point.x,
        ) <
          0.1 &&
        Math.abs(
          previous.y -
            point.y,
        ) <
          0.1
      ) {
        return;
      }


      result.push(
        point,
      );
    },
  );


  return result;
}


function round(
  value,
) {
  return Math.round(
    value *
      10,
  ) /
    10;
}
