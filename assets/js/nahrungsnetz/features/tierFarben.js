/* ======================================== */
/* TIERFARBEN IM NAHRUNGSNETZ               */
/* ======================================== */

/*
    Nicht ausgewählte Tiere und deren
    Beziehungen sind immer grau.
*/
export const NAHRUNGSNETZ_GRAU = "#747b86";


/*
    Für ausgewählte Tiere wird aus der
    Tier-ID deterministisch eine Farbe
    erzeugt.

    Dadurch behält z. B. Panthera leo
    seine Farbe auch dann, wenn die
    Reihenfolge der Auswahl geändert wird.
*/
export function getTierFarbe(
  tierId,
) {
  const id =
    String(
      tierId ??
      "",
    );


  if (!id) {
    return NAHRUNGSNETZ_GRAU;
  }


  const hash =
    hashString(
      id,
    );


  const hue =
    Math.abs(
      hash,
    ) %
    360;


  const saturation =
    70 +
    (
      Math.abs(
        hash >> 8,
      ) %
      11
    );


  const lightness =
    58 +
    (
      Math.abs(
        hash >> 16,
      ) %
      7
    );


  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}


export function getTierDarstellungsFarbe(
  tierId,
  selectedSet,
) {
  if (
    !tierId ||
    !selectedSet?.has(
      tierId,
    )
  ) {
    return NAHRUNGSNETZ_GRAU;
  }


  return getTierFarbe(
    tierId,
  );
}


export function applyNahrungsnetzFarben(
  graph,
  selectedSet,
) {
  if (!graph) {
    return graph;
  }


  graph.nodes =
    graph.nodes.map(
      (node) => {
        if (!node.tierId) {
          return {
            ...node,

            selected:
              false,

            color:
              null,
          };
        }


        const selected =
          selectedSet.has(
            node.tierId,
          );


        return {
          ...node,

          selected,

          color:
            getTierDarstellungsFarbe(
              node.tierId,
              selectedSet,
            ),
        };
      },
    );


  graph.edges =
    graph.edges.map(
      (edge) => {
        const selected =
          selectedSet.has(
            edge.ownerTierId,
          );


        return {
          ...edge,

          selected,

          color:
            getTierDarstellungsFarbe(
              edge.ownerTierId,
              selectedSet,
            ),
        };
      },
    );


  return graph;
}


function hashString(
  value,
) {
  let hash =
    2166136261;


  for (
    let index = 0;
    index <
    value.length;
    index++
  ) {
    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );
  }


  return hash | 0;
}
