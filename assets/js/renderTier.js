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
  setBild("tierBild", ersterWert(tier.bilder?.tier), tier.nameDeutsch || "Tierbild");
  setBild("kartenBild", ersterWert(tier.bilder?.karte), "Verbreitungskarte");
}

function renderTexte(tier) {
  setText("beschreibung", tier.beschreibung);

  const gutZuWissen = Array.isArray(tier.gutZuWissen)
    ? tier.gutZuWissen
    : tier.gutZuWissen
      ? [tier.gutZuWissen]
      : [];

  renderGutZuWissen(gutZuWissen);
}

function renderGutZuWissen(eintraege) {
  const text = document.getElementById("gutZuWissenText");
  const punkte = document.getElementById("gutZuWissenPunkte");
  const links = document.getElementById("gutZurueck");
  const rechts = document.getElementById("gutWeiter");

  if (!text || !punkte || !links || !rechts) return;

  if (eintraege.length === 0) {
    text.textContent = "";
    punkte.innerHTML = "";
    links.style.display = "none";
    rechts.style.display = "none";
    return;
  }

  gutIndex = 0;

  links.style.display = eintraege.length > 1 ? "" : "none";
  rechts.style.display = eintraege.length > 1 ? "" : "none";

  function anzeigen() {
    text.textContent = eintraege[gutIndex];
    punkte.innerHTML = "";

    eintraege.forEach((_, index) => {
      const punkt = document.createElement("span");
      punkt.className = "punkt";

      if (index === gutIndex) {
        punkt.classList.add("aktiv");
      }

      punkt.addEventListener("click", () => {
        gutIndex = index;
        anzeigen();
      });

      punkte.appendChild(punkt);
    });
  }

  links.onclick = () => {
    gutIndex = gutIndex - 1;

    if (gutIndex < 0) {
      gutIndex = eintraege.length - 1;
    }

    anzeigen();
  };

  rechts.onclick = () => {
    gutIndex = gutIndex + 1;

    if (gutIndex >= eintraege.length) {
      gutIndex = 0;
    }

    anzeigen();
  };

  anzeigen();
}

function renderNahrung(tier, symbole) {
  const ernaehrungsId = tier.ernaehrungsart || tier.nahrungart;

  const ernaehrungsarten = symbole.ernaehrung?.ernaehrungsarten || [];

  const ernaehrung =
    findeNachId(ernaehrungsarten, ernaehrungsId) ||
    findeSymbol(ernaehrungsarten, ernaehrungsId);

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
  const nahrungRefs = Array.isArray(tier.nahrungRefs) ? tier.nahrungRefs : [];

  nahrung.forEach((wert, index) => {
    const ref = nahrungRefs[index] || wert;

    const eintrag =
      findeNachId(symbole.nahrungsquellen, ref) ||
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

function ersterWert(wert) {
  if (Array.isArray(wert)) return wert[0] || "";
  return wert || "";
}