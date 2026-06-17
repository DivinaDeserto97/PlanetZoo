import { normalisiereText } from "./normalisierung.js";

export function findeNachId(liste, id) {
  if (!Array.isArray(liste)) return null;
  return liste.find(eintrag => eintrag.id === id) || null;
}

export function findeNachCode(liste, code) {
  if (!Array.isArray(liste)) return null;
  return liste.find(eintrag => eintrag.code === code) || null;
}

export function findeNachName(liste, name) {
  if (!Array.isArray(liste)) return null;

  const gesucht = normalisiereText(name);

  return liste.find(eintrag => {
    return normalisiereText(eintrag.name) === gesucht ||
           normalisiereText(eintrag.nameDeutsch) === gesucht ||
           normalisiereText(eintrag.label) === gesucht;
  }) || null;
}

export function findeSymbol(liste, wert) {
  return findeNachId(liste, wert) || findeNachName(liste, wert);
}