let currentDevice = null;
let currentOrientation = null;


/* =============================== */
/* GERÄT ERKENNEN                  */
/* =============================== */

export function getDevice() {

    const width =
        window.innerWidth;


    if (width < 768) {

        return "Handy";

    }


    if (width < 1200) {

        return "Tablet";

    }


    return "PC";

}


/* =============================== */
/* AUSRICHTUNG ERKENNEN            */
/* =============================== */

export function getOrientation() {

    if (
        window.innerWidth >
        window.innerHeight
    ) {

        return "quer";

    }


    return "hoch";

}


/* =============================== */
/* ERKENNUNG AKTUALISIEREN         */
/* =============================== */

function updateDevice() {

    const device =
        getDevice();


    const orientation =
        getOrientation();


    document.documentElement.dataset.device =
        device;


    document.documentElement.dataset.orientation =
        orientation;


    if (
        device !== currentDevice ||
        orientation !== currentOrientation
    ) {

        currentDevice =
            device;

        currentOrientation =
            orientation;


        document.dispatchEvent(
            new CustomEvent(
                "deviceChanged",
                {
                    detail: {
                        device,
                        orientation
                    }
                }
            )
        );

    }

}


/* =============================== */
/* START                           */
/* =============================== */

export function initDevice() {

    updateDevice();


    window.addEventListener(
        "resize",
        updateDevice
    );

}