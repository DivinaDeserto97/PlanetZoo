function alsArray(wert) {
  return Array.isArray(wert)
    ? wert
    : [];
}


function hatText(wert) {
  return (
    typeof wert === "string" &&
    wert.trim().length > 0
  );
}


export function hatLokalisierterText(
  wert,
) {
  if (
    typeof wert ===
    "string"
  ) {
    return hatText(wert);
  }


  if (
    !wert ||
    typeof wert !==
      "object"
  ) {
    return false;
  }


  return Object.values(
    wert,
  ).some(
    (text) =>
      hatText(text),
  );
}


function flattenGruppen(
  gruppen,
) {
  const result = [];


  alsArray(
    gruppen,
  ).forEach(
    (
      gruppe,
      gruppenIndex,
    ) => {
      const varianten =
        alsArray(
          gruppe?.varianten,
        );


      varianten.forEach(
        (
          variante,
          variantenIndex,
        ) => {
          result.push({
            gruppe,
            gruppenIndex,
            variante,
            variantenIndex,
            dateien:
              alsArray(
                variante?.dateien,
              ),
            metadaten:
              alsArray(
                variante?.metadaten,
              ),
          });
        },
      );
    },
  );


  return result;
}


export function getBildVarianten(
  tier,
) {
  return flattenGruppen(
    tier?.originalDaten
      ?.bilder ??
      tier?.bilder,
  );
}


export function getAudioVarianten(
  tier,
) {
  return flattenGruppen(
    tier?.originalDaten
      ?.audio ??
      tier?.audio,
  );
}


export function getVideoVarianten(
  tier,
) {
  return flattenGruppen(
    tier?.originalDaten
      ?.video ??
      tier?.video,
  );
}


export function getBesteBildDatei(
  dateien,
) {
  return (
    alsArray(
      dateien,
    ).find(
      (datei) =>
        datei?.typ ===
          "wiedergabe" &&
        hatText(
          datei?.pfad,
        ),
    ) ??
    alsArray(
      dateien,
    ).find(
      (datei) =>
        datei?.typ ===
          "original" &&
        hatText(
          datei?.pfad,
        ),
    ) ??
    alsArray(
      dateien,
    ).find(
      (datei) =>
        hatText(
          datei?.pfad,
        ),
    ) ??
    null
  );
}


export function getBesteAudioDatei(
  dateien,
) {
  const liste =
    alsArray(
      dateien,
    );


  const bevorzugt = [
    "mp3",
    "ogg",
    "wav",
    "m4a",
    "aac",
    "flac",
  ];


  for (
    const dateityp of
    bevorzugt
  ) {
    const gefunden =
      liste.find(
        (datei) =>
          String(
            datei?.dateityp ??
              "",
          ).toLowerCase() ===
            dateityp &&
          hatText(
            datei?.pfad,
          ),
      );


    if (gefunden) {
      return gefunden;
    }
  }


  return (
    liste.find(
      (datei) =>
        hatText(
          datei?.pfad,
        ),
    ) ??
    null
  );
}


export function getBesteVideoDatei(
  dateien,
) {
  const liste =
    alsArray(
      dateien,
    );


  return (
    liste.find(
      (datei) =>
        datei?.typ ===
          "wiedergabe" &&
        hatText(
          datei?.pfad,
        ),
    ) ??
    liste.find(
      (datei) =>
        [
          "mp4",
          "webm",
        ].includes(
          String(
            datei?.dateityp ??
              "",
          ).toLowerCase(),
        ) &&
        hatText(
          datei?.pfad,
        ),
    ) ??
    liste.find(
      (datei) =>
        hatText(
          datei?.pfad,
        ),
    ) ??
    null
  );
}


export function getInfotafelBilder(
  tier,
) {
  return getBildVarianten(
    tier,
  )
    .map(
      (entry) => {
        const datei =
          getBesteBildDatei(
            entry.dateien,
          );


        if (!datei) {
          return null;
        }


        return {
          pfad:
            datei.pfad,
          typ:
            entry.gruppe?.typ ??
            "bild",
          variante:
            entry.variante
              ?.variante ??
            entry.variantenIndex +
              1,
          quelle:
            entry.variante
              ?.quelle ??
            "",
          alt:
            entry.variante
              ?.alt ??
            {},
          beschreibung:
            entry.variante
              ?.beschreibung ??
            entry.gruppe
              ?.beschreibung ??
            {},
        };
      },
    )
    .filter(Boolean);
}


export function getInfotafelAudioItems(
  tier,
) {
  return getAudioVarianten(
    tier,
  )
    .map(
      (entry) => {
        const datei =
          getBesteAudioDatei(
            entry.dateien,
          );


        if (!datei) {
          return null;
        }


        const meta =
          entry.metadaten.find(
            (eintrag) =>
              hatText(
                eintrag?.pfad,
              ),
          ) ??
          null;


        return {
          key:
            `${entry.gruppe?.typ ?? "Audio"}-${entry.variante?.variante ?? entry.variantenIndex + 1}-${datei.pfad}`,
          typ:
            entry.gruppe?.typ ||
            "Audio",
          variante:
            entry.variante
              ?.variante ??
            entry.variantenIndex +
              1,
          src:
            datei.pfad,
          metaPath:
            meta?.pfad ??
            null,
        };
      },
    )
    .filter(Boolean);
}
