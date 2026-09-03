import {
    getLanguage
} from "../../features/language.js";


const TIER_FARBEN = [
    "#38bdf8",
    "#f59e0b",
    "#a78bfa",
    "#34d399",
    "#fb7185",
    "#facc15"
];


/* ======================================== */
/* TIERNAME                                 */
/* ======================================== */

export function getTierName(
    tier,
    language = getLanguage()
) {

    const namen =
        tier.namen
        ??
        tier.originalDaten
            ?.identitaet
            ?.namen
        ??
        {};


    /* ==================================== */
    /* AKTUELLE SPRACHE                     */
    /* ==================================== */

    if (
        namen[language]
    ) {

        return namen[language];

    }


    /* ==================================== */
    /* DEUTSCH ALS FALLBACK                 */
    /* ==================================== */

    if (
        namen.de
    ) {

        return namen.de;

    }


    /* ==================================== */
    /* WISSENSCHAFTLICHER NAME              */
    /* ==================================== */

    return (
        tier.wissenschaftlicherName
        ??
        tier.id
        ??
        "Unbekannte Tierart"
    );

}


/* ======================================== */
/* TIERLISTE INITIALISIEREN                 */
/* ======================================== */

export function initTierListe(
    tiere,
    renderer,
    signal
) {

    const container =
        document.querySelector(
            "[data-animal-list]"
        );


    const count =
        document.querySelector(
            "[data-animal-count]"
        );


    if (!container) {

        return null;

    }


    /* ==================================== */
    /* FARBE VERGEBEN                       */
    /* ==================================== */

    tiere.forEach(
        (
            tier,
            index
        ) => {

            tier.mapColor =
                TIER_FARBEN[
                    index
                    %
                    TIER_FARBEN.length
                ];

        }
    );


    /* ==================================== */
    /* AUSGEWÄHLTE TIERE                    */
    /* ==================================== */

    const selected =
        new Set();


    /*
        Alle Tiere mit vorhandener
        Verbreitungskarte standardmäßig
        einschalten.
    */

    tiere.forEach(
        tier => {

            if (
                tier.kartenPfad
            ) {

                selected.add(
                    tier.id
                );

            }

        }
    );


    /* ==================================== */
    /* LISTE RENDERN                        */
    /* ==================================== */

    function render(
        visibleTiere = tiere
    ) {

        container.innerHTML =
            "";


        if (count) {

            count.textContent =
                String(
                    visibleTiere.length
                );

        }


        visibleTiere.forEach(
            tier => {

                /* ======================== */
                /* ZEILE                    */
                /* ======================== */

                const row =
                    document.createElement(
                        "label"
                    );


                row.className =
                    "map-animal";


                row.dataset.animalId =
                    tier.id;


                /* ======================== */
                /* CHECKBOX                 */
                /* ======================== */

                const checkbox =
                    document.createElement(
                        "input"
                    );


                checkbox.type =
                    "checkbox";


                checkbox.className =
                    "map-animal__checkbox";


                checkbox.checked =
                    selected.has(
                        tier.id
                    );


                checkbox.disabled =
                    !tier.kartenPfad;


                checkbox.addEventListener(
                    "change",
                    () => {

                        if (
                            checkbox.checked
                        ) {

                            selected.add(
                                tier.id
                            );

                        }

                        else {

                            selected.delete(
                                tier.id
                            );

                        }


                        renderer.render(
                            selected
                        );

                    },
                    {
                        signal
                    }
                );


                /* ======================== */
                /* FARBPUNKT                */
                /* ======================== */

                const color =
                    document.createElement(
                        "span"
                    );


                color.className =
                    "map-animal__color";


                color.style.backgroundColor =
                    tier.mapColor;


                /* ======================== */
                /* TEXT                     */
                /* ======================== */

                const text =
                    document.createElement(
                        "span"
                    );


                const name =
                    document.createElement(
                        "span"
                    );


                name.className =
                    "map-animal__name";


                name.textContent =
                    getTierName(
                        tier
                    );


                /* ======================== */
                /* WISSENSCHAFTLICHER NAME  */
                /* ======================== */

                const scientific =
                    document.createElement(
                        "span"
                    );


                scientific.className =
                    "map-animal__scientific";


                scientific.textContent =
                    tier.wissenschaftlicherName;


                text.append(
                    name,
                    scientific
                );


                row.append(
                    checkbox,
                    color,
                    text
                );


                container.appendChild(
                    row
                );

            }
        );

    }


    /* ==================================== */
    /* ALLE EIN                             */
    /* ==================================== */

    document
        .querySelector(
            "[data-select-all]"
        )
        ?.addEventListener(
            "click",
            () => {

                tiere.forEach(
                    tier => {

                        if (
                            tier.kartenPfad
                        ) {

                            selected.add(
                                tier.id
                            );

                        }

                    }
                );


                render();


                renderer.render(
                    selected
                );

            },
            {
                signal
            }
        );


    /* ==================================== */
    /* ALLE AUS                             */
    /* ==================================== */

    document
        .querySelector(
            "[data-select-none]"
        )
        ?.addEventListener(
            "click",
            () => {

                selected.clear();


                render();


                renderer.render(
                    selected
                );

            },
            {
                signal
            }
        );


    /* ==================================== */
    /* SPRACHE WECHSELN                     */
    /* ==================================== */

    document.addEventListener(
        "languageChanged",
        () => {

            render();


            renderer.updateLanguage();

        },
        {
            signal
        }
    );


    /* ==================================== */
    /* ERSTER AUFBAU                        */
    /* ==================================== */

    render();


    renderer.render(
        selected
    );


    return {

        render,

        selected

    };

}