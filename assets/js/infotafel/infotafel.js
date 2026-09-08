function formatFoodRelation(
  beziehung,
) {
  const teile =
    [];


  teile.push(
    getFoodValueLabel(
      beziehung?.wert,
    ),
  );


  const typText =
    getFoodTypeLabel(
      beziehung?.typ,
    );


  if (typText) {
    teile.push(
      typText,
    );
  }


  let text =
    teile
      .filter(
        Boolean,
      )
      .join(
        " – ",
      );


  const bedingungen =
    formatFoodConditions(
      beziehung,
    );


  if (bedingungen) {
    text +=
      ` (${bedingungen})`;
  }


  /* ==================================== */
  /* NUTZUNG                              */
  /* ==================================== */

  if (
    beziehung?.typ ===
      "nutzung"
  ) {
    const art =
      beziehung
        ?.nutzung
        ?.art;


    if (art) {
      text +=
        ` · ${getUsageTypeLabel()}: ${enumLabel(
          art,
        )}`;
    }


    const nutzungsDaten =
      parseNutzungsHaeufigkeit(
        beziehung
          ?.nutzung
          ?.haeufigkeit,
      );


    if (nutzungsDaten.menge) {
      text +=
        ` · ${getAmountLabel()}: ${nutzungsDaten.menge}`;
    }


    if (nutzungsDaten.haeufigkeit) {
      text +=
        ` · ${getFrequencyLabel()}: ${nutzungsDaten.haeufigkeit}`;
    }


    if (nutzungsDaten.zeitraum) {
      text +=
        ` · ${getPeriodLabel()}: ${nutzungsDaten.zeitraum}`;
    }


    const nutzungsHinweis =
      getLocalizedValue(
        beziehung
          ?.nutzung
          ?.hinweis,
        getLanguage(),
      );


    if (nutzungsHinweis) {
      text +=
        ` · ${nutzungsHinweis}`;
    }
  }


  /* ==================================== */
  /* AAS                                  */
  /* ==================================== */

  if (
    beziehung?.typ ===
      "aas"
  ) {
    const zustand =
      beziehung
        ?.aas
        ?.zustand;


    if (zustand) {
      text +=
        ` · ${getCarrionStateLabel()}: ${zustand}`;
    }


    const aasHinweis =
      getLocalizedValue(
        beziehung
          ?.aas
          ?.hinweis,
        getLanguage(),
      );


    if (aasHinweis) {
      text +=
        ` · ${aasHinweis}`;
    }
  }


  const hinweis =
    getLocalizedValue(
      beziehung?.hinweis,
      getLanguage(),
    );


  if (hinweis) {
    text +=
      ` · ${hinweis}`;
  }


  return (
    text ||
    ui(
      "noData",
    )
  );
}


function parseNutzungsHaeufigkeit(
  wert,
) {
  const result = {
    menge: "",
    haeufigkeit: "",
    zeitraum: "",
  };


  if (
    typeof wert !==
      "string" ||
    !wert.trim()
  ) {
    return result;
  }


  const teile =
    wert
      .split("|")
      .map(
        (teil) =>
          teil.trim(),
      )
      .filter(
        Boolean,
      );


  teile.forEach(
    (teil) => {
      if (
        teil.startsWith(
          "Menge:",
        )
      ) {
        result.menge =
          teil
            .slice(
              "Menge:".length,
            )
            .trim();

        return;
      }


      if (
        teil.startsWith(
          "Häufigkeit:",
        )
      ) {
        result.haeufigkeit =
          teil
            .slice(
              "Häufigkeit:".length,
            )
            .trim();

        return;
      }


      if (
        teil.startsWith(
          "Zeitraum:",
        )
      ) {
        result.zeitraum =
          teil
            .slice(
              "Zeitraum:".length,
            )
            .trim();
      }
    },
  );


  return result;
}


function getAmountLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Amount"
      : "Menge";
}


function getFrequencyLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Frequency"
      : "Häufigkeit";
}


function getPeriodLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Period"
      : "Zeitraum";
}


function getUsageTypeLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Use"
      : "Nutzung";
}


function getCarrionStateLabel() {
  return getLanguage()
    .startsWith(
      "en",
    )
      ? "Condition"
      : "Zustand";
}