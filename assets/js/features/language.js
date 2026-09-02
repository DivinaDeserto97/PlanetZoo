const DEFAULT_LANGUAGE =
    "de";


const LANGUAGES = [
    "de",
    "en",
    "fr"
];


/* ======================================== */
/* SPRACHE LADEN                            */
/* ======================================== */

export function getLanguage() {

    const language =
        localStorage.getItem(
            "language"
        );


    if (
        language &&
        LANGUAGES.includes(
            language
        )
    ) {

        return language;

    }


    return DEFAULT_LANGUAGE;

}


/* ======================================== */
/* SPRACHE SETZEN                           */
/* ======================================== */

export function setLanguage(
    language
) {

    if (
        !LANGUAGES.includes(
            language
        )
    ) {

        console.error(
            `Sprache "${language}" existiert nicht.`
        );

        return;

    }


    /*
        Sprache speichern.
    */
    localStorage.setItem(
        "language",
        language
    );


    /*
        Sprache ins HTML schreiben.
    */
    document.documentElement.lang =
        language;


    /*
        Seite übersetzen.
    */
    translate();


    /*
        Select aktualisieren.
    */
    updateLanguageSelect();


    /*
        Andere Features informieren:
        Sprache wurde geändert.
    */
    document.dispatchEvent(
        new CustomEvent(
            "languageChanged",
            {
                detail: {
                    language
                }
            }
        )
    );

}


/* ======================================== */
/* HTML ÜBERSETZEN                          */
/* ======================================== */

export function translate() {

    const language =
        getLanguage();


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(
            element => {

                const text =
                    element.dataset[
                        language
                    ];


                if (
                    text !== undefined
                ) {

                    element.textContent =
                        text;

                }

            }
        );

}


/* ======================================== */
/* SPRACH-SELECT AKTUALISIEREN              */
/* ======================================== */

function updateLanguageSelect() {

    const language =
        getLanguage();


    document
        .querySelectorAll(
            "[data-language-select]"
        )
        .forEach(
            select => {

                select.value =
                    language;

            }
        );

}


/* ======================================== */
/* INITIALISIEREN                           */
/* ======================================== */

export function initLanguage() {

    /*
        Gespeicherte Sprache
        direkt setzen.
    */
    document.documentElement.lang =
        getLanguage();


    /*
        Sprache über Select ändern.
    */
    document.addEventListener(
        "change",
        event => {

            const select =
                event.target.closest(
                    "[data-language-select]"
                );


            if (!select) {

                return;

            }


            setLanguage(
                select.value
            );

        }
    );


    /*
        Neue Seite wurde geladen.
    */
    document.addEventListener(
        "pageLoaded",
        () => {

            translate();

            updateLanguageSelect();

        }
    );


    /*
        Neue Komponente,
        z.B. Header, wurde geladen.
    */
    document.addEventListener(
        "componentLoaded",
        () => {

            translate();

            updateLanguageSelect();

        }
    );


    /*
        Direkt beim Start.
    */
    translate();

    updateLanguageSelect();

}