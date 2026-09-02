const pages = {

    home: {
        html: "./pages/home.html",

        css: "./assets/css/home/home.css",

        js: "./home/home.js"
    },
    map: {
        html: "./pages/map.html",

        css: "./assets/css/map/map.css",

        js: "./map/map.js"
    }

};


export async function loadPage(pageName) {

    const page = pages[pageName];


    if (!page) {
        console.error(
            `Seite "${pageName}" wurde in pages.js nicht gefunden.`
        );

        return;
    }


    await loadPageHTML(page);

    loadPageCSS(page);

    await loadPageJS(page);


    /*
        Damit globale Features wissen:

        Der neue HTML-Inhalt
        ist jetzt im DOM.
    */
    document.dispatchEvent(
        new CustomEvent(
            "pageLoaded",
            {
                detail: {
                    page: pageName
                }
            }
        )
    );

}


/* =============================== */
/* HTML                            */
/* =============================== */

async function loadPageHTML(page) {

    const container =
        document.querySelector("#page");


    const response =
        await fetch(page.html);


    if (!response.ok) {

        throw new Error(
            `HTML konnte nicht geladen werden: ${page.html}`
        );

    }


    container.innerHTML =
        await response.text();

}


/* =============================== */
/* CSS                             */
/* =============================== */

function loadPageCSS(page) {

    const oldCSS =
        document.querySelector(
            "#page-css"
        );


    if (oldCSS) {
        oldCSS.remove();
    }


    const link =
        document.createElement("link");


    link.id =
        "page-css";

    link.rel =
        "stylesheet";

    link.href =
        page.css;


    document.head.appendChild(link);

}


/* =============================== */
/* JAVASCRIPT                      */
/* =============================== */

async function loadPageJS(page) {

    const module =
        await import(page.js);


    if (
        typeof module.init
        ===
        "function"
    ) {

        module.init();

    }

}