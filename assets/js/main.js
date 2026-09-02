import {
    loadPage
} from "./pages.js";


import {
    initLanguage
} from "./features/language.js";


import {
    initDevice,
    getDevice
} from "./features/device.js";



/* =============================== */
/* HEADER                          */
/* =============================== */

let loadedHeader = null;


async function loadHeader() {

    const device =
        getDevice();


    /*
        Richtiger Header ist bereits da.
    */
    if (loadedHeader === device) {
        return;
    }


    loadedHeader =
        device;


    const header =
        document.querySelector(
            "#header"
        );


    const base =
        `./assets/components/header/${device}`;


    /* HTML */

    const response =
        await fetch(
            `${base}/header.html`
        );


    if (!response.ok) {

        console.error(
            `Header "${device}" konnte nicht geladen werden.`
        );

        return;

    }


    header.innerHTML =
        await response.text();


    /* CSS */

    const oldCSS =
        document.querySelector(
            "#header-css"
        );


    if (oldCSS) {
        oldCSS.remove();
    }


    const css =
        document.createElement(
            "link"
        );


    css.id =
        "header-css";

    css.rel =
        "stylesheet";

    css.href =
        `${base}/header.css`;


    document.head.appendChild(css);


    /* JS */

    const module =
        await import(
            `../components/header/${device}/header.js`
        );


    if (
        typeof module.init
        ===
        "function"
    ) {

        module.init();

    }


    document.dispatchEvent(
        new CustomEvent(
            "componentLoaded"
        )
    );

}


/* =============================== */
/* PROGRAMMSTART                   */
/* =============================== */

async function main() {

    /*
        Allgemeine Features
    */

    initLanguage();

    initDevice();


    /*
        Header
    */

    await loadHeader();


    /*
        Erster Body
    */

    await loadPage(
        "home"
    );

}


/*
    Gerät / Ausrichtung geändert
*/
document.addEventListener(
    "deviceChanged",
    async () => {

        await loadHeader();

    }
);


main();