import {
  findNearestSlot,
} from "./graphGrid.js";


/* ======================================== */
/* KÄSTCHEN AUF LOGISCHEN SLOT ZIEHEN       */
/* ======================================== */

export function initGraphSlotDrag({
  node,
  stage,
  layout,
  signal,
  onPreview,
  onDrop,
}) {
  let drag =
    null;


  node.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.button !==
          0 ||
        event.target.closest(
          "button, a, input, select, textarea",
        )
      ) {
        return;
      }


      event.preventDefault();


      const stageRect =
        stage.getBoundingClientRect();

      const nodeRect =
        node.getBoundingClientRect();


      drag = {
        pointerId:
          event.pointerId,

        offsetX:
          event.clientX -
          nodeRect.left,

        offsetY:
          event.clientY -
          nodeRect.top,

        stageLeft:
          stageRect.left,

        stageTop:
          stageRect.top,
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


      const left =
        event.clientX -
        drag.stageLeft -
        drag.offsetX;

      const top =
        event.clientY -
        drag.stageTop -
        drag.offsetY;


      node.style.left =
        `${left}px`;

      node.style.top =
        `${top}px`;


      const centerX =
        left +
        node.offsetWidth /
          2;

      const centerY =
        top +
        node.offsetHeight /
          2;


      const slotId =
        findNearestSlot(
          layout,
          centerX,
          centerY,
        );


      onPreview?.(
        slotId,
      );
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


    const left =
      Number.parseFloat(
        node.style.left,
      ) ||
      0;

    const top =
      Number.parseFloat(
        node.style.top,
      ) ||
      0;


    const slotId =
      findNearestSlot(
        layout,
        left +
          node.offsetWidth /
            2,
        top +
          node.offsetHeight /
            2,
      );


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


    onDrop?.(
      slotId,
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
/* SPUR-HANDLE ZIEHEN                       */
/* ======================================== */

export function initLaneHandleDrag({
  handle,
  stage,
  layout,
  corridorRect,
  orientation,
  laneCount,
  signal,
  onDrop,
}) {
  let drag =
    null;


  handle.addEventListener(
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


      const stageRect =
        stage.getBoundingClientRect();


      drag = {
        pointerId:
          event.pointerId,

        stageLeft:
          stageRect.left,

        stageTop:
          stageRect.top,
      };


      handle.classList.add(
        "is-dragging",
      );


      handle.setPointerCapture(
        event.pointerId,
      );
    },
    {
      signal,
    },
  );


  handle.addEventListener(
    "pointermove",
    (event) => {
      if (
        !drag ||
        drag.pointerId !==
          event.pointerId
      ) {
        return;
      }


      const lane =
        getLaneFromPointer(
          event,
          drag,
          layout,
          corridorRect,
          orientation,
          laneCount,
        );


      handle.dataset.previewLane =
        String(
          lane,
        );


      handle.title =
        `Spur ${lane}`;
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


    const lane =
      getLaneFromPointer(
        event,
        drag,
        layout,
        corridorRect,
        orientation,
        laneCount,
      );


    handle.classList.remove(
      "is-dragging",
    );


    if (
      handle.hasPointerCapture(
        event.pointerId,
      )
    ) {
      handle.releasePointerCapture(
        event.pointerId,
      );
    }


    drag =
      null;


    onDrop?.(
      lane,
    );
  }


  handle.addEventListener(
    "pointerup",
    finish,
    {
      signal,
    },
  );


  handle.addEventListener(
    "pointercancel",
    finish,
    {
      signal,
    },
  );
}


function getLaneFromPointer(
  event,
  drag,
  layout,
  rect,
  orientation,
  laneCount,
) {
  const config =
    layout.config;


  let offset;


  if (
    orientation ===
    "vertical"
  ) {
    offset =
      event.clientX -
      drag.stageLeft -
      rect.x -
      config.edgeMargin;
  }

  else {
    offset =
      event.clientY -
      drag.stageTop -
      rect.y -
      config.edgeMargin;
  }


  const lane =
    Math.round(
      offset /
      config.lineGap,
    ) +
    1;


  return Math.max(
    1,
    Math.min(
      Math.max(
        1,
        laneCount,
      ),
      lane,
    ),
  );
}
