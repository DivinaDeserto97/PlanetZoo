const BREITE = 784;
const HOEHE = 292;
const SPEICHERNAME = "meine-tier-verbreitungskarten";

const FARBEN = [
  [47, 195, 255],
  [255, 178, 63],
  [110, 221, 131],
  [214, 105, 255],
  [255, 102, 121],
  [77, 224, 190],
  [255, 217, 91],
  [117, 137, 255],
  [255, 143, 73],
  [241, 108, 190],
];

const canvas = document.querySelector("#weltkarte");
const ctx = canvas.getContext("2d", {
  willReadFrequently: true,
});

const formular = document.querySelector("#tierFormular");
const tiername = document.querySelector("#tiername");
const kartenbild = document.querySelector("#kartenbild");
const tierliste = document.querySelector("#tierliste");
const meldung = document.querySelector("#meldung");
const status = document.querySelector("#status");
const treffer = document.querySelector("#treffer");

let tiere = [];
let grundkarte = null;

function istPink(rot, gruen, blau) {
  return (
    rot > 185 &&
    gruen < 145 &&
    blau > 70 &&
    rot > gruen * 1.45 &&
    rot > blau * 1.2
  );
}

function istWeiss(rot, gruen, blau) {
  return rot > 220 && gruen > 220 && blau > 220;
}

function bildLaden(quelle) {
  return new Promise((resolve, reject) => {
    const bild = new Image();

    bild.onload = () => resolve(bild);
    bild.onerror = () => {
      reject(new Error("Das Bild konnte nicht geladen werden."));
    };

    bild.src = quelle;
  });
}

function dateiLesen(datei) {
  return new Promise((resolve, reject) => {
    const leser = new FileReader();

    leser.onload = () => resolve(leser.result);
    leser.onerror = () => {
      reject(new Error("Die Datei konnte nicht gelesen werden."));
    };

    leser.readAsDataURL(datei);
  });
}

function bildpunkteLesen(bild) {
  const hilfscanvas = document.createElement("canvas");
  hilfscanvas.width = BREITE;
  hilfscanvas.height = HOEHE;

  const hilfsctx = hilfscanvas.getContext("2d", {
    willReadFrequently: true,
  });

  const skalierteHoehe = bild.height * (BREITE / bild.width);

  hilfsctx.drawImage(bild, 0, 0, BREITE, skalierteHoehe);

  return hilfsctx.getImageData(0, 0, BREITE, HOEHE).data;
}

function maskeErstellen(bildpunkte) {
  const maske = new Uint8Array(BREITE * HOEHE);
  let anzahlPink = 0;

  for (let punkt = 0; punkt < maske.length; punkt++) {
    const pixel = punkt * 4;

    if (
      istPink(bildpunkte[pixel], bildpunkte[pixel + 1], bildpunkte[pixel + 2])
    ) {
      maske[punkt] = 1;
      anzahlPink++;
    }
  }

  return {
    maske,
    anzahlPink,
  };
}

function grundkarteErstellen() {
  grundkarte = ctx.createImageData(BREITE, HOEHE);

  for (let punkt = 0; punkt < BREITE * HOEHE; punkt++) {
    const pixel = punkt * 4;
    let land = 0;
    let wasser = 0;

    for (const tier of tiere) {
      const rot = tier.bildpunkte[pixel];
      const gruen = tier.bildpunkte[pixel + 1];
      const blau = tier.bildpunkte[pixel + 2];

      if (istPink(rot, gruen, blau)) {
        land++;
      } else if (!istWeiss(rot, gruen, blau)) {
        if (rot + gruen + blau > 155) {
          land++;
        } else {
          wasser++;
        }
      }
    }

    const farbe = land > wasser ? [84, 111, 126] : [11, 33, 41];

    grundkarte.data[pixel] = farbe[0];
    grundkarte.data[pixel + 1] = farbe[1];
    grundkarte.data[pixel + 2] = farbe[2];
    grundkarte.data[pixel + 3] = 255;
  }
}

function mischen(grundfarbe, neueFarbe, staerke) {
  return Math.round(grundfarbe * (1 - staerke) + neueFarbe * staerke);
}

function positivModulo(zahl, teiler) {
  return ((zahl % teiler) + teiler) % teiler;
}

