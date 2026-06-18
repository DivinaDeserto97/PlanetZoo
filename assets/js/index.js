const systematikDateien = [
  "01_domaenen.json",
  "02_unterdomaenen.json",
  "03_reiche.json",
  "04_unterreiche.json",
  "05_ueberstaemme.json",
  "06_staemme.json",
  "07_unterstaemme.json",
  "08_infrastaemme.json",
  "09_ueberklassen.json",
  "10_klassen.json",
  "11_unterklassen.json",
  "12_infraklassen.json",
  "13_ueberordnungen.json",
  "14_ordnungen.json",
  "15_unterordnungen.json",
  "16_infraordnungen.json",
  "17_ueberfamilien.json",
  "18_familien.json",
  "19_unterfamilien.json",
  "20_triben.json",
  "21_untertriben.json",
  "22_gattungen.json",
  "23_untergattungen.json",
  "24_arten.json",
  "25_unterarten.json",
  "26_varietaeten.json",
  "27_formen.json"
];

let alleZeilen = [];

main();

async function main() {
  const [lebewesen, systematik, biome, regionen] = await Promise.all([
    ladeJson("daten/lebewesen.json", []),
    ladeSystematik(),
    ladeJson("daten/symbole/Biome.json", []),
    ladeJson("daten/symbole/ZoogeografischeRegionen.json", [])
  ]);

  const zeilen = [];

  for (const eintrag of lebewesen) {
    const tier = await ladeJson(eintrag.datei, null);
    if (!tier) continue;

    const pfad = baueSystematikPfad(systematik, eintrag.systematik);

    zeilen.push({
      id: eintrag.id,
      tier,
      pfad,
      klasse: findeRang(pfad, "10_klassen.json"),
      ordnung: findeRang(pfad, "14_ordnungen.json"),
      familie: findeRang(pfad, "18_familien.json"),
      biomeText: baueBiomeText(tier, biome),
      regionText: baueRegionText(tier, regionen),
      suchtext: ""
    });
  }

  alleZeilen = zeilen.map(zeile => ({
    ...zeile,
    suchtext: [
      zeile.tier.nameDeutsch,
      zeile.tier.nameLatein,
      zeile.tier.bedrohung?.code,
      zeile.klasse,
      zeile.ordnung,
      zeile.familie,
      zeile.biomeText,
      zeile.regionText
    ].join(" ").toLowerCase()
  }));

  fuelleFilter();
  renderTabelle();
  aktiviereFilter();
}

async function ladeJson(pfad, fallback) {
  try {
    const antwort = await fetch(pfad);
    if (!antwort.ok) return fallback;
    return await antwort.json();
  } catch {
    return fallback;
  }
}

async function ladeSystematik() {
  const daten = {};

  await Promise.all(systematikDateien.map(async datei => {
    daten[datei] = await ladeJson(`daten/systematik/${datei}`, []);
  }));

  return daten;
}

function baueSystematikPfad(systematik, ref) {
  const pfad = [];

  let aktuelleDatei = ref?.datei;
  let aktuelleId = ref?.id;

  while (aktuelleDatei && aktuelleId != null) {
    const liste = systematik[aktuelleDatei] || [];
    const eintrag = liste.find(x => String(x.id) === String(aktuelleId));

    if (!eintrag) break;

    pfad.push({
      datei: aktuelleDatei,
      ...eintrag
    });

    aktuelleDatei = eintrag.parentDatei;
    aktuelleId = eintrag.parentId;
  }

  return pfad;
}

function findeRang(pfad, datei) {
  return pfad.find(e => e.datei === datei)?.deutsch || "";
}

function baueBiomeText(tier, biomeListe) {
  const fakt = tier.fakten?.find(f => f.label === "Biome");
  const refs = Array.isArray(fakt?.ref) ? fakt.ref : [];

  if (refs.length === 0) return fakt?.wert || "";

  return refs
    .map(id => biomeListe.find(b => b.id === id)?.name || id)
    .join(", ");
}

function baueRegionText(tier, regionenListe) {
  const refs = Array.isArray(tier.zoogeografischeRegionen)
    ? tier.zoogeografischeRegionen
    : [];

  return refs
    .map(id => regionenListe.find(r => r.id === id)?.name || id)
    .join(", ");
}

function fuelleFilter() {
  fuelleSelect("filterKlasse", alleZeilen.map(z => z.klasse));
  fuelleSelect("filterOrdnung", alleZeilen.map(z => z.ordnung));
  fuelleSelect("filterFamilie", alleZeilen.map(z => z.familie));
  fuelleSelect("filterBiome", alleZeilen.flatMap(z => z.biomeText.split(",").map(x => x.trim())));
  fuelleSelect("filterRegion", alleZeilen.flatMap(z => z.regionText.split(",").map(x => x.trim())));
}

function fuelleSelect(id, werte) {
  const select = document.getElementById(id);
  if (!select) return;

  const sauber = [...new Set(werte.filter(Boolean))].sort();

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

  const text = document.getElementById("filterText")?.value.toLowerCase().trim() || "";
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

      tr.innerHTML = `
        <td>${z.tier.nameDeutsch || ""}</td>
        <td><em>${z.tier.nameLatein || ""}</em></td>
        <td>${z.tier.bedrohung?.code || ""}</td>
        <td>${z.klasse}</td>
        <td>${z.ordnung}</td>
        <td>${z.familie}</td>
        <td>${z.biomeText}</td>
        <td>${z.regionText}</td>
      `;

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