import { findeNachId, findeSymbol } from "./lookup.js";

const positionsMap = {
  regionen: "pos-region"
};

const nurHoverTypen = [
  "audio",
  "ruf",
  "sozialverhalten",
  "aktivitaet",
  "regionen"
];

export function renderFaktenRund(tier, symbole) {
  const box = document.getElementById("faktenRund");
  if (!box) return;

  box.innerHTML = "";

  const fakten = baueFakten(tier, symbole);

  fakten.forEach(fakt => {
    if (normalisiereTyp(fakt.typ) === "steckbrief") {
      box.appendChild(renderSteckbrief(fakt, symbole));
      return;
    }

    box.appendChild(renderStandardFakt(fakt, symbole));
  });
}

function baueFakten(tier, symbole) {
  const fakten = [];

  if (Array.isArray(tier.fakten)) {
    tier.fakten.forEach(fakt => {
      fakten.push(fakt);
    });
  }

  if (Array.isArray(tier.zoogeografischeRegionen)) {
    fakten.push({
      typ: "regionen",
      label: "Region",
      wert: tier.zoogeografischeRegionen.join(", "),
      ref: tier.zoogeografischeRegionen
    });
  }

  return fakten;
}

function renderStandardFakt(fakt, symbole) {
  const typ = normalisiereTyp(fakt.typ || fakt.ref || fakt.label);
  const div = document.createElement("div");

  div.className = [
    "fakt-rund",
    klassePosition(fakt, typ),
    `fakt-${typ}`
  ].filter(Boolean).join(" ");

  const icons = document.createElement("span");
  icons.className = "fakt-icons";

  if (typ === "audio" || fakt.typ === "audio") {
    const button = document.createElement("button");
    button.className = "fakt-icon fakt-button";
    button.type = "button";
    button.title = `${fakt.label}: ${fakt.wert}`;
    button.textContent = "🔊";
    button.addEventListener("click", () => spieleAudio(ersterWert(fakt.audio)));
    icons.appendChild(button);
  } else {
    const iconDaten = baueIcons(fakt, symbole, typ);

    iconDaten.forEach(iconData => {
      const icon = document.createElement("span");
      icon.className = "fakt-icon";
      icon.title = iconData.title;
      icon.textContent = iconData.icon;
      icons.appendChild(icon);
    });
  }

  div.appendChild(icons);

  if (!nurHoverTypen.includes(typ) && typ !== "biome") {
    const text = document.createElement("span");
    text.className = "fakt-text";

    const wert = document.createElement("em");
    wert.textContent = fakt.wert || "";

    text.appendChild(wert);
    div.appendChild(text);
  }

  return div;
}

function renderSteckbrief(fakt, symbole) {
  const div = document.createElement("div");

  div.className = [
    "fakt-rund",
    "fakt-steckbrief",
    klassePosition(fakt, "steckbrief")
  ].filter(Boolean).join(" ");

  const liste = document.createElement("div");
  liste.className = "steckbrief-liste";

  const eintraege = Array.isArray(fakt.eintraege) ? fakt.eintraege : [];

  eintraege.forEach(eintrag => {
    const ref = normalisiereTyp(eintrag.ref || eintrag.label);

    const zeile = document.createElement("div");
    zeile.className = `steckbrief-eintrag fakt-${ref}`;

    const eigenschaft =
      findeNachId(symbole.eigenschaften, eintrag.ref) ||
      findeSymbol(symbole.eigenschaften, eintrag.label);

    const icon = document.createElement("span");
    icon.className = "fakt-icon steckbrief-icon";
    icon.title = eigenschaft?.label || eintrag.label;
    icon.textContent = eigenschaft?.icon || "•";

    const text = document.createElement("span");
    text.className = "steckbrief-text";

    const label = document.createElement("strong");
    label.className = "steckbrief-label";
    label.textContent = eintrag.label;

    const wert = document.createElement("em");
    wert.className = "steckbrief-wert";
    wert.textContent = eintrag.wert;

    text.appendChild(label);
    text.appendChild(wert);

    zeile.appendChild(icon);
    zeile.appendChild(text);

    liste.appendChild(zeile);
  });

  div.appendChild(liste);
  return div;
}

function baueIcons(fakt, symbole, typ) {
  if (typ === "sozialverhalten") {
    return [{
      icon: "👥",
      title: `${fakt.label}: ${fakt.wert}`
    }];
  }

  if (typ === "aktivitaet") {
    return iconsAusRefs(symbole.aktivitaet, fakt.ref, fakt.label, fakt.wert, "☀️");
  }

  if (typ === "biome") {
    return [
      {
        icon: "🌲",
        title: "Biome"
      },
      ...iconsAusRefs(symbole.biome, fakt.ref, fakt.label, fakt.wert, "🌲")
    ];
  }

  if (typ === "regionen") {
    return iconsAusRefs(symbole.regionen, fakt.ref, fakt.label, fakt.wert, "🌍");
  }

  const eigenschaft =
    findeNachId(symbole.eigenschaften, fakt.ref) ||
    findeSymbol(symbole.eigenschaften, fakt.label);

  return [{
    icon: eigenschaft?.icon || "•",
    title: eigenschaft?.label || fakt.label || typ
  }];
}

function iconsAusRefs(liste, refs, label, fallbackText, fallbackIcon) {
  const refListe = Array.isArray(refs) ? refs : refs ? [refs] : [];

  const icons = refListe.map(ref => {
    const eintrag = findeNachId(liste, ref);

    return {
      icon: eintrag?.icon || fallbackIcon,
      title: eintrag
        ? `${label}: ${eintrag.name}`
        : `${label}: ${fallbackText}`
    };
  });

  if (icons.length === 0) {
    icons.push({
      icon: fallbackIcon,
      title: `${label}: ${fallbackText}`
    });
  }

  return icons;
}

function spieleAudio(pfad) {
  if (!pfad) return;

  const audio = new Audio(pfad);

  audio.play().catch(fehler => {
    console.error("Audio konnte nicht abgespielt werden:", fehler);
  });
}

function klassePosition(fakt, typ) {
  if (fakt.pos_id !== undefined && fakt.pos_id !== null) {
    return `pos-id-${fakt.pos_id}`;
  }

  return positionsMap[typ] || "";
}

function ersterWert(wert) {
  if (Array.isArray(wert)) return wert[0] || "";
  return wert || "";
}

function normalisiereTyp(wert) {
  return String(wert || "")
    .trim()
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}