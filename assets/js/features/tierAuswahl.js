/*
 * ANFÄNGER-HINWEIS – assets/js/features/tierAuswahl.js
 * ----------------------------------------
 * Diese Datei gehört zum handgeschriebenen Quellcode von Planet Zoo 2 Tools.
 * Die grossen Abschnittskommentare darunter zeigen, welcher Teil welche
 * Aufgabe übernimmt. Beim Ändern möglichst nur den passenden Abschnitt
 * bearbeiten und danach das Browser-Bundle neu bauen/testen.
 */

const STORAGE_KEY = "planetZoo2-tierAuswahl";

/* ======================================== */
/* AUSWAHL LESEN                            */
/* ======================================== */

export function getTierAuswahl() {
  const gespeichert = localStorage.getItem(STORAGE_KEY);

  if (!gespeichert) {
    return [];
  }

  try {
    const tierIds = JSON.parse(gespeichert);

    if (!Array.isArray(tierIds)) {
      return [];
    }

    return [...new Set(tierIds.filter((id) => typeof id === "string"))];
  } catch (fehler) {
    console.warn("Gespeicherte Tierauswahl war ungültig.", fehler);
    return [];
  }
}

/* ======================================== */
/* AUSWAHL SPEICHERN                        */
/* ======================================== */

export function setTierAuswahl(tierIds) {
  const bereinigt = [
    ...new Set((tierIds ?? []).filter((id) => typeof id === "string")),
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bereinigt));

  document.dispatchEvent(
    new CustomEvent("tierAuswahlChanged", {
      detail: {
        tierIds: bereinigt,
      },
    }),
  );

  return bereinigt;
}

/* ======================================== */
/* EIN TIER ÄNDERN                          */
/* ======================================== */

export function setTierAusgewaehlt(tierId, ausgewaehlt) {
  const selected = new Set(getTierAuswahl());

  if (ausgewaehlt) {
    selected.add(tierId);
  } else {
    selected.delete(tierId);
  }

  return setTierAuswahl([...selected]);
}

export function toggleTierAuswahl(tierId) {
  const selected = new Set(getTierAuswahl());

  if (selected.has(tierId)) {
    selected.delete(tierId);
  } else {
    selected.add(tierId);
  }

  return setTierAuswahl([...selected]);
}

export function istTierAusgewaehlt(tierId) {
  return getTierAuswahl().includes(tierId);
}

/* ======================================== */
/* AUSWAHL MIT TIERDATEN VERBINDEN          */
/* ======================================== */

export function getAusgewaehlteTiere(tiere) {
  const selected = new Set(getTierAuswahl());

  return tiere.filter((tier) => selected.has(tier.id));
}

export function bereinigeTierAuswahl(tiere) {
  const erlaubteIds = new Set(tiere.map((tier) => tier.id));
  const bereinigt = getTierAuswahl().filter((id) => erlaubteIds.has(id));

  return setTierAuswahl(bereinigt);
}
