const SVG_NS =
  "http://www.w3.org/2000/svg";


/* ======================================== */
/* VERBINDUNGEN ZEICHNEN                    */
/* ======================================== */

export function renderGraphConnections({
  svg,
  stage,
  edges,
  nodeElements,
}) {
  if (
    !svg ||
    !stage
  ) {
    return;
  }


  svg.replaceChildren();


  const width =
    stage.clientWidth;

  const height =
    stage.clientHeight;


  svg.setAttribute(
    "width",
    String(
      width,
    ),
  );

  svg.setAttribute(
    "height",
    String(
      height,
    ),
  );

  svg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`,
  );


  svg.appendChild(
    createDefs(),
  );


  const stageRect =
    stage.getBoundingClientRect();


  edges.forEach(
    (edge) => {
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
        return;
      }


      const points =
        getConnectionPoints(
          from,
          to,
          stageRect,
      );


      const path =
        document.createElementNS(
          SVG_NS,
          "path",
        );


      path.classList.add(
        "graph-edge",
        `graph-edge--${edge.type ?? "direct"}`,
      );


      path.setAttribute(
        "d",
        `M ${points.start.x} ${points.start.y} L ${points.end.x} ${points.end.y}`,
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
            (
              points.start.x +
              points.end.x
            ) /
            2,
          ),
        );

        label.setAttribute(
          "y",
          String(
            (
              points.start.y +
              points.end.y
            ) /
              2 -
              7,
          ),
        );


        label.textContent =
          edge.label;


        svg.appendChild(
          label,
        );
      }
    },
  );
}


/* ======================================== */
/* PFEIL                                    */
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
/* ANSCHLUSSPUNKTE                          */
/* ======================================== */

function getConnectionPoints(
  from,
  to,
  stageRect,
) {
  const a =
    getLocalRect(
      from,
      stageRect,
    );

  const b =
    getLocalRect(
      to,
      stageRect,
    );


  const centerA = {
    x:
      a.x +
      a.width /
        2,

    y:
      a.y +
      a.height /
        2,
  };


  const centerB = {
    x:
      b.x +
      b.width /
        2,

    y:
      b.y +
      b.height /
        2,
  };


  const dx =
    centerB.x -
    centerA.x;

  const dy =
    centerB.y -
    centerA.y;


  const length =
    Math.hypot(
      dx,
      dy,
    ) ||
    1;


  const ux =
    dx /
    length;

  const uy =
    dy /
    length;


  return {
    start:
      projectToRectEdge(
        centerA,
        a,
        ux,
        uy,
      ),

    end:
      projectToRectEdge(
        centerB,
        b,
        -ux,
        -uy,
      ),
  };
}


function getLocalRect(
  element,
  stageRect,
) {
  const rect =
    element.getBoundingClientRect();


  return {
    x:
      rect.left -
      stageRect.left,

    y:
      rect.top -
      stageRect.top,

    width:
      rect.width,

    height:
      rect.height,
  };
}


function projectToRectEdge(
  center,
  rect,
  ux,
  uy,
) {
  const halfW =
    rect.width /
    2;

  const halfH =
    rect.height /
    2;


  const tx =
    Math.abs(
      ux,
    ) >
    0.0001
      ? halfW /
        Math.abs(
          ux,
        )
      : Infinity;

  const ty =
    Math.abs(
      uy,
    ) >
    0.0001
      ? halfH /
        Math.abs(
          uy,
        )
      : Infinity;


  const t =
    Math.min(
      tx,
      ty,
    );


  return {
    x:
      center.x +
      ux *
      t,

    y:
      center.y +
      uy *
      t,
  };
}
