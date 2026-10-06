/*
 * ANFÄNGER-HINWEIS – assets/js/features/systematikSchema.js
 * ----------------------------------------
 * Diese Datei gehört zum handgeschriebenen Quellcode von Planet Zoo 2 Tools.
 * Die grossen Abschnittskommentare darunter zeigen, welcher Teil welche
 * Aufgabe übernimmt. Beim Ändern möglichst nur den passenden Abschnitt
 * bearbeiten und danach das Browser-Bundle neu bauen/testen.
 */

export const SYSTEMATIK_LEBENSSTATUS = ["lebend", "ausgestorben"];

export const SYSTEMATIK_DOMESTIKATIONSSTATUS = ["wildform", "domestiziert"];

export const SYSTEMATIK_SPIELE = [
  "planetZoo2",
  "jurassicWorldEvolution1",
  "jurassicWorldEvolution2",
  "jurassicWorldEvolution3",
];

export const SYSTEMATIK_VERBINDUNGSTYPEN = [
  "abstammungslinie",
  "aufspaltung",
  "domestikation",
  "wildform",
  "naheVerwandtschaft",
  "unsichereVerwandtschaft",
];

export function istGueltigerLebensstatus(value) {
  return typeof value === "string" && SYSTEMATIK_LEBENSSTATUS.includes(value);
}

export function istGueltigerDomestikationsstatus(value) {
  return (
    typeof value === "string" && SYSTEMATIK_DOMESTIKATIONSSTATUS.includes(value)
  );
}

export function istGueltigesSystematikSpiel(value) {
  return typeof value === "string" && SYSTEMATIK_SPIELE.includes(value);
}

export function istGueltigerSystematikVerbindungstyp(value) {
  return (
    typeof value === "string" && SYSTEMATIK_VERBINDUNGSTYPEN.includes(value)
  );
}
