/* ======================================== */
/* GEMEINSAMES SNAP                         */
/* ======================================== */

export function snapValue(
  value,
  snap = 20,
) {
  if (
    !Number.isFinite(
      value,
    ) ||
    snap <= 0
  ) {
    return value;
  }


  return (
    Math.round(
      value /
      snap,
    ) *
    snap
  );
}


/* ======================================== */
/* KNOTEN VERSCHIEBEN                       */
/* ======================================== */

export function initGraphDrag({
  node,
  stage,
  signal,
  snap = 20,
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
          snapValue(
            drag.startLeft +
              event.clientX -
              drag.startX,
            snap,
          ),
          0,
          maxX,
        );

      const y =
        clamp(
          snapValue(
            drag.startTop +
              event.clientY -
              drag.startY,
            snap,
          ),
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
        snapValue(
          Number.parseFloat(
            node.style.left,
          ) ||
          0,
          snap,
        ),

      y:
        snapValue(
          Number.parseFloat(
            node.style.top,
          ) ||
          0,
          snap,
        ),
    };


    node.style.left =
      `${position.x}px`;

    node.style.top =
      `${position.y}px`;


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


/* ======================================== */
/* FREIER SNAP-PUNKT                        */
/* ======================================== */

export function initGraphPointDrag({
  point,
  stage,
  signal,
  snap = 20,
  onMove,
  onEnd,
}) {
  let drag =
    null;


  point.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.button !==
        0
      ) {
        return;
      }


      event.preventDefault();
      event.stopPropagation();


      drag = {
        pointerId:
          event.pointerId,
      };


      point.classList.add(
        "is-dragging",
      );


      point.setPointerCapture(
        event.pointerId,
      );


      movePoint(
        event,
      );
    },
    {
      signal,
    },
  );


  point.addEventListener(
    "pointermove",
    (event) => {
      if (
        !drag ||
        drag.pointerId !==
          event.pointerId
      ) {
        return;
      }


      movePoint(
        event,
      );
    },
    {
      signal,
    },
  );


  function movePoint(
    event,
  ) {
    const rect =
      stage.getBoundingClientRect();


    const x =
      clamp(
        snapValue(
          event.clientX -
            rect.left,
          snap,
        ),
        0,
        stage.clientWidth,
      );

    const y =
      clamp(
        snapValue(
          event.clientY -
            rect.top,
          snap,
        ),
        0,
        stage.clientHeight,
      );


    point.style.left =
      `${x}px`;

    point.style.top =
      `${y}px`;


    onMove?.({
      x,
      y,
    });
  }


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
        snapValue(
          Number.parseFloat(
            point.style.left,
          ) ||
          0,
          snap,
        ),

      y:
        snapValue(
          Number.parseFloat(
            point.style.top,
          ) ||
          0,
          snap,
        ),
    };


    point.classList.remove(
      "is-dragging",
    );


    if (
      point.hasPointerCapture(
        event.pointerId,
      )
    ) {
      point.releasePointerCapture(
        event.pointerId,
      );
    }


    drag =
      null;


    onEnd?.(
      position,
    );
  }


  point.addEventListener(
    "pointerup",
    finish,
    {
      signal,
    },
  );


  point.addEventListener(
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
