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
  routes,
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


      const geometry =
        getEdgeGeometry(
          from,
          to,
          stageRect,
          routes?.[
            edge.id
          ] ??
          null,
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
        geometry.path,
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
/* STANDARD-ROUTE                           */
/* ======================================== */

export function createDefaultRoute({
  from,
  to,
  stage,
  snap = 20,
}) {
  const stageRect =
    stage.getBoundingClientRect();


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


  const centerA =
    getCenter(
      a,
    );

  const centerB =
    getCenter(
      b,
    );


  const dx =
    centerB.x -
    centerA.x;

  const dy =
    centerB.y -
    centerA.y;


  /*
      Drei editierbare Snap-Punkte.

      Bei eher waagerechter Verbindung:
      Punkt 1 / 2 / 3 liegen zwischen
      Start und Ziel und erzeugen einen
      rechtwinkligen Kabelweg.

      Bei eher senkrechter Verbindung
      wird das System gedreht.
  */

  if (
    Math.abs(
      dx,
    ) >=
    Math.abs(
      dy,
    )
  ) {
    return [
      {
        x:
          snapValue(
            centerA.x +
              dx *
              0.28,
            snap,
          ),

        y:
          snapValue(
            centerA.y,
            snap,
          ),
      },

      {
        x:
          snapValue(
            centerA.x +
              dx *
              0.5,
            snap,
          ),

        y:
          snapValue(
            centerA.y +
              dy *
              0.5,
            snap,
          ),
      },

      {
        x:
          snapValue(
            centerA.x +
              dx *
              0.72,
            snap,
          ),

        y:
          snapValue(
            centerB.y,
            snap,
          ),
      },
    ];
  }


  return [
    {
      x:
        snapValue(
          centerA.x,
          snap,
        ),

      y:
        snapValue(
          centerA.y +
            dy *
            0.28,
          snap,
        ),
    },

    {
      x:
        snapValue(
          centerA.x +
            dx *
            0.5,
          snap,
        ),

      y:
        snapValue(
          centerA.y +
            dy *
            0.5,
          snap,
        ),
    },

    {
      x:
        snapValue(
          centerB.x,
          snap,
        ),

      y:
        snapValue(
          centerA.y +
            dy *
            0.72,
          snap,
        ),
    },
  ];
}


/* ======================================== */
/* GEOMETRIE                                */
/* ======================================== */

function getEdgeGeometry(
  from,
  to,
  stageRect,
  route,
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


  const centerA =
    getCenter(
      a,
    );

  const centerB =
    getCenter(
      b,
    );


  const first =
    route?.[0] ??
    centerB;

  const last =
    route?.[
      route.length -
      1
    ] ??
    centerA;


  const start =
    projectToRectEdge(
      centerA,
      a,
      first.x -
        centerA.x,
      first.y -
        centerA.y,
    );

  const end =
    projectToRectEdge(
      centerB,
      b,
      last.x -
        centerB.x,
      last.y -
        centerB.y,
    );


  const points =
    [
      start,
      ...(route ?? []),
      end,
    ];


  const path =
    buildOrthogonalPath(
      points,
    );


  const labelPoint =
    route?.[
      Math.floor(
        route.length /
        2,
      )
    ] ??
    {
      x:
        (
          start.x +
          end.x
        ) /
        2,

      y:
        (
          start.y +
          end.y
        ) /
        2,
    };


  return {
    path,

    label:
      labelPoint,
  };
}


/* ======================================== */
/* RECHTWINKLIGER PFAD                      */
/* ======================================== */

function buildOrthogonalPath(
  points,
) {
  if (
    points.length <
    2
  ) {
    return "";
  }


  let current =
    points[0];

  let d =
    `M ${current.x} ${current.y}`;


  for (
    let index = 1;
    index <
    points.length;
    index++
  ) {
    const target =
      points[
        index
      ];


    /*
        Abwechselnd erst waagerecht,
        dann senkrecht zum nächsten
        festen Snap-Punkt.
    */

    d +=
      ` L ${target.x} ${current.y}`;

    d +=
      ` L ${target.x} ${target.y}`;


    current =
      target;
  }


  return d;
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
/* RECHTECK-HELFER                          */
/* ======================================== */

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


function getCenter(
  rect,
) {
  return {
    x:
      rect.x +
      rect.width /
        2,

    y:
      rect.y +
      rect.height /
        2,
  };
}


function projectToRectEdge(
  center,
  rect,
  dx,
  dy,
) {
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


function snapValue(
  value,
  snap,
) {
  return (
    Math.round(
      value /
      snap,
    ) *
    snap
  );
}
