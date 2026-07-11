let alleZeilen = [];

main();

async function main() {
  const [lebewesen, biome, regionen] = await Promise.all([
    ladeJson("daten/lebewesen.json", []),
    ladeJson("daten/symbole/Biome.json", []),
    ladeJson("daten/symbole/ZoogeografischeRegionen.json", [])
  ]);

  const zeilen = [];

  for (const eintrag of lebewesen) {
    const tier = await ladeJson(eintrag.datei, null);

    if (!tier) {
      console.warn(`Tier konnte nicht geladen werden: ${eintrag.datei}`);
      continue;
    }

    const systematik = leseSystematik(tier);

    zeilen.push({
      id: eintrag.id || tier.id,
      tier,
      klasse: systematik.klasse,
      ordnung: systematik.ordnung,
      familie: systematik.familie,
      gattung: systematik.gattung,
      biomeText: baueBiomeText(tier, biome),
      regionText: baueRegionText(tier, regionen),
      suchtext: ""
    });
  }

  alleZeilen = zeilen.map(zeile => ({
    ...zeile,
    suchtext: normalisiereText([
      zeile.tier.nameDeutsch,
      zeile.tier.nameLatein,
      zeile.tier.bedrohung?.code,
      zeile.klasse,
      zeile.ordnung,
      zeile.familie,
      zeile.gattung,
      zeile.biomeText,
      zeile.regionText
    ].join(" "))
  }));

  fuelleFilter();
  renderTabelle();
  aktiviereFilter();
}

async function ladeJson(pfad, fallback) {
  try {
    const antwort = await fetch(pfad);

    if (!antwort.ok) {
      console.warn(`JSON nicht gefunden: ${pfad}`);
      return fallback;
    }

    return await antwort.json();
  } catch (fehler) {
    console.error(`Fehler beim Laden von ${pfad}`, fehler);
    return fallback;
  }
}

function leseSystematik(tier) {
  const pfad = tier.systematik?.pfad;
  const kurz = tier.systematikKurz || {};

  if (Array.isArray(pfad)) {
    return {
      klasse: findeRang(pfad, "klasse"),
      ordnung: findeRang(pfad, "ordnung"),
      familie: findeRang(pfad, "familie"),
      gattung: findeRang(pfad, "gattung")
    };
  }

  return {
    klasse: kurz.klasse || "",
    ordnung: kurz.ordnung || "",
    familie: kurz.familie || "",
    gattung: kurz.gattung || ""
  };
}

function findeRang(pfad, rang) {
  const gesucht = normalisiereText(rang);

  const eintrag = pfad.find(e => {
    return normalisiereText(e.rang) === gesucht;
  });

  if (!eintrag) return "";

  return eintrag.deutsch || eintrag.wissenschaftlich || "";
}

function baueBiomeText(tier, biomeListe) {
  const fakt = Array.isArray(tier.fakten)
    ? tier.fakten.find(f => {
        return normalisiereText(f.label) === "biome" ||
               normalisiereText(f.typ) === "biome";
      })
    : null;

  const refs = Array.isArray(fakt?.ref) ? fakt.ref : [];

  if (refs.length === 0) {
    return fakt?.wert || "";
  }

  return refs
    .map(id => {
      const eintrag = biomeListe.find(b => b.id === id);
      return eintrag?.name || id;
    })
    .join(", ");
}

function baueRegionText(tier, regionenListe) {
  const refs = Array.isArray(tier.zoogeografischeRegionen)
    ? tier.zoogeografischeRegionen
    : [];

  return refs
    .map(id => {
      const eintrag = regionenListe.find(r => r.id === id);
      return eintrag?.name || id;
    })
    .join(", ");
}

function fuelleFilter() {
  fuelleSelect("filterKlasse", alleZeilen.map(z => z.klasse));
  fuelleSelect("filterOrdnung", alleZeilen.map(z => z.ordnung));
  fuelleSelect("filterFamilie", alleZeilen.map(z => z.familie));
  fuelleSelect("filterBiome", alleZeilen.flatMap(z => teileText(z.biomeText)));
  fuelleSelect("filterRegion", alleZeilen.flatMap(z => teileText(z.regionText)));
}

function fuelleSelect(id, werte) {
  const select = document.getElementById(id);
  if (!select) return;

  const vorhandenerStart = select.querySelector("option[value='']");
  select.innerHTML = "";

  if (vorhandenerStart) {
    select.appendChild(vorhandenerStart);
  }

  const sauber = [...new Set(werte.filter(Boolean))].sort((a, b) => {
    return a.localeCompare(b, "de");
  });

  sauber.forEach(wert => {
    const option = document.createElement("option");
    option.value = wert;
    option.textContent = wert;
    select.appendChild(option);
  });
}

function aktiviereFilter() {
  [
    "filterText",
    "filterKlasse",
    "filterOrdnung",
    "filterFamilie",
    "filterBiome",
    "filterRegion"
  ].forEach(id => {
    document.getElementById(id)?.addEventListener("input", renderTabelle);
  });
}

function renderTabelle() {
  const tbody = document.getElementById("tierTabelle");
  if (!tbody) return;

  const text = normalisiereText(document.getElementById("filterText")?.value || "");
  const klasse = document.getElementById("filterKlasse")?.value || "";
  const ordnung = document.getElementById("filterOrdnung")?.value || "";
  const familie = document.getElementById("filterFamilie")?.value || "";
  const biome = document.getElementById("filterBiome")?.value || "";
  const region = document.getElementById("filterRegion")?.value || "";

  tbody.innerHTML = "";

  alleZeilen
    .filter(z => !text || z.suchtext.includes(text))
    .filter(z => !klasse || z.klasse === klasse)
    .filter(z => !ordnung || z.ordnung === ordnung)
    .filter(z => !familie || z.familie === familie)
    .filter(z => !biome || z.biomeText.includes(biome))
    .filter(z => !region || z.regionText.includes(region))
    .forEach(z => {
      const tr = document.createElement("tr");
      tr.tabIndex = 0;

      fuegeZelleEin(tr, z.tier.nameDeutsch || "");
      fuegeZelleEin(tr, z.tier.nameLatein || "", true);
      fuegeZelleEin(tr, z.tier.bedrohung?.code || "");
      fuegeZelleEin(tr, z.klasse);
      fuegeZelleEin(tr, z.ordnung);
      fuegeZelleEin(tr, z.familie);
      fuegeZelleEin(tr, z.biomeText);
      fuegeZelleEin(tr, z.regionText);

      tr.addEventListener("click", () => {
        window.location.href = `tier.html?id=${encodeURIComponent(z.id)}`;
      });

      tr.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          window.location.href = `tier.html?id=${encodeURIComponent(z.id)}`;
        }
      });

      tbody.appendChild(tr);
    });
}

function fuegeZelleEin(tr, text, kursiv = false) {
  const td = document.createElement("td");

  if (kursiv) {
    const em = document.createElement("em");
    em.textContent = text;
    td.appendChild(em);
  } else {
    td.textContent = text;
  }

  tr.appendChild(td);
}

function teileText(text) {
  return String(text || "")
    .split(",")
    .map(wert => wert.trim())
    .filter(Boolean);
}

function normalisiereText(wert) {
  return String(wert || "")
    .trim()
    .toLowerCase()
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}