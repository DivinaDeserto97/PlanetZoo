import { setBild, setText, setTitle } from "./dom.js";
import { findeNachCode, findeNachId, findeSymbol } from "./lookup.js";
import { renderFaktenRund } from "./renderFakten.js";

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
  setTitle("iucnBadge", eintrag ? `${eintrag.nameDeutsch} (${eintrag.nameEnglisch})` : tier.bedrohung?.text);
}

function renderBilder(tier) {
  setBild("tierBild", tier.bilder?.tier, tier.nameDeutsch || "Tierbild");
  setBild("kartenBild", tier.bilder?.karte, "Verbreitungskarte");
}

function renderTexte(tier) {
  setText("kurztext", tier.kurztext);
  setText("beschreibung", tier.beschreibung);
  setText("niceToKnow", tier.niceToKnow);
}

function renderNahrung(tier, symbole) {
  const ernaehrungsId = tier.ernaehrungsart || tier.nahrungart;
  const ernaehrung = findeNachId(symbole.ernaehrung.ernaehrungsarten, ernaehrungsId)
    || findeSymbol(symbole.ernaehrung.ernaehrungsarten, ernaehrungsId);

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
    const eintrag = findeNachId(symbole.nahrungsquellen, wert)
      || findeSymbol(symbole.nahrungsquellen, wert);

    const span = document.createElement("span");
    span.className = "chip";
    span.title = eintrag?.name || wert;

    span.textContent = eintrag
      ? `${eintrag.icon} ${eintrag.name}`
      : wert;

    box.appendChild(span);
  });
}