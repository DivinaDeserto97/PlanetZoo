import {
  hatLokalisierterText,
} from "./tierMedien.js";

import {
  SYSTEMATIK_DOMESTIKATIONSSTATUS,
  SYSTEMATIK_LEBENSSTATUS,
  SYSTEMATIK_SPIELE,
  SYSTEMATIK_VERBINDUNGSTYPEN,
} from "./systematikSchema.js";


function hatText(
  value,
) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}


function istObjekt(
  value,
) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(
      value,
    )
  );
}


function hatEigenesFeld(
  object,
  key,
) {
  return Object.prototype.hasOwnProperty.call(
    object ?? {},
    key,
  );
}


function item(
  label,
  pfad,
  ok,
  fehlt = [],
) {
  return {
    label,
    pfad,
    ok:
      Boolean(
        ok,
      ),
    fehlt:
      fehlt.filter(
        Boolean,
      ),
  };
}


function pruefeOptionalenText(
  fehlt,
  object,
  key,
  meldung,
) {
  if (
    hatEigenesFeld(
      object,
      key,
    ) &&
    !hatText(
      object[key],
    )
  ) {
    fehlt.push(
      meldung,
    );
  }
}


function pruefeKnoten(
  knoten,
  index,
) {
  const fehlt =
    [];


  if (
    !istObjekt(
      knoten,
    )
  ) {
    return [
      "Knoten ist kein Objekt.",
    ];
  }


  if (
    !hatText(
      knoten.id,
    )
  ) {
    fehlt.push(
      "ID fehlt.",
    );
  }


  if (
    !hatText(
      knoten.rang,
    )
  ) {
    fehlt.push(
      "Rang fehlt.",
    );
  }


  if (
    !hatText(
      knoten.name,
    )
  ) {
    fehlt.push(
      "Name fehlt.",
    );
  }


  if (
    !hatText(
      knoten.quelle,
    )
  ) {
    fehlt.push(
      "Quelle fehlt.",
    );
  }


  pruefeOptionalenText(
    fehlt,
    knoten,
    "deutscherName",
    "deutscherName ist angelegt, aber leer.",
  );


  if (
    hatEigenesFeld(
      knoten,
      "lebensstatus",
    ) &&
    knoten.lebensstatus !== null &&
    !SYSTEMATIK_LEBENSSTATUS.includes(
      knoten.lebensstatus,
    )
  ) {
    fehlt.push(
      `lebensstatus muss einer dieser Werte sein: ${SYSTEMATIK_LEBENSSTATUS.join(", ")}.`,
    );
  }


  if (
    hatEigenesFeld(
      knoten,
      "domestikationsstatus",
    ) &&
    knoten.domestikationsstatus !== null &&
    !SYSTEMATIK_DOMESTIKATIONSSTATUS.includes(
      knoten.domestikationsstatus,
    )
  ) {
    fehlt.push(
      `domestikationsstatus muss einer dieser Werte sein: ${SYSTEMATIK_DOMESTIKATIONSSTATUS.join(", ")}.`,
    );
  }


  if (
    hatEigenesFeld(
      knoten,
      "schutzstatus",
    ) &&
    knoten.schutzstatus !== null &&
    !hatText(
      knoten.schutzstatus,
    )
  ) {
    fehlt.push(
      "schutzstatus muss Text oder null sein.",
    );
  }


  if (
    hatEigenesFeld(
      knoten,
      "spiele",
    )
  ) {
    if (
      !Array.isArray(
        knoten.spiele,
      )
    ) {
      fehlt.push(
        "spiele muss ein Array sein.",
      );
    }

    else {
      knoten.spiele.forEach(
        (spiel) => {
          if (
            !SYSTEMATIK_SPIELE.includes(
              spiel,
            )
          ) {
            fehlt.push(
              `Unbekanntes Spiel „${spiel}“.`,
            );
          }
        },
      );
    }
  }


  if (
    hatEigenesFeld(
      knoten,
      "position",
    ) &&
    knoten.position !== null &&
    !(
      hatText(
        knoten.position,
      ) &&
      /^\d+\.\d+$/.test(
        knoten.position,
      )
    )
  ) {
    fehlt.push(
      "position muss z. B. „2.4“ sein.",
    );
  }


  if (
    hatEigenesFeld(
      knoten,
      "hinweis",
    ) &&
    !hatLokalisierterText(
      knoten.hinweis,
    )
  ) {
    fehlt.push(
      "hinweis ist angelegt, aber leer.",
    );
  }


  return fehlt;
}


