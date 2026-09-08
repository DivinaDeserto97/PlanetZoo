/* ======================================== */
/* LOGISCHES KÄSTCHEN-/LINIENRASTER         */
/* ======================================== */

/*
    Kästchen:
      1.1  1.2  1.3
      2.1  2.2  2.3
      3.1  3.2  3.3

    Linienbereiche:

      1.1 | L1.1 | 1.2 | L1.2 | 1.3
      --------------------------------
           L2.1       L2.2       L2.3
      --------------------------------
      2.1 | L3.1 | 2.2 | L3.2 | 2.3
      --------------------------------
           L4.1       L4.2       L4.3

    Ungerade L-Nummern:
      vertikale Linienbereiche.

    Gerade L-Nummern:
      horizontale Linienbereiche.
*/


export const GRAPH_GRID = {
  nodeWidth:
    230,

  nodeHeight:
    94,

  lineGap:
    12,

  /*
      Abstand Kästchen -> erste Linie
      = 1,5 × Linienabstand.
  */

  edgeMargin:
    18,

  minCorridorSize:
    54,

  outerPadding:
    34,

  minColumns:
    6,

  minRows:
    5,
};


/* ======================================== */
/* SLOT                                     */
/* ======================================== */

export function parseSlot(
  value,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const match =
    value
      .trim()
      .match(
        /^(\d+)\.(\d+)$/,
      );


  if (!match) {
    return null;
  }


  const row =
    Number(
      match[1],
    );

  const column =
    Number(
      match[2],
    );


  if (
    row < 1 ||
    column < 1
  ) {
    return null;
  }


  return {
    id:
      `${row}.${column}`,

    row,
    column,
  };
}


export function createSlotId(
  row,
  column,
) {
  return `${row}.${column}`;
}


/* ======================================== */
/* LINIENBEREICH                            */
/* ======================================== */

export function parseCorridor(
  value,
) {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const match =
    value
      .trim()
      .match(
        /^L(\d+)\.(\d+)$/i,
      );


  if (!match) {
    return null;
  }


  const band =
    Number(
      match[1],
    );

  const index =
    Number(
      match[2],
    );


  if (
    band < 1 ||
    index < 1
  ) {
    return null;
  }


  if (
    band %
      2 ===
    1
  ) {
    return {
      id:
        `L${band}.${index}`,

      orientation:
        "vertical",

      row:
        (
          band +
          1
        ) /
        2,

      gapColumn:
        index,

      band,
      index,
    };
  }


  return {
    id:
      `L${band}.${index}`,

    orientation:
      "horizontal",

    gapRow:
      band /
      2,

    column:
      index,

    band,
    index,
  };
}


export function createVerticalCorridorId(
  row,
  gapColumn,
) {
  return `L${2 * row - 1}.${gapColumn}`;
}


export function createHorizontalCorridorId(
  gapRow,
  column,
) {
  return `L${2 * gapRow}.${column}`;
}


/* ======================================== */
/* STANDARD-SLOTS                           */
/* ======================================== */

