import { setBild, setText, setTitle } from "./dom.js";
import { findeNachCode, findeNachId, findeSymbol } from "./lookup.js";
import { renderFaktenRund } from "./renderFakten.js";

let gutIndex = 0;

export function renderTier(tier, symbole) {
  document.title = tier.nameDeutsch || "Tier";

  setText("nameDeutsch", tier.nameDeutsch);
  setText("nameLatein", tier.nameLatein);

  renderGefaehrdung(tier, symbole);
  renderBilder(tier);
  renderTexte(tier);
  renderFaktenRund(tier, symbole);
  renderNahrung(tier, symbole);
}

function renderGefaehrdung(tier, symbole) {
  const code = tier.bedrohung?.code || "";
  const eintrag = findeNachCode(symbole.gefaehrdung, code);

  setText("iucnBadge", code);

  setTitle(
    "iucnBadge",
    eintrag
      ? `${eintrag.nameDeutsch} (${eintrag.nameEnglisch})`
      : tier.bedrohung?.text
  );
}

function renderBilder(tier) {
  setBild("tierBild", tier.bilder?.tier, tier.nameDeutsch || "Tierbild");
  setBild("kartenBild", tier.bilder?.karte, "Verbreitungskarte");
}

function renderTexte(tier) {
  setText("beschreibung", tier.beschreibung);

  renderGutZuWissen(
    Array.isArray(tier.gutZuWissen)
      ? tier.gutZuWissen
      : tier.gutZuWissen
        ? [tier.gutZuWissen]
        : []
  );
}

function renderGutZuWissen(fakten) {
  const text = document.getElementById("gutZuWissenText");
  const punkte = document.getElementById("gutZuWissenPunkte");
  const links = document.getElementById("gutZurueck");
  const rechts = document.getElementById("gutWeiter");

  if (!text || !punkte) return;

  if (fakten.length === 0) {
    text.textContent = "";
    punkte.innerHTML = "";
    return;
  }

  gutIndex = 0;

  function anzeigen() {
    text.textContent = fakten[gutIndex];

    punkte.innerHTML = "";

    fakten.forEach((_, i) => {
      const punkt = document.createElement("span");
      punkt.className = "punkt";

      if (i === gutIndex) {
        punkt.classList.add("aktiv");
      }

      punkte.appendChild(punkt);
    });
  }

  links.onclick = () => {
    gutIndex--;

    if (gutIndex < 0) {
      gutIndex = fakten.length - 1;
    }

    anzeigen();
  };

  rechts.onclick = () => {
    gutIndex++;

    if (gutIndex >= fakten.length) {
      gutIndex = 0;
    }

    anzeigen();
  };

  anzeigen();
}

function renderNahrung(tier, symbole) {
  const ernaehrungsId = tier.ernaehrungsart || tier.nahrungart;

  const ernaehrung =
    findeNachId(symbole.ernaehrung.ernaehrungsarten, ernaehrungsId) ||
    findeSymbol(symbole.ernaehrung.ernaehrungsarten, ernaehrungsId);

  const titel = ernaehrung
    ? `Nahrung – ${ernaehrung.icon || ""} ${ernaehrung.name}`
    : ernaehrungsId
      ? `Nahrung – ${ernaehrungsId}`
      : "Nahrung";

  setText("nahrungTitel", titel.trim());

  const box = document.getElementById("nahrung");
  if (!box) return;

  box.innerHTML = "";

  const nahrung = Array.isArray(tier.nahrung) ? tier.nahrung : [];

  nahrung.forEach(wert => {
    const eintrag =
      findeNachId(symbole.nahrungsquellen, wert) ||
      findeSymbol(symbole.nahrungsquellen, wert);

    const chip = document.createElement("span");
    chip.className = "chip";
    chip.title = eintrag?.name || wert;

    chip.textContent = eintrag
      ? `${eintrag.icon} ${eintrag.name}`
      : wert;

    box.appendChild(chip);
  });
}