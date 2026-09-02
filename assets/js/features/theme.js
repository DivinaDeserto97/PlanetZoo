import {
    getLanguage
} from "./language.js";


const DEFAULT_THEME =
    "light";


const THEMES = [
    "light",
    "dark"
];


const THEME_LABELS = {

    light: {
        de: "Dunkel",
        en: "Dark",
        fr: "Sombre"
    },

    dark: {
        de: "Hell",
        en: "Light",
        fr: "Clair"
    }

};


/* ======================================== */
/* THEME LADEN                              */
/* ======================================== */

export function getTheme() {

    const theme =
        localStorage.getItem(
            "theme"
        );


    if (
        theme &&
        THEMES.includes(theme)
    ) {

        return theme;

    }


    return DEFAULT_THEME;

}


/* ======================================== */
/* THEME SETZEN                             */
/* ======================================== */

export function setTheme(
    theme
) {

    if (
        !THEMES.includes(theme)
    ) {

        console.error(
            `Theme "${theme}" existiert nicht.`
        );

        return;

    }


    localStorage.setItem(
        "theme",
        theme
    );


    document.documentElement.dataset.theme =
        theme;


    updateThemeButton();


    document.dispatchEvent(
        new CustomEvent(
            "themeChanged",
            {
                detail: {
                    theme
                }
            }
        )
    );

}


/* ======================================== */
/* THEME WECHSELN                           */
/* ======================================== */

export function toggleTheme() {

    const currentTheme =
        getTheme();


    const newTheme =
        currentTheme === "light"
            ? "dark"
            : "light";


    setTheme(
        newTheme
    );

}


/* ======================================== */
/* BUTTON AKTUALISIEREN                     */
/* ======================================== */

function updateThemeButton() {

    const theme =
        getTheme();


    const language =
        getLanguage();


    document
        .querySelectorAll(
            "[data-theme-toggle]"
        )
        .forEach(button => {

            const label =
                button.querySelector(
                    "[data-theme-label]"
                );


            const icon =
                button.querySelector(
                    "[data-theme-icon]"
                );


            /*
                Text zeigt an,
                wohin gewechselt wird.
            */
            if (label) {

                label.textContent =
                    THEME_LABELS[
                        theme
                    ][
                        language
                    ];

            }


            if (icon) {

                icon.textContent =
                    theme === "light"
                        ? "☾"
                        : "☀";

            }


            button.setAttribute(
                "aria-label",
                THEME_LABELS[
                    theme
                ][
                    language
                ]
            );

        });

}


/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export function initTheme() {

    document.documentElement.dataset.theme =
        getTheme();


    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-theme-toggle]"
                );


            if (!button) {

                return;

            }


            toggleTheme();

        }
    );


    /*
        Header wurde geladen.
    */
    document.addEventListener(
        "componentLoaded",
        updateThemeButton
    );


    /*
        Sprache wurde geändert.
    */
    document.addEventListener(
        "languageChanged",
        updateThemeButton
    );


    updateThemeButton();

}