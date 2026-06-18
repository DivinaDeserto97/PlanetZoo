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

const nurHoverKeys = [
  "sozialverhalten",
  "aktivitaet",
  "regionen",
  "ruf"
];

export function renderFaktenRund(tier, symbole) {
  const box = document.getElementById("faktenRund");
  if (!box) return;

  box.innerHTML = "";

  const fakten = baueFakten(tier, symbole);

  fakten.forEach(fakt => {
    const div = document.createElement("div");
    div.className = `fakt-rund ${positionsMap[fakt.key] || ""}`;

    const icons = document.createElement("span");
    icons.className = "fakt-icons";

    if (fakt.typ === "audio") {
      const button = document.createElement("button");
      button.className = "fakt-icon fakt-button";
      button.type = "button";
      button.title = `${fakt.label}: ${fakt.wert}`;
      button.textContent = fakt.icon || "🔊";
      button.addEventListener("click", () => spieleAudio(fakt.audio));
      icons.appendChild(button);
    } else {
      fakt.icons.forEach(iconData => {
        const icon = document.createElement("span");
        icon.className = "fakt-icon";
        icon.title = iconData.title;
        icon.textContent = iconData.icon;
        icons.appendChild(icon);
      });
    }

    div.appendChild(icons);

    if (!nurHoverKeys.includes(fakt.key) && fakt.key !== "biome") {
      const text = document.createElement("span");
      text.className = "fakt-text";

      const wert = document.createElement("em");
      wert.textContent = fakt.wert;

      text.appendChild(wert);
      div.appendChild(text);
    }

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
      typ: "audio",
      audio: fakt.audio,
      icons: []
    };
  }

  if (key === "sozialverhalten") {
    return {
      key,
      label: fakt.label,
      wert: fakt.wert,
      icons: [
        {
          icon: "👥",
          title: `${fakt.label}: ${fakt.wert}`
        }
      ]
    };
  }

  if (key === "aktivitaet") {
    return {
      key,
      label: fakt.label,
      wert: fakt.wert,
      icons: iconsAusRefs(symbole.aktivitaet, ref, fakt.label, fakt.wert, "☀️")
    };
  }

  if (key === "biome") {
  return {
    key,
    label: fakt.label,
    wert: fakt.wert,
    icons: [
      {
        icon: "🌲",
        title: "Biome"
      },
      ...iconsAusRefs(symbole.biome, ref, fakt.label, fakt.wert, "🌲")
    ]
  };
}

  const eigenschaft = findeNachId(symbole.eigenschaften, ref)
    || findeSymbol(symbole.eigenschaften, fakt.label);

  return {
    key: eigenschaft?.id || key,
    label: fakt.label,
    wert: fakt.wert,
    icons: [
      {
        icon: eigenschaft?.icon || "•",
        title: eigenschaft?.label || fakt.label
      }
    ]
  };
}

function baueListenFakt(key, label, ids, liste, fallbackIcon) {
  return {
    key,
    label,
    wert: ids.join(", "),
    icons: iconsAusRefs(liste, ids, label, ids.join(", "), fallbackIcon)
  };
}

function iconsAusRefs(liste, refs, label, fallbackText, fallbackIcon) {
  if (!Array.isArray(refs)) refs = refs ? [refs] : [];

  const icons = refs.map(ref => {
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