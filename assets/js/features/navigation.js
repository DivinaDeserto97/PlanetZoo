import {
    pages,
    loadPage,
    getCurrentPage
} from "../pages.js";


import {
    getLanguage
} from "./language.js";


/* ======================================== */
/* NAVIGATION ERSTELLEN                     */
/* ======================================== */

export function buildNavigation() {

    const navigation =
        document.querySelector(
            "[data-main-navigation]"
        );


    /*
        Noch kein Header geladen.
    */
    if (!navigation) {

        return;

    }


    /*
        Alte Navigation entfernen.
    */
    navigation.innerHTML =
        "";


    const language =
        getLanguage();


    /*
        Alle Seiten aus pages.js
        durchgehen.
    */
    Object.entries(
        pages
    ).forEach(
        ([pageName, page]) => {

            /*
                navigation: null

                bedeutet:
                Diese Seite erscheint
                NICHT in der Navigation.
            */
            if (!page.navigation) {

                return;

            }


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                `#${pageName}`;


            link.dataset.page =
                pageName;


            /*
                Text aus pages.js
                entsprechend der Sprache.
            */
            link.textContent =
                page.navigation[language]
                ??
                page.navigation.de
                ??
                pageName;


            /*
                Aktuelle Seite markieren.
            */
            if (
                pageName ===
                getCurrentPage()
            ) {

                link.classList.add(
                    "active"
                );

            }


            navigation.appendChild(
                link
            );

        }
    );

}


/* ======================================== */
/* SEITE WECHSELN                           */
/* ======================================== */

async function navigateTo(
    pageName
) {

    if (!pages[pageName]) {

        console.error(
            `Seite "${pageName}" existiert nicht.`
        );

        return;

    }


    await loadPage(
        pageName
    );


    /*
        Navigation neu aufbauen,
        damit active stimmt.
    */
    buildNavigation();

}


/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export function initNavigation() {

    /*
        Klick auf:
        - Navigation
        - PlanetZoo2 Home-Link
    */
    document.addEventListener(
        "click",
        async event => {

            const link =
                event.target.closest(
                    "[data-page]"
                );


            if (!link) {

                return;

            }


            event.preventDefault();


            await navigateTo(
                link.dataset.page
            );

        }
    );


    /*
        Header wurde geladen.

        Jetzt kann Navigation
        hineingeschrieben werden.
    */
    document.addEventListener(
        "componentLoaded",
        () => {

            buildNavigation();

        }
    );


    /*
        Sprache wurde geändert.

        Navigationsnamen neu laden.
    */
    document.addEventListener(
        "languageChanged",
        () => {

            buildNavigation();

        }
    );


    /*
        Neue Seite geladen.

        Active-Status aktualisieren.
    */
    document.addEventListener(
        "pageLoaded",
        () => {

            buildNavigation();

        }
    );

}