function karteZeichnen() {
  if (tiere.length === 0) {
    const leer = ctx.createImageData(BREITE, HOEHE);

    for (let pixel = 0; pixel < leer.data.length; pixel += 4) {
      leer.data[pixel] = 11;
      leer.data[pixel + 1] = 33;
      leer.data[pixel + 2] = 41;
      leer.data[pixel + 3] = 255;
    }

    ctx.putImageData(leer, 0, 0);
    status.textContent = "Noch keine Karte geladen";
    return;
  }

  const ergebnis = new ImageData(
    new Uint8ClampedArray(grundkarte.data),
    BREITE,
    HOEHE,
  );

  const aktiveTiere = tiere.filter((tier) => tier.aktiv);

  for (let punkt = 0; punkt < BREITE * HOEHE; punkt++) {
    let anzahl = 0;
    let rot = 0;
    let gruen = 0;
    let blau = 0;

    for (const tier of aktiveTiere) {
      if (tier.maske[punkt] === 0) {
        continue;
      }

      anzahl++;
      rot += tier.farbe[0];
      gruen += tier.farbe[1];
      blau += tier.farbe[2];
    }

    if (anzahl === 0) {
      continue;
    }

    const pixel = punkt * 4;
    const x = punkt % BREITE;
    const y = Math.floor(punkt / BREITE);

    const durchschnitt = [
      Math.round(rot / anzahl),
      Math.round(gruen / anzahl),
      Math.round(blau / anzahl),
    ];

    const staerke = anzahl === 1 ? 0.76 : 0.86;

    for (let kanal = 0; kanal < 3; kanal++) {
      ergebnis.data[pixel + kanal] = mischen(
        ergebnis.data[pixel + kanal],
        durchschnitt[kanal],
        staerke,
      );
    }

    if (anzahl >= 2 && positivModulo(x + y, 12) < 3) {
      ergebnis.data[pixel] = 7;
      ergebnis.data[pixel + 1] = 28;
      ergebnis.data[pixel + 2] = 35;
    }

    if (anzahl >= 3 && positivModulo(x - y, 12) < 2) {
      ergebnis.data[pixel] = 230;
      ergebnis.data[pixel + 1] = 245;
      ergebnis.data[pixel + 2] = 246;
    }
  }

  ctx.putImageData(ergebnis, 0, 0);

  status.textContent =
    aktiveTiere.length + " von " + tiere.length + " Tieren sichtbar";
}

function speichern() {
  const daten = tiere
    .filter((tier) => !tier.ausDatei)
    .map((tier) => ({
      id: tier.id,
      name: tier.name,
      quelle: tier.quelle,
      farbe: tier.farbe,
    }));

  try {
    localStorage.setItem(SPEICHERNAME, JSON.stringify(daten));

    return true;
  } catch {
    meldung.textContent =
      "Der Browserspeicher ist voll. Das Tier bleibt nur bis zum Schliessen erhalten.";

    return false;
  }
}

function tierlisteZeichnen() {
  tierliste.replaceChildren();

  for (const tier of tiere) {
    const zeile = document.createElement("div");
    zeile.className = "tier";

    const haken = document.createElement("input");
    haken.type = "checkbox";
    haken.checked = tier.aktiv;
    haken.title = tier.name + " anzeigen";

    haken.addEventListener("change", () => {
      tier.aktiv = haken.checked;
      karteZeichnen();
    });

    const farbpunkt = document.createElement("span");
    farbpunkt.className = "farbpunkt";
    farbpunkt.style.background = "rgb(" + tier.farbe.join(",") + ")";

    const name = document.createElement("input");
    name.type = "text";
    name.value = tier.name;
    name.maxLength = 40;

    name.addEventListener("change", () => {
      tier.name = name.value.trim() || "Tier ohne Namen";

      name.value = tier.name;
      speichern();
    });

    const loeschen = document.createElement("button");
    loeschen.type = "button";
    loeschen.className = "loeschen";
    loeschen.textContent = "×";
    loeschen.title = tier.name + " entfernen";

    loeschen.addEventListener("click", () => {
      if (!confirm("„" + tier.name + "“ wirklich entfernen?")) {
        return;
      }

      tiere = tiere.filter((eintrag) => eintrag.id !== tier.id);

      speichern();

      if (tiere.length > 0) {
        grundkarteErstellen();
      }

      tierlisteZeichnen();
      karteZeichnen();
    });

    zeile.append(haken, farbpunkt, name, loeschen);

    tierliste.append(zeile);
  }
}

