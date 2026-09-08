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


  /*
      Mehrere Linien dürfen nicht alle am
      Mittelpunkt derselben Knoten-Seite
      starten/enden.

      Deshalb werden die Anschlussports pro
      Knoten + Seite vor dem Zeichnen verteilt.
  */
  const portAssignments =
    buildPortAssignments({
      layout,
      edges,
      routes,
      nodeSlots,
    });


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
          startPortAssignment:
            portAssignments.get(
              `${edge.id}|start`,
            ) ??
            null,
          endPortAssignment:
            portAssignments.get(
              `${edge.id}|end`,
            ) ??
            null,
        });


      if (!geometry.path) {
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


      applyEffectMarkers(
        path,
        edge,
      );


      svg.appendChild(
        path,
      );


      if (edge.label) {
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
/* WIRKUNG -> SVG-MARKER                    */
/* ======================================== */

function applyEffectMarkers(
  path,
  edge,
) {
  const wirkung =
    String(
      edge?.wirkung ??
      "",
    ).trim();


  /*
      Andere Graph-Module, die noch keine
      ökologische Wirkung besitzen, behalten
      das bisherige Standardverhalten.
  */
  if (!wirkung) {
    path.setAttribute(
      "marker-end",
      "url(#graph-arrow)",
    );

    return;
  }


  path.dataset.wirkung =
    wirkung;


  const [
    selbst,
    ziel,
  ] =
    wirkung.split(
      "/",
    );


  const effectAtFrom =
    getEndpointEffect(
      edge,
      edge.from,
      selbst,
      ziel,
    );

  const effectAtTo =
    getEndpointEffect(
      edge,
      edge.to,
      selbst,
      ziel,
    );


  switch (wirkung) {
    case "+/-":
    case "-/+":
      setMarkerForEffect(
        path,
        "start",
        effectAtFrom,
        "+",
        "graph-arrow",
      );

      setMarkerForEffect(
        path,
        "end",
        effectAtTo,
        "+",
        "graph-arrow",
      );
      break;

    case "+/+":
      path.setAttribute(
        "marker-start",
        "url(#graph-arrow)",
      );

      path.setAttribute(
        "marker-end",
        "url(#graph-arrow)",
      );
      break;

    case "+/0":
    case "0/+":
      setMarkerForEffect(
        path,
        "start",
        effectAtFrom,
        "+",
        "graph-arrow-open",
      );

      setMarkerForEffect(
        path,
        "end",
        effectAtTo,
        "+",
        "graph-arrow-open",
      );
      break;

    case "-/0":
    case "0/-":
      setMarkerForEffect(
        path,
        "start",
        effectAtFrom,
        "-",
        "graph-negative",
      );

      setMarkerForEffect(
        path,
        "end",
        effectAtTo,
        "-",
        "graph-negative",
      );
      break;

    case "-/-":
      path.classList.add(
        "graph-edge--effect-negative-negative",
      );
      break;

    case "0/0":
      path.classList.add(
        "graph-edge--effect-neutral",
      );
      break;

    default:
      break;
  }
}


function getEndpointEffect(
  edge,
  nodeId,
  selbst,
  ziel,
) {
  if (
    nodeId ===
    edge.selbstNodeId
  ) {
    return selbst;
  }


  if (
    nodeId ===
    edge.zielNodeId
  ) {
    return ziel;
  }


  return null;
}


function setMarkerForEffect(
  path,
  endpoint,
  actualEffect,
  wantedEffect,
  markerId,
) {
  if (
    actualEffect !==
    wantedEffect
  ) {
    return;
  }


  path.setAttribute(
    endpoint ===
      "start"
      ? "marker-start"
      : "marker-end",
    `url(#${markerId})`,
  );
}


/* ======================================== */
/* ANSCHLUSSPORTS VERTEILEN                 */
/* ======================================== */

function buildPortAssignments({
  layout,
  edges,
  routes,
  nodeSlots,
}) {
  const groups =
    new Map();

  const assignments =
    new Map();


  edges.forEach(
    (edge) => {
      const route =
        routes.get(
          edge.id,
        ) ??
        [];


      if (!route.length) {
        return;
      }


      registerPortEndpoint({
        layout,
        groups,
        edge,
        endpoint:
          "start",
        nodeId:
          edge.from,
        slotId:
          nodeSlots[
            edge.from
          ],
        routeStep:
          route[0],
      });


      registerPortEndpoint({
        layout,
        groups,
        edge,
        endpoint:
          "end",
        nodeId:
          edge.to,
        slotId:
          nodeSlots[
            edge.to
          ],
        routeStep:
          route[
            route.length -
              1
          ],
      });
    },
  );


  groups.forEach(
    (entries) => {
      entries.sort(
        (a, b) =>
          `${a.edgeId}|${a.endpoint}`
            .localeCompare(
              `${b.edgeId}|${b.endpoint}`,
            ),
      );


      entries.forEach(
        (entry, index) => {
          assignments.set(
            `${entry.edgeId}|${entry.endpoint}`,
            {
              side:
                entry.side,
              index,
              total:
                entries.length,
            },
          );
        },
      );
    },
  );


  return assignments;
}


function registerPortEndpoint({
  layout,
  groups,
  edge,
  endpoint,
  nodeId,
  slotId,
  routeStep,
}) {
  const rect =
    getSlotRect(
      layout,
      slotId,
    );

  const corridor =
    parseCorridor(
      routeStep?.bereich,
    );


  if (
    !rect ||
    !corridor
  ) {
    return;
  }


  const side =
    getNodeSide(
      rect,
      corridor,
    );


  if (!side) {
    return;
  }


  const key =
    `${nodeId}|${side}`;


  if (!groups.has(key)) {
    groups.set(
      key,
      [],
    );
  }


  groups.get(
    key,
  ).push({
    edgeId:
      edge.id,
    endpoint,
    side,
  });
}


function getNodeSide(
  nodeRect,
  corridor,
) {
  if (
    corridor.orientation ===
    "vertical"
  ) {
    return corridor.gapColumn <
      nodeRect.column
      ? "left"
      : "right";
  }


  if (
    corridor.orientation ===
    "horizontal"
  ) {
    return corridor.gapRow <
      nodeRect.row
      ? "top"
      : "bottom";
  }


  return null;
}


/* ======================================== */
/* PFAD-GEOMETRIE                           */
/* ======================================== */

function buildGeometry({
  layout,
  route,
  fromSlot,
  toSlot,
  startPortAssignment,
  endPortAssignment,
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
      startPortAssignment,
    );


  const startEntry =
    getNodeCorridorEntry(
      fromRect,
      first,
      startPort,
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


  const endPort =
    getNodePort(
      toRect,
      last.corridor,
      endPortAssignment,
    );

  const endEntry =
    getNodeCorridorEntry(
      toRect,
      last,
      endPort,
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
  assignment =
    null,
) {
  const side =
    assignment?.side ??
    getNodeSide(
      nodeRect,
      corridor,
    );


  const total =
    Math.max(
      1,
      Number(
        assignment?.total ??
        1,
      ),
    );

  const index =
    Math.max(
      0,
      Math.min(
        total - 1,
        Number(
          assignment?.index ??
          0,
        ),
      ),
    );


  /*
      Bei mehreren Anschlüssen werden 64 %
      der verfügbaren Kantenlänge benutzt.
      Dadurch bleiben die Eckbereiche frei.
  */
  const fraction =
    total ===
    1
      ? 0.5
      : 0.18 +
        (
          index /
          (
            total -
            1
          )
        ) *
          0.64;


  if (
    side ===
      "left" ||
    side ===
      "right"
  ) {
    return {
      x:
        side ===
        "left"
          ? nodeRect.x
          : nodeRect.x +
            nodeRect.width,

      y:
        nodeRect.y +
        nodeRect.height *
          fraction,
    };
  }


  return {
    x:
      nodeRect.x +
      nodeRect.width *
        fraction,

    y:
      side ===
      "top"
        ? nodeRect.y
        : nodeRect.y +
          nodeRect.height,
  };
}


function getNodeCorridorEntry(
  nodeRect,
  routePoint,
  port,
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
        port?.y ??
        nodeRect.y +
          nodeRect.height /
            2,
    };
  }


  return {
    x:
      port?.x ??
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


  defs.append(
    createArrowMarker({
      id:
        "graph-arrow",
      open:
        false,
    }),

    createArrowMarker({
      id:
        "graph-arrow-open",
      open:
        true,
    }),

    createNegativeMarker(),
  );


  return defs;
}


function createArrowMarker({
  id,
  open,
}) {
  const marker =
    document.createElementNS(
      SVG_NS,
      "marker",
    );


  marker.setAttribute(
    "id",
    id,
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


  if (open) {
    path.setAttribute(
      "d",
      "M 1 1 L 9 5 L 1 9",
    );

    path.setAttribute(
      "fill",
      "none",
    );

    path.setAttribute(
      "stroke",
      "context-stroke",
    );

    path.setAttribute(
      "stroke-width",
      "1.8",
    );
  }

  else {
    path.setAttribute(
      "d",
      "M 0 0 L 10 5 L 0 10 z",
    );

    path.setAttribute(
      "fill",
      "context-stroke",
    );
  }


  marker.appendChild(
    path,
  );


  return marker;
}


function createNegativeMarker() {
  const marker =
    document.createElementNS(
      SVG_NS,
      "marker",
    );


  marker.setAttribute(
    "id",
    "graph-negative",
  );

  marker.setAttribute(
    "viewBox",
    "0 0 10 10",
  );

  marker.setAttribute(
    "refX",
    "5",
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


  const line =
    document.createElementNS(
      SVG_NS,
      "path",
    );


  line.setAttribute(
    "d",
    "M 5 0 L 5 10",
  );

  line.setAttribute(
    "fill",
    "none",
  );

  line.setAttribute(
    "stroke",
    "context-stroke",
  );

  line.setAttribute(
    "stroke-width",
    "2.2",
  );


  marker.appendChild(
    line,
  );


  return marker;
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
