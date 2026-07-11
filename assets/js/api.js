export async function ladeJson(pfad, fallback = null) {
  try {
    const antwort = await fetch(pfad);

    if (!antwort.ok) {
      console.error(`JSON konnte nicht geladen werden: ${pfad}`);
      return fallback;
    }

    return await antwort.json();
  } catch (fehler) {
    console.error(`Fehler beim Laden von ${pfad}`, fehler);
    return fallback;
  }
}

export async function ladeLebewesenListe() {
  return ladeJson("daten/lebewesen.json", []);
}

export async function ladeTier(id) {
  const lebewesen = await ladeLebewesenListe();

  const zielId = id || lebewesen[0]?.id;
  const eintrag = lebewesen.find(tier => tier.id === zielId);

  if (!eintrag) {
    console.error(`Tier nicht in lebewesen.json gefunden: ${zielId}`);
    return null;
  }

  return ladeJson(eintrag.datei, null);
}

export async function ladeSymbolDaten() {
  const [
    aktivitaet,
    biome,
    eigenschaften,
    ernaehrung,
    gefaehrdung,
    nahrungsquellen,
    sozialverhalten,
    regionen
  ] = await Promise.all([
    ladeJson("daten/symbole/Aktivität.json", []),
    ladeJson("daten/symbole/Biome.json", []),
    ladeJson("daten/symbole/Eigenschaften.json", []),
    ladeJson("daten/symbole/Ernärung.json", {}),
    ladeJson("daten/symbole/Gefärdungsgrad.json", []),
    ladeJson("daten/symbole/Nahrungsquellen.json", []),
    ladeJson("daten/symbole/sozialverhalten.json", []),
    ladeJson("daten/symbole/ZoogeografischeRegionen.json", [])
  ]);

  return {
    aktivitaet,
    biome,
    eigenschaften,
    ernaehrung,
    gefaehrdung,
    nahrungsquellen,
    sozialverhalten,
    regionen
  };
}