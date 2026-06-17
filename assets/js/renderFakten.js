import { findeNachId, findeSymbol } from "./lookup.js";

const positionsMap = {
  sozialverhalten: "pos-sozial",
  aktivitaet: "pos-aktiv",
  biome: "pos-lebensraum",
  regionen: "pos-region",
  laenge: "pos-groesse",
  groesse: "pos-groesse",
  fluegelspannweite: "pos-fluegel",
  gewicht: "pos-gewicht",
  alter: "pos-alter",
  geschwindigkeit: "pos-speed",
  ruf: "pos-ruf"
};

const labelKeyMap = {
  "Sozialverhalten": "sozialverhalten",
  "Aktivität": "aktivitaet",
  "Biome": "biome",
  "Lebensraum": "lebensraum",
  "Größe": "groesse",
  "Länge": "laenge",
  "Flügelspannweite": "fluegelspannweite",
  "Gewicht": "gewicht",
  "Alter": "alter",
  "Geschwindigkeit": "geschwindigkeit",
  "Ruf": "ruf",
  "Geräusch": "ruf",
  "Geräusche": "ruf"
};

export function renderFaktenRund(tier, symbole) {
  const box = document.getElementById("faktenRund");
  if (!box) return;

  box.innerHTML = "";

  const fakten = baueFakten(tier, symbole);

  fakten.forEach(fakt => {
    const div = document.createElement("div");
    div.className = `fakt-rund ${positionsMap[fakt.key] || ""}`;

    if (fakt.typ === "audio") {
      div.innerHTML = `
        <button class="fakt-icon fakt-button" type="button" title="${fakt.tooltip || fakt.label}">
          ${fakt.icon || "🔊"}
        </button>
        <span class="fakt-text">
          <strong>${fakt.label}</strong>
          <em>${fakt.wert}</em>
        </span>
      `;

      const button = div.querySelector("button");
      button.addEventListener("click", () => spieleAudio(fakt.audio));

      box.appendChild(div);
      return;
    }

    div.innerHTML = `
      <span class="fakt-icon" title="${fakt.tooltip || fakt.label}">
        ${fakt.icon || "•"}
      </span>
      <span class="fakt-text">
        <strong>${fakt.label}</strong>
        <em>${fakt.wert}</em>
      </span>
    `;

    box.appendChild(div);
  });
}

function spieleAudio(pfad) {
  if (!pfad) return;

  const audio = new Audio(pfad);
  audio.play().catch(fehler => {
    console.error("Audio konnte nicht abgespielt werden:", fehler);
  });
}

function baueFakten(tier, symbole) {
  const fakten = [];

  if (Array.isArray(tier.fakten)) {
    tier.fakten.forEach(fakt => {
      fakten.push(baueFaktAusSteckbrief(fakt, symbole));
    });
  }

  if (Array.isArray(tier.zoogeografischeRegionen)) {
    fakten.push(baueListenFakt(
      "regionen",
      "Region",
      tier.zoogeografischeRegionen,
      symbole.regionen,
      "🌍"
    ));
  }

  return fakten;
}

function baueFaktAusSteckbrief(fakt, symbole) {
  const key = labelKeyMap[fakt.label] || "";
  const ref = fakt.ref;

  if (fakt.typ === "audio") {
    return {
      key: key || "ruf",
      label: fakt.label || "Ruf",
      wert: fakt.wert || "Abspielen",
      icon: "🔊",
      tooltip: fakt.wert || "Tierlaut abspielen",
      typ: "audio",
      audio: fakt.audio
    };
  }

  if (key === "sozialverhalten") {
    return {
      key,
      label: fakt.label,
      wert: fakt.wert,
      icon: "👥",
      tooltip: tooltipAusRefs(symbole.sozialverhalten, ref) || fakt.wert
    };
  }

  if (key === "aktivitaet") {
    const icons = iconsAusRefs(symbole.aktivitaet, ref);
    return {
      key,
      label: fakt.label,
      wert: fakt.wert,
      icon: icons || "☀️",
      tooltip: tooltipAusRefs(symbole.aktivitaet, ref) || fakt.wert
    };
  }

  if (key === "biome") {
    const icons = iconsAusRefs(symbole.biome, ref);
    return {
      key,
      label: fakt.label,
      wert: fakt.wert,
      icon: icons || "🌲",
      tooltip: tooltipAusRefs(symbole.biome, ref) || fakt.wert
    };
  }

  const eigenschaft = findeNachId(symbole.eigenschaften, ref)
    || findeSymbol(symbole.eigenschaften, fakt.label);

  return {
    key: eigenschaft?.id || key,
    label: fakt.label,
    wert: fakt.wert,
    icon: eigenschaft?.icon || "•",
    tooltip: eigenschaft?.label || fakt.label
  };
}

function baueListenFakt(key, label, ids, liste, fallbackIcon) {
  const namen = ids.map(id => findeNachId(liste, id)?.name || id);
  const icons = ids.map(id => findeNachId(liste, id)?.icon).filter(Boolean);

  return {
    key,
    label,
    wert: namen.join(", "),
    icon: icons[0] || fallbackIcon,
    tooltip: namen.join(", ")
  };
}

function iconsAusRefs(liste, refs) {
  if (!Array.isArray(refs)) refs = refs ? [refs] : [];

  return refs
    .map(ref => findeNachId(liste, ref)?.icon)
    .filter(Boolean)
    .join("");
}

function tooltipAusRefs(liste, refs) {
  if (!Array.isArray(refs)) refs = refs ? [refs] : [];

  return refs
    .map(ref => findeNachId(liste, ref)?.name)
    .filter(Boolean)
    .join(", ");
}