export function pruefeSystematikStruktur(
  systematik,
) {
  const checks =
    [];


  if (
    !istObjekt(
      systematik,
    )
  ) {
    checks.push(
      item(
        "Systematik",
        "systematik",
        false,
        [
          "Systematik-Struktur fehlt.",
        ],
      ),
    );


    return checks;
  }


  if (
    hatEigenesFeld(
      systematik,
      "hinweis",
    )
  ) {
    checks.push(
      item(
        "Systematik – Hinweis",

        "systematik.hinweis",

        hatLokalisierterText(
          systematik.hinweis,
        ),

        [
          !hatLokalisierterText(
            systematik.hinweis,
          )
            ? "Hinweis ist angelegt, aber leer."
            : null,
        ],
      ),
    );
  }


  /* ======================================== */
  /* NAHE VERWANDTE – OPTIONAL                */
  /* ======================================== */

  if (
    hatEigenesFeld(
      systematik,
      "naheVerwandte",
    )
  ) {
    const naheVerwandte =
      systematik.naheVerwandte;


    if (
      !Array.isArray(
        naheVerwandte,
      ) ||
      naheVerwandte.length ===
        0
    ) {
      checks.push(
        item(
          "Nahe Verwandte",

          "systematik.naheVerwandte",

          false,

          [
            "naheVerwandte ist angelegt, aber leer oder kein Array.",
          ],
        ),
      );
    }

    else {
      naheVerwandte.forEach(
        (
          verwandter,
          index,
        ) => {
          const fehlt =
            [];


          if (
            !istObjekt(
              verwandter,
            )
          ) {
            fehlt.push(
              "Eintrag ist kein Objekt.",
            );
          }

          else {
            if (
              !hatText(
                verwandter.id,
              )
            ) {
              fehlt.push(
                "Wissenschaftliche ID / Art fehlt.",
              );
            }


            if (
              !hatText(
                verwandter.beziehung,
              )
            ) {
              fehlt.push(
                "Beziehung fehlt.",
              );
            }


            if (
              !hatText(
                verwandter.deutscherName,
              )
            ) {
              fehlt.push(
                "Deutscher Name fehlt.",
              );
            }


            if (
              !hatText(
                verwandter.quelle,
              )
            ) {
              fehlt.push(
                "Quelle fehlt.",
              );
            }
          }


          checks.push(
            item(
              `Nahe Verwandte – Eintrag ${index + 1}`,

              `systematik.naheVerwandte[${index}]`,

              fehlt.length ===
                0,

              fehlt,
            ),
          );
        },
      );
    }
  }


  /* ======================================== */
  /* EVOLUTION                                */
  /* ======================================== */

  const evolution =
    systematik.evolution;


  if (
    !istObjekt(
      evolution,
    )
  ) {
    checks.push(
      item(
        "Evolution",

        "systematik.evolution",

        false,

        [
          "Evolution-Struktur fehlt.",
        ],
      ),
    );


    return checks;
  }


  if (
    hatEigenesFeld(
      evolution,
      "hinweis",
    )
  ) {
    checks.push(
      item(
        "Evolution – Hinweis",

        "systematik.evolution.hinweis",

        hatLokalisierterText(
          evolution.hinweis,
        ),

        [
          !hatLokalisierterText(
            evolution.hinweis,
          )
            ? "Evolution-Hinweis ist angelegt, aber leer."
            : null,
        ],
      ),
    );
  }


  /* ======================================== */
  /* KNOTEN                                   */
  /* ======================================== */

  const knoten =
    evolution.knoten;


  if (
    !Array.isArray(
      knoten,
    ) ||
    knoten.length ===
      0
  ) {
    checks.push(
      item(
        "Evolution – Knoten",

        "systematik.evolution.knoten",

        false,

        [
          "Mindestens ein Evolutions-Knoten fehlt.",
        ],
      ),
    );
  }

  else {
    knoten.forEach(
      (
        knotenEintrag,
        index,
      ) => {
        const fehlt =
          pruefeKnoten(
            knotenEintrag,
            index,
          );


        checks.push(
          item(
            `Evolution – Knoten ${index + 1}`,

            `systematik.evolution.knoten[${index}]`,

            fehlt.length ===
              0,

            fehlt,
          ),
        );
      },
    );
  }


  /* ======================================== */
  /* AUFSPALTUNGEN – OPTIONAL                 */
  /* ======================================== */

  if (
    hatEigenesFeld(
      evolution,
      "aufspaltungen",
    )
  ) {
    const aufspaltungen =
      evolution.aufspaltungen;


    if (
      !Array.isArray(
        aufspaltungen,
      ) ||
      aufspaltungen.length ===
        0
    ) {
      checks.push(
        item(
          "Evolution – Aufspaltungen",

          "systematik.evolution.aufspaltungen",

          false,

          [
            "aufspaltungen ist angelegt, aber leer oder kein Array.",
          ],
        ),
      );
    }

    else {
      aufspaltungen.forEach(
        (
          aufspaltung,
          index,
        ) => {
          const fehlt =
            [];


          if (
            !hatText(
              aufspaltung?.linieA,
            )
          ) {
            fehlt.push(
              "Linie A fehlt.",
            );
          }


          if (
            !hatText(
              aufspaltung?.linieB,
            )
          ) {
            fehlt.push(
              "Linie B fehlt.",
            );
          }


          if (
            typeof aufspaltung?.zeitVorHeuteMioJahre !==
              "number" ||
            !Number.isFinite(
              aufspaltung.zeitVorHeuteMioJahre,
            )
          ) {
            fehlt.push(
              "Zeit vor heute in Mio. Jahren fehlt oder ist keine Zahl.",
            );
          }


          if (
            !hatText(
              aufspaltung?.typ,
            )
          ) {
            fehlt.push(
              "Typ der Aufspaltung fehlt.",
            );
          }


          if (
            !hatText(
              aufspaltung?.quelle,
            )
          ) {
            fehlt.push(
              "Quelle fehlt.",
            );
          }


          checks.push(
            item(
              `Evolution – Aufspaltung ${index + 1}`,

              `systematik.evolution.aufspaltungen[${index}]`,

              fehlt.length ===
                0,

              fehlt,
            ),
          );
        },
      );
    }
  }


  /* ======================================== */
  /* EXPLIZITE VERBINDUNGEN – OPTIONAL        */
  /* ======================================== */

  if (
    hatEigenesFeld(
      evolution,
      "verbindungen",
    )
  ) {
    const verbindungen =
      evolution.verbindungen;


    if (
      !Array.isArray(
        verbindungen,
      ) ||
      verbindungen.length ===
        0
    ) {
      checks.push(
        item(
          "Evolution – Verbindungen",

          "systematik.evolution.verbindungen",

          false,

          [
            "verbindungen ist angelegt, aber leer oder kein Array.",
          ],
        ),
      );
    }

    else {
      verbindungen.forEach(
        (
          verbindung,
          index,
        ) => {
          const fehlt =
            [];


          if (
            !hatText(
              verbindung?.von,
            )
          ) {
            fehlt.push(
              "von fehlt.",
            );
          }


          if (
            !hatText(
              verbindung?.nach,
            )
          ) {
            fehlt.push(
              "nach fehlt.",
            );
          }


          if (
            !SYSTEMATIK_VERBINDUNGSTYPEN.includes(
              verbindung?.typ,
            )
          ) {
            fehlt.push(
              `typ muss einer dieser Werte sein: ${SYSTEMATIK_VERBINDUNGSTYPEN.join(", ")}.`,
            );
          }


          if (
            !hatText(
              verbindung?.quelle,
            )
          ) {
            fehlt.push(
              "Quelle fehlt.",
            );
          }


          if (
            hatEigenesFeld(
              verbindung,
              "hinweis",
            ) &&
            !hatLokalisierterText(
              verbindung.hinweis,
            )
          ) {
            fehlt.push(
              "hinweis ist angelegt, aber leer.",
            );
          }


          checks.push(
            item(
              `Evolution – Verbindung ${index + 1}`,

              `systematik.evolution.verbindungen[${index}]`,

              fehlt.length ===
                0,

              fehlt,
            ),
          );
        },
      );
    }
  }


  return checks;
}