formular.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = tiername.value.trim();
  const datei = kartenbild.files[0];

  if (!name || !datei) {
    meldung.textContent = "Bitte Tiername und Kartenbild auswählen.";
    return;
  }

  if (datei.size > 12 * 1024 * 1024) {
    meldung.textContent = "Das Bild darf höchstens 12 MB gross sein.";
    return;
  }

  meldung.textContent = "Die pinke Fläche wird gesucht …";

  try {
    const quelle = await dateiLesen(datei);
    const bild = await bildLaden(quelle);
    const bildpunkte = bildpunkteLesen(bild);
    const ergebnis = maskeErstellen(bildpunkte);

    if (ergebnis.anzahlPink < 30) {
      throw new Error(
        "Im oberen Kartenbereich wurde keine pinke Fläche gefunden.",
      );
    }

    const farbe = FARBEN[tiere.length % FARBEN.length];

    tiere.push({
      id: Date.now() + "-" + Math.random().toString(16).slice(2),
      name,
      quelle,
      farbe,
      bildpunkte,
      maske: ergebnis.maske,
      aktiv: true,
    });

    grundkarteErstellen();
    tierlisteZeichnen();
    karteZeichnen();
    speichern();

    formular.reset();

    meldung.textContent = name + " wurde hinzugefügt.";
  } catch (fehler) {
    meldung.textContent =
      fehler.message || "Das Tier konnte nicht hinzugefügt werden.";
  }
});

document.querySelector("#alleEin").addEventListener("click", () => {
  tiere.forEach((tier) => {
    tier.aktiv = true;
  });

  tierlisteZeichnen();
  karteZeichnen();
});

document.querySelector("#alleAus").addEventListener("click", () => {
  tiere.forEach((tier) => {
    tier.aktiv = false;
  });

  tierlisteZeichnen();
  karteZeichnen();
});

canvas.addEventListener("mousemove", (event) => {
  if (tiere.length === 0) {
    return;
  }

  const rahmen = canvas.getBoundingClientRect();

  const x = Math.floor(((event.clientX - rahmen.left) / rahmen.width) * BREITE);

  const y = Math.floor(((event.clientY - rahmen.top) / rahmen.height) * HOEHE);

  if (x < 0 || y < 0 || x >= BREITE || y >= HOEHE) {
    return;
  }

  const punkt = y * BREITE + x;

  const gefundeneTiere = tiere.filter(
    (tier) => tier.aktiv && tier.maske[punkt] === 1,
  );

  treffer.textContent =
    gefundeneTiere.length === 0
      ? "Hier ist kein ausgewähltes Tier eingetragen."
      : "Hier überschneiden sich: " +
        gefundeneTiere.map((tier) => tier.name).join(", ");
});

canvas.addEventListener("mouseleave", () => {
  treffer.textContent = "Fahre mit der Maus über die Karte.";
});

async function tierdateienLaden() {
  if (typeof window.datenImportieren !== "function") {
    console.error("datenImport.js wurde nicht richtig geladen.");

    return;
  }

  const importierteTiere = await window.datenImportieren();

  for (const tierdaten of importierteTiere) {
    try {
      const bild = await bildLaden(tierdaten.kartenPfad);

      const bildpunkte = bildpunkteLesen(bild);

      const ergebnis = maskeErstellen(bildpunkte);

      if (ergebnis.anzahlPink < 30) {
        console.warn("Keine pinke Fläche gefunden:", tierdaten.name);

        continue;
      }

      tiere.push({
        id: "datei-" + tierdaten.id,
        name: tierdaten.name,
        wissenschaftlicherName: tierdaten.wissenschaftlicherName,
        quelle: tierdaten.kartenPfad,
        tierbilder: tierdaten.tierbilder,
        farbe: FARBEN[tiere.length % FARBEN.length],
        bildpunkte,
        maske: ergebnis.maske,
        aktiv: true,
        ausDatei: true,
      });
    } catch (fehler) {
      console.error(tierdaten.name + " konnte nicht geladen werden.", fehler);
    }
  }
}

async function gespeicherteTiereLaden() {
  let gespeicherteDaten;

  try {
    gespeicherteDaten = JSON.parse(localStorage.getItem(SPEICHERNAME) || "[]");
  } catch {
    gespeicherteDaten = [];
  }

  for (const daten of gespeicherteDaten) {
    try {
      const bild = await bildLaden(daten.quelle);
      const bildpunkte = bildpunkteLesen(bild);
      const ergebnis = maskeErstellen(bildpunkte);

      tiere.push({
        ...daten,
        bildpunkte,
        maske: ergebnis.maske,
        aktiv: true,
      });
    } catch {
      console.warn("Eine gespeicherte Tierkarte konnte nicht geladen werden.");
    }
  }

  if (tiere.length > 0) {
    grundkarteErstellen();
  }

  tierlisteZeichnen();
  karteZeichnen();
}

async function alleTiereLaden() {
  await tierdateienLaden();
  await gespeicherteTiereLaden();
}

alleTiereLaden();
