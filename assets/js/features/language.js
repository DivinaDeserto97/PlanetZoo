const DEFAULT_LANGUAGE = "de";

const LANGUAGES = [
    "de",
    "en",
    "fr"
];


/* =============================== */
/* SPRACHE LADEN                   */
/* =============================== */

export function getLanguage() {

    const language =
        localStorage.getItem(
            "language"
        );


    if (
        language &&
        LANGUAGES.includes(language)
    ) {
        return language;
    }


    return DEFAULT_LANGUAGE;

}


/* =============================== */
/* SPRACHE SETZEN                  */
/* =============================== */

export function setLanguage(language) {

    if (!LANGUAGES.includes(language)) {

        console.error(
            `Sprache "${language}" existiert nicht.`
        );

        return;

    }


    localStorage.setItem(
        "language",
        language
    );


    document.documentElement.lang =
        language;


    translate();

    updateLanguageSelect();

}


/* =============================== */
/* HTML ÜBERSETZEN                 */
/* =============================== */

export function translate() {

    const language =
        getLanguage();


    document
        .querySelectorAll(
            "[data-i18n]"
        )
        .forEach(element => {

            const text =
                element.dataset[language];


            if (text !== undefined) {

                element.textContent =
                    text;

            }

        });

}


/* =============================== */
/* SELECT AKTUALISIEREN            */
/* =============================== */

function updateLanguageSelect() {

    const language =
        getLanguage();


    document
        .querySelectorAll(
            "[data-language-select]"
        )
        .forEach(select => {

            select.value =
                language;

        });

}


/* =============================== */
/* INITIALISIEREN                  */
/* =============================== */

export function initLanguage() {

    document.documentElement.lang =
        getLanguage();


    /*
        Sprache über Select-Feld ändern
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
        Wenn pages.js einen neuen
        Body geladen hat
    */
    document.addEventListener(
        "pageLoaded",
        () => {

            translate();

            updateLanguageSelect();

        }
    );


    /*
        Wenn z.B. ein neuer Header
        geladen wurde
    */
    document.addEventListener(
        "componentLoaded",
        () => {

            translate();

            updateLanguageSelect();

        }
    );


    translate();

    updateLanguageSelect();

}