export function createDefaultSlotMap(
  graph,
) {
  const nodes =
    graph.nodes ??
    [];


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
      nodes
        .filter(
          (node) =>
            node.focus,
        )
        .map(
          (node) =>
            node.id,
        ),
    );


  nodes.forEach(
    (node) => {
      if (
        node.focus
      ) {
        buckets.focus.push(
          node,
        );

        return;
      }


      const goesToFocus =
        graph.edges.some(
          (edge) =>
            edge.from ===
              node.id &&
            focusIds.has(
              edge.to,
            ),
        );


      const comesFromFocus =
        graph.edges.some(
          (edge) =>
            focusIds.has(
              edge.from,
            ) &&
            edge.to ===
              node.id,
        );


      if (
        goesToFocus &&
        !comesFromFocus
      ) {
        buckets.input.push(
          node,
        );
      }

      else if (
        comesFromFocus &&
        !goesToFocus
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


  const map =
    {};

  const used =
    new Set();


  placeBucket(
    map,
    used,
    buckets.input,
    [
      1,
      2,
    ],
  );


  placeBucket(
    map,
    used,
    buckets.focus,
    [
      3,
    ],
  );


  placeBucket(
    map,
    used,
    buckets.mixed,
    [
      4,
    ],
  );


  placeBucket(
    map,
    used,
    buckets.predator,
    [
      5,
      6,
    ],
  );


  return map;
}


function placeBucket(
  result,
  used,
  nodes,
  columns,
) {
  nodes.forEach(
    (
      node,
      index,
    ) => {
      let row =
        Math.floor(
          index /
          columns.length,
        ) +
        1;

      let column =
        columns[
          index %
          columns.length
        ];

      let slot =
        createSlotId(
          row,
          column,
        );


      while (
        used.has(
          slot,
        )
      ) {
        row++;

        slot =
          createSlotId(
            row,
            column,
          );
      }


      used.add(
        slot,
      );

      result[
        node.id
      ] =
        slot;
    },
  );
}


/* ======================================== */
/* GRID-GRÖSSE                              */
/* ======================================== */

export function getGridSize({
  graph,
  nodeSlots,
}) {
  let highestRow =
    0;

  let highestColumn =
    0;


  Object.values(
    nodeSlots,
  ).forEach(
    (slotId) => {
      const slot =
        parseSlot(
          slotId,
        );


      if (!slot) {
        return;
      }


      highestRow =
        Math.max(
          highestRow,
          slot.row,
        );

      highestColumn =
        Math.max(
          highestColumn,
          slot.column,
        );
    },
  );


  /*
      Dynamisches Raster:

      Es gibt IMMER genau mindestens eine
      freie Reihe und eine freie Spalte hinter
      dem aktuell am weitesten belegten Slot.

      Beispiel:
      höchster belegter Slot = 6.7
      -> Raster mindestens 7 Zeilen / 8 Spalten.

      Die Mindestgröße bleibt für kleine Netze
      bestehen.
  */

  const rows =
    Math.max(
      GRAPH_GRID.minRows,
      highestRow + 1,
    );

  const columns =
    Math.max(
      GRAPH_GRID.minColumns,
      highestColumn + 1,
    );


  return {
    rows,
    columns,
  };
}


/* ======================================== */
/* AUTO-ROUTING                             */
/* ======================================== */

export function buildRoutes({
  graph,
  nodeSlots,
  rows,
  columns,
  localEdgeLanes = {},
  localEdgeGuides = {},
}) {
  const corridorUsage =
    new Map();

  const routes =
    new Map();


  /*
      Routen-Priorität:

      1. lokal per Drag gesetzte Führungszeile/-spalte
      2. feste Route aus dem JSON
      3. automatische Route

      Die lokalen Führungen verändern NICHT die Tier-JSON.
      Sie gehören nur zum gespeicherten Layout.
  */

  const sortedEdges =
    [
      ...(graph.edges ??
        []),
    ].sort(
      (a, b) =>
        String(
          a.id,
        ).localeCompare(
          String(
            b.id,
          ),
        ),
    );


  /* ==================================== */
  /* MANUELLE FÜHRUNGSZEILE / -SPALTE    */
  /* ==================================== */

  sortedEdges.forEach(
    (edge) => {
      const fromSlot =
        parseSlot(
          nodeSlots[
            edge.from
          ],
        );

      const toSlot =
        parseSlot(
          nodeSlots[
            edge.to
          ],
        );

      if (
        !fromSlot ||
        !toSlot
      ) {
        return;
      }


      const guides =
        normalizeLocalGuides(
          localEdgeGuides?.[
            edge.id
          ],
          rows,
          columns,
        );


      if (!guides) {
        return;
      }


      const path =
        findGuidedCorridorPath({
          fromSlot,
          toSlot,
          rows,
          columns,
          usage:
            corridorUsage,
          guides,
        });


      if (!path.length) {
        return;
      }


      const route =
        path.map(
          (bereich) => ({
            bereich,
            spur:
              null,
          }),
        );


      routes.set(
        edge.id,
        route,
      );


      path.forEach(
        (bereich) => {
          incrementUsage(
            corridorUsage,
            bereich,
          );
        },
      );
    },
  );


  /* ==================================== */
  /* FESTE JSON-ROUTE                     */
  /* ==================================== */

  sortedEdges.forEach(
    (edge) => {
      if (
        routes.has(
          edge.id,
        )
      ) {
        return;
      }


      const custom =
        normalizeJsonRoute(
          edge.route,
          rows,
          columns,
        );


      if (!custom) {
        return;
      }


      routes.set(
        edge.id,
        custom,
      );


      custom.forEach(
        (step) => {
          incrementUsage(
            corridorUsage,
            step.bereich,
          );
        },
      );
    },
  );


  /* ==================================== */
  /* AUTOMATISCHE ROUTE                   */
  /* ==================================== */

  sortedEdges.forEach(
    (edge) => {
      if (
        routes.has(
          edge.id,
        )
      ) {
        return;
      }


      const fromSlot =
        parseSlot(
          nodeSlots[
            edge.from
          ],
        );

      const toSlot =
        parseSlot(
          nodeSlots[
            edge.to
          ],
        );


      if (
        !fromSlot ||
        !toSlot
      ) {
        routes.set(
          edge.id,
          [],
        );

        return;
      }


      const path =
        findBestCorridorPath({
          fromSlot,
          toSlot,
          rows,
          columns,
          usage:
            corridorUsage,
        });


      routes.set(
        edge.id,
        path.map(
          (bereich) => ({
            bereich,
            spur:
              null,
          }),
        ),
      );


      path.forEach(
        (bereich) => {
          incrementUsage(
            corridorUsage,
            bereich,
          );
        },
      );
    },
  );


  /*
      Spuren vergeben.

      Priorität:
      1. lokal per Drag gesetzte Spur
      2. Spur aus JSON
      3. kleinste freie Spur
  */

  const usedLanes =
    new Map();


  sortedEdges.forEach(
    (edge) => {
      const route =
        routes.get(
          edge.id,
        ) ??
        [];


      route.forEach(
        (step) => {
          const localLane =
            Number(
              localEdgeLanes
                ?.[edge.id]
                ?.[step.bereich],
            );

          const jsonLane =
            Number(
              step.spur,
            );


          const wanted =
            Number.isInteger(
              localLane,
            ) &&
            localLane >
              0
              ? localLane
              : (
                  Number.isInteger(
                    jsonLane,
                  ) &&
                  jsonLane >
                    0
                    ? jsonLane
                    : null
                );


          const lane =
            reserveLane(
              usedLanes,
              step.bereich,
              wanted,
            );


          step.spur =
            lane;
        },
      );
    },
  );


  return {
    routes,
    laneCounts:
      getLaneCounts(
        usedLanes,
      ),
  };
}


/* ======================================== */
/* KÜRZESTER KORRIDOR-WEG                   */
/* ======================================== */

function findBestCorridorPath({
  fromSlot,
  toSlot,
  rows,
  columns,
  usage,
}) {
  return findPathBetweenCorridors({
    starts:
      getSlotCorridors(
        fromSlot,
        rows,
        columns,
      ),

    targets:
      new Set(
        getSlotCorridors(
          toSlot,
          rows,
          columns,
        ),
      ),

    rows,
    columns,
    usage,
  });
}


/* ======================================== */
/* MANUELLE FÜHRUNG DURCH ZEILE / SPALTE    */
/* ======================================== */

function normalizeLocalGuides(
  value,
  rows,
  columns,
) {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }


  const horizontalGapRow =
    Number(
      value.horizontalGapRow,
    );

  const verticalGapColumn =
    Number(
      value.verticalGapColumn,
    );


  const result =
    {};


  if (
    Number.isInteger(
      horizontalGapRow,
    ) &&
    horizontalGapRow >=
      1 &&
    horizontalGapRow <
      rows
  ) {
    result.horizontalGapRow =
      horizontalGapRow;
  }


  if (
    Number.isInteger(
      verticalGapColumn,
    ) &&
    verticalGapColumn >=
      1 &&
    verticalGapColumn <
      columns
  ) {
    result.verticalGapColumn =
      verticalGapColumn;
  }


  return Object.keys(
    result,
  ).length
    ? result
    : null;
}


function findGuidedCorridorPath({
  fromSlot,
  toSlot,
  rows,
  columns,
  usage,
  guides,
}) {
  const startCorridors =
    getSlotCorridors(
      fromSlot,
      rows,
      columns,
    );

  const targetCorridors =
    new Set(
      getSlotCorridors(
        toSlot,
        rows,
        columns,
      ),
    );


  const horizontal =
    guides?.horizontalGapRow
      ? Array.from(
          {
            length:
              columns,
          },
          (_, index) =>
            createHorizontalCorridorId(
              guides.horizontalGapRow,
              index + 1,
            ),
        ).filter(
          (id) =>
            isValidCorridor(
              id,
              rows,
              columns,
            ),
        )
      : [];


  const vertical =
    guides?.verticalGapColumn
      ? Array.from(
          {
            length:
              rows,
          },
          (_, index) =>
            createVerticalCorridorId(
              index + 1,
              guides.verticalGapColumn,
            ),
        ).filter(
          (id) =>
            isValidCorridor(
              id,
              rows,
              columns,
            ),
        )
      : [];


  if (
    horizontal.length &&
    vertical.length
  ) {
    let best =
      [];


    horizontal.forEach(
      (horizontalId) => {
        const neighbors =
          new Set(
            getCorridorNeighbors(
              horizontalId,
              rows,
              columns,
            ),
          );


        vertical.forEach(
          (verticalId) => {
            if (
              !neighbors.has(
                verticalId,
              )
            ) {
              return;
            }


            [
              [
                horizontalId,
                verticalId,
              ],
              [
                verticalId,
                horizontalId,
              ],
            ].forEach(
              (required) => {
                const candidate =
                  buildPathThroughRequiredCorridors({
                    starts:
                      startCorridors,
                    targets:
                      targetCorridors,
                    required,
                    rows,
                    columns,
                    usage,
                  });


                if (
                  candidate.length &&
                  (
                    !best.length ||
                    candidate.length <
                      best.length
                  )
                ) {
                  best =
                    candidate;
                }
              },
            );
          },
        );
      },
    );


    if (best.length) {
      return best;
    }
  }


  const candidates =
    horizontal.length
      ? horizontal
      : vertical;


  if (candidates.length) {
    let best =
      [];


    candidates.forEach(
      (requiredId) => {
        const candidate =
          buildPathThroughRequiredCorridors({
            starts:
              startCorridors,
            targets:
              targetCorridors,
            required:
              [
                requiredId,
              ],
            rows,
            columns,
            usage,
          });


        if (
          candidate.length &&
          (
            !best.length ||
            candidate.length <
              best.length
          )
        ) {
          best =
            candidate;
        }
      },
    );


    if (best.length) {
      return best;
    }
  }


  return findBestCorridorPath({
    fromSlot,
    toSlot,
    rows,
    columns,
    usage,
  });
}


function buildPathThroughRequiredCorridors({
  starts,
  targets,
  required,
  rows,
  columns,
  usage,
}) {
  let currentStarts =
    [
      ...starts,
    ];

  const result =
    [];


  for (
    const requiredId of
    required
  ) {
    const part =
      findPathBetweenCorridors({
        starts:
          currentStarts,
        targets:
          new Set(
            [
              requiredId,
            ],
          ),
        rows,
        columns,
        usage,
      });


    if (!part.length) {
      return [];
    }


    appendPath(
      result,
      part,
    );

    currentStarts =
      [
        requiredId,
      ];
  }


  const tail =
    findPathBetweenCorridors({
      starts:
        currentStarts,
      targets,
      rows,
      columns,
      usage,
    });


  if (!tail.length) {
    return [];
  }


  appendPath(
    result,
    tail,
  );


  return result;
}


function appendPath(
  target,
  part,
) {
  part.forEach(
    (corridor) => {
      if (
        target[
          target.length - 1
        ] !==
        corridor
      ) {
        target.push(
          corridor,
        );
      }
    },
  );
}


function findPathBetweenCorridors({
  starts,
  targets,
  rows,
  columns,
  usage,
}) {
  for (
    const corridor of
    starts
  ) {
    if (
      targets.has(
        corridor,
      )
    ) {
      return [
        corridor,
      ];
    }
  }


  const queue =
    [];

  const best =
    new Map();

  const previous =
    new Map();


  starts.forEach(
    (corridor) => {
      const cost =
        corridorCost(
          corridor,
          usage,
        );


      queue.push({
        corridor,
        cost,
      });


      best.set(
        corridor,
        cost,
      );


      previous.set(
        corridor,
        null,
      );
    },
  );


  while (
    queue.length
  ) {
    queue.sort(
      (a, b) =>
        a.cost -
        b.cost,
    );


    const current =
      queue.shift();


    if (
      current.cost !==
      best.get(
        current.corridor,
      )
    ) {
      continue;
    }


    if (
      targets.has(
        current.corridor,
      )
    ) {
      return reconstructPath(
        current.corridor,
        previous,
      );
    }


    const neighbors =
      getCorridorNeighbors(
        current.corridor,
        rows,
        columns,
      );


    neighbors.forEach(
      (neighbor) => {
        const nextCost =
          current.cost +
          corridorCost(
            neighbor,
            usage,
          );


        if (
          nextCost >=
          (
            best.get(
              neighbor,
            ) ??
            Infinity
          )
        ) {
          return;
        }


        best.set(
          neighbor,
          nextCost,
        );


        previous.set(
          neighbor,
          current.corridor,
        );


        queue.push({
          corridor:
            neighbor,
          cost:
            nextCost,
        });
      },
    );
  }


  return [];
}


function corridorCost(
  corridor,
  usage,
) {
  /*
      Bereits benutzte Bereiche werden
      leicht verteuert. So verteilt sich
      das Netz besser, ohne einen Umweg
      völlig zu bevorzugen.
  */

  return (
    1 +
    (
      usage.get(
        corridor,
      ) ??
      0
    ) *
      0.35
  );
}


function reconstructPath(
  end,
  previous,
) {
  const path =
    [];

  let current =
    end;


  while (
    current
  ) {
    path.unshift(
      current,
    );

    current =
      previous.get(
        current,
      ) ??
      null;
  }


  return path;
}


/* ======================================== */
/* KORRIDORE AM KÄSTCHEN                    */
/* ======================================== */

function getSlotCorridors(
  slot,
  rows,
  columns,
) {
  const result =
    [];


  if (
    slot.column >
    1
  ) {
    result.push(
      createVerticalCorridorId(
        slot.row,
        slot.column -
          1,
      ),
    );
  }


  if (
    slot.column <
    columns
  ) {
    result.push(
      createVerticalCorridorId(
        slot.row,
        slot.column,
      ),
    );
  }


  if (
    slot.row >
    1
  ) {
    result.push(
      createHorizontalCorridorId(
        slot.row -
          1,
        slot.column,
      ),
    );
  }


  if (
    slot.row <
    rows
  ) {
    result.push(
      createHorizontalCorridorId(
        slot.row,
        slot.column,
      ),
    );
  }


  return result;
}


/* ======================================== */
/* KORRIDOR-NACHBARN                        */
/* ======================================== */

function getCorridorNeighbors(
  corridorId,
  rows,
  columns,
) {
  const corridor =
    parseCorridor(
      corridorId,
    );


  if (!corridor) {
    return [];
  }


  const result =
    new Set();


  if (
    corridor.orientation ===
    "vertical"
  ) {
    const row =
      corridor.row;

    const gapColumn =
      corridor.gapColumn;


    /*
        Gerade weiter in derselben vertikalen
        Führungs-Spalte. Dadurch kann eine Linie
        über mehrere Zeilen wirklich gerade
        verlaufen, statt im Zickzack.
    */

    if (
      row >
      1
    ) {
      result.add(
        createVerticalCorridorId(
          row - 1,
          gapColumn,
        ),
      );
    }


    if (
      row <
      rows
    ) {
      result.add(
        createVerticalCorridorId(
          row + 1,
          gapColumn,
        ),
      );
    }


    /*
        Knotenpunkt oberhalb.
    */

    if (
      row >
      1
    ) {
      result.add(
        createHorizontalCorridorId(
          row -
            1,
          gapColumn,
        ),
      );

      result.add(
        createHorizontalCorridorId(
          row -
            1,
          gapColumn +
            1,
        ),
      );
    }


    /*
        Knotenpunkt unterhalb.
    */

    if (
      row <
      rows
    ) {
      result.add(
        createHorizontalCorridorId(
          row,
          gapColumn,
        ),
      );

      result.add(
        createHorizontalCorridorId(
          row,
          gapColumn +
            1,
        ),
      );
    }
  }

  else {
    const gapRow =
      corridor.gapRow;

    const column =
      corridor.column;


    /*
        Gerade weiter in derselben horizontalen
        Führungs-Zeile.
    */

    if (
      column >
      1
    ) {
      result.add(
        createHorizontalCorridorId(
          gapRow,
          column - 1,
        ),
      );
    }


    if (
      column <
      columns
    ) {
      result.add(
        createHorizontalCorridorId(
          gapRow,
          column + 1,
        ),
      );
    }


    /*
        Knotenpunkt links.
    */

    if (
      column >
      1
    ) {
      result.add(
        createVerticalCorridorId(
          gapRow,
          column -
            1,
        ),
      );

      result.add(
        createVerticalCorridorId(
          gapRow +
            1,
          column -
            1,
        ),
      );
    }


    /*
        Knotenpunkt rechts.
    */

    if (
      column <
      columns
    ) {
      result.add(
        createVerticalCorridorId(
          gapRow,
          column,
        ),
      );

      result.add(
        createVerticalCorridorId(
          gapRow +
            1,
          column,
        ),
      );
    }
  }


  return [
    ...result,
  ].filter(
    (id) =>
      isValidCorridor(
        id,
        rows,
        columns,
      ),
  );
}


function isValidCorridor(
  id,
  rows,
  columns,
) {
  const corridor =
    parseCorridor(
      id,
    );


  if (!corridor) {
    return false;
  }


  if (
    corridor.orientation ===
    "vertical"
  ) {
    return (
      corridor.row >=
        1 &&
      corridor.row <=
        rows &&
      corridor.gapColumn >=
        1 &&
      corridor.gapColumn <
        columns
    );
  }


  return (
    corridor.gapRow >=
      1 &&
    corridor.gapRow <
      rows &&
    corridor.column >=
      1 &&
    corridor.column <=
      columns
  );
}


/* ======================================== */
/* JSON-ROUTE                               */
/* ======================================== */

function normalizeJsonRoute(
  route,
  rows,
  columns,
) {
  if (
    !Array.isArray(
      route,
    ) ||
    !route.length
  ) {
    return null;
  }


  const normalized =
    route
      .map(
        (step) => {
          if (
            typeof step ===
            "string"
          ) {
            return {
              bereich:
                step,

              spur:
                null,
            };
          }


          if (
            !step ||
            typeof step !==
              "object"
          ) {
            return null;
          }


          return {
            bereich:
              step.bereich ??
              step.korridor ??
              "",

            spur:
              Number.isInteger(
                Number(
                  step.spur,
                ),
              )
                ? Number(
                    step.spur,
                  )
                : null,
          };
        },
      )
      .filter(
        (step) =>
          step &&
          isValidCorridor(
            step.bereich,
            rows,
            columns,
          ),
      );


  return normalized.length
    ? normalized
    : null;
}


/* ======================================== */
/* SPUREN                                   */
/* ======================================== */

function reserveLane(
  usedLanes,
  corridor,
  wanted,
) {
  if (
    !usedLanes.has(
      corridor,
    )
  ) {
    usedLanes.set(
      corridor,
      new Set(),
    );
  }


  const used =
    usedLanes.get(
      corridor,
    );


  if (
    wanted &&
    !used.has(
      wanted,
    )
  ) {
    used.add(
      wanted,
    );

    return wanted;
  }


  let lane =
    1;


  while (
    used.has(
      lane,
    )
  ) {
    lane++;
  }


  used.add(
    lane,
  );


  return lane;
}


function getLaneCounts(
  usedLanes,
) {
  const result =
    {};


  usedLanes.forEach(
    (
      lanes,
      corridor,
    ) => {
      result[
        corridor
      ] =
        Math.max(
          1,
          ...lanes,
        );
    },
  );


  return result;
}


function incrementUsage(
  usage,
  corridor,
) {
  usage.set(
    corridor,
    (
      usage.get(
        corridor,
      ) ??
      0
    ) +
      1,
  );
}


/* ======================================== */
/* PIXEL-LAYOUT                             */
/* ======================================== */

export function buildPixelLayout({
  rows,
  columns,
  laneCounts,
}) {
  const config =
    GRAPH_GRID;


  const verticalGapWidths =
    {};

  const horizontalGapHeights =
    {};


  for (
    let gapColumn = 1;
    gapColumn <
    columns;
    gapColumn++
  ) {
    let maxLanes =
      1;


    for (
      let row = 1;
      row <=
      rows;
      row++
    ) {
      maxLanes =
        Math.max(
          maxLanes,
          laneCounts[
            createVerticalCorridorId(
              row,
              gapColumn,
            )
          ] ??
            1,
        );
    }


    verticalGapWidths[
      gapColumn
    ] =
      getCorridorSize(
        maxLanes,
      );
  }


  for (
    let gapRow = 1;
    gapRow <
    rows;
    gapRow++
  ) {
    let maxLanes =
      1;


    for (
      let column = 1;
      column <=
      columns;
      column++
    ) {
      maxLanes =
        Math.max(
          maxLanes,
          laneCounts[
            createHorizontalCorridorId(
              gapRow,
              column,
            )
          ] ??
            1,
        );
    }


    horizontalGapHeights[
      gapRow
    ] =
      getCorridorSize(
        maxLanes,
      );
  }


  const columnLeft =
    {};

  let x =
    config.outerPadding;


  for (
    let column = 1;
    column <=
    columns;
    column++
  ) {
    columnLeft[
      column
    ] =
      x;


    x +=
      config.nodeWidth;


    if (
      column <
      columns
    ) {
      x +=
        verticalGapWidths[
          column
        ];
    }
  }


  const rowTop =
    {};

  let y =
    config.outerPadding;


  for (
    let row = 1;
    row <=
    rows;
    row++
  ) {
    rowTop[
      row
    ] =
      y;


    y +=
      config.nodeHeight;


    if (
      row <
      rows
    ) {
      y +=
        horizontalGapHeights[
          row
        ];
    }
  }


  return {
    rows,
    columns,

    width:
      x +
      config.outerPadding,

    height:
      y +
      config.outerPadding,

    columnLeft,
    rowTop,
    verticalGapWidths,
    horizontalGapHeights,

    config,
  };
}


function getCorridorSize(
  laneCount,
) {
  const config =
    GRAPH_GRID;


  return Math.max(
    config.minCorridorSize,

    config.edgeMargin *
      2 +
      Math.max(
        0,
        laneCount -
          1,
      ) *
        config.lineGap,
  );
}


/* ======================================== */
/* SLOT-RECHTECK                            */
/* ======================================== */

export function getSlotRect(
  layout,
  slotId,
) {
  const slot =
    parseSlot(
      slotId,
    );


  if (
    !slot ||
    slot.row >
      layout.rows ||
    slot.column >
      layout.columns
  ) {
    return null;
  }


  return {
    x:
      layout.columnLeft[
        slot.column
      ],

    y:
      layout.rowTop[
        slot.row
      ],

    width:
      layout.config.nodeWidth,

    height:
      layout.config.nodeHeight,

    row:
      slot.row,

    column:
      slot.column,

    id:
      slot.id,
  };
}


/* ======================================== */
/* KORRIDOR-RECHTECK                        */
/* ======================================== */

export function getCorridorRect(
  layout,
  corridorId,
) {
  const corridor =
    parseCorridor(
      corridorId,
    );


  if (!corridor) {
    return null;
  }


  if (
    corridor.orientation ===
    "vertical"
  ) {
    const left =
      layout.columnLeft[
        corridor.gapColumn
      ] +
      layout.config.nodeWidth;


    return {
      x:
        left,

      y:
        layout.rowTop[
          corridor.row
        ],

      width:
        layout
          .verticalGapWidths[
            corridor.gapColumn
          ],

      height:
        layout.config.nodeHeight,

      orientation:
        "vertical",

      ...corridor,
    };
  }


  const top =
    layout.rowTop[
      corridor.gapRow
    ] +
    layout.config.nodeHeight;


  return {
    x:
      layout.columnLeft[
        corridor.column
      ],

    y:
      top,

    width:
      layout.config.nodeWidth,

    height:
      layout
        .horizontalGapHeights[
          corridor.gapRow
        ],

    orientation:
      "horizontal",

    ...corridor,
  };
}


/* ======================================== */
/* SPUR-KOORDINATE                          */
/* ======================================== */

export function getLaneCoordinate(
  layout,
  corridorId,
  lane,
) {
  const rect =
    getCorridorRect(
      layout,
      corridorId,
    );


  if (!rect) {
    return null;
  }


  if (
    rect.orientation ===
    "vertical"
  ) {
    return {
      x:
        rect.x +
        layout.config
          .edgeMargin +
        (
          lane -
          1
        ) *
          layout.config
            .lineGap,

      y:
        rect.y +
        rect.height /
          2,
    };
  }


  return {
    x:
      rect.x +
      rect.width /
        2,

    y:
      rect.y +
      layout.config
        .edgeMargin +
      (
        lane -
        1
      ) *
        layout.config
          .lineGap,
  };
}


/* ======================================== */
/* NÄCHSTE LINIEN-ZEILE / -SPALTE           */
/* ======================================== */

export function findNearestHorizontalGapRow(
  layout,
  y,
) {
  let best =
    null;

  let bestDistance =
    Infinity;


  for (
    let gapRow = 1;
    gapRow <
    layout.rows;
    gapRow++
  ) {
    const rect =
      getCorridorRect(
        layout,
        createHorizontalCorridorId(
          gapRow,
          1,
        ),
      );


    if (!rect) {
      continue;
    }


    const center =
      rect.y +
      rect.height /
        2;

    const distance =
      Math.abs(
        y - center,
      );


    if (
      distance <
      bestDistance
    ) {
      bestDistance =
        distance;

      best =
        gapRow;
    }
  }


  return best;
}


export function findNearestVerticalGapColumn(
  layout,
  x,
) {
  let best =
    null;

  let bestDistance =
    Infinity;


  for (
    let gapColumn = 1;
    gapColumn <
    layout.columns;
    gapColumn++
  ) {
    const rect =
      getCorridorRect(
        layout,
        createVerticalCorridorId(
          1,
          gapColumn,
        ),
      );


    if (!rect) {
      continue;
    }


    const center =
      rect.x +
      rect.width /
        2;

    const distance =
      Math.abs(
        x - center,
      );


    if (
      distance <
      bestDistance
    ) {
      bestDistance =
        distance;

      best =
        gapColumn;
    }
  }


  return best;
}


/* ======================================== */
/* NÄCHSTER SLOT BEI DRAG                   */
/* ======================================== */

export function findNearestSlot(
  layout,
  x,
  y,
) {
  let best =
    null;

  let bestDistance =
    Infinity;


  for (
    let row = 1;
    row <=
    layout.rows;
    row++
  ) {
    for (
      let column = 1;
      column <=
      layout.columns;
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


      const centerX =
        rect.x +
        rect.width /
          2;

      const centerY =
        rect.y +
        rect.height /
          2;


      const distance =
        Math.hypot(
          x -
            centerX,
          y -
            centerY,
        );


      if (
        distance <
        bestDistance
      ) {
        bestDistance =
          distance;

        best =
          slotId;
      }
    }
  }


  return best;
}
