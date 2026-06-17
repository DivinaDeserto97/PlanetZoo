const params = new URLSearchParams(window.location.search);
const tierId = params.get("id") || "Ramphastos-toco";

ladeTier(tierId);

async function ladeTier(id) {
  const antwort = await fetch(`daten/tiere/${id}.json`);

  if (!antwort.ok) {
    console.error(`Tierdaten konnten nicht geladen werden: daten/tiere/${id}.json`);
    return;
  }

  const tier = await antwort.json();

  document.title = tier.nameDeutsch || "Tier";
  setText("nameDeutsch", tier.nameDeutsch);
  setText("nameLatein", tier.nameLatein);

  if (tier.bedrohung) {
    setText("iucnBadge", tier.bedrohung.code);
    document.getElementById("iucnBadge").title = tier.bedrohung.text || "";
  }

  setBild("tierBild", tier.bilder?.tier, tier.nameDeutsch || "Tierbild");
  setBild("kartenBild", tier.bilder?.karte, "Verbreitungskarte");

  setText("kurztext", tier.kurztext);
  setText("beschreibung", tier.beschreibung);
  setText("niceToKnow", tier.niceToKnow);

  renderFaktenRund(tier.fakten || []);

  const nahrungTitel = tier.nahrungart ? `Nahrung – ${tier.nahrungart}` : "Nahrung";
  setText("nahrungTitel", nahrungTitel);
  renderChips("nahrung", tier.nahrung || []);
}

function setText(id, wert) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = wert || "";
}

function setBild(id, src, alt) {
  const img = document.getElementById(id);
  if (!img) return;

  img.src = src || "";
  img.alt = alt || "";
}

function renderFaktenRund(fakten) {
  const box = document.getElementById("faktenRund");
  box.innerHTML = "";

  const iconMap = {
    "Sozialverhalten": "👥",
    "Aktivität": "☀️",
    "Biome": "🌲",
    "Lebensraum": "🌲",
    "Größe": "📏",
    "Länge": "📏",
    "Flügelspannweite": "🪽",
    "Gewicht": "⚖️",
    "Alter": "⏳",
    "Geschwindigkeit": "💨"
  };

  const classMap = {
    "Sozialverhalten": "pos-sozial",
    "Aktivität": "pos-aktiv",
    "Biome": "pos-lebensraum",
    "Lebensraum": "pos-lebensraum",
    "Größe": "pos-groesse",
    "Länge": "pos-groesse",
    "Flügelspannweite": "pos-fluegel",
    "Gewicht": "pos-gewicht",
    "Alter": "pos-alter",
    "Geschwindigkeit": "pos-speed"
  };

  fakten.forEach(fakt => {
    const div = document.createElement("div");
    div.className = `fakt-rund ${classMap[fakt.label] || ""}`;

    div.innerHTML = `
      <span class="fakt-icon">${iconMap[fakt.label] || "•"}</span>
      <span class="fakt-text">
        <strong>${fakt.label}</strong>
        <em>${fakt.wert}</em>
      </span>
    `;

    box.appendChild(div);
  });
}

function renderChips(id, werte) {
  const box = document.getElementById(id);
  box.innerHTML = "";

  werte.forEach(wert => {
    const span = document.createElement("span");
    span.className = "chip";
    span.textContent = wert;
    box.appendChild(span);
  });
}