/* ======================================== */
/* KNOTEN VERSCHIEBEN                       */
/* ======================================== */

export function initGraphDrag({
  node,
  stage,
  signal,
  onMove,
  onEnd,
}) {
  let drag =
    null;


  node.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.button !== 0 ||
        event.target.closest(
          "button, a, input, select, textarea",
        )
      ) {
        return;
      }


      event.preventDefault();


      const startLeft =
        Number.parseFloat(
          node.style.left,
        ) ||
        0;

      const startTop =
        Number.parseFloat(
          node.style.top,
        ) ||
        0;


      drag = {
        pointerId:
          event.pointerId,

        startX:
          event.clientX,

        startY:
          event.clientY,

        startLeft,

        startTop,
      };


      node.classList.add(
        "is-dragging",
      );


      node.setPointerCapture(
        event.pointerId,
      );
    },
    {
      signal,
    },
  );


  node.addEventListener(
    "pointermove",
    (event) => {
      if (
        !drag ||
        drag.pointerId !==
          event.pointerId
      ) {
        return;
      }


      const maxX =
        Math.max(
          0,
          stage.clientWidth -
            node.offsetWidth,
        );

      const maxY =
        Math.max(
          0,
          stage.clientHeight -
            node.offsetHeight,
        );


      const x =
        clamp(
          drag.startLeft +
            event.clientX -
            drag.startX,
          0,
          maxX,
        );

      const y =
        clamp(
          drag.startTop +
            event.clientY -
            drag.startY,
          0,
          maxY,
        );


      node.style.left =
        `${x}px`;

      node.style.top =
        `${y}px`;


      onMove?.({
        x,
        y,
      });
    },
    {
      signal,
    },
  );


  function finish(
    event,
  ) {
    if (
      !drag ||
      drag.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const position = {
      x:
        Number.parseFloat(
          node.style.left,
        ) ||
        0,

      y:
        Number.parseFloat(
          node.style.top,
        ) ||
        0,
    };


    node.classList.remove(
      "is-dragging",
    );


    if (
      node.hasPointerCapture(
        event.pointerId,
      )
    ) {
      node.releasePointerCapture(
        event.pointerId,
      );
    }


    drag =
      null;


    onEnd?.(
      position,
    );
  }


  node.addEventListener(
    "pointerup",
    finish,
    {
      signal,
    },
  );


  node.addEventListener(
    "pointercancel",
    finish,
    {
      signal,
    },
  );
}


function clamp(
  value,
  min,
  max,
) {
  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
